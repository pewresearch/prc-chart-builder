/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/no-unresolved */
/* eslint-disable max-lines-per-function */
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	useInnerBlocksProps,
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	ToggleControl,
	PanelBody,
	TextControl,
	Button,
	Modal,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal Dependencies
 */
import Placeholder from './placeholder';
import ViewModeControls from './view-mode-controls';
import ChartCptWizardShell from './chart-cpt-wizard-shell';
import { isNewCreationUiEnabled, shouldHostCptWizard } from './creation-ui';
import { prefetchChartPatternsLibrary } from '../shared/select-chart-step';
import controllerStore from './store';
import useChartEditorPresence from './use-chart-editor-presence';
import { hasSiblingDuplicateChartId } from './utils/chart-id-conflicts';

/**
 * Sanitize a user-entered id into a value that is safe as a DOM id and an
 * Interactivity API store key: keep ASCII letters, digits, hyphens and
 * underscores; replace anything else with a hyphen.
 *
 * @param {string} value Raw input.
 * @return {string} Sanitized id.
 */
function sanitizeChartId(value) {
	return (value || '').replace(/[^a-zA-Z0-9_-]/g, '-');
}

/**
 * Generate a fresh, collision-resistant controller id in standard UUID format.
 *
 * @return {string} A new unique id.
 */
function generateChartId() {
	if (
		typeof crypto !== 'undefined' &&
		typeof crypto.randomUUID === 'function'
	) {
		return crypto.randomUUID();
	}

	const hex = (length) =>
		Array.from({ length }, () =>
			Math.floor(Math.random() * 16).toString(16)
		).join('');

	return `${hex(8)}-${hex(4)}-${hex(4)}-${hex(4)}-${hex(12)}`;
}

