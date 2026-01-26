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
 * @param {Object} params
 * @param {Object} params.attrs - Block attributes
 * @param {Array} params.chartData - Chart data array
 * @param {Function} params.setAttributes - Function to update block attributes
 * @param {Function} params.toggleSelection - Function to enable/disable block selection
 * @returns {Object} wpEditorFunctions object with annotations and labels handlers
 */
export function createWpEditorFunctions({
	attrs,
	chartData,
	setAttributes,
	toggleSelection,
	setAlignments,
}) {
	// Label position registry for alignment detection
	const labelRegistry = new Map();

	return {
		annotations: {
			onDragStart: (annotationId) => {
				// Disable block selection to prevent block dragging
				if (toggleSelection) {
					toggleSelection(false);
				}
			},
			onDrag: (annotationId, x, y, isDragging) => {
				// Could show preview or update UI during drag
			},
			onDragEnd: (annotationId, finalX, finalY) => {
				const annotationIndex = parseInt(annotationId, 10);
				const { annotations } = attrs;

				if (
					!annotations ||
					annotationIndex < 0 ||
					annotationIndex >= annotations.length
				) {
					// Re-enable block selection
					if (toggleSelection) {
						toggleSelection(true);
					}
					return;
				}

				// Update state with final position
				const updatedAnnotations = annotations.map((annotation, i) =>
					i === annotationIndex
						? {
								...annotation,
								x: Math.round(finalX * 10) / 10,
								y: Math.round(finalY * 10) / 10,
							}
						: annotation
				);

				setAttributes({ annotations: updatedAnnotations });

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

			onDragStart: (x, category) => {
				// Disable block selection to prevent block dragging
				if (toggleSelection) {
					toggleSelection(false);
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
				// Clear alignments when drag ends
				setAlignments({
					vertical: [],
					horizontal: [],
				});
				const updatedData = chartData.map((d) => {
					if (d.x === x) {
						return {
							...d,
							__labelPositions: {
								...d.__labelPositions,
								[category]: {
									dx: Math.round(finalDx),
									dy: Math.round(finalDy),
								},
							},
						};
					}
					return d;
				});

				setAttributes({ chartData: updatedData });

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
				// immediately set the legend alignment to none
				setAttributes({ legendAlignment: 'none' });
			},
			onDrag: (x, y, isDragging) => {
				// Could show preview or update UI during drag
			},
			onDragEnd: (finalX, finalY) => {
				// When manually positioned, set alignment to 'none'
				setAttributes({
					legendOffsetX: Math.round(finalX),
					legendOffsetY: Math.round(finalY),
					legendAlignment: 'none', // sanity check to ensure the legend alignment is set to none
				});

				// Re-enable block selection
				if (toggleSelection) {
					toggleSelection(true);
				}
			},
		},
	};
}
