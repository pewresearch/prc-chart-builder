/**
 * Viewport-gate pattern BlockPreview iframes.
 *
 * Each BlockPreview mounts an iframe that reloads editor/block assets. Rendering
 * every template card at once fans out hundreds of network requests and can
 * trigger browser ERR_INSUFFICIENT_RESOURCES. Only mount previews that are
 * near the pattern-picker scrollport.
 */
import { useEffect, useRef, useState } from '@wordpress/element';

const PATTERN_PICKER_SELECTOR = '.prc-chart-modal__pattern-picker';
/** Keep a small buffer so scrolling feels warm without mounting the whole grid. */
const ROOT_MARGIN = '120px 0px';
const SCROLLABLE_OVERFLOW = new Set(['auto', 'scroll', 'overlay']);

/**
 * True when computed styles make the element a vertical scrollport.
 *
 * @param {Element} element
 * @return {boolean}
 */
function isVerticalScrollport(element) {
	const { overflowY, overflow } = window.getComputedStyle(element);
	return (
		SCROLLABLE_OVERFLOW.has(overflowY) || SCROLLABLE_OVERFLOW.has(overflow)
	);
}

/**
 * True when the element clips overflowing content (scrollable or not).
 *
 * @param {Element} element
 * @return {boolean}
 */
function isClippingScrollRoot(element) {
	const { overflowY, overflow } = window.getComputedStyle(element);
	const clips =
		SCROLLABLE_OVERFLOW.has(overflowY) ||
		SCROLLABLE_OVERFLOW.has(overflow) ||
		overflowY === 'hidden' ||
		overflow === 'hidden';

	return clips && element.scrollHeight > element.clientHeight;
}

/**
 * Resolve the IntersectionObserver root for a pattern preview cell.
 *
 * Full-page master-detail hosts scroll `.prc-chart-modal__pattern-picker`.
 * Compact/modal hosts scroll an outer container (for example Modal content),
 * so using the picker when it does not clip defeats lazy preview loading.
 *
 * @param {Element} node Preview cell observed for visibility.
 * @return {Element|null} Scrollport root, or null for the viewport.
 */
export function findPatternPreviewScrollRoot(node) {
	const picker = node.closest(PATTERN_PICKER_SELECTOR);
	if (picker && isVerticalScrollport(picker)) {
		return picker;
	}

	let current = node.parentElement;
	while (current) {
		if (isClippingScrollRoot(current)) {
			return current;
		}
		current = current.parentElement;
	}

	return null;
}

/**
 * @return {[import('react').RefObject<HTMLElement|null>, boolean]} Ref for the
 *   preview cell and whether it is near the pattern-picker viewport.
 */
export default function usePatternPreviewVisibility() {
	const ref = useRef(null);
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const node = ref.current;
		if (!node || typeof IntersectionObserver === 'undefined') {
			setIsVisible(true);
			return undefined;
		}

		const root = findPatternPreviewScrollRoot(node);
		const observer = new IntersectionObserver(
			([entry]) => {
				setIsVisible(Boolean(entry?.isIntersecting));
			},
			{ root, rootMargin: ROOT_MARGIN, threshold: 0 }
		);

		observer.observe(node);
		return () => observer.disconnect();
	}, []);

	return [ref, isVisible];
}
