/**
 * Image export utilities for chart blocks
 * Centralized utilities for generating and uploading chart images (PNG/SVG)
 */
import { dispatch, select } from '@wordpress/data';
import { uploadMedia } from '@wordpress/media-utils';

/**
 * External dependencies
 */

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
 * Create a hash of block attributes for change detection
 * Only includes attributes that affect chart rendering
 *
 * @param {Object} attributes - Block attributes
 * @return {string} JSON string hash of relevant attributes
 */
export function createAttributesHash(attributes) {
	const { io, ...otherAttributes } = attributes;

	// Only include io properties that affect chart rendering
	const ioForHash = {
		chartData: io?.chartData,
		colorValue: io?.colorValue,
		customColors: io?.customColors,
	};

	return JSON.stringify({
		...otherAttributes,
		io: ioForHash,
	});
}

/**
 * Get block element with iframe support
 * Searches both the main document and any iframes (for site editor compatibility)
 * Tries multiple strategies to find the block element
 *
 * @param {string} clientId - The block client ID
 * @return {HTMLElement|null} The block element or null if not found
 */

// additionally, make sure never to return an element from the Overview tree (.block-editor-list-view-leaf)
export const getBlockElement = (clientId) => {
	let blockEl = null;
	// Strategy 1: Try standard selectors in current document
	blockEl =
		document.getElementById(`block-${clientId}`) ||
		document.querySelector(`[data-block="${clientId}"]`);
	if (blockEl && blockEl.closest('.block-editor-list-view-leaf')) {
		blockEl = null;
	}

	// Strategy 2: Check iframes (for site editor)
	if (!blockEl) {
		const iframes = document.querySelectorAll('iframe');
		for (const iframe of iframes) {
			try {
				if (iframe.contentDocument?.body) {
					blockEl =
						iframe.contentDocument.getElementById(
							`block-${clientId}`
						) ||
						iframe.contentDocument.querySelector(
							`[data-block="${clientId}"]`
						);
					if (blockEl) break;
				}
			} catch (error) {
				// Cross-origin iframe - skip silently
			}
		}
	}

	return blockEl;
};

/**
 * Find the actual chart container element within a block
 * Handles different block states (selected/unselected) and structures
 *
 * @param {HTMLElement} blockEl - The block element
 * @return {Object} Object containing { chartEl, textWrapper, tag } or nulls
 */
export const findChartElements = (blockEl) => {
	if (!blockEl) {
		return { chartEl: null, textWrapper: null, tag: null };
	}

	// Find the tag element (used for copyright notice)
	const tag = blockEl.querySelector('.cb__tag');

	// Try to find the text wrapper (preferred for capture as it includes title/footer)
	const textWrapper = blockEl.querySelector('.cb__text-wrapper');

	// Fall back to just the chart element
	const chartEl = textWrapper || blockEl.querySelector('.cb__chart');

	return { chartEl, textWrapper, tag };
};

/**
 * Upload a blob to the WordPress media library and update block attributes
 *
 * @param {Object}   options           Upload options
 * @param {Blob}     options.blob      The blob to upload
 * @param {string}   options.name      Filename for the upload
 * @param {string}   options.type      MIME type (e.g., 'image/png')
 * @param {string}   options.clientId  Block client ID to update attributes
 * @param {boolean}  options.isSVG     Whether this is an SVG upload
 * @param {Function} options.onSuccess Callback when upload succeeds
 * @param {Function} options.onError   Callback when upload fails
 * @return {void}
 */
export const uploadChartImage = ({
	blob,
	name,
	type,
	clientId,
	isSVG = false,
	onSuccess,
	onError,
}) => {
	uploadMedia({
		additionalData: {
			meta: {
				prc_hide_media: true,
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
			// If fileObj.url contains 'blob:', it's still uploading
			if (fileObj.url.includes('blob:')) {
				return;
			}

			// Get current attributes to merge nested io object
			const currentAttributes =
				select('core/block-editor').getBlockAttributes(clientId);
			const currentIo = currentAttributes?.io || {};

			// Create a hash of chart attributes for change detection
			// Using shared function to ensure consistency with change detection logic
			const attributesHash = createAttributesHash(currentAttributes);

			// Update nested io object with image URL, ID, and metadata
			const updatedAttributes = {
				io: {
					...currentIo,
					...(isSVG
						? {
								staticImageUrl: fileObj.url,
								staticImageId: fileObj.id,
								svgUrl: fileObj.url,
								svgId: fileObj.id,
								svgGeneratedAt: new Date().toISOString(),
								svgAttributesHash: attributesHash,
							}
						: {
								pngUrl: fileObj.url,
								pngId: fileObj.id,
								pngGeneratedAt: new Date().toISOString(),
								pngAttributesHash: attributesHash,
							}),
				},
			};

			dispatch('core/block-editor').updateBlockAttributes(
				clientId,
				updatedAttributes
			);

			if (onSuccess) {
				onSuccess(fileObj);
			}
		},
		onError: (error) => {
			// eslint-disable-next-line no-console
			console.error('Image upload error:', error);
			if (onError) {
				onError(error);
			}
		},
	});
};

/**
 * Create and download an SVG from a chart block
 *
 * @param {Object}   options            Options
 * @param {string}   options.clientId   Block client ID
 * @param {boolean}  options.upload     Whether to upload to media library (default: false, just downloads)
 * @param {Function} options.onStart    Callback when process starts
 * @param {Function} options.onComplete Callback when process completes
 * @param {Function} options.onError    Callback when an error occurs
 * @return {void}
 */
export const createSVG = ({
	clientId,
	upload = false,
	onStart,
	onComplete,
	onError,
}) => {
	if (onStart) onStart();

	const blockEl = getBlockElement(clientId);
	if (!blockEl) {
		const error = new Error('Block element not found');
		if (onError) onError(error);
		return;
	}

	// that may be present in the editor UI (e.g. Document Overview caret icons).
	const chartContainer = blockEl.querySelector('.cb__chart') || blockEl;
	const svg = chartContainer.querySelector('svg');
	if (!svg) {
		const error = new Error('SVG element not found within block');
		// eslint-disable-next-line no-console
		console.warn(error.message);
		if (onError) onError(error);
		return;
	}

	const resolvedSvg = resolveLightDarkInSVG(svg);
	resolvedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
	resolvedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
	const blob = new Blob([resolvedSvg.outerHTML], { type: 'image/svg+xml' });

	if (upload) {
		uploadChartImage({
			blob,
			name: `chart-${clientId}.svg`,
			type: 'image/svg+xml',
			clientId,
			isSVG: true,
			onSuccess: (fileObj) => {
				if (onComplete) onComplete(fileObj);
			},
			onError,
		});
	} else {
		// Download the SVG
		const url = URL.createObjectURL(blob);
		const downloadLink = document.createElement('a');
		downloadLink.href = url;
		downloadLink.download = `chart-${clientId}.svg`;
		document.body.appendChild(downloadLink);
		downloadLink.click();
		document.body.removeChild(downloadLink);
		URL.revokeObjectURL(url);
		if (onComplete) onComplete();
	}
};
