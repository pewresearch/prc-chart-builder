/* eslint-disable @wordpress/no-unsafe-wp-apis */
/**
 * Preview Chart controls — viewport width and appearance for the preview pane only.
 * Does not touch WordPress editor device type or global color scheme.
 */
import {
	PanelBody,
	RangeControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { withColorScheme, withVision } from './preview-appearance';
import PreviewViewportToggle from './preview-viewport-toggle';
import {
	PREVIEW_VIEWPORT_WIDTHS,
	getPreviewSizeHelp,
} from './preview-viewports';

/**
 * @param {Object}      props
 * @param {string}      props.viewport            `'desktop'` | `'tablet'` | `'mobile'`.
 * @param {Function}    props.onViewportChange
 * @param {number|null} props.customWidth         Hand-picked canvas width, if any.
 * @param {Function}    props.onCustomWidthChange
 * @param {Object|null} props.widthRange          `{ min, max, chartWidth }` slider bounds, or null to hide it.
 * @param {Object}      props.appearance          PreviewAppearance.
 * @param {Function}    props.onAppearanceChange
 * @return {import('react').ReactNode} The preview size, color mode, and color vision panels.
 */
export default function PreviewToolbar({
	viewport,
	onViewportChange,
	customWidth,
	onCustomWidthChange,
	widthRange,
	appearance,
	onAppearanceChange,
}) {
	const chartWidth = widthRange?.chartWidth;

	// The presets can exceed the range when a chart's own width cap is narrower
	// than the viewport they describe, so the slider tracks the clamped width.
	const presetWidth = widthRange
		? Math.min(
				PREVIEW_VIEWPORT_WIDTHS[viewport] ?? widthRange.max,
				widthRange.max
			)
		: null;
	const sizeHelp =
		typeof chartWidth === 'number' ? getPreviewSizeHelp(chartWidth) : null;

	return (
		<div className="prc-chart-wizard__preview-controls">
			<PanelBody
				title={__('Preview size', 'prc-chart-builder')}
				initialOpen
			>
				<PreviewViewportToggle
					viewport={viewport}
					onViewportChange={onViewportChange}
					help={sizeHelp}
					isBlock
				/>
				{widthRange && (
					<RangeControl
						className="prc-chart-wizard__preview-width"
						label={__('Custom width', 'prc-chart-builder')}
						value={customWidth ?? presetWidth}
						min={widthRange.min}
						max={widthRange.max}
						step={10}
						allowReset
						onChange={(next) => onCustomWidthChange(next ?? null)}
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
				)}
			</PanelBody>
			<PanelBody
				title={__('Color mode', 'prc-chart-builder')}
				initialOpen
			>
				<ToggleGroupControl
					label={__('Color mode', 'prc-chart-builder')}
					hideLabelFromVision
					value={appearance.colorScheme}
					isBlock
					onChange={(scheme) =>
						onAppearanceChange(withColorScheme(appearance, scheme))
					}
					__nextHasNoMarginBottom
					__next40pxDefaultSize
				>
					<ToggleGroupControlOption
						label={__('Light', 'prc-chart-builder')}
						value="light"
					/>
					<ToggleGroupControlOption
						label={__('Dark', 'prc-chart-builder')}
						value="dark"
					/>
				</ToggleGroupControl>
			</PanelBody>
			<PanelBody
				title={__('Color blindness test', 'prc-chart-builder')}
				initialOpen
			>
				<ToggleGroupControl
					label={__('Color blindness test', 'prc-chart-builder')}
					hideLabelFromVision
					value={
						appearance.vision.kind === 'typical'
							? 'typical'
							: appearance.vision.deficiency
					}
					isBlock
					onChange={(token) =>
						onAppearanceChange(withVision(appearance, token))
					}
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					help={__(
						'Color blindness test shows you how your colors would look to somebody with a color vision deficiency',
						'prc-chart-builder'
					)}
				>
					<ToggleGroupControlOption
						label={__('Typical', 'prc-chart-builder')}
						value="typical"
					/>
					<ToggleGroupControlOption
						label={__('Protanopia', 'prc-chart-builder')}
						value="protanopia"
					/>
					<ToggleGroupControlOption
						label={__('Deuteranopia', 'prc-chart-builder')}
						value="deuteranopia"
					/>
					<ToggleGroupControlOption
						label={__('Tritanopia', 'prc-chart-builder')}
						value="tritanopia"
					/>
				</ToggleGroupControl>
			</PanelBody>
		</div>
	);
}