export default function Edit({ attributes, setAttributes, clientId, context }) {
	const {
		id,
		tabsActive,
		chartTabActive,
		dataTabActive,
		downloadImageTabActive,
		shareActive,
		chartType,
		enableSchemaOutput,
	} = attributes;

	useChartEditorPresence({
		controllerClientId: clientId,
		refId: context?.refId,
	});

	// Track if we've already initialized the ID in this component lifecycle
	// This prevents repeated setAttributes calls when the component remounts
	// due to entity re-parsing in nested entity contexts (e.g., synced chart in tabs)
	const hasInitializedId = useRef(false);
	// Session-scoped ignores so "Keep ID" doesn't reopen for the same conflict.
	const ignoredDuplicateIds = useRef(new Set());
	const [isDuplicateIdDialogOpen, setIsDuplicateIdDialogOpen] =
		useState(false);

	// Generate a stable unique ID on first mount that persists across re-renders
	// This prevents loops caused by clientId changing on entity re-parse
	const stableIdRef = useRef(null);
	if (!stableIdRef.current) {
		// Use existing id if available, otherwise generate a new stable one
		// We use clientId as the base but store it in a ref so it doesn't change
		stableIdRef.current = id || clientId;
	}

	// Initialize the ID attribute only once, and only if not already set
	// This effect is intentionally minimal to prevent re-render loops
	useEffect(() => {
		// Skip if we've already handled ID initialization in this instance
		if (hasInitializedId.current) {
			return;
		}

		// Only set ID if it's not already defined
		if (!id) {
			hasInitializedId.current = true;
			setAttributes({ id: stableIdRef.current });
		} else {
			// ID already exists, mark as initialized
			hasInitializedId.current = true;
		}
	}, [id, setAttributes]);

	const hasInitializedLock = useRef(false);

	const {
		layoutType,
		chartClientId,
		chartAttributes,
		chartIo,
		allowDataDownload,
		tableClientId,
		tableValidationSchema,
		selectedBlockClientId,
		selectedBlockParents,
		view,
		showBoth,
		postType,
		isPreviewMode,
		controllerBlocks,
	} = useSelect(
		(select) => {
			const {
				getBlock,
				getSelectedBlockClientId,
				getBlockParents,
				getBlocksByName,
			} = select(blockEditorStore);
			const { getControllerView, getControllerShowBoth } =
				select(controllerStore);
			const block = getBlock(clientId);
			const chartBlock = block?.innerBlocks?.find(
				(innerBlock) => innerBlock.name === 'prc-chart-builder/chart'
			);
			const tableBlock = block?.innerBlocks?.find(
				(innerBlock) => innerBlock.name === 'prc-block/table'
			);
			const sel = getSelectedBlockClientId();
			const controllerClientIds =
				typeof getBlocksByName === 'function'
					? getBlocksByName('prc-chart-builder/controller')
					: [];
			return {
				layoutType: chartBlock?.attributes?.layout?.type,
				chartClientId: chartBlock?.clientId,
				chartAttributes: chartBlock?.attributes ?? null,
				chartIo: chartBlock?.attributes?.io || {},
				allowDataDownload:
					chartBlock?.attributes?.io?.allowDataDownload ?? true,
				tableClientId: tableBlock?.clientId,
				tableValidationSchema:
					tableBlock?.attributes?.validationSchema || '',
				selectedBlockClientId: sel,
				selectedBlockParents: sel ? getBlockParents(sel) : [],
				view: getControllerView(id),
				showBoth: getControllerShowBoth(id),
				postType: select(editorStore).getCurrentPostType(),
				// BlockPreview iframes still see postType=chart; skip the CPT
				// wizard shell there so pattern cards render the chart canvas.
				isPreviewMode:
					!!select(blockEditorStore).getSettings().isPreviewMode,
				controllerBlocks: controllerClientIds
					.map((controllerClientId) => getBlock(controllerClientId))
					.filter(Boolean),
			};
		},
		[clientId, id]
	);

	const hasSiblingDuplicate = hasSiblingDuplicateChartId(
		controllerBlocks,
		clientId,
		id
	);
	const isControllerSelected =
		selectedBlockClientId === clientId ||
		(selectedBlockParents || []).includes(clientId);

	// Prompt only for the selected controller that shares an id with a sibling.
	// Render-time dedupe remains the safety net for cross-post embeds on a page.
	useEffect(() => {
		if (
			hasSiblingDuplicate &&
			isControllerSelected &&
			id &&
			!ignoredDuplicateIds.current.has(id)
		) {
			setIsDuplicateIdDialogOpen(true);
			return;
		}
		if (!hasSiblingDuplicate) {
			setIsDuplicateIdDialogOpen(false);
		}
	}, [hasSiblingDuplicate, isControllerSelected, id]);

	const { setControllerView, setControllerShowBoth } =
		useDispatch(controllerStore);

	// Host the 4-step wizard only when the site-level rollout flag is on, and
	// only for the live chart CPT canvas — not BlockPreview or article embeds.
	const hostCptWizard = shouldHostCptWizard({
		enabled: isNewCreationUiEnabled(window?.prcChartBuilderLibrary),
		postType,
		isPreviewMode,
	});

	useEffect(() => {
		if (hostCptWizard) {
			prefetchChartPatternsLibrary();
		}
	}, [hostCptWizard]);

	// Chart CPT: lock move/remove on the Controller via block attributes
	// (replaces CPT template_lock so Create pattern stays available).
	useEffect(() => {
		if (hasInitializedLock.current || !hostCptWizard) {
			return;
		}
		hasInitializedLock.current = true;
		const lock = attributes.lock;
		if (lock?.move && lock?.remove) {
			return;
		}
		setAttributes({
			lock: {
				...(lock && typeof lock === 'object' ? lock : {}),
				move: true,
				remove: true,
			},
		});
	}, [hostCptWizard, attributes.lock, setAttributes]);

	// Auto-switch the editor view to match whichever pane the user
	// selects (or selects a descendant of) from the list view or canvas.
	// This prevents the confusing case where clicking a hidden block
	// selects something the user can't see. Skipped when both panes are
	// visible or when the controller id isn't ready yet.
	useEffect(() => {
		if (!id || showBoth || !selectedBlockClientId) {
			return;
		}
		const ancestry = [selectedBlockClientId, ...selectedBlockParents];
		if (
			chartClientId &&
			ancestry.includes(chartClientId) &&
			view !== 'chart'
		) {
			setControllerView(id, 'chart');
		} else if (
			tableClientId &&
			ancestry.includes(tableClientId) &&
			view !== 'data'
		) {
			setControllerView(id, 'data');
		}
	}, [
		id,
		selectedBlockClientId,
		selectedBlockParents,
		chartClientId,
		tableClientId,
		showBoth,
		view,
		setControllerView,
	]);

	const { updateBlockAttributes, replaceInnerBlocks } =
		useDispatch(blockEditorStore);

	// Set the controller id and cascade the derived "{id}-chart" id to the
	// child chart so the pair stays in sync. Editors use this to hand a
	// copy/pasted chart a fresh, unique id without leaving the block. (The
	// server also deduplicates ids at render time as a safety net.)
	const applyControllerId = (nextId) => {
		const clean = sanitizeChartId(nextId);
		// An empty id is never valid: persisting it would leave the child
		// chart's derived "{id}-chart" attribute stale and desync the pair.
		if (!clean) {
			return;
		}
		setAttributes({ id: clean });
		if (chartClientId) {
			updateBlockAttributes(chartClientId, { id: `${clean}-chart` });
		}
	};

	const dismissDuplicateIdDialog = () => {
		if (id) {
			ignoredDuplicateIds.current.add(id);
		}
		setIsDuplicateIdDialogOpen(false);
	};

	const regenerateDuplicateId = () => {
		applyControllerId(generateChartId());
		setIsDuplicateIdDialogOpen(false);
	};

	// Map chartType to layout.type (matching VARIATION_TO_LAYOUT_TYPE from variations.js)
	const CHART_TYPE_TO_LAYOUT_TYPE = {
		bar: 'bar',
		column: 'bar',
		'stacked-bar': 'stacked-bar',
		'stacked-column': 'stacked-bar', // Uses stacked-bar layout with vertical orientation
		line: 'line',
		area: 'area',
		'stacked-area': 'stacked-area',
		'dot-plot': 'dot-plot',
		scatter: 'scatter',
		'bee-swarm': 'bee-swarm',
		pie: 'pie',
		'small-multiples': 'small-multiples',
		treemap: 'treemap',
		sankey: 'sankey',
		waffle: 'waffle',
		'waffle-portion': 'small-multiples',
		'heat-map-table': 'heat-map-table',
		'diverging-bar': 'diverging-bar',
		'exploded-bar': 'exploded-bar',
		'map-usa': 'map-usa',
		'map-usa-counties': 'map-usa-counties',
		'map-usa-cbsa': 'map-usa-cbsa',
		'map-usa-block': 'map-usa-block',
		'map-usa-hex': 'map-usa-hex',
		'map-world': 'map-world',
		'map-world-orthographic': 'map-world-orthographic',
		freeform: 'freeform',
	};

	// Get getBlock selector for use in effect
	const getBlock = useSelect(
		(select) => select(blockEditorStore).getBlock,
		[]
	);

	// Sync chartType changes to chart block's layout.type and orientation only
	useEffect(() => {
		// Only run if we have chartType and chartClientId
		if (!chartType || !chartClientId || !getBlock) {
			return;
		}

		// Get fresh chart block data inside effect to ensure we have latest
		const currentBlock = getBlock(clientId);
		const currentChartBlock = currentBlock?.innerBlocks?.find(
			(innerBlock) => innerBlock.name === 'prc-chart-builder/chart'
		);

		if (!currentChartBlock || !currentChartBlock.attributes?.layout) {
			return;
		}

		const expectedLayoutType = CHART_TYPE_TO_LAYOUT_TYPE[chartType];
		const currentLayoutType = currentChartBlock.attributes.layout.type;
		const currentOrientation =
			currentChartBlock.attributes.layout.orientation;

		// Determine expected orientation - same simple logic as bar/column
		let expectedOrientation = currentOrientation; // Preserve existing by default

		if (chartType === 'column' || chartType === 'stacked-column') {
			expectedOrientation = 'vertical';
		} else if (chartType === 'bar' || chartType === 'stacked-bar') {
			expectedOrientation = 'horizontal';
		}

		// Only update if something actually needs to change
		if (
			!expectedLayoutType ||
			(expectedLayoutType === currentLayoutType &&
				expectedOrientation === currentOrientation)
		) {
			return;
		}

		// Update ONLY layout.type and layout.orientation, preserving everything else
		const updatedLayout = {
			...currentChartBlock.attributes.layout,
			type: expectedLayoutType,
		};

		// Only set orientation if it needs to change
		if (expectedOrientation !== currentOrientation) {
			updatedLayout.orientation = expectedOrientation;
		}

		// Update only the layout object, preserving all other attributes
		updateBlockAttributes(chartClientId, {
			layout: updatedLayout,
		});
	}, [chartType, chartClientId, clientId, updateBlockAttributes, getBlock]);

	// Map maps to the table validation schema that enforces their geo column.
	// Block/hex maps key off state FIPS, same as the standard state map.
	const MAP_LAYOUT_TO_SCHEMA = {
		'map-usa': 'geo-state',
		'map-usa-block': 'geo-state',
		'map-usa-hex': 'geo-state',
		'map-usa-counties': 'geo-county',
		'map-usa-cbsa': 'geo-cbsa',
		'map-world': 'geo-country-numeric',
		'map-world-orthographic': 'geo-country-numeric',
	};

	// Keep the sibling table's validation schema in sync with the selected map
	// type so the table block surfaces the geo column requirements and flags
	// mis-named headers. Only manage the auto-applied geo-* schemas — leave any
	// other schema a producer set manually untouched.
	useEffect(() => {
		if (!tableClientId) {
			return;
		}
		const targetSchema = MAP_LAYOUT_TO_SCHEMA[layoutType] || '';
		if (targetSchema) {
			if (tableValidationSchema !== targetSchema) {
				updateBlockAttributes(tableClientId, {
					validationSchema: targetSchema,
				});
			}
		} else if (tableValidationSchema.startsWith('geo-')) {
			updateBlockAttributes(tableClientId, { validationSchema: '' });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [layoutType, tableClientId, tableValidationSchema]);

	const viewMode = showBoth ? 'both' : view;

	// Chart CPT wizard: blockProps on the host wrapper. Otherwise on the figure.
	const blockProps = useBlockProps(
		hostCptWizard
			? {}
			: {
					'data-view-mode': viewMode,
				}
	);
	const hasInnerBlocks = useSelect(
		(select) => select(blockEditorStore).getBlocks(clientId).length > 0,
		[clientId]
	);

	// Keep blockProps off useInnerBlocksProps — duplicating the controller
	// class onto the inner-blocks layout breaks direct-child view-mode CSS.
	const innerBlocksProps = useInnerBlocksProps(
		{},
		{
			renderAppender: false,
			templateLock: false,
		}
	);

	const onChartAttributesChange = useCallback(
		(nextAttributes) => {
			if (chartClientId) {
				updateBlockAttributes(chartClientId, nextAttributes);
			}
		},
		[chartClientId, updateBlockAttributes]
	);

	const onEnterDataStep = useCallback(() => {
		if (!id) {
			return;
		}
		// Table only in the left column — lean preview sits in the right pane.
		setControllerShowBoth(id, false);
		setControllerView(id, 'data');
	}, [id, setControllerShowBoth, setControllerView]);

	const onEnterDesignMode = useCallback(() => {
		if (!id) {
			return;
		}
		setControllerShowBoth(id, false);
		setControllerView(id, 'chart');
	}, [id, setControllerShowBoth, setControllerView]);

	const onEnterPreviewStep = useCallback(() => {
		if (!id) {
			return;
		}
		setControllerShowBoth(id, false);
		setControllerView(id, 'chart');
	}, [id, setControllerShowBoth, setControllerView]);

	// Empty controllers use the trunk Choose Chart Type placeholder unless the
	// site-level rollout flag hosts the full chart CPT wizard.
	if (!hasInnerBlocks && !hostCptWizard) {
		return <Placeholder {...{ attributes, setAttributes, clientId }} />;
	}

	const canvas = (
		<>
			{postType !== 'chart' && (
				<ViewModeControls
					view={view}
					showBoth={showBoth}
					onChangeView={(next) => setControllerView(id, next)}
					onChangeShowBoth={(next) => setControllerShowBoth(id, next)}
				/>
			)}
			<figure
				{...(hostCptWizard
					? {
							className: 'wp-block-prc-chart-builder-controller',
							'data-view-mode': viewMode,
						}
					: blockProps)}
			>
				<div {...innerBlocksProps} />
			</figure>
		</>
	);

	const inspector = (
		<InspectorControls>
			<PanelBody
				title={__('Tab Controls / Data Download / Schema.org')}
				initialOpen={true}
			>
				<p
					style={{
						marginTop: 0,
						marginBottom: '12px',
						fontSize: '12px',
					}}
				>
					{__(
						'Control which tabs appear below the chart. Hiding a tab removes it from the frontend entirely — users can only interact with what is shown.'
					)}
				</p>
				<ToggleControl
					label={__('Chart tab')}
					checked={chartTabActive}
					onChange={() =>
						setAttributes({ chartTabActive: !chartTabActive })
					}
				/>
				<ToggleControl
					label={__('Data tab')}
					checked={dataTabActive}
					onChange={() =>
						setAttributes({ dataTabActive: !dataTabActive })
					}
				/>
				<ToggleControl
					label={__('Allow data download')}
					checked={allowDataDownload}
					disabled={!dataTabActive || !chartClientId}
					onChange={() => {
						if (chartClientId) {
							updateBlockAttributes(chartClientId, {
								io: {
									...chartIo,
									allowDataDownload: !allowDataDownload,
								},
							});
						}
					}}
				/>
				<ToggleControl
					label={__('Download Image tab')}
					checked={downloadImageTabActive}
					onChange={() =>
						setAttributes({
							downloadImageTabActive: !downloadImageTabActive,
						})
					}
				/>
				<ToggleControl
					label={__('Share tab')}
					checked={shareActive}
					onChange={() =>
						setAttributes({ shareActive: !shareActive })
					}
				/>
				<ToggleControl
					label={__('Include in structured data (schema.org)')}
					help={__(
						"When enabled, this chart will be included in the page's JSON-LD schema as a Dataset. Disable for decorative or supplementary charts that should not appear in search results."
					)}
					checked={enableSchemaOutput}
					onChange={() =>
						setAttributes({
							enableSchemaOutput: !enableSchemaOutput,
						})
					}
				/>
			</PanelBody>
			<PanelBody title={__('Chart ID (advanced)')} initialOpen={false}>
				<p
					style={{
						marginTop: 0,
						marginBottom: '12px',
						fontSize: '12px',
					}}
				>
					{__(
						'This is the unique identifier for this chart. If you copied this chart from another chart, it may share an ID with the original — which can break rendering when both appear on the same page. Give it a distinct ID, or click Regenerate for a fresh one.'
					)}
				</p>
				<TextControl
					label={__('Chart ID')}
					value={id || ''}
					onChange={(next) => applyControllerId(next)}
					help={__(
						'Only letters, numbers, hyphens and underscores are allowed.'
					)}
					__nextHasNoMarginBottom
				/>
				<Button
					variant="secondary"
					onClick={() => applyControllerId(generateChartId())}
				>
					{__('Regenerate ID')}
				</Button>
			</PanelBody>
		</InspectorControls>
	);

	const duplicateIdDialog = isDuplicateIdDialogOpen ? (
		<Modal
			title={__('Duplicate Chart ID')}
			onRequestClose={dismissDuplicateIdDialog}
		>
			<p>
				{__(
					'Another chart in this editor shares this Chart ID. Regenerating gives this chart a unique ID so both can render correctly when they appear on the same page.'
				)}
			</p>
			<div
				style={{
					display: 'flex',
					justifyContent: 'flex-end',
					gap: '8px',
					marginTop: '16px',
				}}
			>
				<Button variant="tertiary" onClick={dismissDuplicateIdDialog}>
					{__('Keep ID')}
				</Button>
				<Button variant="primary" onClick={regenerateDuplicateId}>
					{__('Regenerate ID')}
				</Button>
			</div>
		</Modal>
	) : null;

	if (hostCptWizard) {
		return (
			<Fragment>
				{inspector}
				{duplicateIdDialog}
				<div {...blockProps}>
					<ChartCptWizardShell
						refineContent={canvas}
						chartAttributes={chartAttributes}
						chartClientId={chartClientId}
						onChartAttributesChange={onChartAttributesChange}
						chartType={chartType}
						clientId={clientId}
						setAttributes={setAttributes}
						replaceInnerBlocks={replaceInnerBlocks}
						tableClientId={tableClientId}
						onEnterDataStep={onEnterDataStep}
						onEnterDesignMode={onEnterDesignMode}
						onEnterPreviewStep={onEnterPreviewStep}
					/>
				</div>
			</Fragment>
		);
	}

	return (
		<Fragment>
			{inspector}
			{duplicateIdDialog}
			{canvas}
		</Fragment>
	);
}
