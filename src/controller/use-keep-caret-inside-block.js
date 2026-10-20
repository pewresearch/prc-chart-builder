import { store as blockEditorStore } from '@wordpress/block-editor';
import { useRefEffect } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Wizard controls render inside the block canvas. There, writing flow treats
 * ArrowUp / ArrowDown in a text input as block navigation: it moves focus to
 * the next tabbable and cancels the key, so FormTokenField and other fields
 * never see it. Writing flow skips that while `keepCaretInsideBlock` is on, so
 * this hook turns it on while focus is inside the returned ref's node.
 *
 * The editor provider can reset settings at any time, so every focus change
 * inside the node re-applies the flag.
 *
 * @return {Function} Ref callback for the controls container.
 */
export default function useKeepCaretInsideBlock() {
	const { getSettings } = useSelect(blockEditorStore);
	const { updateSettings } = useDispatch(blockEditorStore);

	return useRefEffect(
		(node) => {
			let previous = null;

			const restore = () => {
				if (previous === null) {
					return;
				}
				updateSettings({ keepCaretInsideBlock: previous });
				previous = null;
			};

			const onFocusIn = () => {
				const current = !!getSettings().keepCaretInsideBlock;
				if (previous === null) {
					previous = current;
				}
				if (!current) {
					updateSettings({ keepCaretInsideBlock: true });
				}
			};

			const onFocusOut = (event) => {
				if (!node.contains(event.relatedTarget)) {
					restore();
				}
			};

			node.addEventListener('focusin', onFocusIn);
			node.addEventListener('focusout', onFocusOut);
			return () => {
				node.removeEventListener('focusin', onFocusIn);
				node.removeEventListener('focusout', onFocusOut);
				restore();
			};
		},
		[getSettings, updateSettings]
	);
}
