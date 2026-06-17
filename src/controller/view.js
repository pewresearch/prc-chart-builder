/**
 * External Dependencies
 */
import DOMPurify from 'dompurify';

/**
 * WordPress Dependencies
 */
import {
	getContext,
	getElement,
	getServerState,
	store,
	watch,
} from '@wordpress/interactivity';

/**
 * Internal Dependencies
 */
import { sanitizeChartExportFilename } from '../chart/utils/sanitize-chart-export-filename';
import { arrayToCSV, UTF8_BOM } from './utils/csv-export';
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
	if (window.navigator.maxTouchPoints > 0) return; // suppress on touch devices

	document.querySelectorAll('.wp-chart-builder-chart').forEach((chartEl) => {
		chartEl.addEventListener('contextmenu', (event) => {
			event.preventDefault();
			removeContextMenu();
			const wrapper = chartEl.closest('.wp-chart-builder-wrapper');
			if (wrapper) buildContextMenu(wrapper, event);
		});
	});
});

/**
 * Write trusted-but-sanitized cell HTML.
 *
 * Cell content is author/config-trusted (server-seeded from a `wp_kses_post`
 * render, then updated only by consumer blocks via `setTableData` / `setChart`),
 * the same trust boundary the rest of this module relies on. We still run it
 * through DOMPurify so inline markup the parser captured (e.g. `<strong>`,
 * links) survives a live update — matching the server render — while any unsafe
 * markup is stripped.
 *
 * @param {HTMLElement} cell  Target cell.
 * @param {*}           value Cell value (string or HTML fragment).
 */
function setCellHTML(cell, value) {
	cell.innerHTML = DOMPurify.sanitize(String(value ?? ''));
}

/**
 * Visible, non-hidden cells of a row, in document order.
 *
 * The server renders the full Power Table (via `render_block`), so hidden
 * columns are present in the DOM with `.is-column-hidden`. The `{ header, rows }`
 * projection has those columns filtered out, so we map projection values onto
 * the visible cells only.
 *
 * @param {HTMLTableRowElement} row Table row.
 * @return {HTMLTableCellElement[]} Non-hidden cells.
 */
function visibleCells(row) {
	return Array.from(row.children).filter(
		(cell) => !cell.classList.contains('is-column-hidden')
	);
}

/**
 * Update the visible underlying-numbers table in place from a `{ header, rows }`
 * projection — content only, never structure.
 *
 * The initial render is the real Power Table block, which carries all author
 * formatting (column widths, scroll, sticky column, sorting, rounding). To keep
 * that formatting intact on a live update we only rewrite the content of cells
 * that already exist; we never rebuild rows or cells. This is deliberately
 * strict: an update is accepted only when its shape matches the rendered table
 * exactly (same row count, and same visible-column count per row). On any
 * mismatch we leave the server-rendered table untouched — a malformed update
 * degrades to "no live update", never to stripped formatting. Reshaping the
 * table (adding/removing rows or columns) is intentionally unsupported; the
 * text-only projection cannot describe layout, and reshaping is not a real
 * chart-data use case.
 *
 * The element passed in is the `.chart-builder-data-table` figure; the `<table>`
 * is resolved from within it.
 *
 * @param {HTMLElement} tableEl   The `.chart-builder-data-table` element (figure or table).
 * @param {Object}      tableData `{ header: string[], rows: string[][] }`.
 */
