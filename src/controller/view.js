/**
 * WordPress Dependencies
 */
import {
	getContext,
	getElement,
	getServerState,
	store,
} from '@wordpress/interactivity';

/**
 * Internal Dependencies
 */
import { sanitizeChartExportFilename } from '../chart/utils/sanitize-chart-export-filename';
import { logMigrationComparison } from './utils/log-migration';

const { addQueryArgs } = window.wp.url;
const { innerWidth, innerHeight } = window;

/**
 * Resolve light-dark() CSS function values in SVG presentation attributes.
 *
 * SVG path fill/stroke attributes don't support CSS color functions like
 * light-dark(), so browsers render them as black. This clones the SVG and
 * replaces every light-dark(light, dark) attribute value with the light value,
 * making the exported SVG self-contained and renderable everywhere.
 *
 * @param {SVGSVGElement} svg
 * @return {SVGSVGElement} A cloned SVG with resolved color attributes.
 */
function resolveLightDarkInSVG(svg) {
	const clone = svg.cloneNode(true);
	const LIGHT_DARK_RE = /light-dark\(\s*([^,]+?)\s*,\s*[^)]+?\s*\)/gi;
	const ATTRS_TO_CHECK = ['fill', 'stroke', 'color', 'stop-color'];
	clone.querySelectorAll('*').forEach((el) => {
		ATTRS_TO_CHECK.forEach((attr) => {
			const val = el.getAttribute(attr);
			if (val && LIGHT_DARK_RE.test(val)) {
				LIGHT_DARK_RE.lastIndex = 0;
				el.setAttribute(attr, val.replace(LIGHT_DARK_RE, '$1'));
			}
		});
	});
	return clone;
}

// convert array of arrays to formatted csv, with optional metadata
// @see https://github.com/pewresearch/prc-scripts/blob/main/src/@prc/functions/functions.js#L145
function arrayToCSV(objArray, metadata) {
	if (undefined === objArray || objArray.length === 0) return false;
	const array =
		'object' !== typeof objArray ? JSON.parse(objArray) : objArray;
	const checkIfEmptyAndSanitize = (str) => {
		if (undefined === str) {
			return '';
		}
		// remove any inner html tags that might be present, both open and close
		str = str.replace(/<[^>]*>?/g, '');
		str = str.replace(/<\/[^>]*>?/g, '');
		if (str.indexOf(',') > -1) {
			return `"${str}"`;
		}
		return str;
	};
	let str = '';
	if (undefined !== metadata) {
		str += `${checkIfEmptyAndSanitize(metadata.title)}\n${checkIfEmptyAndSanitize(metadata.subtitle)}\n\n`;
	}
	for (let i = 0; i < array.length; i += 1) {
		let line = '';
		// if a value has a comma in it, wrap it in quotes
		for (let j = 0; j < array[i].length; j += 1) {
			if (j > 0) line += ',';
			if (array[i][j].indexOf(',') > -1) {
				line += `"${array[i][j]}"`;
			} else {
				line += array[i][j];
			}
		}
		str += `${line}\n`;
	}
	if (undefined !== metadata) {
		str += `\n${checkIfEmptyAndSanitize(metadata.note)}\n${checkIfEmptyAndSanitize(metadata.source)}\n${checkIfEmptyAndSanitize(metadata.tag)}`;
	}
	return str;
}

/**
 * Context menu — vanilla JS, no Interactivity API store involvement.
 * Data is read from data-* attributes set by the PHP render callback.
 */

let activeMenu = null;
let dismissMousedown = null;
let dismissKeydown = null;

function removeContextMenu() {
	if (activeMenu) {
		activeMenu.remove();
		activeMenu = null;
	}
	if (dismissMousedown) {
		document.removeEventListener('mousedown', dismissMousedown);
		dismissMousedown = null;
	}
	if (dismissKeydown) {
		document.removeEventListener('keydown', dismissKeydown);
		dismissKeydown = null;
	}
}

