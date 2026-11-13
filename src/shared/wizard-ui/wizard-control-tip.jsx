/**
 * Field help for the chart wizard: an info button that opens a popover.
 */
import { Button, Dropdown } from '@wordpress/components';
import { useRef } from '@wordpress/element';
import { info } from '@wordpress/icons';

/**
 * The popover renders in the admin page, outside the editor canvas iframe that
 * carries the dark mode `color-scheme`, so it borrows the scheme of the page
 * the button lives in.
 *
 * @param {Element|null} node Help button.
 * @return {string|undefined} CSS `color-scheme` value.
 */
function getColorScheme(node) {
	const root = node?.ownerDocument?.documentElement;
	const view = node?.ownerDocument?.defaultView;
	return root && view ? view.getComputedStyle(root).colorScheme : undefined;
}

/**
 * @param {Object} props
 * @param {string} props.label Accessible name for the help control (field name).
 * @param {string} props.text  Help copy shown in the popover.
 */
export default function WizardControlTip({ label, text }) {
	const buttonRef = useRef(null);

	return (
		<Dropdown
			className="prc-chart-modal__control-tip-dropdown"
			contentClassName="prc-chart-modal__control-tip-popover"
			popoverProps={{ placement: 'top-start', offset: 8 }}
			renderToggle={({ isOpen, onToggle }) => (
				<Button
					ref={buttonRef}
					className="prc-chart-modal__control-tip"
					icon={info}
					iconSize={20}
					label={label}
					showTooltip={false}
					size="small"
					variant="tertiary"
					aria-expanded={isOpen}
					onClick={onToggle}
				/>
			)}
			renderContent={() => (
				<div
					className="prc-chart-modal__control-tip-body"
					style={{ colorScheme: getColorScheme(buttonRef.current) }}
				>
					<p className="prc-chart-modal__control-tip-text">{text}</p>
				</div>
			)}
		/>
	);
}
