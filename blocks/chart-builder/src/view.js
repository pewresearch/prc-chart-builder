/* eslint-disable no-undef */
/* eslint-disable react/jsx-filename-extension */
/* eslint-disable react/react-in-jsx-scope */
/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies
 */
import {
	ChartBuilderWrapper,
	ChartBuilderTextWrapper,
} from '@prc/chart-builder';
import { arrayToCSV } from '@prc/functions';
import { createRoot } from 'react-dom/client';

/**
 * Internal  dependencies
 */
import getConfig from './utils/getConfig';
import ShareModal from './view/ShareModal';
import './styles.scss';

new DOMParser();

const { innerWidth, innerHeight } = window;

const getChartConfig = (el) => {
	const hash = el.dataset.chartHash;
	const attributes = window.chartConfigs[hash];
	const config = getConfig(attributes, hash, 'wp-chart-builder-wrapper');
	// add static image attributes to config
	const {
		isStaticChart,
		staticImageId,
		staticImageUrl,
		staticImageAltText,
		tabsActive,
	} = attributes;
	return {
		...config,
		staticImageId,
		staticImageUrl,
		isStaticChart,
		staticImageAltText,
		tabsActive,
	};
};

const setViewButtonEvents = (viewButtons, tableEl, renderEl, hash) => {
	if (viewButtons && viewButtons.querySelector('.view-button--chart')) {
		viewButtons
			.querySelector('.view-button--chart')
			.addEventListener('click', () => {
				tableEl.classList.remove('active');
				renderEl.classList.add('active');
				// remove active class from sibling buttons
				viewButtons
					.querySelectorAll('.view-button')
					.forEach((button) => {
						button.classList.remove('active');
					});
				// add active class to this button
				viewButtons
					.querySelector('.view-button--chart')
					.classList.add('active');
				document
					.querySelector(`#modal-overlay-${hash}`)
					.classList.remove('active');
				document
					.querySelector(`#modal-${hash}`)
					.classList.remove('active');
			});
	}
	if (viewButtons && viewButtons.querySelector('.view-button--table')) {
		viewButtons
			.querySelector('.view-button--table')
			.addEventListener('click', () => {
				tableEl.classList.add('active');
				renderEl.classList.remove('active');
				// remove active class from sibling buttons
				viewButtons
					.querySelectorAll('.view-button')
					.forEach((button) => {
						button.classList.remove('active');
					});
				// add active class to this button
				viewButtons
					.querySelector('.view-button--table')
					.classList.add('active');
			});
	}
	if (viewButtons && viewButtons.querySelector('.view-button--share')) {
		viewButtons
			.querySelector('.view-button--share')
			.addEventListener('click', () => {
				tableEl.classList.remove('active');
				renderEl.classList.add('active');
				// remove active class from sibling buttons
				viewButtons
					.querySelectorAll('.view-button')
					.forEach((button) => {
						button.classList.remove('active');
					});
				// add active class to this button
				viewButtons
					.querySelector('.view-button--share')
					.classList.add('active');
				document
					.querySelector(`#modal-overlay-${hash}`)
					.classList.add('active');
				document
					.querySelector(`#modal-${hash}`)
					.classList.add('active');
			});
	}
};