function buildContextMenu(wrapper, event) {
	const pngUrl = wrapper.dataset.pngUrl || '';
	const hasCsv = wrapper.dataset.hasCsv === 'true';
	const postUrl = wrapper.dataset.postUrl || '';
	const chartUrl = wrapper.dataset.chartUrl || '';
	const chartTitle = wrapper.dataset.chartTitle || '';

	const menu = document.createElement('div');
	menu.className = 'wp-chart-builder-context-menu';

	function makeItem(label, onClick) {
		const btn = document.createElement('button');
		btn.className = 'wp-chart-builder-context-menu__item';
		btn.type = 'button';
		btn.textContent = label;
		btn.addEventListener('click', () => {
			onClick();
			removeContextMenu();
		});
		return btn;
	}

	if (pngUrl) {
		menu.appendChild(
			makeItem('Download image (.png)', () => {
				fetch(pngUrl)
					.then((res) => res.blob())
					.then((blob) => {
						const url = URL.createObjectURL(blob);
						const a = document.createElement('a');
						const slug = sanitizeChartExportFilename(chartTitle);
						a.href = url;
						a.download = `${slug}.png`;
						a.click();
						URL.revokeObjectURL(url);
					});
			})
		);
	}

	if (hasCsv) {
		menu.appendChild(
			makeItem('Download data (.csv)', () => {
				// Re-use the existing downloadData action by finding and
				// clicking the hidden download button already in the DOM,
				// or dispatch a synthetic click on the controller element.
				const downloadBtn = wrapper.querySelector(
					'[data-wp-on--click="actions.downloadData"]'
				);
				if (downloadBtn) {
					downloadBtn.click();
				}
			})
		);
	}

	if (chartUrl && chartUrl !== postUrl) {
		menu.appendChild(
			makeItem('Open chart in new tab', () => {
				window.open(chartUrl, '_blank', 'noopener');
			})
		);
	}

	// Do we want to add this option to copy the link to the current page?
	// seems kinda useless
	// menu.appendChild(
	// 	makeItem('Copy link to this page', () => {
	// 		navigator.clipboard.writeText(postUrl);
	// 	})
	// );

	// Position at cursor, clamped to viewport.
	const menuWidth = 180;
	const menuHeight = 100; // approximate before render
	const x = Math.min(event.clientX, window.innerWidth - menuWidth - 8);
	const y = Math.min(event.clientY, window.innerHeight - menuHeight - 8);
	menu.style.left = `${x}px`;
	menu.style.top = `${y}px`;

	document.body.appendChild(menu);
	activeMenu = menu;

	// Dismiss on outside click.
	dismissMousedown = (e) => {
		if (!menu.contains(e.target)) {
			removeContextMenu();
		}
	};
	// Dismiss on Escape.
	dismissKeydown = (e) => {
		if (e.key === 'Escape') {
			removeContextMenu();
		}
	};

	document.addEventListener('mousedown', dismissMousedown);
	document.addEventListener('keydown', dismissKeydown);
}

// Attach to all controller wrappers after DOM is ready.
document.addEventListener('DOMContentLoaded', () => {
	if (navigator.maxTouchPoints > 0) return; // suppress on touch devices

	document.querySelectorAll('.wp-chart-builder-chart').forEach((chartEl) => {
		chartEl.addEventListener('contextmenu', (event) => {
			event.preventDefault();
			removeContextMenu();
			const wrapper = chartEl.closest('.wp-chart-builder-wrapper');
			if (wrapper) buildContextMenu(wrapper, event);
		});
	});
});

