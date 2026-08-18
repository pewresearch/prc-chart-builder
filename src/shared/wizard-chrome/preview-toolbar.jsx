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
import { desktop, mobile, tablet } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';

import { withColorScheme, withVision } from './preview-appearance';
import {
	PREVIEW_CARD_PADDING,
	PREVIEW_VIEWPORT_WIDTHS,
} from './preview-viewports';

/** Local preview viewport keys (not WordPress editor deviceType). */
export const PREVIEW_VIEWPORTS = {
	desktop: {
		value: 'desktop',
		label: __('Desktop', 'prc-chart-builder'),
		icon: desktop,
		width: PREVIEW_VIEWPORT_WIDTHS.desktop,
	},
	tablet: {
		value: 'tablet',
		label: __('Tablet', 'prc-chart-builder'),
		icon: tablet,
		width: PREVIEW_VIEWPORT_WIDTHS.tablet,
	},
	mobile: {
		value: 'mobile',
		label: __('Mobile', 'prc-chart-builder'),
		icon: mobile,
		width: PREVIEW_VIEWPORT_WIDTHS.mobile,
	},
};

/**
 * @param {Object}      props
 * @param {string}      props.viewport            `'desktop'` | `'tablet'` | `'mobile'`.
 * @param {Function}    props.onViewportChange
 * @param {number|null} props.customWidth         Hand-picked canvas width, if any.
 * @param {Function}    props.onCustomWidthChange
 * @param {Object|null} props.widthRange          `{ min, max }` slider bounds, or null to hide it.
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
	// The presets can exceed the range when a chart's own width cap is narrower
	// than the viewport they describe, so the slider tracks the clamped width.
	const presetWidth = widthRange
		? Math.min(
				PREVIEW_VIEWPORT_WIDTHS[viewport] ?? widthRange.max,
				widthRange.max
			)
		: null;

	return (
		<div className="prc-chart-wizard__preview-controls">
			<PanelBody
				title={__('Preview size', 'prc-chart-builder')}
				initialOpen
			>
				<ToggleGroupControl
					label={__('Preview size', 'prc-chart-builder')}
					hideLabelFromVision
					value={viewport}
					isBlock
					onChange={onViewportChange}
					__nextHasNoMarginBottom
					__next40pxDefaultSize
				>
					{Object.values(PREVIEW_VIEWPORTS).map(
						({ value, label, icon }) => (
							<ToggleGroupControlOption
								key={value}
								value={value}
								label={label}
								icon={icon}
							/>
						)
					)}
				</ToggleGroupControl>
				{widthRange && (
					<RangeControl
						className="prc-chart-wizard__preview-width"
						label={__('Custom width', 'prc-chart-builder')}
						help={sprintf(
							/* translators: %d: chart width in pixels. */
							__(
								'This chart is capped at %dpx wide, so wider previews render identically.',
								'prc-chart-builder'
							),
							widthRange.max - PREVIEW_CARD_PADDING
						)}
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
				title={__('Color vision', 'prc-chart-builder')}
				initialOpen
			>
				<ToggleGroupControl
					label={__('Color vision', 'prc-chart-builder')}
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
