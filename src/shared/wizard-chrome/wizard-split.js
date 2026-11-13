/**
 * Drag-to-collapse split between the wizard's left and right panels
 * (PRC-1252).
 *
 * The split is the left panel's share of the row, in percent. It follows the
 * pointer freely and stays where it is released, except that a panel left
 * narrower than SPLIT_MIN collapses to a thin strip (split 0 or 100), and a
 * release close to the middle settles at an even 50.
 */

export const SPLIT_MIN = 20;
const SPLIT_MAX = 100 - SPLIT_MIN;
const MIDDLE_PULL = 3;
const KEYBOARD_STEP = 10;

/**
 * @param {number} percentage Raw left-panel share, in percent.
 * @return {number} The share kept inside the row, for live dragging.
 */
export function clampSplit(percentage) {
	return Math.min(100, Math.max(0, percentage));
}

/**
 * A drag that starts from a collapsed panel opens it once the pointer moves
 * this far, so the panel does not fall shut again on release.
 */
const OPEN_INTENT = 2;

/**
 * @param {number} percentage Left-panel share at release, in percent.
 * @param {number} [from]     Share when the drag started.
 * @return {number} The share to settle on.
 */
export function snapSplit(percentage, from) {
	if (percentage < SPLIT_MIN) {
		return from === 0 && percentage > OPEN_INTENT ? SPLIT_MIN : 0;
	}
	if (percentage > SPLIT_MAX) {
		return from === 100 && percentage < 100 - OPEN_INTENT ? SPLIT_MAX : 100;
	}
	if (Math.abs(percentage - 50) <= MIDDLE_PULL) {
		return 50;
	}
	return percentage;
}

/**
 * @param {number} split Current split, in percent.
 * @param {string} key   KeyboardEvent.key.
 * @return {number|null} Next split, or null when the handle ignores the key.
 */
export function getKeyboardSplit(split, key) {
	switch (key) {
		case 'ArrowLeft':
			return split === 100 ? SPLIT_MAX : snapSplit(split - KEYBOARD_STEP);
		case 'ArrowRight':
			return split === 0 ? SPLIT_MIN : snapSplit(split + KEYBOARD_STEP);
		case 'Home':
			return 0;
		case 'End':
			return 100;
		default:
			return null;
	}
}