const { state, actions } = store('prc-chart-builder/controller', {
	state: {
		get isActive() {
			const context = getContext();
			const { id } = context;
			const element = getElement();
			return (
				element.attributes['data-chart-view'] === state[id].activeTab ||
				(element.attributes['data-allow-overlay'] &&
					state[id].activeTab === 'share')
			);
		},
		get isQuestionExpanded() {
			const context = getContext();
			const { id } = context;
			return state[id]?.isQuestionExpanded || false;
		},
	},
	callbacks: {
		detectWebShareSupport() {
			if (window.navigator.share === undefined) {
				state.webShareSupported = false;
			} else {
				state.webShareSupported = true;
			}
		},
		logMigrationAttributes() {
			const context = getContext();
			const { id } = context;

			// Wait a bit for chart server state to be available
			setTimeout(() => {
				// Try to get chart attributes from chart block's server state
				// The chart block uses namespace 'prc-chart-builder/chart'
				try {
					const chartServerState = getServerState(
						'prc-chart-builder/chart'
					);
					if (
						chartServerState &&
						Object.keys(chartServerState).length > 0
					) {
						// Find the chart block that belongs to this controller
						// Chart blocks have IDs that may match or be related to controller ID
						const chartIds = Object.keys(chartServerState);

						chartIds.forEach((chartId) => {
							const chartState = chartServerState[chartId];
							if (chartState && chartState.attributes) {
								const migratedAttrs = chartState.attributes;
								const originalAttrs =
									migratedAttrs._v1Original || migratedAttrs;

								logMigrationComparison(
									originalAttrs,
									migratedAttrs,
									chartId
								);
							}
						});
					} else {
						// eslint-disable-next-line no-console
						console.log(
							`[Migration Log] No chart server state found for controller ${id}`
						);
					}
				} catch (error) {
					// eslint-disable-next-line no-console
					console.warn(
						`[Migration Log] Error accessing chart server state:`,
						error
					);
				}
			}, 200); // Small delay to ensure chart state is initialized
		},
		syncTableHeight() {
			const context = getContext();
			const { id } = context;
			// Wait a bit for the chart to fully render
			setTimeout(() => {
				const controllerEl = document.getElementById(id);
				if (!controllerEl) {
					return;
				}

				const isFreeform = controllerEl.classList.contains(
					'wp-block-prc-chart-builder-controller--freeform'
				);
				// get the shallowest table container
				const tableContainer = document.getElementById(`${id}-table`);
				let tableInnerContainer = null;
				if (tableContainer) {
					tableInnerContainer = tableContainer.querySelector(
						'.wp-chart-builder-table__inner'
					);
				}
				const chartContainer = isFreeform
					? controllerEl.querySelector(
							'.wp-chart-builder-freeform-chart'
						)
					: controllerEl.querySelector('.cb__chart');

				const imgContainer =
					controllerEl.querySelector('.wp-block-image');

				if ((chartContainer || imgContainer) && tableInnerContainer) {
					const chartHeight =
						chartContainer?.offsetHeight ||
						imgContainer?.offsetHeight;
					if (chartHeight) {
						// Set min-height instead of fixed height to allow table to be taller if needed
						// -65px is the height of the download data button and the margin bottom of the table
						tableInnerContainer.style.height = '100%';
						tableInnerContainer.style.minHeight = `${chartHeight - 37}px`;
						tableInnerContainer.style.maxHeight = `${chartHeight - 37}px`;
					}
				}
			}, 100);
		},
	},
	actions: {
		setActiveTab(event) {
			event.preventDefault();
			const context = getContext();
			const { id } = context;
			const element = getElement();
			// if the active tab is share and the native share is supported, do onShareClick
			if (
				element.attributes['data-chart-view'] === 'share' &&
				state.webShareSupported
			) {
				actions.shareNative();
			} else {
				// otherwise, set the active tab to the current tab
				state[id].activeTab = element.attributes['data-chart-view'];
			}
		},
		toggleQuestionWordingExpanded() {
			const context = getContext();
			const { id } = context;
			state[id].isQuestionExpanded = !state[id].isQuestionExpanded;
		},
		hideModal() {
			const context = getContext();
			const { id } = context;
			state[id].activeTab = 'chart';
		},
		shareNative: () => {
			const context = getContext();
			const { chartPostUrl, postUrl, title } = context;
			const url = chartPostUrl || postUrl;

			if (true === state.webShareSupported) {
				window.navigator.share({
					title: title + ' | Pew Research Center',
					url,
				});
			}
		},
		shareTwitter() {
			const context = getContext();
			const { chartPostUrl, postUrl, title } = context;
			const actionUrl = addQueryArgs('https://twitter.com/intent/tweet', {
				text: title,
				url: chartPostUrl || postUrl,
			});
			window.open(
				actionUrl,
				'twtrShareWindow',
				`height=450, width=550, top=${innerHeight / 2 - 275}, left=${
					innerWidth / 2 - 225
				}, toolbar=0, location=0, menubar=0, directories=0, scrollbars=0`
			);
		},
		shareBluesky() {
			const context = getContext();
			const { chartPostUrl, postUrl, title } = context;
			const url = chartPostUrl || postUrl;
			const actionUrl = addQueryArgs('https://bsky.app/intent/compose', {
				text: `${title} ${url}`,
			});
			window.open(
				actionUrl,
				'bskyShareWindow',
				`height=450, width=550, top=${innerHeight / 2 - 275}, left=${
					innerWidth / 2 - 225
				}, toolbar=0, location=0, menubar=0, directories=0, scrollbars=0`
			);
		},
		shareFacebook() {
			const context = getContext();
			const { chartPostUrl, postUrl } = context;
			const actionUrl = addQueryArgs(
				'https://www.facebook.com/sharer/sharer.php',
				{
					u: chartPostUrl || postUrl,
				}
			);
			window.open(
				actionUrl,
				'fbShareWindow',
				`height=450, width=550, top=${innerHeight / 2 - 275}, left=${
					innerWidth / 2 - 225
				}, toolbar=0, location=0, menubar=0, directories=0, scrollbars=0`
			);
		},
		downloadData(event) {
			const context = getContext();
			const {
				tableData,
				title,
				subtitle,
				note,
				source,
				tag,
				postPubDate,
			} = context;
			// If the event is a keydown event and the key is not Enter or space, return
			if (
				event.type === 'keydown' &&
				event.key !== 'Enter' &&
				event.key !== ' '
			) {
				return;
			}
			if (!tableData) {
				return;
			}
			const csv = arrayToCSV([tableData.header, ...tableData.rows], {
				title,
				subtitle,
				note,
				source,
				tag,
			});
			const blob = new Blob([csv], { type: 'text/csv' });
			const url = URL.createObjectURL(blob);
			const downloadLink = document.createElement('a');
			const csvTitle = sanitizeChartExportFilename(title);
			downloadLink.setAttribute('href', url);
			downloadLink.setAttribute(
				'download',
				`${csvTitle}_data_${postPubDate}.csv`
			);
			downloadLink.click();
		},
		downloadImage() {
			const context = getContext();
			const { featuredImageUrl, title } = context;
			if (!featuredImageUrl) return;
			fetch(featuredImageUrl)
				.then((res) => res.blob())
				.then((blob) => {
					const url = URL.createObjectURL(blob);
					const a = document.createElement('a');
					const slug = sanitizeChartExportFilename(title);
					a.href = url;
					a.download = `${slug}.png`;
					a.click();
					URL.revokeObjectURL(url);
				});
		},
		downloadSVG() {
			const context = getContext();
			const { id } = context;
			const controllerEl = document.getElementById(id);
			const svg = controllerEl.querySelector('svg');
			const resolvedSvg = resolveLightDarkInSVG(svg);
			resolvedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
			resolvedSvg.setAttribute(
				'xmlns:xlink',
				'http://www.w3.org/1999/xlink'
			);
			const blob = new Blob([resolvedSvg.outerHTML], {
				type: 'image/svg+xml',
			});
			const url = URL.createObjectURL(blob);
			const downloadLink = document.createElement('a');
			downloadLink.href = url;
			downloadLink.download = `chart-${id}.svg`;
			document.body.appendChild(downloadLink);
			downloadLink.click();
			document.body.removeChild(downloadLink);
		},
	},
});
