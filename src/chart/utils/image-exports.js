/**
 * Image export utilities for chart blocks
 * Centralized utilities for generating and uploading chart images (PNG/SVG)
 */
import { dispatch, select } from '@wordpress/data';
import { uploadMedia } from '@wordpress/media-utils';

/**
 * External dependencies
 */
import html2canvas from 'html2canvas';

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
export const getBlockElement = (clientId) => {
	// Strategy 1: Try standard selectors in current document
	let blockEl =
		document.getElementById(`block-${clientId}`) ||
		document.querySelector(`[data-block="${clientId}"]`);

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

	const svg = blockEl.querySelector('svg');
	if (!svg) {
		const error = new Error('SVG element not found within block');
		// eslint-disable-next-line no-console
		console.warn(error.message);
		if (onError) onError(error);
		return;
	}

	svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
	svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
	const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });

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

/**
 * Create a PNG from a chart block and upload to media library
 *
 * @param {Object}   options            Options
 * @param {string}   options.clientId   Block client ID
 * @param {Function} options.onStart    Callback when process starts
 * @param {Function} options.onComplete Callback when process completes (receives fileObj)
 * @param {Function} options.onError    Callback when an error occurs
 * @return {void}
 */
export const createPNG = ({ clientId, onStart, onComplete, onError }) => {
	if (onStart) onStart();

	// Try to ensure the block is selected for better rendering
	// This can help ensure all elements are properly rendered
	try {
		const { selectBlock } = dispatch('core/block-editor');
		selectBlock(clientId);
	} catch (e) {
		// Non-critical if we can't select the block
	}

	// Give the block a moment to fully render if we just selected it
	setTimeout(() => {
		const blockEl = getBlockElement(clientId);
		if (!blockEl) {
			const error = new Error('Block element not found');
			if (onError) onError(error);
			return;
		}

		// Find chart elements using flexible selectors
		const { chartEl, textWrapper, tag } = findChartElements(blockEl);

		if (!tag) {
			const error = new Error('Required element not found: .cb__tag');
			// eslint-disable-next-line no-console
			console.warn(error.message, {
				clientId,
				blockEl,
				availableClasses: Array.from(
					blockEl.querySelectorAll('[class]')
				).map((el) => el.className),
			});
			if (onError) onError(error);
			return;
		}

		if (!chartEl) {
			const error = new Error(
				'Chart container not found (.cb__text-wrapper or .cb__chart)'
			);
			// eslint-disable-next-line no-console
			console.warn(error.message, {
				clientId,
				blockEl,
				availableClasses: Array.from(
					blockEl.querySelectorAll('[class]')
				).map((el) => el.className),
			});
			if (onError) onError(error);
			return;
		}

		// ResizableBox is optional - may not exist in all contexts
		const resizerEl = blockEl.querySelector(
			'.components-resizable-box__container'
		);

		// Store original values for restoration
		const originalTagText = tag.innerHTML;
		const originalStyles = {
			padding: chartEl.style.padding,
		};

		// Prepare element for capture
		tag.innerHTML = `© ${originalTagText}`;

		// Add 48px padding for social media whitespace (better presentation on social platforms)
		const socialPadding = '48px';
		chartEl.style.padding = socialPadding;

		// Apply letter-spacing to text elements for better readability in PNG
		// Target specific text elements instead of entire chart
		const textElements = chartEl.querySelectorAll(
			'.cb__title, .cb__subtitle, .cb__note, .cb__source, .cb__tag'
		);
		const originalLetterSpacing = [];
		textElements.forEach((el, index) => {
			originalLetterSpacing[index] = el.style.letterSpacing;
			el.style.letterSpacing = '0.5px';
		});

		if (resizerEl) {
			resizerEl.classList.remove('has-show-handle');
		}

		// Restore function to clean up DOM changes
		const restore = () => {
			if (resizerEl) {
				resizerEl.classList.add('has-show-handle');
			}
			chartEl.style.padding = originalStyles.padding;
			// Restore letter-spacing to text elements
			textElements.forEach((el, index) => {
				el.style.letterSpacing = originalLetterSpacing[index];
			});
			tag.innerHTML = originalTagText;
		};

		// Allow DOM to settle before capture
		setTimeout(() => {
			// html2canvas will capture the element including its padding
			// Use minimal buffer to avoid extra whitespace
			html2canvas(chartEl, {
				height: chartEl.scrollHeight + 10,
				width: chartEl.scrollWidth + 10,
				backgroundColor: '#ffffff', // Ensure white background
			})
				.then((canvas) => {
					canvas.toBlob(
						(blob) => {
							uploadChartImage({
								blob,
								name: `chart-${clientId}-${Date.now()}.png`,
								type: 'image/png',
								clientId,
								isSVG: false,
								onSuccess: (fileObj) => {
									restore();
									if (onComplete) onComplete(fileObj);
								},
								onError: (error) => {
									restore();
									if (onError) onError(error);
								},
							});
						},
						'image/png',
						1
					);
				})
				.catch((error) => {
					// eslint-disable-next-line no-console
					console.error('Error creating canvas:', error);
					restore();
					if (onError) onError(error);
				});
		}, 1000);
	}, 100); // Brief delay after selecting block
};

/**
 * Generate PNGs for multiple chart blocks
 *
 * @param {Object}   options            Options
 * @param {Array}    options.clientIds  Array of block client IDs
 * @param {Function} options.onProgress Callback for progress updates (receives { completed, total, currentClientId })
 * @param {Function} options.onComplete Callback when all charts are processed
 * @param {Function} options.onError    Callback when an error occurs
 * @return {void}
 */
export const createPNGsForMultipleCharts = ({
	clientIds,
	onProgress,
	onComplete,
	onError,
}) => {
	if (!clientIds || clientIds.length === 0) {
		if (onComplete) onComplete([]);
		return;
	}

	const results = [];
	let completed = 0;

	const processNext = (index) => {
		if (index >= clientIds.length) {
			if (onComplete) onComplete(results);
			return;
		}

		const clientId = clientIds[index];

		if (onProgress) {
			onProgress({
				completed,
				total: clientIds.length,
				currentClientId: clientId,
			});
		}

		createPNG({
			clientId,
			onComplete: (fileObj) => {
				completed++;
				results.push({ clientId, success: true, fileObj });
				// Add longer delay between charts to ensure proper rendering
				setTimeout(() => processNext(index + 1), 1500);
			},
			onError: (error) => {
				completed++;
				results.push({ clientId, success: false, error });
				if (onError) onError(error, clientId);
				// Continue with next chart even if one fails
				setTimeout(() => processNext(index + 1), 1500);
			},
		});
	};

	processNext(0);
};
