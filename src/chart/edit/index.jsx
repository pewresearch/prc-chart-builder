/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable max-lines */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable max-lines-per-function */
/**
 * WordPress Dependencies
 */
// import { ResizableBox, Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import {
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { store as editorStore } from '@wordpress/editor';

/**
 * External Dependencies
 */
import {
	ChartBuilderWrapper,
	ChartBuilderTextWrapper,
} from '@prc/charting-library';
// eslint-disable-next-line
import { memo, useEffect, useMemo, useState, useRef } from 'react';

/**
 * Internal Dependencies
 */
import { formatCellContent } from '../utils/helpers';
import { mergeCustomLabelData } from '../utils/merge-custom-label-data';
import ChartControls from './chart-controls';
import getConfig from '../utils/get-config';
import CopyPasteStylesHandler from './copy-paste-styles-handler';
import { TitleSubtitle, Footer } from './meta-text-fields';
import { createWpEditorFunctions } from './wp-editor-functions';
import { AlignmentOverlay } from './alignment-overlay';
import { DrawingOverlay } from './drawing-overlay';
import { DrawingLayer } from './drawing-layer';
import { DrawingSelectionLayer } from './drawing-selection-layer';
import { useViewportAttributes } from './use-viewport-attributes';
import { ChartElementPopover, ELEMENT_TYPES } from './popover';

const getCellContent = (cell) => {
	return (
		cell.content?.originalContent ||
		cell.content?.originalHTML ||
		cell.content?.text ||
		cell.content
	);
};

/**
 * Memoized wrapper for ChartBuilderWrapper to prevent re-renders during drag.
 * This ensures that alignment state updates don't break drag interactions.
 */
const MemoizedChartBuilder = memo(
	({ className, config, data, wpEditorFunctions }) => (
		<ChartBuilderWrapper
			className={className}
			config={config}
			data={data}
			wpEditorFunctions={wpEditorFunctions}
		/>
	)
);

