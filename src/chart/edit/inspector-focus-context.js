/**
 * Context and hooks for programmatically focusing inspector sidebar panels
 * when chart elements are clicked (labels, shapes, legend items, axes, etc.).
 *
 * Usage:
 *   1. Wrap the editor root in <InspectorFocusProvider>.
 *   2. Call focusPanels(['bar', 'colors']) from handleElementClick.
 *   3. In each *-controls.jsx, use useFocusedPanel('bar') to get
 *      { isOpen, panelRef, onToggle } and wire them to <PanelBody>.
 */

/**
 * WordPress Dependencies
 */
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from '@wordpress/element';

export const InspectorFocusContext = createContext(null);

/**
 * Provides focus state for inspector panels.
 * Holds an array of panel IDs that should be opened on the next render cycle.
 *
 * @param {Object}                    props
 * @param {import('react').ReactNode} props.children
 */
export function InspectorFocusProvider({ children }) {
	const [focusedPanels, setFocusedPanels] = useState([]);

	const focusPanels = useCallback((panelIds) => {
		setFocusedPanels(Array.isArray(panelIds) ? panelIds : [panelIds]);
	}, []);

	const clearFocus = useCallback(() => setFocusedPanels([]), []);

	return (
		<InspectorFocusContext.Provider
			value={{ focusedPanels, focusPanels, clearFocus }}
		>
			{children}
		</InspectorFocusContext.Provider>
	);
}

/**
 * Returns the raw focus context value.
 *
 * @return {{ focusedPanels: string[], focusPanels: Function, clearFocus: Function }|null}
 */
export function useInspectorFocus() {
	return useContext(InspectorFocusContext);
}

/**
 * Hook for use inside each *-controls.jsx panel component.
 * Returns controlled open state and a ref for scrollIntoView.
 * When this panel's ID appears in focusedPanels, it opens itself
 * and scrolls into view, then clears the focus signal.
 *
 * @param {string} panelId - The unique ID for this panel (e.g. 'labels', 'bar', 'colors').
 * @return {{ isOpen: boolean, panelRef: import('react').RefObject, onToggle: Function }}
 */
export function useFocusedPanel(panelId) {
	const ctx = useInspectorFocus();
	const [isOpen, setIsOpen] = useState(false);
	const panelRef = useRef(null);

	useEffect(() => {
		if (ctx?.focusedPanels?.includes(panelId)) {
			setIsOpen(true);
			// Defer scroll until after PanelBody has painted open
			setTimeout(() => {
				panelRef.current?.scrollIntoView({
					behavior: 'smooth',
					block: 'start',
				});
			}, 50);
			ctx.clearFocus();
		}
	}, [ctx?.focusedPanels, panelId]); // eslint-disable-line react-hooks/exhaustive-deps

	// Expose the stable panel id on the DOM so observational layers
	// (e.g. presence) can identify which panel a focused input lives in
	// without every controls file having to wire it up. Purely additive —
	// panels not wrapped with `useFocusedPanel` fall back to title-text
	// detection in the consumer.
	useEffect(() => {
		const el = panelRef.current;
		if (!el) return;
		el.setAttribute('data-presence-id', panelId);
	}, [panelId]);

	return { isOpen, panelRef, onToggle: setIsOpen };
}
