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
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';

export const InspectorFocusContext = createContext(null);

const PREFERENCES_SCOPE = 'prc-chart-builder';
const OPEN_PANELS_PREFERENCE = 'openPanels';
const NO_OPEN_PANELS = {};

/**
 * Returns the next open-state map after a panel toggles.
 *
 * @param {Object<string, boolean>} openPanels Current open state by panel ID.
 * @param {string}                  panelId    Panel being toggled.
 * @param {boolean}                 open       Whether the panel is opening.
 * @param {boolean}                 exclusive  Close every other panel on open.
 * @return {Object<string, boolean>} Next open state by panel ID.
 */
function getNextOpenPanels(openPanels, panelId, open, exclusive) {
	if (!open || !exclusive) {
		return { ...openPanels, [panelId]: open };
	}
	const closed = Object.fromEntries(
		Object.keys(openPanels).map((id) => [id, false])
	);
	return { ...closed, [panelId]: true };
}

/**
 * Provides focus and open state for inspector panels.
 * Holds which panels are open, and an array of panel IDs that should be
 * opened on the next render cycle.
 *
 * @param {Object}                    props
 * @param {import('react').ReactNode} props.children
 * @param {boolean}                   [props.defaultPanelsOpen] When true, panels using `useFocusedPanel` start expanded.
 * @param {boolean}                   [props.exclusive]         When true, opening a panel closes the others (accordion).
 * @param {boolean}                   [props.persist]           When true, open state is saved to user preferences, so it survives reloads and is shared by every provider that persists.
 */
export function InspectorFocusProvider({
	children,
	defaultPanelsOpen = false,
	exclusive = false,
	persist = false,
}) {
	const [focusedPanels, setFocusedPanels] = useState([]);
	const [localOpenPanels, setLocalOpenPanels] = useState(NO_OPEN_PANELS);
	const persistedOpenPanels = useSelect(
		(select) =>
			persist
				? select(preferencesStore).get(
						PREFERENCES_SCOPE,
						OPEN_PANELS_PREFERENCE
					)
				: undefined,
		[persist]
	);
	const openPanels = persist
		? (persistedOpenPanels ?? NO_OPEN_PANELS)
		: localOpenPanels;
	const registry = useRegistry();
	const { set: setPreference } = useDispatch(preferencesStore);
	const [selectedAnnotationIndex, setSelectedAnnotationIndex] =
		useState(null);

	const focusPanels = useCallback((panelIds) => {
		setFocusedPanels(Array.isArray(panelIds) ? panelIds : [panelIds]);
	}, []);

	const clearFocus = useCallback(() => setFocusedPanels([]), []);

	const setPanelOpen = useCallback(
		(panelId, open) => {
			if (!persist) {
				setLocalOpenPanels((current) =>
					getNextOpenPanels(current, panelId, open, exclusive)
				);
				return;
			}
			const current =
				registry
					.select(preferencesStore)
					.get(PREFERENCES_SCOPE, OPEN_PANELS_PREFERENCE) ??
				NO_OPEN_PANELS;
			setPreference(
				PREFERENCES_SCOPE,
				OPEN_PANELS_PREFERENCE,
				getNextOpenPanels(current, panelId, open, exclusive)
			);
		},
		[exclusive, persist, registry, setPreference]
	);

	return (
		<InspectorFocusContext.Provider
			value={{
				focusedPanels,
				focusPanels,
				clearFocus,
				defaultPanelsOpen,
				openPanels,
				setPanelOpen,
				selectedAnnotationIndex,
				setSelectedAnnotationIndex,
			}}
		>
			{children}
		</InspectorFocusContext.Provider>
	);
}

/**
 * Returns the raw focus context value.
 *
 * @return {{ focusedPanels: string[], focusPanels: Function, clearFocus: Function, defaultPanelsOpen?: boolean, openPanels: Object<string, boolean>, setPanelOpen: Function, selectedAnnotationIndex: number|null, setSelectedAnnotationIndex: Function }|null} Focus context, or null outside the provider.
 */
export function useInspectorFocus() {
	return useContext(InspectorFocusContext);
}

/**
 * Hook for use inside each *-controls.jsx panel component.
 * Returns controlled open state and a ref for scrollIntoView.
 * Inside a provider the open state lives in the provider, so it survives
 * the panel unmounting; outside one it is local.
 * When this panel's ID appears in focusedPanels, it opens itself
 * and scrolls into view, then clears the focus signal.
 *
 * @param {string}  panelId               The unique ID for this panel (e.g. 'labels', 'bar', 'colors').
 * @param {Object}  [options]
 * @param {boolean} [options.initialOpen] Open state before the user toggles the panel. Defaults to the provider's `defaultPanelsOpen`.
 * @return {{ isOpen: boolean, panelRef: import('react').RefObject, onToggle: Function }} Controlled open state helpers for PanelBody.
 */
export function useFocusedPanel(panelId, { initialOpen } = {}) {
	const ctx = useInspectorFocus();
	const defaultOpen = initialOpen ?? Boolean(ctx?.defaultPanelsOpen);
	const [localIsOpen, setLocalIsOpen] = useState(defaultOpen);
	const isOpen = ctx ? (ctx.openPanels[panelId] ?? defaultOpen) : localIsOpen;
	const setIsOpen = useCallback(
		(open) =>
			ctx ? ctx.setPanelOpen(panelId, open) : setLocalIsOpen(open),
		[ctx, panelId]
	);
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