export default function Edit({
	attributes: attrs,
	setAttributes,
	toggleSelection,
	clientId,
	isSelected,
	context,
}) {
	const { id, io, metadata, dataRender, drawings = [] } = attrs;

	const { chartData, isStaticChart, isFreeformChart } = io;
	const { groupBreaksCategory, mapScale } = dataRender || {};

	// Use the controller id to create a unique id for the chart.
	const controllerId = context['prc-chart-builder/id'];

	// Viewport-aware attribute management
	const { deviceType, getCurrentValue, updateAttributeForDevice } =
		useViewportAttributes(attrs, setAttributes);

	// Get viewport-aware layout dimensions
	const width = getCurrentValue('layout', 'width');
	const height = getCurrentValue('layout', 'height');

	// Get viewport-aware label customizations
	const customPositions = getCurrentValue('labels', 'customPositions');
	const customLabels = getCurrentValue('labels', 'customLabels');
	const customVisibility = getCurrentValue('labels', 'customVisibility');
	const customStyles = getCurrentValue('labels', 'customStyles');

	// Memoized chartData with all label customizations merged in
	// This merges labels.custom* attributes into chartData as __label* hidden attributes
	const chartDataWithCustomizations = useMemo(
		() =>
			mergeCustomLabelData(chartData, {
				customPositions,
				customLabels,
				customVisibility,
				customStyles,
			}),
		[chartData, customPositions, customLabels, customVisibility, customStyles]
	);

	// State for chart element customization popover (labels, shapes, etc.)
	const [selectedElement, setSelectedElement] = useState(null);

	// Track if we've already initialized the chart ID to prevent loops
	// in nested entity contexts (synced chart in tabs)
	const hasInitializedChartId = useRef(false);

	// Set chart ID based on controller ID (v2: nested in io.id)
	// Uses a ref guard to prevent repeated updates during entity re-parsing
	useEffect(() => {
		// Skip if already initialized
		if (hasInitializedChartId.current) {
			return;
		}

		if (controllerId) {
			const expectedChartId = `${controllerId}-chart`;
			// Only update if different to avoid unnecessary renders
			if (id !== expectedChartId) {
				hasInitializedChartId.current = true;
				setAttributes({
					id: expectedChartId,
				});
			} else {
				// ID already matches expected, mark as initialized
				hasInitializedChartId.current = true;
			}
		}
	}, [controllerId, id, setAttributes]);

	// Get table data from parent controller's innerBlocks
	const { tableData, parentBlockId, refId } = useSelect(
		(select) => {
			const { getBlock, getBlockParentsByBlockName } =
				select(blockEditorStore);
			const { getCurrentPostId, getCurrentPostType } =
				select(editorStore);

			// If we're in a synced chart context and have synced table data, use it
			const syncedTableData =
				context['prc-chart-builder/syncedTableData'];
			if (syncedTableData) {
				const editorContextPostType = getCurrentPostType();
				let postId = null;
				if (context && context.refId) {
					postId = context.refId;
				} else if ('chart' === editorContextPostType) {
					postId = getCurrentPostId();
				}

				return {
					tableData: syncedTableData,
					parentBlockId: controllerId,
					refId: postId,
				};
			}

			// Use getBlockParentsByBlockName to find controller parents
			// Returns array ordered from nearest to farthest ancestor
			const controllerParents = getBlockParentsByBlockName(
				clientId,
				'prc-chart-builder/controller'
			);

			// Find the first NON-freeform controller parent
			// Freeform charts are containers and should NEVER provide data to nested charts
			// A chart's data should always come from its own controller, not any freeform ancestor
			let parentControllerId = null;
			for (const parentId of controllerParents) {
				const controllerBlock = getBlock(parentId);
				// Skip freeform controllers - they don't provide data
				if (controllerBlock && !controllerBlock.attributes?.isFreeform) {
					parentControllerId = parentId;
					break;
				}
			}
			// Find the table block among the parent controller's children
			let tableAttributes = null;
			if (parentControllerId) {
				const controllerBlock = getBlock(parentControllerId);
				const innerBlocks = controllerBlock?.innerBlocks || [];

				const tableBlock = innerBlocks.find(
					(block) =>
						'core/table' === block.name ||
						'prc-block/table' === block.name
				);

				if (tableBlock) {
					const freshTableBlock = getBlock(tableBlock.clientId);
					tableAttributes = freshTableBlock?.attributes;
				}
			}

			const editorContextPostType = getCurrentPostType();

			let postId = null;
			if (context && context.refId) {
				postId = context.refId;
			} else if ('chart' === editorContextPostType) {
				postId = getCurrentPostId();
			}

			return {
				tableData: tableAttributes,
				parentBlockId: parentControllerId,
				refId: postId,
			};
		},
		[context, controllerId, clientId]
	);

	// Alignment state for visual guides during drag
	const [alignments, setAlignments] = useState({
		vertical: [],
		horizontal: [],
	});

	// Track drag state to disable tooltips during drag
	const [isDragging, setIsDragging] = useState(false);

	// Handle element click for customization popover (labels, shapes, segments, etc.)
	const handleElementClick = ({ elementType, dataPoint, startPoint, endPoint, category, defaultLabel, defaultColor, anchorEl }) => {
		setSelectedElement({
			elementType,
			dataPoint,
			startPoint,
			endPoint,
			category,
			defaultLabel,
			defaultColor,
			anchorEl,
		});
	};

	// Handle popover close
	const handlePopoverClose = () => {
		setSelectedElement(null);
	};

	// Handle label customization updates from popover
	const handleLabelCustomizationUpdate = (updates) => {
		// Merge updates into the labels attribute viewport-aware
		if (updates.customPositions !== undefined) {
			updateAttributeForDevice('labels', {
				customPositions: updates.customPositions,
			});
		}
		if (updates.customLabels !== undefined) {
			updateAttributeForDevice('labels', {
				customLabels: updates.customLabels,
			});
		}
		if (updates.customVisibility !== undefined) {
			updateAttributeForDevice('labels', {
				customVisibility: updates.customVisibility,
			});
		}
		if (updates.customStyles !== undefined) {
			updateAttributeForDevice('labels', {
				customStyles: updates.customStyles,
			});
		}
	};

	// Handle shape customization updates from popover
	const handleShapeCustomizationUpdate = (updates) => {
		// Merge updates into the shapes attribute viewport-aware
		if (updates.customStyles !== undefined) {
			updateAttributeForDevice('shapes', {
				customStyles: updates.customStyles,
			});
		}
	};

	// Handle segment customization updates from popover
	const handleSegmentCustomizationUpdate = (updates) => {
		// Merge updates into the shapes.segmentStyles attribute viewport-aware
		if (updates.segmentStyles !== undefined) {
			updateAttributeForDevice('shapes', {
				segmentStyles: updates.segmentStyles,
			});
		}
	};

	// Get the appropriate update handler based on element type
	const getCustomizationUpdateHandler = (elementType) => {
		if (elementType === ELEMENT_TYPES.SHAPE) {
			return handleShapeCustomizationUpdate;
		}
		if (elementType === ELEMENT_TYPES.SEGMENT) {
			return handleSegmentCustomizationUpdate;
		}
		return handleLabelCustomizationUpdate;
	};

	// Get the appropriate customizations based on element type
	const getCustomizationsForElement = (elementType) => {
		if (elementType === ELEMENT_TYPES.SHAPE) {
			const shapeCustomStyles = getCurrentValue('shapes', 'customStyles') || {};
			return {
				customStyles: shapeCustomStyles,
			};
		}
		if (elementType === ELEMENT_TYPES.SEGMENT) {
			const segmentStyles = getCurrentValue('shapes', 'segmentStyles') || {};
			return {
				segmentStyles,
			};
		}
		return {
			customPositions: customPositions || {},
			customLabels: customLabels || {},
			customVisibility: customVisibility || {},
			customStyles: customStyles || {},
		};
	};

	// WIP Editor functions for chart interactions
	const editorClickEvent = () => {
		// Editor click handler for chart interactions
	};
	// IMPORTANT: setAlignments and setIsDragging are NOT in dependencies to avoid recreating on every state change
	const wpEditorFunctions = useMemo(
		() =>
			createWpEditorFunctions({
				attrs,
				deviceType,
				getCurrentValue,
				updateAttributeForDevice,
				toggleSelection,
				setAlignments, // Pass alignment setter (stable reference)
				setIsDragging, // Pass drag state setter (stable reference)
				onElementClick: handleElementClick, // Pass callback for popover
			}),
		[
			attrs,
			deviceType,
			getCurrentValue,
			updateAttributeForDevice,
			toggleSelection,
		] // setAlignments, setIsDragging, handleElementClick intentionally excluded
	);

	const config = useMemo(() => {
		const baseConfig = getConfig(
			attrs,
			clientId,
			editorClickEvent,
			deviceType
		);

		// set the parent class to the chart builder chart for the editor
		baseConfig.layout.parentClass = 'wp-block-prc-chart-builder-chart';

		// Add IDs to annotations
		if (baseConfig.annotations?.items) {
			baseConfig.annotations.items = baseConfig.annotations.items.map(
				(annotation, index) => ({
					...annotation,
					id: String(index),
				})
			);
		}

		// Disable tooltips during drag to prevent conflicts
		if (isDragging) {
			baseConfig.tooltip = {
				...baseConfig.tooltip,
				active: false,
				activeOnMobile: false,
			};
		}

		return baseConfig;
	}, [attrs, clientId, deviceType, isDragging]);

	const headers = useMemo(
		() =>
			tableData
				? tableData.head[0].cells.map((c) => getCellContent(c))
				: [],
		[tableData]
	);

	const body = useMemo(() => (tableData ? tableData.body : []), [tableData]);

	const memoizedChartData = useMemo(
		() =>
			body.map((row) =>
				row.cells.reduce((acc, cell, index) => {
					const key = 0 === index ? 'x' : headers[index];
					return {
						...acc,
						[key]: formatCellContent(
							getCellContent(cell),
							key,
							mapScale,
							groupBreaksCategory,
							dataRender?.xScale,
							dataRender?.xFormat
						),
					};
				}, {})
			),
		[
			body,
			headers,
			mapScale,
			groupBreaksCategory,
			dataRender?.xScale,
			dataRender?.xFormat,
		]
	);

	// Track if initial data sync has completed to prevent loops during entity initialization
	const hasCompletedInitialDataSync = useRef(false);

	useEffect(() => {
		if (!headers || headers.length === 0) {
			return;
		}
		if (!memoizedChartData || memoizedChartData.length === 0) {
			return;
		}

		const [, ...rest] = headers;

		// Note: We no longer preserve __labelPositions from old chartData here.
		// Custom label positions are now managed via labels.customPositions (viewport-aware)
		// and merged into chartData at render time by mergeCustomLabelPositions utility.
		const newChartData = memoizedChartData;

		// Check if the data actually changed (deep comparison of data values)
		const dataChanged =
			!chartData ||
			chartData.length !== newChartData.length ||
			newChartData.some((newRow, index) => {
				const oldRow = chartData[index];
				if (!oldRow) return true;
				// Compare all keys
				return Object.keys(newRow).some((key) => {
					return newRow[key] !== oldRow[key];
				});
			});

		// Only update if data actually changed or if required metadata is missing
		if (!dataChanged && attrs.io?.availableCategories?.length > 0) {
			// Mark initial sync as complete even if no update needed
			hasCompletedInitialDataSync.current = true;
			return;
		}

		// Prevent rapid successive updates during entity initialization
		// by checking if we've already done the initial sync
		if (hasCompletedInitialDataSync.current && !dataChanged) {
			return;
		}

		hasCompletedInitialDataSync.current = true;

		setAttributes({
			io: {
				...(attrs.io || {}),
				availableCategories: rest,
				independentVariable: headers[0],
				chartData: newChartData,
			},
		});
		// Note: controllerId intentionally NOT in deps - it was causing loops
		// when controller ID changed during entity initialization.
		// This effect should only run when actual table data changes.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [headers, memoizedChartData, setAttributes]);

	const blockProps = useBlockProps({
		className: 'active',
	});

	const innerBlocksProps = useInnerBlocksProps();

	// Drawing state
	const [isDrawingMode, setIsDrawingMode] = useState(false);
	const [drawingTool, setDrawingTool] = useState('pen');
	const [strokeColor, setStrokeColor] = useState('#000000');
	const [strokeWidth, setStrokeWidth] = useState(1);
	const [selectedDrawingId, setSelectedDrawingId] = useState(null);

	function handleDrawingComplete(drawingData) {
		setAttributes({
			drawings: [...(drawings || []), drawingData],
		});
	}

	function handleDrawingModeChange(mode) {
		setIsDrawingMode(mode);
	}

	function handleToolChange(tool) {
		setDrawingTool(tool);
	}

	return (
		<>
			<ChartControls
				attributes={attrs}
				setAttributes={setAttributes}
				parentBlock={parentBlockId}
				clientId={clientId}
				isDrawingMode={isDrawingMode}
				drawingTool={drawingTool}
				onDrawingModeChange={handleDrawingModeChange}
				onToolChange={handleToolChange}
				strokeColor={strokeColor}
				strokeWidth={strokeWidth}
				onStrokeColorChange={setStrokeColor}
				onStrokeWidthChange={setStrokeWidth}
				selectedDrawingId={selectedDrawingId}
				onSelectedDrawingChange={setSelectedDrawingId}
			/>
			<CopyPasteStylesHandler
				attributes={attrs}
				setAttributes={setAttributes}
			/>
			<div {...blockProps}>
				<figure>
					<ChartBuilderTextWrapper
						active={config.metadata.active}
						width={width}
						horizontalRules={config.layout.horizontalRules}
					>
						{metadata.active && (
							<TitleSubtitle
								attributes={attrs}
								setAttributes={setAttributes}
							/>
						)}
						{(isStaticChart || isFreeformChart) && (
							<div className="cb__chart" {...innerBlocksProps} />
						)}
						{!isStaticChart &&
							!isFreeformChart &&
							memoizedChartData && (
								<div style={{ position: 'relative' }}>
								<MemoizedChartBuilder
									className="cb__chart"
									config={config}
									data={
										chartDataWithCustomizations ||
										memoizedChartData
									}
									wpEditorFunctions={wpEditorFunctions}
								/>
								{/* Chart Element Customization Popover (Labels, Shapes, Segments, etc.) */}
								{selectedElement && (
									<ChartElementPopover
										anchorRef={selectedElement.anchorEl}
										elementType={selectedElement.elementType}
										dataPoint={selectedElement.dataPoint}
										startPoint={selectedElement.startPoint}
										endPoint={selectedElement.endPoint}
										category={selectedElement.category}
										defaultLabel={selectedElement.defaultLabel}
										defaultColor={selectedElement.defaultColor}
										currentCustomizations={getCustomizationsForElement(selectedElement.elementType)}
										onUpdate={getCustomizationUpdateHandler(selectedElement.elementType)}
										onClose={handlePopoverClose}
									/>
								)}
									<DrawingLayer
										drawings={drawings}
										chartDimensions={{
											width,
											height,
											padding: config.layout.padding,
										}}
										chartWidth={width}
										chartHeight={height}
										layoutDimensions={{
											width: config.layout.width,
											height: config.layout.height,
											padding: config.layout.padding,
										}}
									/>
									{isSelected && !isDrawingMode && (
										<DrawingSelectionLayer
											drawings={drawings}
											chartDimensions={{
												width,
												height,
												padding: config.layout.padding,
											}}
											chartWidth={width}
											chartHeight={height}
											layoutDimensions={{
												width: config.layout.width,
												height: config.layout.height,
												padding: config.layout.padding,
											}}
											onDrawingsChange={(
												newDrawings
											) =>
												setAttributes({
													drawings: newDrawings,
												})
											}
											isDrawingMode={isDrawingMode}
											selectedDrawingId={selectedDrawingId}
											onSelectionChange={
												setSelectedDrawingId
											}
										/>
									)}
									<AlignmentOverlay
										alignments={alignments}
										chartDimensions={{
											width,
											height,
											padding: config.layout.padding,
										}}
									/>
									{isSelected && (
										<DrawingOverlay
											isActive={isDrawingMode}
											tool={drawingTool}
											onDrawingComplete={
												handleDrawingComplete
											}
											chartDimensions={{
												width,
												height,
												padding: config.layout.padding,
											}}
											chartWidth={width}
											chartHeight={height}
											strokeColor={strokeColor}
											strokeWidth={strokeWidth}
											layoutDimensions={{
												width: config.layout.width,
												height: config.layout.height,
												padding: config.layout.padding,
											}}
										/>
									)}
								</div>
							)}
						{metadata.active && (
							<Footer
								attributes={attrs}
								setAttributes={setAttributes}
							/>
						)}
					</ChartBuilderTextWrapper>
				</figure>
			</div>
		</>
	);
}
