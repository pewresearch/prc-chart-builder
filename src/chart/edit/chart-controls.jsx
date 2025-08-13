/* eslint-disable max-lines */
/* eslint-disable no-console */
/* eslint-disable @wordpress/no-unsafe-wp-apis */
/* eslint-disable max-lines-per-function */
/* eslint-disable no-undef */
/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	PanelRow,
	SelectControl,
	RangeControl,
	BoxControl,
	ExternalLink,
	Button,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { uploadMedia } from '@wordpress/media-utils';
import { useState } from '@wordpress/element';

/**
 * External Dependencies
 */
import html2canvas from 'html2canvas';

/**
 * Internal Dependencies
 */
import { formatNum } from '../utils/helpers';
import BarControls from './bar-controls';
import ColorControls from './color-controls';
import XAxisControls from './x-axis-controls';
import YAxisControls from './y-axis-controls';
import DataControls from './data-controls';
import LineControls from './line-controls';
import LabelControls from './label-controls';
import LegendControls from './legend-controls';
import TooltipControls from './tooltip-controls';
import TextFieldControls from './text-field-controls';
import NodeControls from './node-controls';
import DivergingBarControls from './diverging-bar-control';
import DotPlotControls from './dot-plot-controls';
import PlotBandControls from './plot-band-controls';
import AnnotationControls from './annotation-controls';
import DiffColumnControls from './diff-column-controls';
import MapControls from './map-controls';

/**
 * Utility function to get block element with iframe support
 * @param {string} clientId - The block client ID
 * @returns {HTMLElement|null} The block element or null if not found
 */
