/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable max-lines */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable max-lines-per-function */
/**
 * WordPress Dependencies
 */
import { Notice } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
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
import { formatCellContentTyped } from '../utils/helpers';
import { mergeCustomLabelData } from '../utils/merge-custom-label-data';
import { mergeCustomTooltipData } from '../utils/merge-custom-tooltip-data';
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
import {
	InspectorFocusProvider,
	useInspectorFocus,
} from './inspector-focus-context';
import {
	BAR_CHART_TYPES,
	LINE_CHART_TYPES,
	NODE_CHART_TYPES,
	MAP_CHART_TYPES,
} from '../utils/chart-types';

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

function EditInner({
	attributes: attrs,
	setAttributes,
	toggleSelection,
	clientId,
	isSelected,
	context,
}) {
	const { focusPanels } = useInspectorFocus();
	const { id, io, metadata, dataRender, drawings = [] } = attrs;

	const { chartData, isStaticChart, isFreeformChart, preserveStringKeys } =
		io;
	const { groupBreaksActive, groupBreaksCategory, mapScale } =
		dataRender || {};

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

	// Determine group breaks category for key matching
	const activeGroupBreaksCategory =
		groupBreaksActive && groupBreaksCategory ? groupBreaksCategory : null;

	// Memoized chartData with all label customizations merged in
	// This merges labels.custom* attributes into chartData as __label* hidden attributes
	const chartDataWithLabelCustomizations = useMemo(
		() =>
			mergeCustomLabelData(
				chartData,
				{
					customPositions,
					customLabels,
					customVisibility,
					customStyles,
				},
				activeGroupBreaksCategory
			),
		[
			chartData,
			customPositions,
			customLabels,
			customVisibility,
			customStyles,
			activeGroupBreaksCategory,
		]
	);

	// Enrich chart data with __errorBars from column mappings (dot-plot only)
	const isDotPlot = attrs?.layout?.type === 'dot-plot';
	const errorBarsAttr = getCurrentValue('errorBars') || {};
	const errorBarsCategories = errorBarsAttr.categories || {};
	const errorBarsDefaultStyles = errorBarsAttr.defaultStyles || {};
	const chartDataWithCustomizations = useMemo(() => {
		const source = chartDataWithLabelCustomizations || chartData;
		if (!isDotPlot || !errorBarsAttr.enabled || !source) return source;

		const mappingEntries = Object.entries(errorBarsCategories);
		if (mappingEntries.length === 0) return source;

		return source.map((row) => {
			const bars = {};
			for (const [catKey, mapping] of mappingEntries) {
				if (mapping.lowColumn && mapping.highColumn) {
					const low = parseFloat(row[mapping.lowColumn]);
					const high = parseFloat(row[mapping.highColumn]);
					if (!isNaN(low) && !isNaN(high)) {
						bars[catKey] = {
							min: low,
							max: high,
							...errorBarsDefaultStyles,
							...(mapping.styles || {}),
						};
					}
				}
			}
			return Object.keys(bars).length > 0
				? { ...row, __errorBars: bars }
				: row;
		});
	}, [
		chartDataWithLabelCustomizations,
		chartData,
		isDotPlot,
		errorBarsAttr.enabled,
		errorBarsCategories,
		errorBarsDefaultStyles,
	]);

	// Merge customTooltips (top-level block attribute) as a final pass so it
	// sees rows with any upstream label/errorBar customizations already applied.
	const customTooltips = attrs.customTooltips || {};
	const chartDataWithAllCustomizations = useMemo(
		() =>
			mergeCustomTooltipData(
				chartDataWithCustomizations,
				customTooltips,
				activeGroupBreaksCategory
			),
		[chartDataWithCustomizations, customTooltips, activeGroupBreaksCategory]
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

	// Get table data from the chart's own parent controller's innerBlocks.
	// Each chart block is always bound to its nearest non-freeform controller.
	// Table data is never inherited from ancestor controllers or external context.
	const {
		tableData,
		columnMeta,
		tableIsValid,
		tableValidationSchema,
		parentBlockId,
		refId,
	} = useSelect(
		(select) => {
			const { getBlock, getBlockParentsByBlockName } =
				select(blockEditorStore);
			const { getCurrentPostId, getCurrentPostType } =
				select(editorStore);

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
				if (
					controllerBlock &&
					!controllerBlock.attributes?.isFreeform
				) {
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
				columnMeta: tableAttributes?.columnMeta || [],
				tableIsValid: tableAttributes?.isValid ?? true,
				tableValidationSchema: tableAttributes?.validationSchema || '',
				parentBlockId: parentControllerId || controllerId,
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

	// Resolve which inspector panel(s) to open when a SHAPE element is clicked,
	// based on the current chart type.
	const resolveShapePanels = (type) => {
		if (BAR_CHART_TYPES.includes(type)) return ['bar', 'colors'];
		if (LINE_CHART_TYPES.includes(type)) return ['line', 'colors'];
		if (NODE_CHART_TYPES.includes(type)) return ['nodes', 'colors'];
		if (type === 'pie') return ['pie', 'colors'];
		if (type === 'treemap') return ['treemap', 'colors'];
		if (type === 'sankey') return ['sankey', 'colors'];
		if (MAP_CHART_TYPES.includes(type)) return ['map', 'colors'];
		return ['colors'];
	};

	// Static map for non-shape element types → panel ID
	const ELEMENT_TYPE_TO_PANEL = {
		[ELEMENT_TYPES.LABEL]: 'labels',
		[ELEMENT_TYPES.NET_VALUE_LABEL]: 'netValues',
		[ELEMENT_TYPES.SEGMENT]: 'line',
		[ELEMENT_TYPES.REGRESSION]: 'regression',
		[ELEMENT_TYPES.ANNOTATION]: 'annotations',
		[ELEMENT_TYPES.LEGEND_ITEM]: 'legend',
		[ELEMENT_TYPES.ERROR_BAR]: 'dotPlot',
		[ELEMENT_TYPES.DIFF_COLUMN_HEADER]: 'diffColumn',
		[ELEMENT_TYPES.DIFF_COLUMN_LABEL]: 'diffColumn',
	};

	// Handle element click for customization popover (labels, shapes, segments, annotations, tick labels, etc.)
	// Also focuses the matching inspector sidebar panel(s).
	const handleElementClick = ({
		elementType,
		dataPoint,
		startPoint,
		endPoint,
		category,
		defaultLabel,
		defaultColor,
		anchorEl,
		groupValue = null,
		annotationId = null,
		axisKey = null,
		tickValue = null,
		categoryValue = null,
	}) => {
		// Determine which panel(s) to focus based on element type and chart type
		let panelIds;
		if (elementType === ELEMENT_TYPES.SHAPE) {
			panelIds = resolveShapePanels(attrs?.layout?.type || 'bar');
		} else if (elementType === ELEMENT_TYPES.LINE) {
			// Line/area clicks only focus the inspector — no popover
			panelIds = ['line', 'colors'];
			if (panelIds.length) {
				focusPanels(panelIds);
			}
			return;
		} else if (elementType === ELEMENT_TYPES.TICK_LABEL) {
			panelIds = [
				axisKey === 'dependent' ? 'dependentAxis' : 'independentAxis',
			];
		} else {
			const panelId = ELEMENT_TYPE_TO_PANEL[elementType];
			panelIds = panelId ? [panelId] : [];
		}

		setSelectedElement({
			elementType,
			dataPoint,
			startPoint,
			endPoint,
			category,
			defaultLabel,
			defaultColor,
			anchorEl,
			groupValue,
			annotationId,
			axisKey,
			tickValue,
			categoryValue,
		});

		if (panelIds.length) {
			focusPanels(panelIds);
		}
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

	// Handle error bar customization updates from popover
	const handleErrorBarCustomizationUpdate = (updates) => {
		if (updates.customStyles !== undefined) {
			updateAttributeForDevice('errorBars', {
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

	// Handle annotation customization updates from popover
	const handleAnnotationCustomizationUpdate = (annotationId, updates) => {
		const index = parseInt(annotationId, 10);
		const currentItems = getCurrentValue('annotations', 'items') || [];
		if (index < 0 || index >= currentItems.length) return;
		const updated = currentItems.map((item, i) =>
			i === index ? { ...item, ...updates } : item
		);
		updateAttributeForDevice('annotations', { items: updated });
	};

	// Ref for the "Add annotation" button, used to anchor the popover on creation
	// Create a new annotation centered in the chart.
	// The user drags it into position, then clicks it to open the popover.
	const handleAddAnnotation = () => {
		const currentItems = getCurrentValue('annotations', 'items') || [];
		const layout = getCurrentValue('layout') || {};
		const newAnnotation = {
			x: (layout.width || 640) / 2,
			y: (layout.height || 400) / 2,
			text: 'New annotation',
			fontSize: 12,
			fontWeight: 'normal',
			fontStyle: 'normal',
			fontFamily: "'franklin-gothic-urw', Verdana, Geneva, sans-serif",
			fill: 'light-dark(#000000, #f0f0f0)',
			textAnchor: 'middle',
			verticalAnchor: 'middle',
			rotation: 0,
			link: '',
			backgroundColor: 'transparent',
			padding: 0,
			borderRadius: 0,
			opacity: 1,
			maxWidth: 200,
			activeOnMobile: true,
			positioningContext: 'chart',
		};
		updateAttributeForDevice('annotations', {
			items: [...currentItems, newAnnotation],
		});
	};

	// Handle regression line customization updates from popover.
	// Merges groupBreakStyles overrides into the regression attribute.
	const handleRegressionCustomizationUpdate = (updates) => {
		const currentRegression = getCurrentValue('regression') || {};
		updateAttributeForDevice('regression', {
			...currentRegression,
			...updates,
		});
	};

	// Handle legend item customization updates from popover.
	// customLegendLabels is a flat object attribute (not a nested group), so we
	// call setAttributes directly with the complete new value rather than using
	// updateAttributeForDevice which would merge via spread and prevent deletions.
	const handleLegendItemCustomizationUpdate = (updates) => {
		if (updates.customLegendLabels !== undefined) {
			setAttributes({ customLegendLabels: updates.customLegendLabels });
		}
	};

	// Handle per-element tooltip customization updates from popover.
	// customTooltips is a flat top-level object attribute (not viewport-aware —
	// tooltip content is the same across viewports), so we use setAttributes
	// directly to allow deletions to propagate (spread-merge would mask them).
	const handleTooltipCustomizationUpdate = (updates) => {
		if (updates.customTooltips !== undefined) {
			setAttributes({ customTooltips: updates.customTooltips });
		}
	};

	// Handle tick label customization updates from popover
	const handleTickLabelCustomizationUpdate = (updates) => {
		const current = getCurrentValue('customTickLabels') || {
			independent: {},
			dependent: {},
		};
		const next = {
			independent:
				updates.independent !== undefined
					? updates.independent
					: current.independent,
			dependent:
				updates.dependent !== undefined
					? updates.dependent
					: current.dependent,
		};
		updateAttributeForDevice('customTickLabels', next);
	};

	// Handle diff column header customization updates from popover
	const handleDiffColumnHeaderCustomizationUpdate = (updates) => {
		const current = getCurrentValue('diffColumn') || {};
		updateAttributeForDevice('diffColumn', {
			...current,
			...updates,
			style: {
				...(current.style || {}),
				...(updates.style || {}),
			},
		});
	};

	// Handle per-cell diff column customization updates from popover
	const handleDiffColumnLabelCustomizationUpdate = (updates) => {
		if (updates.customLabels === undefined) {
			return;
		}
		const current = getCurrentValue('diffColumn') || {};
		updateAttributeForDevice('diffColumn', {
			...current,
			customLabels: updates.customLabels,
		});
	};

	// Handle annotation delete from popover
	const handleAnnotationDelete = (annotationId) => {
		const index = parseInt(annotationId, 10);
		const currentItems = getCurrentValue('annotations', 'items') || [];
		const updated = currentItems.filter((_, i) => i !== index);
		updateAttributeForDevice('annotations', { items: updated });
		handlePopoverClose();
	};

	// Get the appropriate update handler based on element type
	const getCustomizationUpdateHandler = (elementType, selectedElement) => {
		if (elementType === ELEMENT_TYPES.SHAPE) {
			return handleShapeCustomizationUpdate;
		}
		if (elementType === ELEMENT_TYPES.ERROR_BAR) {
			return handleErrorBarCustomizationUpdate;
		}
		if (elementType === ELEMENT_TYPES.SEGMENT) {
			return handleSegmentCustomizationUpdate;
		}
		if (elementType === ELEMENT_TYPES.REGRESSION) {
			return handleRegressionCustomizationUpdate;
		}
		if (
			elementType === ELEMENT_TYPES.ANNOTATION &&
			selectedElement?.annotationId != null
		) {
			return (updates) =>
				handleAnnotationCustomizationUpdate(
					selectedElement.annotationId,
					updates
				);
		}
		if (elementType === ELEMENT_TYPES.TICK_LABEL) {
			return handleTickLabelCustomizationUpdate;
		}
		if (elementType === ELEMENT_TYPES.LEGEND_ITEM) {
			return handleLegendItemCustomizationUpdate;
		}
		if (elementType === ELEMENT_TYPES.DIFF_COLUMN_HEADER) {
			return handleDiffColumnHeaderCustomizationUpdate;
		}
		if (elementType === ELEMENT_TYPES.DIFF_COLUMN_LABEL) {
			return handleDiffColumnLabelCustomizationUpdate;
		}
		return handleLabelCustomizationUpdate;
	};

	// Get the appropriate customizations based on element type
	const getCustomizationsForElement = (elementType) => {
		if (elementType === ELEMENT_TYPES.SHAPE) {
			const shapeCustomStyles =
				getCurrentValue('shapes', 'customStyles') || {};
			return {
				customStyles: shapeCustomStyles,
			};
		}
		if (elementType === ELEMENT_TYPES.ERROR_BAR) {
			return {
				customStyles:
					getCurrentValue('errorBars', 'customStyles') || {},
			};
		}
		if (elementType === ELEMENT_TYPES.SEGMENT) {
			const segmentStyles =
				getCurrentValue('shapes', 'segmentStyles') || {};
			return {
				segmentStyles,
			};
		}
		if (elementType === ELEMENT_TYPES.REGRESSION) {
			return getCurrentValue('regression') || {};
		}
		if (elementType === ELEMENT_TYPES.TICK_LABEL) {
			return (
				getCurrentValue('customTickLabels') || {
					independent: {},
					dependent: {},
				}
			);
		}
		if (elementType === ELEMENT_TYPES.LEGEND_ITEM) {
			return getCurrentValue('customLegendLabels') || {};
		}
		if (elementType === ELEMENT_TYPES.DIFF_COLUMN_HEADER) {
			return getCurrentValue('diffColumn') || {};
		}
		if (elementType === ELEMENT_TYPES.DIFF_COLUMN_LABEL) {
			return getCurrentValue('diffColumn')?.customLabels || {};
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
	// Resolve chart type from layout attributes for editor-function configuration
	const chartType = attrs?.layout?.type || 'bar';

	// IMPORTANT: setAlignments and setIsDragging are NOT in dependencies to avoid recreating on every state change
	const wpEditorFunctions = useMemo(
		() =>
			createWpEditorFunctions({
				attrs,
				chartType,
				deviceType,
				getCurrentValue,
				updateAttributeForDevice,
				setAttributes,
				toggleSelection,
				setAlignments, // Pass alignment setter (stable reference)
				setIsDragging, // Pass drag state setter (stable reference)
				onElementClick: handleElementClick, // Pass callback for popover
			}),
		[
			attrs,
			chartType,
			deviceType,
			getCurrentValue,
			updateAttributeForDevice,
			setAttributes,
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
						[key]: formatCellContentTyped(
							getCellContent(cell),
							key,
							columnMeta,
							index,
							mapScale,
							groupBreaksCategory,
							dataRender?.xScale,
							dataRender?.xFormat,
							preserveStringKeys
						),
					};
				}, {})
			),
		[
			body,
			headers,
			columnMeta,
			mapScale,
			groupBreaksCategory,
			dataRender?.xScale,
			dataRender?.xFormat,
			preserveStringKeys,
		]
	);

	// Determine whether the sibling table has meaningful validation configured.
	// If it does but the table is invalid, we hold the last known-good chart data.
	const hasValidation =
		columnMeta.some((m) => m?.dataType && m.dataType !== 'auto') ||
		!!tableValidationSchema;
	const shouldSync = !hasValidation || tableIsValid;

	// Track if initial data sync has completed to prevent loops during entity initialization
	const hasCompletedInitialDataSync = useRef(false);

	useEffect(() => {
		if (!headers || headers.length === 0) {
			return;
		}
		if (!memoizedChartData || memoizedChartData.length === 0) {
			return;
		}
		if (!shouldSync) {
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
	}, [headers, memoizedChartData, shouldSync, setAttributes]);

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
			{hasValidation && !tableIsValid && (
				<Notice status="warning" isDismissible={true}>
					{__(
						'The source table has validation errors. The chart is showing the last valid data.',
						'prc-chart-builder'
					)}
				</Notice>
			)}
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
								<div
									style={{ position: 'relative' }}
									onClick={(event) => {
										if (!selectedElement) return;
										// Close the popover when clicking the chart background,
										// but not when clicking a label, shape, or the popover itself.
										const isLabel =
											event.target.closest?.('text');
										const isPopover =
											event.target.closest?.(
												'.components-popover'
											);
										if (!isLabel && !isPopover) {
											handlePopoverClose();
										}
									}}
								>
									<MemoizedChartBuilder
										className="cb__chart"
										config={config}
										data={
											chartDataWithAllCustomizations ||
											chartDataWithCustomizations ||
											memoizedChartData
										}
										wpEditorFunctions={wpEditorFunctions}
									/>
									{/* Chart Element Customization Popover (Labels, Shapes, Segments, Annotations, etc.) */}
									{selectedElement && (
										<ChartElementPopover
											anchorRef={selectedElement.anchorEl}
											elementType={
												selectedElement.elementType
											}
											chartType={chartType}
											legendVariation={
												getCurrentValue(
													'legend',
													'variation'
												) || 'grouped'
											}
											dataPoint={
												selectedElement.dataPoint
											}
											startPoint={
												selectedElement.startPoint
											}
											endPoint={selectedElement.endPoint}
											category={selectedElement.category}
											defaultLabel={
												selectedElement.defaultLabel
											}
											defaultColor={
												selectedElement.defaultColor
											}
											groupValue={
												selectedElement.groupValue
											}
											currentCustomizations={getCustomizationsForElement(
												selectedElement.elementType
											)}
											annotationId={
												selectedElement.annotationId
											}
											axisKey={
												selectedElement.axisKey ?? null
											}
											tickValue={
												selectedElement.tickValue ??
												null
											}
											categoryValue={
												selectedElement.categoryValue ??
												null
											}
											annotation={
												selectedElement.elementType ===
													ELEMENT_TYPES.ANNOTATION &&
												selectedElement.annotationId !=
													null
													? (() => {
															const items =
																getCurrentValue(
																	'annotations',
																	'items'
																) || [];
															const idx =
																parseInt(
																	selectedElement.annotationId,
																	10
																);
															return (
																items[idx] ??
																selectedElement.annotationSnapshot ??
																null
															);
														})()
													: undefined
											}
											onUpdate={getCustomizationUpdateHandler(
												selectedElement.elementType,
												selectedElement
											)}
											currentTooltipCustomizations={{
												customTooltips:
													attrs?.customTooltips || {},
											}}
											onTooltipUpdate={
												handleTooltipCustomizationUpdate
											}
											onDelete={
												selectedElement.elementType ===
												ELEMENT_TYPES.ANNOTATION
													? () =>
															handleAnnotationDelete(
																selectedElement.annotationId
															)
													: undefined
											}
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
											onDrawingsChange={(newDrawings) =>
												setAttributes({
													drawings: newDrawings,
												})
											}
											isDrawingMode={isDrawingMode}
											selectedDrawingId={
												selectedDrawingId
											}
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
									{isSelected &&
										config.annotations?.active && (
											<button
												type="button"
												className="has-ui-white-background-color has-background has-small-label-font-size wp-element-button"
												onClick={handleAddAnnotation}
												style={{
													position: 'absolute',
													bottom: '',
													right: '8px',
													zIndex: 10,
													padding: '4px 8px',
													borderRadius: '4px',
													color: 'var(--wp--preset--color--sky-blue-spectrum-primary)',
													border: '1px solid var(--wp--preset--color--sky-blue-spectrum-primary)',
													cursor: 'pointer !important',
													fontFamily:
														'var(--wp--preset--font-family--sans-serif)',
												}}
											>
												+ Add annotation
											</button>
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

export default function Edit(props) {
	return (
		<InspectorFocusProvider>
			<EditInner {...props} />
		</InspectorFocusProvider>
	);
}