function rebuildDataTable(tableEl, tableData) {
	if (!tableEl || !tableData || !Array.isArray(tableData.header)) {
		return;
	}
	const table = tableEl.matches('table')
		? tableEl
		: tableEl.querySelector('table');
	if (!table) {
		return;
	}

	const { header, rows = [] } = tableData;
	const rowsData = Array.isArray(rows) ? rows : [];

	const headerRow = table.querySelector('thead tr');
	const headerCells = headerRow ? visibleCells(headerRow) : [];
	const bodyRows = Array.from(table.querySelectorAll('tbody > tr'));

	// Validate the entire shape BEFORE mutating anything, so a mismatch leaves
	// the server render fully intact rather than half-updated.
	const shapeMatches =
		(!headerRow || headerCells.length === header.length) &&
		bodyRows.length === rowsData.length &&
		bodyRows.every((row, r) => {
			const rowData = Array.isArray(rowsData[r]) ? rowsData[r] : [];
			return visibleCells(row).length === rowData.length;
		});

	if (!shapeMatches) {
		// eslint-disable-next-line no-console -- surface misconfigured updates to developers; keeps the correct server render.
		console.warn(
			'[prc-chart-builder] Ignoring table update: shape does not match the rendered table. Updates must keep the same structure (row and visible-column counts).'
		);
		return;
	}

	// Content-only patch. Element-level formatting (styles, classes, column
	// widths) is preserved because we never touch the cell elements themselves.
	if (headerRow) {
		header.forEach((cell, i) => setCellHTML(headerCells[i], cell));
	}
	bodyRows.forEach((row, r) => {
		const rowData = Array.isArray(rowsData[r]) ? rowsData[r] : [];
		visibleCells(row).forEach((cell, c) => setCellHTML(cell, rowData[c]));
	});
}

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
		/**
		 * Match the data-tab table height to the paired chart.
		 *
		 * Static charts are server-rendered `<img>`s whose height is stable at
		 * init, so a single delayed measurement used to be enough. Interactivity
		 * charts mount asynchronously (the Preact wrapper, lazy-loaded maps via
		 * Suspense, label/animation layout), so the chart's final height is not
		 * known on init — a one-shot `setTimeout` raced that settle and left the
		 * table shorter than the chart.
		 *
		 * Instead, observe the chart container with a `ResizeObserver` so the
		 * table tracks the chart's height as it renders and on any later resize
		 * (viewport change, router re-render). A `MutationObserver` waits for
		 * the chart node to appear when it hasn't mounted yet. Returns a
		 * disposer the init directive runs on cleanup.
		 *
		 * @return {Function|undefined} Cleanup fn, or undefined when there is no table.
		 */
		syncTableHeight() {
			const { id } = getContext();
			const controllerEl = document.getElementById(id);
			if (!controllerEl) {
				return undefined;
			}

			const tableInnerContainer = document
				.getElementById(`${id}-table`)
				?.querySelector('.wp-chart-builder-table__inner');
			if (!tableInnerContainer) {
				return undefined;
			}

			const isFreeform = controllerEl.classList.contains(
				'wp-block-prc-chart-builder-controller--freeform'
			);
			const getChartEl = () =>
				(isFreeform
					? controllerEl.querySelector(
							'.wp-chart-builder-freeform-chart'
						)
					: controllerEl.querySelector('.cb__chart')) ||
				controllerEl.querySelector('.wp-block-image');

			const applyHeight = () => {
				const chartHeight = getChartEl()?.offsetHeight;
				if (!chartHeight) {
					return;
				}
				// -37px ≈ the download-data button + table bottom margin.
				tableInnerContainer.style.height = '100%';
				tableInnerContainer.style.minHeight = `${chartHeight - 37}px`;
				tableInnerContainer.style.maxHeight = `${chartHeight - 37}px`;
			};

			// Coalesce bursts of resize callbacks into one measurement.
			let rafId = null;
			const schedule = () => {
				if (rafId) {
					window.cancelAnimationFrame(rafId);
				}
				rafId = window.requestAnimationFrame(() => {
					rafId = null;
					applyHeight();
				});
			};

			let observedChartEl = null;
			const resizeObserver = new window.ResizeObserver(schedule);
			const ensureObserved = () => {
				const chartEl = getChartEl();
				if (chartEl && chartEl !== observedChartEl) {
					if (observedChartEl) {
						resizeObserver.unobserve(observedChartEl);
					}
					observedChartEl = chartEl;
					resizeObserver.observe(chartEl);
				}
				return !!chartEl;
			};

			// The interactivity chart node may not exist yet at init — watch the
			// controller subtree until it mounts, then hand off to the
			// ResizeObserver as the long-lived sync mechanism.
			let mutationObserver = null;
			if (!ensureObserved()) {
				mutationObserver = new window.MutationObserver(() => {
					if (ensureObserved()) {
						schedule();
						mutationObserver.disconnect();
						mutationObserver = null;
					}
				});
				mutationObserver.observe(controllerEl, {
					childList: true,
					subtree: true,
				});
			}

			schedule();

			return () => {
				if (rafId) {
					window.cancelAnimationFrame(rafId);
				}
				resizeObserver.disconnect();
				if (mutationObserver) {
					mutationObserver.disconnect();
				}
			};
		},
		/**
		 * Keep the controller's server-rendered surfaces in sync with the chart
		 * store, so a consumer block calling `setChart` / `setData` /
		 * `setConfig` / `setTableData` on `state.charts[chartId]` updates what's
		 * visible. Two independent `watch`es are registered:
		 *
		 * 1. **Underlying-numbers table** — rebuilt in place from the slice's
		 *    `tableData` (also drives the CSV export via `downloadData` and the
		 *    chart's ARIA description). Present only when the chart has a table.
		 * 2. **Metadata text** — `title` / `subtitle` / `note` / `source` /
		 *    `tag` mirrored from the chart config's `metadata`. These render
		 *    server-side in up to three places inside the controller (the chart
		 *    block, the data-tab table, the freeform wrapper), so every match in
		 *    the subtree is updated.
		 *
		 * Each `watch` auto-subscribes only to the signals it reads, so a
		 * `tableData` change never re-runs the metadata pass and vice-versa.
		 * Both skip their first run because the server already rendered the same
		 * values. Metadata is written via `innerHTML` to match the server's
		 * `wp_kses_post` render so inline markup (links, emphasis) survives a
		 * live update; the source is author/config-trusted, the same trust
		 * boundary as the block attributes the server escapes.
		 *
		 * @return {Function|undefined} A dispose fn the init directive cleans up.
		 */
		watchChart() {
			const { id } = getContext();
			const controllerEl = document.getElementById(id);
			if (!controllerEl) {
				return undefined;
			}
			const chartId = controllerEl.querySelector('[data-prc-chart-id]')
				?.dataset?.prcChartId;
			if (!chartId) {
				return undefined;
			}

			let chartStore;
			try {
				chartStore = store('prc-chart-builder/chart');
			} catch (e) {
				// Chart store not registered (e.g. custom-charts). CSV download
				// still falls back to the controller context.
				return undefined;
			}

			const disposers = [];

			// 1) Visible underlying-numbers table (only when a table exists).
			const tableEl = controllerEl.querySelector(
				'.chart-builder-data-table'
			);
			if (tableEl) {
				let isFirstRun = true;
				disposers.push(
					watch(() => {
						// Read FIRST so the watch subscribes before any return.
						const tableData =
							chartStore.state.charts?.[chartId]?.tableData;
						if (isFirstRun) {
							isFirstRun = false;
							return;
						}
						rebuildDataTable(tableEl, tableData);
					})
				);
			}

			// 2) Metadata text fields. Source of truth is config.metadata,
			//    patched via setConfig / setChart({ config: { metadata } }).
			const metaFields = [
				['title', '.cb__title'],
				['subtitle', '.cb__subtitle'],
				['note', '.cb__note--note'],
				['source', '.cb__note--source'],
				['tag', '.cb__tag'],
			];
			let isFirstMetaRun = true;
			disposers.push(
				watch(() => {
					const metadata =
						chartStore.state.charts?.[chartId]?.config?.metadata;
					// Read every field up front so the watch subscribes to all
					// of them before the first-run skip returns.
					// eslint-disable-next-line @wordpress/no-unused-vars-before-return -- intentional: the reads above register signal dependencies and must run before the early return.
					const values = metaFields.map(
						([field]) => metadata?.[field]
					);
					if (isFirstMetaRun) {
						isFirstMetaRun = false;
						return;
					}
					metaFields.forEach(([, selector], i) => {
						const value = values[i];
						if (value === undefined) {
							return;
						}
						controllerEl
							.querySelectorAll(selector)
							.forEach((el) => {
								// Parity with the server's wp_kses_post render so
								// inline markup (links, emphasis) survives a live
								// update. Source is author/config-trusted — the
								// same trust boundary as the block attributes.
								el.innerHTML = String(value ?? '');
							});
					});
				})
			);

			return () => disposers.forEach((dispose) => dispose && dispose());
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
				id,
				tableData: contextTableData,
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
			// Prefer the live chart-store slice (kept in sync by setTableData /
			// setChart) so exported CSVs reflect any runtime data updates. Fall
			// back to the server-seeded controller context for freeform charts
			// (no chart slice) or before the chart store is registered.
			let tableData = contextTableData;
			const controllerEl = document.getElementById(id);
			const chartId = controllerEl?.querySelector('[data-prc-chart-id]')
				?.dataset?.prcChartId;
			if (chartId) {
				try {
					const slice = store('prc-chart-builder/chart').state
						.charts?.[chartId];
					if (slice?.tableData) {
						tableData = slice.tableData;
					}
				} catch (e) {
					// Chart store not registered — use the context fallback.
				}
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
			const blob = new Blob([UTF8_BOM, csv], {
				type: 'text/csv;charset=utf-8',
			});
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
