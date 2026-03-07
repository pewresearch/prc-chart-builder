/* eslint-disable max-lines-per-function */
/**
 * WordPress Editor Functions for Chart Interactions
 *
 * This file defines editor-specific functions that are passed to the charting library
 * via wpEditorFunctions context. These functions handle interactive features like
 * draggable annotations and labels that only work in the editor.
 */

import { findAlignments, generateLabelId } from './alignment-utils';
import {
	POSITION_DISABLED_CHART_TYPES,
	ANNOTATION_POPOVER_CHART_TYPES,
	TICK_LABEL_POPOVER_CHART_TYPES,
} from './popover/utils';

/**
 * Generate a label key from x value, category, and optional group value.
 * This is the format used to store customizations in block attributes.
 *
 * Key formats:
 * - 2-part (standard): "xValue::category"
 * - 3-part (grouped):  "xValue::category::groupValue"
 *
 * @param {string|number|Date} x          - The x value
 * @param {string}             category   - The category name
 * @param {string|null}        groupValue - The group value (when groupBreaksActive), or null
 * @return {string} Key in format "xValue::category" or "xValue::category::groupValue"
 */
export function generateLabelKey(x, category, groupValue = null) {
	if (groupValue) {
		return `${x}::${category}::${groupValue}`;
	}
	return `${x}::${category}`;
}

/**
 * Create wpEditorFunctions object for chart interactions
 *
 * @param {Object}   params
 * @param {Object}   params.attrs                    - Block attributes
 * @param {string}   params.chartType                - The chart layout type (e.g., 'bar', 'treemap', 'pie')
 * @param {string}   params.deviceType               - Current device type ('desktop', 'tablet', 'mobile')
 * @param {Function} params.getCurrentValue          - Function to get viewport-aware attribute values
 * @param {Function} params.updateAttributeForDevice - Function to update viewport-aware attributes
 * @param {Function} params.toggleSelection          - Function to enable/disable block selection
 * @param {Function} params.setAlignments            - Function to update alignment overlay state
 * @param {Function} params.setIsDragging            - Function to update drag state (for disabling tooltips)
 * @param {Function} params.onElementClick           - Callback when a chart element (label/shape) is clicked for customization
 * @return {Object} wpEditorFunctions object with annotations, labels, shapes, and legend handlers
 */
