import { useRefEffect } from '@wordpress/compose';

const LIST_SELECTOR = '.components-form-token-field__suggestions-list';

/**
 * FormTokenField closes and reopens its suggestion list after each pick, so
 * the new list starts at the top. Remember the scroll position while focus is
 * inside the field and restore it on the reopened list. Leaving the field
 * forgets it, so the next visit starts at the top.
 *
 * @return {Function} Ref callback for an element wrapping the FormTokenField.
 */
export default function useKeepSuggestionScroll() {
	return useRefEffect((node) => {
		let scrollTop = 0;

		const onScroll = (event) => {
			if (event.target.matches?.(LIST_SELECTOR)) {
				scrollTop = event.target.scrollTop;
			}
		};

		const onFocusOut = (event) => {
			if (!node.contains(event.relatedTarget)) {
				scrollTop = 0;
			}
		};

		const observer = new window.MutationObserver((mutations) => {
			for (const mutation of mutations) {
				for (const added of mutation.addedNodes) {
					if (added.matches?.(LIST_SELECTOR)) {
						added.scrollTop = scrollTop;
					}
				}
			}
		});

		node.addEventListener('scroll', onScroll, true);
		node.addEventListener('focusout', onFocusOut);
		observer.observe(node, { childList: true, subtree: true });
		return () => {
			node.removeEventListener('scroll', onScroll, true);
			node.removeEventListener('focusout', onFocusOut);
			observer.disconnect();
		};
	}, []);
}
