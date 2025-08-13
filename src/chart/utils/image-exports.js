import { dispatch } from '@wordpress/data';
import { uploadMedia } from '@wordpress/media-utils';
/**
 * External dependencies
 */
import html2canvas from 'html2canvas';

const upload = (blob, name, type, clientId) => {
	uploadMedia({
		additionalData: {
			meta: {
				isChartBuilderImage: true,
			},
		},
		filesList: [
			new File([blob], name, {
				type,
			}),
		],
		onFileChange: ([fileObj]) => {
			if (!fileObj) {
				return;
			}
			// if fileObj.url contains substring 'blob:', it's a local file and we should not upload it
			if (fileObj.url.includes('blob:')) {
				return;
			}
			dispatch('core/block-editor').updateBlockAttributes(clientId, {
				svgUrl: fileObj.url,
				svgId: fileObj.id,
			});
			return fileObj;
			// TODO: Set this as the featured image on chart post type, but not elsewhere.
			// editPost({ featured_media: fileObj.id });
			// setImageLoading(false);
		},
		onError: console.error,
	});
};

const createSVG = (clientId) => {
	const blockEl = document
		.querySelector('iframe')
		.contentDocument.body.querySelector(`[data-block="${clientId}"]`);
	const svg = blockEl.querySelector('svg');
	svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
	svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
	const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
	const url = URL.createObjectURL(blob);
	const downloadLink = document.createElement('a');
	downloadLink.href = url;
	downloadLink.download = `chart-${clientId}.svg`;
	const uploadedMedia = upload(
		blob,
		`chart-${clientId}.svg`,
		'image/svg+xml',
		clientId
	);
	return uploadedMedia;
	// document.body.appendChild(downloadLink);
	// downloadLink.click();
	// document.body.removeChild(downloadLink);
};

const createPNG = (clientId) => {
	const blockEl = document.querySelector(`[data-block="${clientId}"]`);
	const resizerEl = blockEl.querySelector(
		'.components-resizable-box__container'
	);
	const textWrapper = blockEl.querySelector('.cb__text-wrapper');
	const chartWrapper = blockEl.querySelector('.cb__chart');
	const convertableEl = textWrapper || chartWrapper;
	if (textWrapper) {
		convertableEl.style.padding = `5px`;
	}
	resizerEl.classList.remove('has-show-handle');

	html2canvas(convertableEl).then((canvas) => {
		canvas.toBlob(
			(blob) => {
				const png = upload(
					blob,
					`chart-${clientId}-${Date.now()}.png`,
					'image/png'
				);
				return png;
			},
			'image/png',
			1
		);
		resizerEl.classList.add('has-show-handle');
		convertableEl.style.padding = '';
	});
};

export { createPNG, createSVG };