const initFacebookLinks = (e, postUrl, rootUrl, postId, pngAttrs) => {
	e.preventDefault();
	const actionUrl = addQueryArgs(
		'https://www.facebook.com/sharer/sharer.php',
		{
			u: pngAttrs.id
				? `${rootUrl}/share/${postId}/${pngAttrs.id}`
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
	e.stopPropagation();
};

const initTwitterLinks = (e, postUrl, rootUrl, postId, pngAttrs, title) => {
	e.preventDefault();
	const actionUrl = addQueryArgs('https://twitter.com/intent/tweet', {
		text: title,
		url: pngAttrs.id
			? `${rootUrl}/share/${postId}/${pngAttrs.id}`
			: postUrl,
	});
	window.open(
		actionUrl,
		'twtrShareWindow',
		`height=450, width=550, top=${innerHeight / 2 - 275}, left=${
			innerWidth / 2 - 225
		}, toolbar=0, location=0, menubar=0, directories=0, scrollbars=0`
	);
	e.stopPropagation();
};

const createSvg = (hash) => {
	const blockEl = document.querySelector(`[data-chart-hash="${hash}"]`);
	const svg = blockEl.querySelector('svg');
	svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
	svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
	const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
	const url = URL.createObjectURL(blob);
	const downloadLink = document.createElement('a');
	downloadLink.href = url;
	downloadLink.download = `chart-${hash}.svg`;
	document.body.appendChild(downloadLink);
	downloadLink.click();
	document.body.removeChild(downloadLink);
};

const renderCharts = () => {
	const charts = document.querySelectorAll('.wp-chart-builder-wrapper');
	charts.forEach((chart) => {
		const renderEl = chart.querySelector('.wp-chart-builder-inner');
		const root = createRoot(renderEl);
		const config = getChartConfig(renderEl);
		const hash = renderEl.dataset.chartHash;
		const tableEl = chart.querySelector('.wp-chart-builder-table');
		const downloadButton = chart.querySelector(
			'.wp-chart-builder-download'
		);
		const svgDownloadButton = chart.querySelector('.download-svg');
		const viewButtons = chart.querySelector(
			'.wp-chart-builder-view-buttons'
		);
		const { isStaticChart, staticImageId, staticImageUrl, tabsActive } =
			config;
		const { postId, postUrl, postPubDate, rootUrl } = renderEl.dataset;
		const pngAttrs = {
			url: !isStaticChart
				? window.chartConfigs[hash].pngUrl
				: staticImageUrl,
			id: !isStaticChart
				? window.chartConfigs[hash].pngId
				: staticImageId,
		};
		const tableData = window.tableData[hash];
		// if there is preformatted data, use that, otherwise use the data from the chart config
		const preformattedDataArr = window.chartPreformattedData[hash];
		const { chartData } = window.chartConfigs[hash];
		const formattedData = preformattedDataArr || chartData;

		// TODO: readd csv export when WP_HTML_Tag_Processor is fixed
		// if there are no errors getting table data, and there are rows, create a csv
		const csv =
			tabsActive &&
			tableData &&
			!tableData.errors &&
			tableData.rows.length > 0
				? arrayToCSV([tableData.header, ...tableData.rows], {
						title: config.metadata.title,
						subtitle: config.metadata.subtitle,
						note: config.metadata.note,
						source: config.metadata.source,
						tag: config.metadata.tag,
					})
				: false;
		// onclick, download the csv
		const downloadData = (e) => {
			e.preventDefault();
			const blob = new Blob([csv], { type: 'text/csv' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			const csvTitle = config.metadata.title
				.toLowerCase()
				.replace(/\s+/g, '_');
			link.setAttribute('href', url);
			link.setAttribute(
				'download',
				`${csvTitle}_data_${postPubDate}.csv`
			);
			link.click();
			e.stopPropagation();
		};
		if (downloadButton && csv) {
			downloadButton.addEventListener('click', downloadData);
		}

		if (svgDownloadButton) {
			svgDownloadButton.addEventListener('click', (e) => createSvg(hash));
		}
		setViewButtonEvents(viewButtons, tableEl, renderEl, hash);
		root.render(
			<figure>
				<ChartBuilderTextWrapper
					active={config.metadata.active}
					width={config.layout.width}
					horizontalRules={config.layout.horizontalRules}
					title={config.metadata.title}
					subtitle={config.metadata.subtitle}
					note={config.metadata.note}
					source={config.metadata.source}
					tag={config.metadata.tag}
				>
					{isStaticChart && (
						<img
							className="cb__static-img"
							src={pngAttrs.url}
							alt={config.staticImageAltText}
						/>
					)}
					{!isStaticChart && (
						<ChartBuilderWrapper
							config={config}
							data={formattedData}
						/>
					)}
					{tabsActive && (
						<ShareModal
							onClickFacebook={(e) =>
								initFacebookLinks(
									e,
									postUrl,
									rootUrl,
									postId,
									pngAttrs
								)
							}
							onClickTwitter={(e) =>
								initTwitterLinks(
									e,
									postUrl,
									rootUrl,
									postId,
									pngAttrs,
									config.metadata.title
								)
							}
							pngAttrs={pngAttrs}
							elementId={hash}
						/>
					)}
				</ChartBuilderTextWrapper>
			</figure>,
			renderEl
		);
	});
};

domReady(() => {
	renderCharts();
});
