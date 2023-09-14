import { uploadMedia } from '@wordpress/media-utils';

/**
 * External dependencies
 */
import html2canvas from 'html2canvas';

const createPngFromCanvas = (clientId, setAttributes, unlockPostSaving) => {
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
				upload(
					blob,
					`chart-${clientId}-${Date.now()}.png`,
					'image/png',
					setAttributes,
					unlockPostSaving
				);
			},
			'image/png',
			1
		);
		resizerEl.classList.add('has-show-handle');
		convertableEl.style.padding = '';
	});
};

const upload = (blob, name, type, setAttributes, unlockPostSaving) => {
	uploadMedia({
		filesList: [
			new File([blob], name, {
				type,
			}),
		],
		onFileChange: ([fileObj]) => {
			if (!fileObj.url.includes('blob:')) {
				setAttributes({
					pngUrl: fileObj.url,
					pngId: fileObj.id,
				});
				unlockPostSaving('chart-builder');
			}
		},
		onError: console.error,
	});
};

export default createPngFromCanvas;
