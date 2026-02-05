/**
 * Popover Context
 *
 * Provides shared state and functions for popover components.
 */

import { createContext, useContext } from '@wordpress/element';

/**
 * Context for sharing popover state.
 */
export const PopoverContext = createContext({
	selectedElement: null,
	currentCustomizations: {},
	onUpdate: () => {},
	onClose: () => {},
});

/**
 * Hook to access popover context.
 *
 * @return {Object} Popover context values
 */
export function usePopoverContext() {
	return useContext(PopoverContext);
}

/**
 * Popover Context Provider
 *
 * @param {Object}   props
 * @param {Object}   props.selectedElement       - The selected element data
 * @param {Object}   props.currentCustomizations - Current customizations from attributes
 * @param {Function} props.onUpdate              - Callback to update customizations
 * @param {Function} props.onClose               - Callback to close the popover
 * @param {Object}   props.children              - Child components
 */
export function PopoverProvider({
	selectedElement,
	currentCustomizations,
	onUpdate,
	onClose,
	children,
}) {
	return (
		<PopoverContext.Provider
			value={{
				selectedElement,
				currentCustomizations,
				onUpdate,
				onClose,
			}}
		>
			{children}
		</PopoverContext.Provider>
	);
}

export default PopoverContext;
