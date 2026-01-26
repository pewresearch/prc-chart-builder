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
import { memo, useEffect, useMemo, useState } from 'react';

/**
 * Internal Dependencies
 */
import { formatCellContent } from '../utils/helpers';
import { mergeCustomLabelPositions } from '../utils/merge-custom-label-positions';
import ChartControls from './chart-controls';
import getConfig from '../utils/get-config';
// import CopyPasteStylesHandler from './copy-paste-styles-handler';
import { TitleSubtitle, Footer } from './meta-text-fields';
import { createWpEditorFunctions } from './wp-editor-functions';
import { AlignmentOverlay } from './alignment-overlay';
import { DrawingOverlay } from './drawing-overlay';
import { DrawingLayer } from './drawing-layer';
import { useViewportAttributes } from './use-viewport-attributes';

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

	// Get viewport-aware custom label positions
	const customLabelPositions = getCurrentValue('labels', 'customPositions');

	// Memoized chartData with custom positions merged in
	// This merges labels.customPositions into chartData as __labelPositions
	const chartDataWithCustomPositions = useMemo(
		() => mergeCustomLabelPositions(chartData, customLabelPositions),
		[chartData, customLabelPositions]
	);

	// Set chart ID based on controller ID (v2: nested in io.id)
	useEffect(() => {
		if (controllerId) {
			const expectedChartId = `${controllerId}-chart`;
			// Only update if different to avoid unnecessary renders
			if (id !== expectedChartId) {
				setAttributes({
					id: expectedChartId,
				});
			}
		}
	}, [controllerId, id, setAttributes]);

	// Get table data from parent controller's innerBlocks
	const { tableData, parentBlockId, refId } = useSelect(
		(select) => {
			const { getBlock, getBlockParents } = select(blockEditorStore);
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

			// Use the actual parent from the block tree
			// Context ID might be stale after migration, so we use the actual parent
			const chartParents = getBlockParents(clientId);
			const actualParentId =
				chartParents.length > 0 ? chartParents[0] : null;
			const parentControllerId = actualParentId || controllerId;

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
	const editorClickEvent = () => {
		// Editor click handler for chart interactions
	};

	// Alignment state for visual guides during drag
	const [alignments, setAlignments] = useState({
		vertical: [],
		horizontal: [],
	});

	// Track drag state to disable tooltips during drag
	const [isDragging, setIsDragging] = useState(false);

	// Editor functions for chart interactions
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
			}),
		[
			attrs,
			deviceType,
			getCurrentValue,
			updateAttributeForDevice,
			toggleSelection,
		] // setAlignments and setIsDragging intentionally excluded
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
			return;
		}

		setAttributes({
			io: {
				...(attrs.io || {}),
				availableCategories: rest,
				independentVariable: headers[0],
				chartData: newChartData,
			},
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [headers, memoizedChartData, setAttributes, controllerId]);

	const blockProps = useBlockProps({
		className: 'active',
	});

	const innerBlocksProps = useInnerBlocksProps();

	// Drawing state
	const [isDrawingMode, setIsDrawingMode] = useState(false);
	const [drawingTool, setDrawingTool] = useState('pen');
	const [strokeColor, setStrokeColor] = useState('#000000');
	const [strokeWidth, setStrokeWidth] = useState(2);

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
			/>
			{/* <CopyPasteStylesHandler
				id={id}
				attributes={attrs}
				setAttributes={setAttributes}
			> */}
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
											chartDataWithCustomPositions ||
											memoizedChartData
										}
										wpEditorFunctions={wpEditorFunctions}
									/>
									<DrawingLayer
										drawings={drawings}
										chartDimensions={{
											width,
											height,
											padding: config.layout.padding,
										}}
										chartWidth={width}
										chartHeight={height}
									/>
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
			{/* </CopyPasteStylesHandler> */}
		</>
	);
}
