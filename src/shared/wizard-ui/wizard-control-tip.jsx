/**
 * Field help for the chart wizard — thin wrapper around wp.components.Tooltip.
 */
import { Button, Tooltip } from '@wordpress/components';
import { info } from '@wordpress/icons';

/**
 * @param {Object} props
 * @param {string} props.label Accessible name for the help control (field name).
 * @param {string} props.text  Help copy shown in the popover.
 */
export default function WizardControlTip({ label, text }) {
	return (
		<Tooltip
			className="prc-chart-modal__control-tip-tooltip"
			delay={0}
			hideOnClick={false}
			placement="top-start"
			text={text}
		>
			<Button
				className="prc-chart-modal__control-tip"
				icon={info}
				iconSize={20}
				label={label}
				showTooltip={false}
				size="small"
				variant="tertiary"
			/>
		</Tooltip>
	);
}
