/**
 * WordPress Dependencies
 */
import { store, getElement, getContext } from '@wordpress/interactivity';

const { addQueryArgs } = window.wp.url;
const { innerWidth, innerHeight } = window;

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
	},
	callbacks: {
		detectWebShareSupport() {
			if (window.navigator.share === undefined) {
				state.webShareSupported = false;
			} else {
				state.webShareSupported = true;
			}
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
		hideModal() {
			const context = getContext();
			const { id } = context;
			state[id].activeTab = 'chart';
		},
		shareNative: () => {
			const context = getContext();
			const { postId, postUrl, rootUrl, title, featuredImageId } =
				context;
			const url = featuredImageId
				? `${rootUrl}/share/${postId}/${featuredImageId}`
				: postUrl;

			if (true === state.webShareSupported) {
				window.navigator.share({
					title: title + ' | Pew Research Center',
					url: url,
				});
			}
		},
		shareTwitter() {
			const context = getContext();
			const { postId, postUrl, rootUrl, title, featuredImageId } =
				context;
			const actionUrl = addQueryArgs('https://twitter.com/intent/tweet', {
				text: title,
				url: featuredImageId
					? `${rootUrl}/share/${postId}/${featuredImageId}`
					: postUrl,
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
			const { postId, postUrl, rootUrl, title, featuredImageId } =
				context;
			const url = featuredImageId
				? `${rootUrl}/share/${postId}/${featuredImageId}`
				: postUrl;
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
			const { postId, postUrl, rootUrl, featuredImageId } = context;
			const actionUrl = addQueryArgs(
				'https://www.facebook.com/sharer/sharer.php',
				{
					u: featuredImageId
						? `${rootUrl}/share/${postId}/${featuredImageId}`
						: postUrl,
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
				(event.key !== 'Enter' || event.key !== ' ')
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
			const csvTitle = title.toLowerCase().replace(/\s+/g, '_');
			downloadLink.setAttribute('href', url);
			downloadLink.setAttribute(
				'download',
				`${csvTitle}_data_${postPubDate}.csv`
			);
			downloadLink.click();
		},
		downloadSVG() {
			const context = getContext();
			const { id } = context;
			const controllerEl = document.getElementById(id);
			const svg = controllerEl.querySelector('svg');
			svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
			svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
			const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
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
