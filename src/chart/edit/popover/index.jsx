/**
 * Chart Element Popover
 *
 * An extensible popover system for customizing chart elements.
 * Supports different panel types (labels, shapes, etc.) based on the element type.
 */

/* eslint-disable @wordpress/no-unsafe-wp-apis */

import { __ } from '@wordpress/i18n';
import { useEffect, useRef, useCallback } from '@wordpress/element';
import {
	Popover,
	Button,
	__experimentalHStack as HStack,
	__experimentalText as Text,
} from '@wordpress/components';
import { closeSmall } from '@wordpress/icons';

import {
	LabelPanel,
	ShapePanel,
	LineSegmentPanel,
	RegressionLinePanel,
	AnnotationPanel,
	TickLabelPanel,
	LegendItemPanel,
	ErrorBarPanel,
	TooltipPanelSection,
	DiffColumnHeaderPanel,
	DiffColumnLabelPanel,
} from './panels';

/**
 * Element type constants.
 */
export const ELEMENT_TYPES = {
	LABEL: 'label',
	NET_VALUE_LABEL: 'netValueLabel',
	SHAPE: 'shape',
	LINE: 'line',
	SEGMENT: 'segment',
	REGRESSION: 'regression',
	ANNOTATION: 'annotation',
	TICK_LABEL: 'tickLabel',
	LEGEND_ITEM: 'legendItem',
	ERROR_BAR: 'errorBar',
	DIFF_COLUMN_HEADER: 'diffColumnHeader',
	DIFF_COLUMN_LABEL: 'diffColumnLabel',
};

/**
 * Get the panel title based on element type.
 *
 * @param {string} elementType - The type of element
 * @return {string} Panel title
 */
function getPanelTitle(elementType) {
	switch (elementType) {
		case ELEMENT_TYPES.SHAPE:
			return __('Shape Settings', 'prc-chart-builder');
		case ELEMENT_TYPES.SEGMENT:
			return __('Line Segment Settings', 'prc-chart-builder');
		case ELEMENT_TYPES.REGRESSION:
			return __('Regression Line Settings', 'prc-chart-builder');
		case ELEMENT_TYPES.ANNOTATION:
			return __('Annotation Settings', 'prc-chart-builder');
		case ELEMENT_TYPES.TICK_LABEL:
			return __('Tick Label Settings', 'prc-chart-builder');
		case ELEMENT_TYPES.LEGEND_ITEM:
			return __('Legend Item Settings', 'prc-chart-builder');
		case ELEMENT_TYPES.ERROR_BAR:
			return __('Error Bar Settings', 'prc-chart-builder');
		case ELEMENT_TYPES.DIFF_COLUMN_HEADER:
			return __('Diff Column Header', 'prc-chart-builder');
		case ELEMENT_TYPES.DIFF_COLUMN_LABEL:
			return __('Diff Column Cell', 'prc-chart-builder');
		case ELEMENT_TYPES.LABEL:
		default:
			return __('Label Settings', 'prc-chart-builder');
	}
}

/**
 * ChartElementPopover Component
 *
 * Main popover container that renders the appropriate panel based on element type.
 *
 * @param {Object}   props
 * @param {Object}   props.anchorRef             - Ref to the element to anchor to
 * @param {string}   props.elementType           - Type of element ('label', 'shape', or 'segment')
 * @param {string}   props.chartType             - The chart layout type (e.g., 'bar', 'treemap', 'pie')
 * @param {Object}      props.dataPoint             - The data point object (for labels/shapes)
 * @param {Object}      props.startPoint            - The start point of segment (for segments)
 * @param {Object}      props.endPoint              - The end point of segment (for segments)
 * @param {string}      props.category              - The category key
 * @param {string}      props.defaultLabel          - The default label value (for labels)
 * @param {string}      props.defaultColor          - The default color (for shapes/segments)
 * @param {string|null} props.groupValue            - The group value (when groupBreaksActive), or null
 * @param {Object}      props.currentCustomizations - Current customizations
 * @param {string}     props.annotationId          - Annotation index (for annotations)
 * @param {Object}     props.annotation            - Annotation object (for annotations)
 * @param {string}     props.axisKey               - 'independent' or 'dependent' (for tick labels)
 * @param {string}     props.tickValue              - Raw tick value (for tick labels)
 * @param {string}     props.categoryValue          - Category/domain value (for legend items)
 * @param {string}     props.legendVariation       - 'grouped' | 'detached' (for legend items)
 * @param {Function}   props.onUpdate              - Callback to update
 * @param {Object}     props.currentTooltipCustomizations - { customTooltips } for TooltipPanelSection
 * @param {Function}   props.onTooltipUpdate       - Callback to update customTooltips
 * @param {Function}   props.onDelete              - Callback to delete (for annotations)
 * @param {Function}   props.onClose               - Callback when closing
 */
