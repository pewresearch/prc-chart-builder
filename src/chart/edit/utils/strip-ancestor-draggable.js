const WAS_DRAGGABLE = 'data-prc-was-draggable';

/**
 * Temporarily remove `draggable="true"` from ancestors.
 *
 * Gutenberg sets that attribute on selected blocks. Native HTML5 drag then
 * starts on mousedown and races annotation/label/drawing drags. Gutenberg
 * already strips this for inputs; chart overlays need the same lock.
 *
 * @param {Node} fromNode - Element that received the pointer (e.g. annotation)
 * @return {Function} Restore `draggable="true"` on the nodes this call stripped
 */
export function stripAncestorDraggable(fromNode) {
	const stripped = [];
	let node = fromNode;
	if (node && node.nodeType !== 1) {
		node = node.parentElement;
	}
	while (node && node !== document.documentElement) {
		if (node.getAttribute?.('draggable') === 'true') {
			node.setAttribute(WAS_DRAGGABLE, 'true');
			node.removeAttribute('draggable');
			stripped.push(node);
		}
		node = node.parentElement;
	}
	return () => {
		for (const el of stripped) {
			if (el.getAttribute(WAS_DRAGGABLE) === 'true') {
				el.setAttribute('draggable', 'true');
				el.removeAttribute(WAS_DRAGGABLE);
			}
		}
	};
}