const getBlockElement = (clientId) => {
	// Try current document first
	let blockEl =
		document.getElementById(`block-${clientId}`) ||
		document.querySelector(`[data-block="${clientId}"]`);

	// If not found, check iframes
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

function ControlSections(props) {
	const { chartType, chartFamily, attributes, limitControls } = props;
	if (limitControls) {
		return <TextFieldControls {...props} />;
	}
	return (
		<>
			<TextFieldControls {...props} />
			<DataControls {...props} />
			<ColorControls {...props} />
			{'map' !== chartFamily && (
				<>
					<XAxisControls {...props} />
					<YAxisControls {...props} />
				</>
			)}
			{'map' === chartFamily && <MapControls {...props} />}

			{('bar' === chartType ||
				'stacked-bar' === chartType ||
				'exploded-bar' === chartType) && <BarControls {...props} />}
			{'diverging-bar' === chartType && (
				<DivergingBarControls {...props} />
			)}
			{('line' === chartType ||
				'area' === chartType ||
				'stacked-area' === chartType) && (
				<>
					<PlotBandControls {...props} />
					<LineControls {...props} />
				</>
			)}
			{'dot-plot' === chartType && <DotPlotControls {...props} />}
			{('line' === chartType ||
				'area' === chartType ||
				'stacked-area' === chartType ||
				'dot-plot' === chartType ||
				'scatter' === chartType) && (
				<NodeControls {...props} chartType={chartType} />
			)}
			{attributes.diffColumnActive && <DiffColumnControls {...props} />}
			<AnnotationControls {...props} />
			<LabelControls {...props} chartType={chartType} />
			<TooltipControls {...props} />
			<LegendControls {...props} />
		</>
	);
}

function ChartControls({ attributes, setAttributes, clientId }) {
	const [imageLoading, setImageLoading] = useState(false);
	const [svgLoading, setSVGLoading] = useState(false);
	const {
		chartType,
		chartFamily,
		chartOrientation,
		paddingTop,
		paddingRight,
		paddingBottom,
		paddingLeft,
		height,
		width,
		overflowX,
		mobileBreakpoint,
		pngUrl,
		allowDataDownload,
		isStaticChart,
		isFreeformChart,
	} = attributes;

	const limitControls = isFreeformChart || isStaticChart;
	const upload = (blob, name, type) => {
		uploadMedia({
			filesList: [
				new File([blob], name, {
					type,
				}),
			],
			onFileChange: ([fileObj]) => {
				setAttributes({
					pngUrl: fileObj.url,
					pngId: fileObj.id,
				});
				// TODO: Set this as the featured image on chart post type, but not elsewhere.
				// editPost({ featured_media: fileObj.id });
				setImageLoading(false);
			},
			onError: console.error,
		});
	};
	const createSvg = () => {
		setSVGLoading(true);

		const blockEl = getBlockElement(clientId);
		if (!blockEl) {
			setSVGLoading(false);
			return;
		}

		const svg = blockEl.querySelector('svg');
		if (!svg) {
			console.warn('SVG element not found within block');
			setSVGLoading(false);
			return;
		}

		svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
		svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
		const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
		const url = URL.createObjectURL(blob);
		const downloadLink = document.createElement('a');
		downloadLink.href = url;
		downloadLink.download = `chart-${clientId}.svg`;
		document.body.appendChild(downloadLink);
		downloadLink.click();
		document.body.removeChild(downloadLink);
		setSVGLoading(false);
	};
	const createCanvas = () => {
		setImageLoading(true);

		const blockEl = getBlockElement(clientId);
		if (!blockEl) {
			setImageLoading(false);
			return;
		}

		const resizerEl = blockEl.querySelector(
			'.components-resizable-box__container'
		);
		const textWrapper = blockEl.querySelector('.cb__text-wrapper');
		const chartWrapper = blockEl.querySelector('.cb__chart');
		const tag = blockEl.querySelector('.cb__tag');

		if (!resizerEl || !tag) {
			console.warn('Required elements not found within block');
			setImageLoading(false);
			return;
		}

		const tagText = tag.innerHTML;
		tag.innerHTML = `© ${tagText}`;
		const convertableEl = textWrapper || chartWrapper;
		if (textWrapper) {
			convertableEl.style.padding = `5px`;
		}
		resizerEl.classList.remove('has-show-handle');
		// temporarily add letter-spacing: 0.5px; to the convertableEl
		convertableEl.style.letterSpacing = '0.5px';
		setTimeout(() => {
			html2canvas(convertableEl, {
				height: convertableEl.scrollHeight + 100,
				width: convertableEl.scrollWidth + 100,
			})
				.then((canvas) => {
					canvas.toBlob(
						(blob) => {
							upload(
								blob,
								`chart-${clientId}-${Date.now()}.png`,
								'image/png'
							);
						},
						'image/png',
						1
					);
					resizerEl.classList.add('has-show-handle');
					convertableEl.style.padding = '';
					tag.innerHTML = tagText;
				})
				.catch((error) => {
					console.error('Error creating canvas:', error);
					setImageLoading(false);
					resizerEl.classList.add('has-show-handle');
					convertableEl.style.padding = '';
					tag.innerHTML = tagText;
					convertableEl.style.letterSpacing = '';
				});
		}, 1000);
	};
	return (
		<InspectorControls>
			<PanelBody title={__('Chart Layout')} initialOpen={false}>
				{!limitControls &&
					('bar' === chartType || 'stacked-bar' === chartType) && (
						<SelectControl
							label={__('Chart Orientation (Bar charts only)')}
							value={chartOrientation}
							options={[
								{
									value: 'vertical',
									label: 'Vertical',
								},
								{
									value: 'horizontal',
									label: 'Horizontal',
								},
							]}
							onChange={(orientation) => {
								setAttributes({
									chartOrientation: orientation,
								});
							}}
						/>
					)}
				<RangeControl
					label={__('Width')}
					withInputField
					min={0}
					max={1152}
					value={parseInt(width, 10)}
					onChange={(w) =>
						setAttributes({
							width: formatNum(w, 'integer'),
						})
					}
				/>
				<RangeControl
					label={__('Height')}
					withInputField
					min={0}
					max={1200}
					value={parseInt(height, 10)}
					onChange={(h) =>
						setAttributes({
							height: formatNum(h, 'integer'),
						})
					}
				/>
				<SelectControl
					label={__('Overflow')}
					value={overflowX}
					help={__(
						'Choose how the chart should handle overflow on the x-axis when the chart width is wider than the window. "Responsive" will resize the chart width to fit the window, "Scroll" will allow the chart to be scrolled horizontally, and "Scroll (fixed y-axis)" will allow the chart to be scrolled horizontally while keeping the y-axis fixed (if applicable).'
					)}
					options={[
						{
							value: 'responsive',
							label: 'Responsive (Recommended)',
						},
						{
							value: 'scroll',
							label: 'Scroll',
						},
						// {
						// 	value: 'scroll-fixed-y-axis',
						// 	label: 'Scroll (fixed y-axis)',
						// },
						{
							value: 'preserve-aspect-ratio',
							label: 'Preserve Aspect Ratio',
						},
					]}
					onChange={(overflow) =>
						setAttributes({
							overflowX: overflow,
						})
					}
				/>
				<RangeControl
					label={__('Mobile Breakpoint')}
					help={__(
						'Width at which the chart switches to mobile layout, which will trigger certain layout changes when activated (tooltip rendering, etc.).'
					)}
					withInputField
					min={0}
					max={1152}
					value={parseInt(mobileBreakpoint, 10)}
					onChange={(bp) =>
						setAttributes({
							mobileBreakpoint: formatNum(bp, 'integer'),
						})
					}
				/>
				{!limitControls && (
					<BoxControl
						label={__('Padding')}
						values={{
							top: paddingTop,
							right: paddingRight,
							bottom: paddingBottom,
							left: paddingLeft,
						}}
						resetValues={{
							top: 0,
							right: 0,
							bottom: 0,
							left: 0,
						}}
						onChange={(value) =>
							setAttributes({
								paddingTop: formatNum(value.top, 'integer'),
								paddingRight: formatNum(value.right, 'integer'),
								paddingBottom: formatNum(
									value.bottom,
									'integer'
								),
								paddingLeft: formatNum(value.left, 'integer'),
							})
						}
					/>
				)}
			</PanelBody>
			<ControlSections
				attributes={attributes}
				setAttributes={setAttributes}
				clientId={clientId}
				chartType={chartType}
				chartFamily={chartFamily}
				limitControls={limitControls}
			/>
			<PanelBody title="Image and Data Exports" initialOpen={false}>
				<ToggleControl
					label={__('Allow user to download data')}
					checked={allowDataDownload}
					help={__(
						'If checked, a link to download a .csv of the table data will be displayed below the table and on the share tab.'
					)}
					onChange={() =>
						setAttributes({ allowDataDownload: !allowDataDownload })
					}
				/>
				<PanelRow>
					<Button isSecondary isBusy={svgLoading} onClick={createSvg}>
						Download SVG
					</Button>
				</PanelRow>
				<PanelRow>
					<Button
						isSecondary
						isBusy={imageLoading}
						onClick={createCanvas}
					>
						Upload Chart PNG to Media Library
					</Button>
				</PanelRow>
				<PanelRow>
					{imageLoading && (
						<p>
							Creating image. This will take several moments ...
						</p>
					)}
					{svgLoading && <p>Preparing SVG ...</p>}
				</PanelRow>
				{0 < pngUrl.length && (
					<>
						<PanelRow>
							<TextControl label={__('PNG URL')} value={pngUrl} />
						</PanelRow>
						<PanelRow>
							<ExternalLink href={pngUrl}>
								Preview Image
							</ExternalLink>
						</PanelRow>
					</>
				)}
			</PanelBody>
		</InspectorControls>
	);
}

export default ChartControls;
