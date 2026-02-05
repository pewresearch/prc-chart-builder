/**
 * WordPress Editor Functions for Chart Interactions
 *
 * This file defines editor-specific functions that are passed to the charting library
 * via wpEditorFunctions context. These functions handle interactive features like
 * draggable annotations and labels that only work in the editor.
 */

import { findAlignments, generateLabelId } from './alignment-utils';

/**
 * Generate a label key from x value and category.
 * This is the format used to store customizations in block attributes.
 *
 * @param {string|number|Date} x        - The x value
 * @param {string}             category - The category name
 * @return {string} Key in format "xValue::category"
 */
export function generateLabelKey(x, category) {
	return `${x}::${category}`;
}

/**
 * Create wpEditorFunctions object for chart interactions
 *
 * @param {Object}   params
 * @param {Object}   params.attrs                    - Block attributes
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
	deviceType,
	getCurrentValue,
	updateAttributeForDevice,
	toggleSelection,
	setAlignments,
	setIsDragging,
	onElementClick,
}) {
	// Label position registry for alignment detection
	const labelRegistry = new Map();
	return {
		annotations: {
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
			onDrag: (x, category, dx, dy, isDragging, absoluteX, absoluteY) => {
				// Detect alignment with other labels
				if (absoluteX !== undefined && absoluteY !== undefined) {
					const labelId = generateLabelId(x, category);
					const allPositions = Array.from(labelRegistry.values());
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
			onDragEnd: (x, category, finalDx, finalDy) => {
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
				// Format: { "xValue::category": { dx, dy } }
				// Get current viewport's customPositions
				const currentCustomPositions =
					getCurrentValue('labels', 'customPositions') || {};

				// Build unique key for this label (x value + category)
				const labelKey = `${x}::${category}`;

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

			/**
			 * Handle click on a label to open customization popover.
			 *
			 * @param {Object}      dataPoint    - The data point object from chartData
			 * @param {string}      category     - The category key (e.g., 'n1', 'Democrats')
			 * @param {string}      defaultLabel - The programmatically generated label
			 * @param {HTMLElement} anchorEl     - The DOM element to anchor the popover to
			 */
			onClick: (dataPoint, category, defaultLabel, anchorEl) => {
				if (onElementClick) {
					onElementClick({
						elementType: 'label',
						dataPoint,
						category,
						defaultLabel,
						anchorEl,
					});
				}
			},

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
			 */
			onClick: (dataPoint, category, defaultColor, anchorEl) => {
				if (onElementClick) {
					onElementClick({
						elementType: 'shape',
						dataPoint,
						category,
						defaultColor,
						anchorEl,
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