export function createWpEditorFunctions({
	attrs,
	chartType,
	deviceType,
	getCurrentValue,
	updateAttributeForDevice,
	toggleSelection,
	setAlignments,
	setIsDragging,
	onElementClick,
}) {
	const positionDisabled = POSITION_DISABLED_CHART_TYPES.includes(chartType);
	// null means the feature is enabled for all chart types.
	const annotationPopoverEnabled =
		ANNOTATION_POPOVER_CHART_TYPES === null ||
		ANNOTATION_POPOVER_CHART_TYPES.includes(chartType);
	const tickLabelPopoverEnabled =
		TICK_LABEL_POPOVER_CHART_TYPES === null ||
		TICK_LABEL_POPOVER_CHART_TYPES.includes(chartType);
	// Label position registry for alignment detection
	const labelRegistry = new Map();
	return {
		annotations: {
			/**
			 * Handle click on an annotation to open customization popover.
			 * Only enabled for chart types in ANNOTATION_POPOVER_CHART_TYPES (e.g. horizontal bar).
			 *
			 * @param {string}      annotationId - The annotation id (index as string)
			 * @param {HTMLElement} anchorEl     - The DOM element to anchor the popover to
			 */
			onClick:
				annotationPopoverEnabled && onElementClick
					? (annotationId, anchorEl) => {
							onElementClick({
								elementType: 'annotation',
								annotationId,
								anchorEl,
							});
						}
					: undefined,
			onDragStart: () => {
				// Disable block selection to prevent block dragging
				if (toggleSelection) {
					toggleSelection(false);
				}
				// Disable tooltips during drag
				if (setIsDragging) {
					setIsDragging(true);
				}
			},
			onDrag: () => {
				// Could show preview or update UI during drag
			},
			onDragEnd: (annotationId, finalX, finalY) => {
				const annotationIndex = parseInt(annotationId, 10);

				// Get current viewport's annotations items
				// Check viewport-specific override first, then fall back to base
				let currentItems;
				if (
					deviceType !== 'desktop' &&
					attrs[deviceType]?.annotations?.items
				) {
					currentItems = attrs[deviceType].annotations.items;
				} else {
					currentItems = attrs.annotations?.items || [];
				}

				// Re-enable tooltips
				if (setIsDragging) {
					setIsDragging(false);
				}

				if (
					!currentItems ||
					annotationIndex < 0 ||
					annotationIndex >= currentItems.length
				) {
					// Re-enable block selection
					if (toggleSelection) {
						toggleSelection(true);
					}
					return;
				}

				// Update state with final position (viewport-aware)
				const updatedAnnotations = currentItems.map((annotation, i) =>
					i === annotationIndex
						? {
								...annotation,
								x: Math.round(finalX * 10) / 10,
								y: Math.round(finalY * 10) / 10,
							}
						: annotation
				);

				updateAttributeForDevice('annotations', {
					items: updatedAnnotations,
				});

				// Re-enable block selection
				if (toggleSelection) {
					toggleSelection(true);
				}
			},
		},
		labels: {
			// Register a label's position for alignment tracking
			registerPosition: (id, x, y, category) => {
				labelRegistry.set(id, { id, x, y, category });
			},

			// Unregister a label when it unmounts
			unregisterPosition: (id) => {
				labelRegistry.delete(id);
			},

			/**
			 * Handle click on a label to open customization popover.
			 *
			 * @param {Object}      dataPoint    - The data point object from chartData
			 * @param {string}      category     - The category key (e.g., 'n1', 'Democrats')
			 * @param {string}      defaultLabel - The programmatically generated label
			 * @param {HTMLElement} anchorEl     - The DOM element to anchor the popover to
			 * @param {string|null} groupValue   - The group value (when groupBreaksActive), or null
			 */
			onClick: (
				dataPoint,
				category,
				defaultLabel,
				anchorEl,
				groupValue
			) => {
				if (onElementClick) {
					onElementClick({
						elementType: 'label',
						dataPoint,
						category,
						defaultLabel,
						anchorEl,
						groupValue: groupValue || null,
					});
				}
			},

			// Conditionally include drag handlers only for chart types that support manual positioning
			...(positionDisabled
				? {}
				: {
						onDragStart: () => {
							// Disable block selection to prevent block dragging
							if (toggleSelection) {
								toggleSelection(false);
							}
							// Disable tooltips during drag
							if (setIsDragging) {
								setIsDragging(true);
							}
						},
						onDrag: (
							x,
							category,
							dx,
							dy,
							isDragging,
							absoluteX,
							absoluteY,
							groupValue
						) => {
							// Detect alignment with other labels
							if (
								absoluteX !== undefined &&
								absoluteY !== undefined
							) {
								const labelId = generateLabelId(
									x,
									category,
									groupValue || null
								);
								const allPositions = Array.from(
									labelRegistry.values()
								);
								const detected = findAlignments(
									absoluteX,
									absoluteY,
									labelId,
									allPositions
								);

								// Only update if there are alignments to show
								setAlignments(detected);
							}
						},
						onDragEnd: (
							x,
							category,
							finalDx,
							finalDy,
							groupValue
						) => {
							// Re-enable tooltips
							if (setIsDragging) {
								setIsDragging(false);
							}
							// Clear alignments when drag ends
							setAlignments({
								vertical: [],
								horizontal: [],
							});

							// Store custom label positions in viewport-aware labels.customPositions
							// Format: { "xValue::category": { dx, dy } } or { "xValue::category::groupValue": { dx, dy } }
							// Get current viewport's customPositions
							const currentCustomPositions =
								getCurrentValue('labels', 'customPositions') ||
								{};

							// Build unique key for this label (x value + category + optional group)
							const labelKey = generateLabelKey(
								x,
								category,
								groupValue || null
							);

							const newPosition = {
								dx: Math.round(finalDx),
								dy: Math.round(finalDy),
							};

							// Update custom positions with viewport awareness
							updateAttributeForDevice('labels', {
								customPositions: {
									...currentCustomPositions,
									[labelKey]: newPosition,
								},
							});

							// Re-enable block selection
							if (toggleSelection) {
								toggleSelection(true);
							}
						},
					}),

			/**
			 * Update label customizations (text, visibility, styles).
			 * Called from the DataPointPopover when user makes changes.
			 *
			 * @param {Object} updates - Object with optional keys: customLabels, customVisibility, customStyles
			 */
			updateCustomizations: (updates) => {
				// Merge updates into the labels attribute viewport-aware
				const labelsUpdates = {};

				if (updates.customLabels !== undefined) {
					labelsUpdates.customLabels = updates.customLabels;
				}
				if (updates.customVisibility !== undefined) {
					labelsUpdates.customVisibility = updates.customVisibility;
				}
				if (updates.customStyles !== undefined) {
					labelsUpdates.customStyles = updates.customStyles;
				}

				if (Object.keys(labelsUpdates).length > 0) {
					updateAttributeForDevice('labels', labelsUpdates);
				}
			},

			/**
			 * Get current label customizations from attributes.
			 * Used by the popover to show current values.
			 *
			 * @return {Object} Current customizations: { customLabels, customVisibility, customStyles, customPositions }
			 */
			getCustomizations: () => {
				return {
					customPositions:
						getCurrentValue('labels', 'customPositions') || {},
					customLabels:
						getCurrentValue('labels', 'customLabels') || {},
					customVisibility:
						getCurrentValue('labels', 'customVisibility') || {},
					customStyles:
						getCurrentValue('labels', 'customStyles') || {},
				};
			},
		},
		shapes: {
			/**
			 * Handle click on a shape to open customization popover.
			 *
			 * @param {Object}      dataPoint    - The data point object from chartData
			 * @param {string}      category     - The category key (e.g., 'n1', 'Democrats')
			 * @param {string}      defaultColor - The default fill color
			 * @param {HTMLElement} anchorEl     - The DOM element to anchor the popover to
			 * @param {string|null} groupValue   - The group value (when groupBreaksActive), or null
			 */
			onClick: (
				dataPoint,
				category,
				defaultColor,
				anchorEl,
				groupValue
			) => {
				if (onElementClick) {
					onElementClick({
						elementType: 'shape',
						dataPoint,
						category,
						defaultColor,
						anchorEl,
						groupValue: groupValue || null,
					});
				}
			},

			/**
			 * Update shape customizations (fill, stroke, opacity, etc.).
			 * Called from the popover when user makes changes.
			 *
			 * @param {Object} updates - Object with customStyles updates
			 */
			updateCustomizations: (updates) => {
				if (updates.customStyles !== undefined) {
					updateAttributeForDevice('shapes', {
						customStyles: updates.customStyles,
					});
				}
			},

			/**
			 * Get current shape customizations from attributes.
			 * Used by the popover to show current values.
			 *
			 * @return {Object} Current customizations: { customStyles }
			 */
			getCustomizations: () => {
				return {
					customStyles:
						getCurrentValue('shapes', 'customStyles') || {},
				};
			},
		},
		segments: {
			/**
			 * Handle click on a line segment to open customization popover.
			 *
			 * @param {Object}      startPoint   - The start data point of the segment
			 * @param {Object}      endPoint     - The end data point of the segment
			 * @param {string}      category     - The category key (e.g., 'n1', 'Democrats')
			 * @param {string}      defaultColor - The default stroke color
			 * @param {HTMLElement} anchorEl     - The DOM element to anchor the popover to
			 */
			onClick: (
				startPoint,
				endPoint,
				category,
				defaultColor,
				anchorEl
			) => {
				if (onElementClick) {
					onElementClick({
						elementType: 'segment',
						startPoint,
						endPoint,
						category,
						defaultColor,
						anchorEl,
					});
				}
			},

			/**
			 * Update segment customizations (stroke, strokeWidth, opacity, strokeDasharray).
			 * Called from the popover when user makes changes.
			 *
			 * @param {Object} updates - Object with segmentStyles updates
			 */
			updateCustomizations: (updates) => {
				if (updates.segmentStyles !== undefined) {
					updateAttributeForDevice('shapes', {
						segmentStyles: updates.segmentStyles,
					});
				}
			},

			/**
			 * Get current segment customizations from attributes.
			 * Used by the popover to show current values.
			 *
			 * @return {Object} Current customizations: { segmentStyles }
			 */
			getCustomizations: () => {
				return {
					segmentStyles:
						getCurrentValue('shapes', 'segmentStyles') || {},
				};
			},
		},
		line: {
			/**
			 * Handle click on a LinePath or AreaClosed to focus the Line inspector panel.
			 * Does not open a popover — panel focus only.
			 *
			 * @param {HTMLElement} anchorEl - The DOM element that was clicked
			 */
			onClick: onElementClick
				? (anchorEl) => {
						onElementClick({
							elementType: 'line',
							anchorEl,
						});
					}
				: undefined,
		},
		regression: {
			/**
			 * Handle click on a regression line to open customization popover.
			 *
			 * @param {string}      category     - The category key, or 'combined' for a single line
			 * @param {string}      defaultColor - The current stroke color of the line
			 * @param {HTMLElement} anchorEl     - The DOM element to anchor the popover to
			 */
			onClick: onElementClick
				? (category, defaultColor, anchorEl) => {
						onElementClick({
							elementType: 'regression',
							category,
							defaultColor,
							anchorEl,
						});
					}
				: undefined,

			/**
			 * Update regression line customizations (groupBreakStyles overrides).
			 * Called from the popover when user makes changes.
			 *
			 * @param {Object} updates - Object with groupBreakStyles updates (merged into regression attr)
			 */
			updateCustomizations: (updates) => {
				const currentRegression = getCurrentValue('regression') || {};
				updateAttributeForDevice('regression', {
					...currentRegression,
					...updates,
				});
			},

			/**
			 * Get current regression customizations from attributes.
			 *
			 * @return {Object} Current regression attribute values
			 */
			getCustomizations: () => {
				return getCurrentValue('regression') || {};
			},
		},
		tickLabels:
			tickLabelPopoverEnabled && onElementClick
				? {
						onClick: (
							axisKey,
							tickValue,
							formattedValue,
							anchorEl
						) => {
							onElementClick({
								elementType: 'tickLabel',
								axisKey,
								tickValue,
								defaultLabel:
									formattedValue ?? String(tickValue),
								anchorEl,
							});
						},
						updateCustomizations: (updates) => {
							const current = getCurrentValue(
								'customTickLabels'
							) || {
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
						},
						getCustomizations: () => {
							return (
								getCurrentValue('customTickLabels') || {
									independent: {},
									dependent: {},
								}
							);
						},
					}
				: undefined,
		legendItems: onElementClick
			? {
					/**
					 * Handle click on a legend item to open customization popover.
					 *
					 * @param {string}      categoryValue - The category/domain value of the legend item
					 * @param {string}      defaultLabel  - The default rendered label text
					 * @param {HTMLElement} anchorEl      - The DOM element to anchor the popover to
					 */
					onClick: (categoryValue, defaultLabel, anchorEl) => {
						onElementClick({
							elementType: 'legendItem',
							categoryValue,
							defaultLabel,
							anchorEl,
						});
					},

					/**
					 * Update legend item customizations (label text).
					 * Called from the popover when user makes changes.
					 *
					 * @param {Object} updates - Object with customLegendLabels updates
					 */
					updateCustomizations: (updates) => {
						if (updates.customLegendLabels !== undefined) {
							// customLegendLabels is a flat object -- handled directly in handleLegendItemCustomizationUpdate
							// This path should not be used; legend updates go through onElementClick -> onUpdate
						}
					},

					/**
					 * Get current legend item customizations from attributes.
					 *
					 * @return {Object} Current customLegendLabels: { [categoryValue]: { text? } }
					 */
					getCustomizations: () => {
						return getCurrentValue('customLegendLabels') || {};
					},
				}
			: undefined,
		legend: {
			onDragStart: () => {
				// Disable block selection to prevent block dragging
				if (toggleSelection) {
					toggleSelection(false);
				}
				// Disable tooltips during drag
				if (setIsDragging) {
					setIsDragging(true);
				}
				// Immediately set the legend alignment to none (viewport-aware)
				updateAttributeForDevice('legend', {
					alignment: 'none',
				});
			},
			onDrag: () => {
				// Could show preview or update UI during drag
			},
			onDragEnd: (finalX, finalY) => {
				// Re-enable tooltips
				if (setIsDragging) {
					setIsDragging(false);
				}
				// When manually positioned, set alignment to 'none' (viewport-aware)
				updateAttributeForDevice('legend', {
					offsetX: Math.round(finalX),
					offsetY: Math.round(finalY),
					alignment: 'none', // sanity check to ensure the legend alignment is set to none
				});

				// Re-enable block selection
				if (toggleSelection) {
					toggleSelection(true);
				}
			},
		},
	};
}