export function ChartElementPopover({
	anchorRef,
	elementType = ELEMENT_TYPES.LABEL,
	chartType,
	dataPoint,
	startPoint,
	endPoint,
	category,
	defaultLabel,
	defaultColor,
	groupValue = null,
	currentCustomizations = {},
	annotationId,
	annotation,
	axisKey,
	tickValue,
	categoryValue,
	legendVariation = 'grouped',
	onUpdate,
	currentTooltipCustomizations = {},
	onTooltipUpdate,
	onDelete,
	onClose,
}) {
	// Ref for the popover content to detect clicks outside
	const popoverRef = useRef(null);

	// Handle click outside to close the popover
	useEffect(() => {
		const handleClickOutside = (event) => {
			// Check if click is outside the popover content
			if (
				popoverRef.current &&
				!popoverRef.current.contains(event.target)
			) {
				// Also check if the click is on a nested popover (like color picker)
				const isNestedPopover = event.target.closest?.(
					'.components-popover'
				);
				if (!isNestedPopover) {
					onClose();
				}
			}
		};

		// Add listener with a slight delay to avoid closing immediately on the click that opened it
		const timeoutId = setTimeout(() => {
			document.addEventListener('mousedown', handleClickOutside);
		}, 0);

		return () => {
			clearTimeout(timeoutId);
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [onClose]);

	// Prevent closing via focus when interacting with nested dropdowns
	const handleFocusOutside = useCallback((event) => {
		// Always prevent the default focus-outside behavior since we handle closing via click
		event.preventDefault();
	}, []);

	/**
	 * Render the appropriate panel based on element type.
	 */
	const renderPanel = () => {
		switch (elementType) {
			case ELEMENT_TYPES.SHAPE:
				return (
					<ShapePanel
						dataPoint={dataPoint}
						category={category}
						defaultColor={defaultColor}
						groupValue={groupValue}
						currentCustomizations={currentCustomizations}
						onUpdate={onUpdate}
						currentTooltipCustomizations={
							currentTooltipCustomizations
						}
						onTooltipUpdate={onTooltipUpdate}
					/>
				);
			case ELEMENT_TYPES.SEGMENT:
				return (
					<LineSegmentPanel
						startPoint={startPoint}
						endPoint={endPoint}
						category={category}
						defaultColor={defaultColor}
						currentCustomizations={currentCustomizations}
						onUpdate={onUpdate}
					/>
				);
			case ELEMENT_TYPES.REGRESSION:
				return (
					<RegressionLinePanel
						category={category}
						defaultColor={defaultColor}
						currentCustomizations={currentCustomizations}
						onUpdate={onUpdate}
					/>
				);
			case ELEMENT_TYPES.ANNOTATION:
				return (
					<AnnotationPanel
						annotationId={annotationId}
						annotation={annotation}
						onUpdate={onUpdate}
						onDelete={onDelete}
					/>
				);
			case ELEMENT_TYPES.TICK_LABEL:
				return (
					<TickLabelPanel
						axisKey={axisKey}
						tickValue={tickValue}
						defaultLabel={defaultLabel}
						currentCustomizations={currentCustomizations}
						onUpdate={onUpdate}
					/>
				);
			case ELEMENT_TYPES.LEGEND_ITEM:
				return (
					<LegendItemPanel
						categoryValue={categoryValue}
						defaultLabel={defaultLabel}
						currentCustomizations={currentCustomizations}
						onUpdate={onUpdate}
						legendVariation={legendVariation}
					/>
				);
			case ELEMENT_TYPES.DIFF_COLUMN_HEADER:
				return (
					<DiffColumnHeaderPanel
						diffColumn={currentCustomizations}
						onUpdate={onUpdate}
					/>
				);
			case ELEMENT_TYPES.DIFF_COLUMN_LABEL:
				return (
					<DiffColumnLabelPanel
						dataPoint={dataPoint}
						category={category}
						defaultLabel={defaultLabel}
						groupValue={groupValue}
						currentCustomizations={currentCustomizations}
						onUpdate={onUpdate}
					/>
				);
			case ELEMENT_TYPES.ERROR_BAR:
				return (
					<ErrorBarPanel
						dataPoint={dataPoint}
						category={category}
						defaultColor={defaultColor}
						groupValue={groupValue}
						currentCustomizations={currentCustomizations}
						onUpdate={onUpdate}
					/>
				);
			case ELEMENT_TYPES.LABEL:
			default:
				return (
					<LabelPanel
						dataPoint={dataPoint}
						category={category}
						defaultLabel={defaultLabel}
						groupValue={groupValue}
						chartType={chartType}
						currentCustomizations={currentCustomizations}
						onUpdate={onUpdate}
						currentTooltipCustomizations={
							currentTooltipCustomizations
						}
						onTooltipUpdate={onTooltipUpdate}
					/>
				);
		}
	};

	return (
		<Popover
			anchor={anchorRef}
			placement="top"
			offset={12}
			onClose={onClose}
			focusOnMount="firstElement"
			className="chart-element-popover"
			onFocusOutside={handleFocusOutside}
		>
			<div
				ref={popoverRef}
				style={{
					padding: '16px',
					minWidth: '300px',
					maxHeight: '400px',
					overflowY: 'auto',
				}}
			>
				<HStack alignment="edge" style={{ marginBottom: '12px' }}>
					<Text weight="600" size="13px">
						{getPanelTitle(elementType)}
					</Text>
					<Button
						icon={closeSmall}
						label={__('Close', 'prc-chart-builder')}
						isSmall
						onClick={onClose}
					/>
				</HStack>

				{renderPanel()}
			</div>
		</Popover>
	);
}

// Re-export for convenience
export { ELEMENT_TYPES as ElementTypes };
export {
	LabelPanel,
	ShapePanel,
	LineSegmentPanel,
	RegressionLinePanel,
	AnnotationPanel,
	ErrorBarPanel,
	TooltipPanelSection,
} from './panels';
export {
	useLabelCustomizations,
	useShapeCustomizations,
	useSegmentCustomizations,
	useErrorBarCustomizations,
	useTooltipCustomizations,
} from './hooks';
export {
	generateElementKey,
	generateSegmentKey,
	formatDisplayValue,
} from './utils';

export default ChartElementPopover;
