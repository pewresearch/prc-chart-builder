/**
 * WordPress Dependencies
 */
import { PanelBody } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import { useFocusedPanel } from './hooks/inspector-focus-context';

/**
 * PanelBody whose open state lives in the nearest InspectorFocusProvider,
 * for panels that render conditionally and so cannot call the hook inline.
 *
 * @param {Object}                    props
 * @param {string}                    props.panelId       Unique panel ID for the provider's open-state map.
 * @param {boolean}                   [props.initialOpen] Open state before the user toggles the panel.
 * @param {import('react').ReactNode} props.children
 */
export default function FocusedPanelBody({
	panelId,
	initialOpen,
	children,
	...props
}) {
	const { isOpen, panelRef, onToggle } = useFocusedPanel(panelId, {
		initialOpen,
	});
	return (
		<PanelBody
			{...props}
			ref={panelRef}
			opened={isOpen}
			onToggle={onToggle}
		>
			{children}
		</PanelBody>
	);
}
