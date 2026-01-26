/**
 * WordPress Editor Functions for Chart Interactions
 *
 * This file defines editor-specific functions that are passed to the charting library
 * via wpEditorFunctions context. These functions handle interactive features like
 * draggable annotations and labels that only work in the editor.
 */

import { findAlignments, generateLabelId } from './alignment-utils';

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
 * @return {Object} wpEditorFunctions object with annotations and labels handlers
 */
export function createWpEditorFunctions({
	attrs,
	deviceType,
	getCurrentValue,
	updateAttributeForDevice,
	toggleSelection,
	setAlignments,
	setIsDragging,
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
