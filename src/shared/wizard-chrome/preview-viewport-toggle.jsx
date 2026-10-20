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
import { __ } from '@wordpress/i18n';

/** Local preview viewport keys (not WordPress editor deviceType). */
export const PREVIEW_VIEWPORTS = [
	{
		value: 'desktop',
		label: __('Desktop', 'prc-chart-builder'),
		icon: desktop,
	},
	{ value: 'tablet', label: __('Tablet', 'prc-chart-builder'), icon: tablet },
	{ value: 'mobile', label: __('Mobile', 'prc-chart-builder'), icon: mobile },
];

/**
 * @param {Object}   props
 * @param {string}   props.viewport         `'desktop'` | `'tablet'` | `'mobile'`.
 * @param {Function} props.onViewportChange
 * @param {boolean}  [props.isBlock]        Stretch the buttons to fill the row.
 * @param {string}   [props.className]
 * @return {import('react').ReactNode} The device toggle.
 */
export default function PreviewViewportToggle({
	viewport,
	onViewportChange,
	isBlock = false,
	className,
}) {
	return (
		<ToggleGroupControl
			className={className}
			label={__('Preview size', 'prc-chart-builder')}
			hideLabelFromVision
			value={viewport}
			isBlock={isBlock}
			onChange={onViewportChange}
			__nextHasNoMarginBottom
			__next40pxDefaultSize
		>
			{PREVIEW_VIEWPORTS.map(({ value, label, icon }) => (
				<ToggleGroupControlOptionIcon
					key={value}
					value={value}
					label={label}
					icon={icon}
				/>
			))}
		</ToggleGroupControl>
	);
}
