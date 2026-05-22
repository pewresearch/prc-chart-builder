/**
 * WordPress Dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as editorStore } from '@wordpress/editor';

/**
 * External Dependencies
 */
import { useDeclarePresence } from '@prc/hooks';

/**
 * When true, emit verbose declarer diagnostics to the console under the
 * `[chart-presence:declare]` tag. Pairs with the `chart-presence` observer
 * logs in `use-chart-presence.js` so you can see both ends of the room.
 */
const PRESENCE_DEBUG = false;

/**
 * Resolves the identity of the InspectorControls panel that currently contains
 * the focused element, if any.
 *
 * Preference order:
 *   1. `data-presence-id` on any ancestor — stable slug, set automatically for
 *      any chart panel that uses `useFocusedPanel(panelId)`.
 *   2. The title text of the nearest `.components-panel__body` — localized
 *      human-readable fallback for panels that don't opt in.
 *
 * Returns `null` when focus is on the body, in the block canvas, or otherwise
 * not inside any inspector panel.
 *
 * @return {string|null} Panel identifier.
 */
function resolveFocusedPanel() {
	const active =
		typeof document !== 'undefined' ? document.activeElement : null;
	if (!active || active === document.body) {
		return null;
	}

	const tagged = active.closest('[data-presence-id]');
	if (tagged) {
		return tagged.getAttribute('data-presence-id');
	}

	const panelBody = active.closest('.components-panel__body');
	if (!panelBody) {
		return null;
	}

	const titleEl = panelBody.querySelector(
		'.components-panel__body-title, .components-panel__body-toggle'
	);
	const title = titleEl?.textContent?.trim();
	return title || null;
}

/**
 * Declares this user's activity in the chart CPT's Presence API room.
 *
 * Active only when the controller is the root of a chart CPT edit screen
 * (i.e. no `refId` has been passed down by a synced-chart wrapper). When
 * the controller is rendered inside a synced-chart in another post, this
 * hook is inert — observers in that room are the synced-chart wrappers,
 * not us.
 *
 * Publishes two dimensions of activity:
 *   - `section` — coarse block-level region derived from selection
 *     (`chart` | `data` | `controls`).
 *   - `panel`   — fine inspector-panel identity derived from DOM focus
 *     (e.g. `dependentAxis`, `labels`, or a localized title string).
 *     Null when the user isn't focused inside any inspector panel.
 *
 * @param {Object} params
 * @param {string} params.controllerClientId The controller block's client id.
 * @param {string} [params.refId]            Chart CPT ref passed via Block Context
 *                                           when rendered inside a synced-chart.
 */
export default function useChartEditorPresence({ controllerClientId, refId }) {
	const { currentPostId, currentPostType, section } = useSelect((select) => {
		const editor = select(editorStore);
		const blockEditor = select(blockEditorStore);
		const selectedId = blockEditor.getSelectedBlockClientId();

		let resolvedSection = 'chart';

		if (selectedId) {
			const name = blockEditor.getBlockName(selectedId);
			const parentNames = blockEditor
				.getBlockParents(selectedId)
				.map((id) => blockEditor.getBlockName(id));

			const isTableBlock = (blockName) =>
				blockName === 'prc-block/table' || blockName === 'core/table';

			if (isTableBlock(name) || parentNames.some(isTableBlock)) {
				resolvedSection = 'data';
			} else if (
				name === 'prc-chart-builder/chart' ||
				parentNames.includes('prc-chart-builder/chart')
			) {
				resolvedSection = 'chart';
			} else if (name === 'prc-chart-builder/controller') {
				resolvedSection = 'controls';
			}
		}

		return {
			currentPostId: editor.getCurrentPostId(),
			currentPostType: editor.getCurrentPostType(),
			section: resolvedSection,
		};
	}, []);

	// Only publish when the controller is the root of a chart CPT edit screen.
	// When nested inside a synced-chart (refId present), observers in the room
	// are the synced-chart wrappers — we'd be talking to ourselves. When the
	// Presence API plugin isn't loaded on the site, `useDeclarePresence` gates
	// itself internally on `window.prcPlatform.presenceApiEnabled` (temporary
	// bridge until deeper Presence integration) and becomes fully inert (no
	// fetches, no setInterval, no apiFetch retries), so we don't need to repeat
	// that check here.
	const isChartRoot =
		!refId && currentPostType === 'chart' && !!currentPostId;
	const room = isChartRoot ? `postType/chart:${currentPostId}` : null;

	// Track which inspector panel currently contains focus. Listener is
	// attached only while we're actively publishing, so dormant hook instances
	// (controllers rendered inside synced-charts) don't add any global cost.
	const [panel, setPanel] = useState(null);
	useEffect(() => {
		if (!isChartRoot) {
			return undefined;
		}

		const onFocusChange = () => {
			const next = resolveFocusedPanel();
			setPanel((prev) => (prev === next ? prev : next));
		};

		onFocusChange();
		document.addEventListener('focusin', onFocusChange, true);
		document.addEventListener('focusout', onFocusChange, true);

		return () => {
			document.removeEventListener('focusin', onFocusChange, true);
			document.removeEventListener('focusout', onFocusChange, true);
		};
	}, [isChartRoot]);

	useDeclarePresence(
		room,
		{ action: 'editing', section, panel },
		{
			clientIdPrefix: `chart-controller-${controllerClientId}`,
			debug: PRESENCE_DEBUG ? 'chart-presence:declare' : false,
		}
	);

	useEffect(() => {
		if (!PRESENCE_DEBUG) return;
		// eslint-disable-next-line no-console
		console.log('[chart-presence:declare] mount state', {
			controllerClientId,
			refId,
			currentPostId,
			currentPostType,
			isChartRoot,
			room,
			section,
			panel,
		});
	}, [
		controllerClientId,
		refId,
		currentPostId,
		currentPostType,
		isChartRoot,
		room,
		section,
		panel,
	]);
}
