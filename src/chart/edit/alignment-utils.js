/**
 * Alignment Detection Utilities
 *
 * Simple utilities for detecting when draggable labels align with each other.
 * Used in wp-editor-functions.js to provide real-time alignment feedback.
 */

// How close (in pixels) labels need to be to trigger an alignment guide
export const ALIGNMENT_THRESHOLD = 1;

/**
 * Find alignment opportunities between current position and other labels
 *
 * @param {number} currentX - Current X position being dragged to
 * @param {number} currentY - Current Y position being dragged to
 * @param {string} currentLabelId - ID of the label being dragged
 * @param {Array} allLabels - Array of {id, x, y, category} for all labels
 * @returns {Object} { vertical: [{x, id}], horizontal: [{y, id}] }
 */
export function findAlignments(currentX, currentY, currentLabelId, allLabels) {
	const alignments = {
		vertical: [],
		horizontal: [],
	};

	allLabels
		.filter((label) => label.id !== currentLabelId)
		.forEach((label) => {
			// Check vertical alignment (same X coordinate)
			if (Math.abs(currentX - label.x) < ALIGNMENT_THRESHOLD) {
				alignments.vertical.push({ x: label.x, id: label.id });
			}
			// Check horizontal alignment (same Y coordinate)
			if (Math.abs(currentY - label.y) < ALIGNMENT_THRESHOLD) {
				alignments.horizontal.push({ y: label.y, id: label.id });
			}
		});

	return alignments;
}

/**
 * Generate a unique ID for a label based on its data point and category
 *
 * @param {*} x - The x value from the data point
 * @param {string} category - The category/series name
 * @returns {string} Unique label ID
 */
export function generateLabelId(x, category) {
	return `label-${x}-${category}`;
}
