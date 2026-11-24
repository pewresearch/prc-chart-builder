/* eslint-disable @wordpress/no-unsafe-wp-apis */
/**
 * Device buttons for the chart preview. They resize the preview pane only;
 * the WordPress editor device type stays as it is.
 */
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
} from '@wordpress/components';
import { desktop, mobile, tablet } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';

import { VIEWPORT_BREAKPOINTS } from '../../chart/utils/view-helpers';

/**
 * Local preview viewport keys (not WordPress editor deviceType). `range` is
 * the screen width that shows these settings on the site; the button shows
 * it as its tooltip.
 */
export const PREVIEW_VIEWPORTS = [
	{
		value: 'desktop',
		label: __('Desktop', 'prc-chart-builder'),
		range: sprintf(
			/* translators: %d: narrowest desktop screen width in pixels. */
			__('screens %dpx and wider', 'prc-chart-builder'),
			VIEWPORT_BREAKPOINTS.medium
		),
		icon: desktop,
	},
	{
		value: 'tablet',
		label: __('Tablet', 'prc-chart-builder'),
		range: sprintf(
			/* translators: 1: narrowest tablet width, 2: widest tablet width, in pixels. */
			__('screens %1$dpx to %2$dpx wide', 'prc-chart-builder'),
			VIEWPORT_BREAKPOINTS.mobile,
			VIEWPORT_BREAKPOINTS.medium - 1
		),
		icon: tablet,
	},
	{
		value: 'mobile',
		label: __('Mobile', 'prc-chart-builder'),
		range: sprintf(
			/* translators: %d: widest mobile screen width in pixels. */
			__('screens up to %dpx wide', 'prc-chart-builder'),
			VIEWPORT_BREAKPOINTS.mobile - 1
		),
		icon: mobile,
	},
];

/**
 * @param {Object}   props
 * @param {string}   props.viewport            `'desktop'` | `'tablet'` | `'mobile'`.
 * @param {Function} props.onViewportChange
 * @param {boolean}  [props.isBlock]           Stretch the buttons to fill the row.
 * @param {string}   [props.className]
 * @param {string[]} [props.disabledViewports] Viewport keys that change nothing.
 * @param {string}   [props.help]              Why a size is unavailable, if any.
 * @return {import('react').ReactNode} The device toggle.
 */
export default function PreviewViewportToggle({
	viewport,
	onViewportChange,
	isBlock = false,
	className,
	disabledViewports = [],
	help,
}) {
	return (
		<ToggleGroupControl
			className={className}
			label={__('Preview size', 'prc-chart-builder')}
			help={help}
			hideLabelFromVision
			value={viewport}
			isBlock={isBlock}
			onChange={onViewportChange}
			__nextHasNoMarginBottom
			__next40pxDefaultSize
		>
			{PREVIEW_VIEWPORTS.map(({ value, label, range, icon }) => (
				<ToggleGroupControlOptionIcon
					key={value}
					value={value}
					label={sprintf(
						/* translators: 1: device name, 2: screen width range. */
						__('%1$s: %2$s', 'prc-chart-builder'),
						label,
						range
					)}
					icon={icon}
					disabled={disabledViewports.includes(value)}
				/>
			))}
		</ToggleGroupControl>
	);
}
