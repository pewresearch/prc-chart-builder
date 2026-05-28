/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/no-unresolved */
/* eslint-disable max-lines-per-function */
import { Fragment, useEffect, useRef } from 'react';

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
import { ToggleControl, PanelBody } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';

/**
 * Internal Dependencies
 */
import Placeholder from './placeholder';
import ViewModeControls from './view-mode-controls';
import controllerStore from './store';
import useChartEditorPresence from './use-chart-editor-presence';

export default function Edit({ attributes, setAttributes, clientId, context }) {
	const { id, tabsActive, shareActive, chartType, enableSchemaOutput } =
		attributes;

	useChartEditorPresence({
		controllerClientId: clientId,
		refId: context?.refId,
	});

	// Track if we've already initialized the ID in this component lifecycle
	// This prevents repeated setAttributes calls when the component remounts
	// due to entity re-parsing in nested entity contexts (e.g., synced chart in tabs)
	const hasInitializedId = useRef(false);

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

	const {
		layoutType,
		chartClientId,
		tableClientId,
		selectedBlockClientId,
		selectedBlockParents,
		view,
		showBoth,
	} = useSelect(
		(select) => {
			const { getBlock, getSelectedBlockClientId, getBlockParents } =
				select(blockEditorStore);
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
			return {
				layoutType: chartBlock?.attributes?.layout?.type,
				chartClientId: chartBlock?.clientId,
				tableClientId: tableBlock?.clientId,
				selectedBlockClientId: sel,
				selectedBlockParents: sel ? getBlockParents(sel) : [],
				view: getControllerView(id),
				showBoth: getControllerShowBoth(id),
			};
		},
		[clientId, id]
	);

	const { setControllerView, setControllerShowBoth } =
		useDispatch(controllerStore);

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

	const { updateBlockAttributes } = useDispatch(blockEditorStore);
	const variations = useSelect((select) => {
		const { getBlockVariations } = select(blocksStore);
		return getBlockVariations('prc-chart-builder/controller');
	}, []);

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
		pie: 'pie',
		treemap: 'treemap',
		sankey: 'sankey',
		'diverging-bar': 'diverging-bar',
		'exploded-bar': 'exploded-bar',
		'map-usa': 'map-usa',
		'map-usa-counties': 'map-usa-counties',
		'map-usa-cbsa': 'map-usa-cbsa',
		'map-usa-block': 'map-usa-block',
		'map-usa-hex': 'map-usa-hex',
		'map-world': 'map-world',
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
	}, [
		chartType,
		chartClientId,
		clientId,
		variations,
		updateBlockAttributes,
		getBlock,
	]);

	const dummyCSVS = [
		{
			name: 'US State Map',
			url: 'https://www.pewresearch.org/wp-content/uploads/sites/20/2024/10/usa-state.csv',
		},
		{
			name: 'US County Map',
			url: 'https://www.pewresearch.org/wp-content/uploads/sites/20/2024/10/usa-county.csv',
		},
		{
			name: 'US Block Map',
			url: 'https://www.pewresearch.org/wp-content/uploads/sites/20/2024/10/usa-block-map.csv',
		},
		{
			name: 'World Map',
			url: 'https://www.pewresearch.org/wp-content/uploads/sites/20/2024/10/world.csv',
		},
	];

	const viewMode = showBoth ? 'both' : view;

	const blockProps = useBlockProps({
		'data-view-mode': viewMode,
	});
	const hasInnerBlocks = useSelect(
		(select) => select(blockEditorStore).getBlocks(clientId).length > 0,
		[clientId]
	);

	const innerBlocksProps = useInnerBlocksProps(blockProps, {
		renderAppender: false,
		templateLock: false,
	});

	if (!hasInnerBlocks) {
		return <Placeholder {...{ attributes, setAttributes, clientId }} />;
	}

	return (
		<Fragment>
			<ViewModeControls
				view={view}
				showBoth={showBoth}
				onChangeView={(next) => setControllerView(id, next)}
				onChangeShowBoth={(next) => setControllerShowBoth(id, next)}
			/>
			<InspectorControls>
				{/* check if layout.type has substring of 'map' */}
				{layoutType && layoutType.includes('map') && (
					<PanelBody>
						<p>
							<strong>
								Your table must include{' '}
								<a href="https://transition.fcc.gov/oet/info/maps/census/fips/fips.txt">
									county or state FIPS codes
								</a>{' '}
								to match the data for a US Map, or{' '}
								<a href="https://www.iban.com/country-codes">
									3-digit ISO codes
								</a>{' '}
								for world maps.
							</strong>{' '}
						</p>
						<p>Dummy data for maps can be found here:</p>
						<ul>
							{dummyCSVS.map((csv) => (
								<li key={csv.name}>
									<a href={csv.url} download>
										{csv.name}
									</a>
								</li>
							))}
						</ul>
					</PanelBody>
				)}
				<PanelBody>
					<ToggleControl
						label={__('Show tabs')}
						checked={tabsActive}
						help={__(
							'If unchecked, only the chart will be shown. Disable this for small multiples and charts where you do not want to show underlying data.'
						)}
						onChange={() =>
							setAttributes({ tabsActive: !tabsActive })
						}
					/>
					<ToggleControl
						label={__('Show share tab')}
						help={__(
							'If unchecked, only chart and data tabs will be shown.'
						)}
						checked={shareActive}
						onChange={() =>
							setAttributes({
								shareActive: !shareActive,
							})
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
			</InspectorControls>
			<figure {...blockProps}>
				<div {...innerBlocksProps} />
			</figure>
		</Fragment>
	);
}
