/**
 * Pure decisions for the review-step "Add editor note" control.
 *
 * Gutenberg attaches the note to the selected block and stores every id in
 * `metadata.noteId`, accepting both the legacy scalar and the current array.
 * This module only decides when the control is shown and which editor actions
 * open the composer. It does not write note ids itself.
 */

/** Complementary area id for Gutenberg's "All notes" sidebar. */
export const NOTES_SIDEBAR_ID = 'edit-post/collab-history-sidebar';

/**
 * Gutenberg treats viewports at or above the `medium` breakpoint (782px) as
 * wide enough for the floating note composer.
 */
export const NOTES_FLOATING_MIN_WIDTH = 782;

/**
 * Width of the editor window, not the canvas iframe.
 *
 * The review step renders inside the canvas iframe, so `window.innerWidth`
 * there is the canvas. The note composer measures the parent editor window.
 *
 * @param {Window} view Window the control is running in.
 * @return {number} Viewport width in pixels.
 */
export function getFloatingNotesViewportWidth(view) {
	try {
		const parent = view.parent;
		if (
			parent &&
			parent !== view &&
			typeof parent.innerWidth === 'number'
		) {
			return parent.innerWidth;
		}
	} catch {
		return view.innerWidth;
	}
	return view.innerWidth;
}

/**
 * @param {number} width Viewport width in pixels.
 * @return {boolean} True when the floating note composer can render.
 */
export function isWideEnoughForFloatingNotes(width) {
	return width >= NOTES_FLOATING_MIN_WIDTH;
}

/**
 * Whether a post type's REST `supports` map includes `editor.notes`.
 *
 * Mirrors `PostTypeSupportCheck` for the `editor.notes` key: the editor
 * feature is an array whose first entry is either `{ notes: true }` or a
 * list that contains `notes`.
 *
 * @param {Object|null|undefined} supports Post type `supports` map.
 * @return {boolean} True when the post type can host block notes.
 */
export function postTypeSupportsEditorNotes(supports) {
	const editor = supports?.editor;
	if (!Array.isArray(editor) || editor.length === 0) {
		return false;
	}
	const [sub] = editor;
	if (Array.isArray(sub)) {
		return sub.includes('notes');
	}
	return Boolean(sub?.notes);
}

/**
 * Whether the review-step control should render.
 *
 * Hidden until both facts are known: the post type supports notes, and the
 * current user can edit the post (the same capability that creates a note).
 *
 * @param {Object}  args
 * @param {boolean} args.notesSupported Post type supports `editor.notes`.
 * @param {boolean} args.canEditPost    User can update the current post.
 * @return {boolean} True when the button should render.
 */
export function canShowEditorNoteButton({ notesSupported, canEditPost }) {
	return notesSupported === true && canEditPost === true;
}

/**
 * Decide how to open a block note on the chart.
 *
 * On a large viewport the composer floats beside the canvas, and it stays
 * hidden while the All notes sidebar is open or notes are set to hidden.
 * On a small viewport the floating composer does not render, so the All
 * notes sidebar is opened instead.
 *
 * @param {Object}      args
 * @param {string|null} args.chartClientId             Chart block clientId.
 * @param {boolean}     args.hasSelectNote             Private `selectNote` action is available.
 * @param {string}      [args.notesDisplayMode]        `'full' | 'minimized' | 'hidden'`.
 * @param {string|null} [args.activeComplementaryArea] Open sidebar identifier.
 * @param {boolean}     [args.isDistractionFree]       Distraction free hides the notes UI.
 * @param {boolean}     [args.isLargeViewport]         Viewport is wide enough for floating notes.
 * @return {{ ok: true, selectClientId: string, unhideNotes: boolean, closeSidebar: boolean, openSidebar: boolean, exitDistractionFree: boolean } | { ok: false }}
 *   Actions to run, or `{ ok: false }` when the private composer cannot open.
 */
export function planOpenEditorNote({
	chartClientId,
	hasSelectNote,
	notesDisplayMode,
	activeComplementaryArea,
	isDistractionFree = false,
	isLargeViewport = true,
}) {
	if (!chartClientId || !hasSelectNote) {
		return { ok: false };
	}
	const sidebarOpen = activeComplementaryArea === NOTES_SIDEBAR_ID;
	return {
		ok: true,
		selectClientId: chartClientId,
		unhideNotes: notesDisplayMode === 'hidden',
		closeSidebar: isLargeViewport && sidebarOpen,
		openSidebar: !isLargeViewport && !sidebarOpen,
		exitDistractionFree: Boolean(isDistractionFree),
	};
}

/**
 * Run a plan from {@link planOpenEditorNote}.
 *
 * Selects the chart block before `selectNote`, so a selection subscriber
 * that clears the note runs first and the `'new'` selection wins.
 *
 * @param {ReturnType<typeof planOpenEditorNote>} plan
 * @param {Object}                                actions
 * @param {Function}                              actions.selectBlock
 * @param {Function}                              actions.selectNote
 * @param {Function}                              actions.setPreference
 * @param {Function}                              actions.disableComplementaryArea
 * @param {Function}                              actions.enableComplementaryArea
 * @return {boolean} True when the composer was requested.
 */
export function openEditorNote(plan, actions) {
	if (!plan.ok) {
		return false;
	}
	if (plan.exitDistractionFree) {
		actions.setPreference('core', 'distractionFree', false);
	}
	if (plan.unhideNotes) {
		actions.setPreference('core', 'notesDisplayMode', 'full');
	}
	if (plan.closeSidebar) {
		actions.disableComplementaryArea('core');
	}
	if (plan.openSidebar) {
		actions.enableComplementaryArea('core', NOTES_SIDEBAR_ID);
	}
	actions.selectBlock(plan.selectClientId);
	actions.selectNote('new', { focus: true });
	return true;
}

/**
 * Counts note threads by status.
 *
 * Gutenberg stores a note as a `note` comment. Status `hold` is open and
 * `approved` is resolved. Only top-level threads count: replies, and the
 * status reply Gutenberg adds on resolve, carry a parent id.
 *
 * @param {Object[]|null|undefined} threads Note comments from core-data.
 * @return {{open: number, resolved: number}} Thread counts.
 */
export function summarizeEditorNotes(threads) {
	const summary = { open: 0, resolved: 0 };
	(threads ?? []).forEach((thread) => {
		if (thread.parent !== 0) {
			return;
		}
		if (thread.status === 'approved') {
			summary.resolved += 1;
		} else if (thread.status === 'hold') {
			summary.open += 1;
		}
	});
	return summary;
}

/**
 * Open the All notes sidebar, or close it when it is already open.
 *
 * @param {string|null|undefined} activeComplementaryArea          Open sidebar identifier.
 * @param {Object}                actions
 * @param {Function}              actions.enableComplementaryArea
 * @param {Function}              actions.disableComplementaryArea
 */
export function toggleNotesSidebar(activeComplementaryArea, actions) {
	if (activeComplementaryArea === NOTES_SIDEBAR_ID) {
		actions.disableComplementaryArea('core');
		return;
	}
	actions.enableComplementaryArea('core', NOTES_SIDEBAR_ID);
}
