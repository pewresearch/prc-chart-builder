/**
 * Review-step control that opens Gutenberg's note composer on the chart block.
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { store as coreStore, useEntityRecords } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __, sprintf } from '@wordpress/i18n';
import { comment } from '@wordpress/icons';
import { store as interfaceStore } from '@wordpress/interface';
import { store as noticesStore } from '@wordpress/notices';
import { store as preferencesStore } from '@wordpress/preferences';

import {
	NOTES_SIDEBAR_ID,
	canShowEditorNoteButton,
	getFloatingNotesViewportWidth,
	isWideEnoughForFloatingNotes,
	openEditorNote,
	planOpenEditorNote,
	postTypeSupportsEditorNotes,
	summarizeEditorNotes,
	toggleNotesSidebar,
} from './editor-note';
import { readSelectNote } from './editor-note-api';

/**
 * @param {Object}      props
 * @param {string|null} props.chartClientId   Chart block to attach the note to.
 * @param {Function}    [props.onUnavailable] Called when the private composer
 *                                            cannot open. The wizard uses this to show the controller block toolbar.
 * @return {import('react').ReactNode} The button, or null when notes are unavailable.
 */
export default function AddEditorNoteButton({ chartClientId, onUnavailable }) {
	const {
		postId,
		notesSupported,
		canEditPost,
		notesDisplayMode,
		activeComplementaryArea,
		isDistractionFree,
	} = useSelect((select) => {
		const editor = select(editorStore);
		const postTypeName = editor.getCurrentPostType();
		const currentPostId = editor.getCurrentPostId();
		const postType = postTypeName
			? select(coreStore).getPostType(postTypeName)
			: null;
		const canEdit =
			postTypeName && currentPostId
				? select(coreStore).canUser('update', {
						kind: 'postType',
						name: postTypeName,
						id: currentPostId,
					})
				: false;
		return {
			postId: currentPostId,
			notesSupported: postTypeSupportsEditorNotes(postType?.supports),
			canEditPost: canEdit === true,
			notesDisplayMode: select(preferencesStore).get(
				'core',
				'notesDisplayMode'
			),
			activeComplementaryArea:
				select(interfaceStore).getActiveComplementaryArea('core'),
			isDistractionFree: Boolean(
				select(preferencesStore).get('core', 'distractionFree')
			),
		};
	}, []);
	const { selectBlock } = useDispatch(blockEditorStore);
	const editorDispatch = useDispatch(editorStore);
	const { set: setPreference } = useDispatch(preferencesStore);
	const { disableComplementaryArea, enableComplementaryArea } =
		useDispatch(interfaceStore);
	const { createInfoNotice } = useDispatch(noticesStore);
	const helpId = `prc-chart-wizard-editor-note-help-${useInstanceId(AddEditorNoteButton)}`;

	const showButton = canShowEditorNoteButton({ notesSupported, canEditPost });

	// Same query args as Gutenberg's notes sidebar, so both share one cache
	// entry and the counts follow note changes made there.
	const { records: noteThreads } = useEntityRecords(
		'root',
		'comment',
		{ post: postId, type: 'note', status: 'all', per_page: -1 },
		{ enabled: showButton && typeof postId === 'number' }
	);

	if (!showButton) {
		return null;
	}

	const isNotesSidebarOpen = activeComplementaryArea === NOTES_SIDEBAR_ID;
	const noteSummary = summarizeEditorNotes(noteThreads);
	let noteStatusText = '';
	if (noteThreads) {
		noteStatusText =
			noteSummary.open + noteSummary.resolved === 0
				? __('No notes yet.', 'prc-chart-builder')
				: sprintf(
						/* translators: 1: number of open notes, 2: number of resolved notes. */
						__('%1$d open · %2$d resolved', 'prc-chart-builder'),
						noteSummary.open,
						noteSummary.resolved
					);
	}

	const handleClick = () => {
		if (!chartClientId) {
			return;
		}
		const selectNote = readSelectNote(editorDispatch);
		const plan = planOpenEditorNote({
			chartClientId,
			hasSelectNote: typeof selectNote === 'function',
			notesDisplayMode,
			activeComplementaryArea,
			isDistractionFree,
			isLargeViewport: isWideEnoughForFloatingNotes(
				getFloatingNotesViewportWidth(window)
			),
		});
		const opened = openEditorNote(plan, {
			selectBlock,
			selectNote,
			setPreference,
			disableComplementaryArea,
			enableComplementaryArea,
		});
		if (opened) {
			return;
		}
		createInfoNotice(
			__('Use Add note in the block toolbar.', 'prc-chart-builder'),
			{ type: 'snackbar' }
		);
		onUnavailable?.();
	};

	return (
		<div className="prc-chart-wizard__workflow-action">
			<Button
				variant="secondary"
				icon={comment}
				onClick={handleClick}
				disabled={!chartClientId}
				accessibleWhenDisabled
				aria-describedby={helpId}
				__next40pxDefaultSize
			>
				{__('Add editor note', 'prc-chart-builder')}
			</Button>
			<p id={helpId} className="prc-chart-wizard__workflow-action-help">
				{__(
					'Opens a note on this chart for other editors. Save the chart to keep the note.',
					'prc-chart-builder'
				)}
			</p>
			<div className="prc-chart-wizard__note-status">
				<p
					className="prc-chart-wizard__workflow-action-help"
					aria-live="polite"
				>
					{noteStatusText}
				</p>
				<Button
					variant="link"
					onClick={() =>
						toggleNotesSidebar(activeComplementaryArea, {
							enableComplementaryArea,
							disableComplementaryArea,
						})
					}
					aria-expanded={isNotesSidebarOpen}
				>
					{isNotesSidebarOpen
						? __('Hide all notes', 'prc-chart-builder')
						: __('View all notes', 'prc-chart-builder')}
				</Button>
			</div>
		</div>
	);
}
