/**
 * WordPress Dependencies
 */
import { store, getElement, getContext } from '@wordpress/interactivity';

const { arrayToCSV } = window.prcFunctions;
const { addQueryArgs } = window.wp.url;
const { innerWidth, innerHeight } = window;

const { state } = store('prc-block/chart-builder-controller', {
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
	actions: {
		setActiveTab() {
			const context = getContext();
			const { id } = context;
			const element = getElement();
			state[id].activeTab = element.attributes['data-chart-view'];
		},
		hideModal() {
			const context = getContext();
			const { id } = context;
			state[id].activeTab = 'chart';
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
	callbacks: {
		onRun: () => {
			const context = getContext();
			console.log('context', context);
		},
	},
});
