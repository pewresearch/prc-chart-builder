/**
 * WordPress Dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

/**
 * Internal Dependencies
 */
import { shouldHideBlockToolbar } from './hide-block-toolbar';

export const HIDE_BLOCK_TOOLBAR_BODY_CLASS =
	'prc-chart-builder-hide-block-toolbar';

/**
 * Toggle the body class that hides the block toolbar (see editor.scss)
 * while the selection sits inside the wizard-hosting controller.
 *
 * @param {string}  controllerClientId Wizard-hosting controller clientId.
 * @param {boolean} exposeBlockToolbar When true, do not hide toolbars (Advanced Settings).
 */
export default function useHideBlockToolbar(
	controllerClientId,
	exposeBlockToolbar = false
) {
	const shouldHide = useSelect(
		(select) => {
			const {
				getBlockSelectionStart,
				getBlockName,
				getBlockParents,
				getBlockAttributes,
			} = select(blockEditorStore);
			const selectedClientId = getBlockSelectionStart();
			if (!selectedClientId) {
				return false;
			}
			const toRef = (clientId) => ({
				clientId,
				name: getBlockName(clientId),
				attributes: getBlockAttributes(clientId),
			});
			return shouldHideBlockToolbar({
				controllerClientId,
				controllerAttributes: getBlockAttributes(controllerClientId),
				selected: toRef(selectedClientId),
				ancestors: getBlockParents(selectedClientId).map(toRef),
				exposeBlockToolbar,
			});
		},
		[controllerClientId, exposeBlockToolbar]
	);

	useEffect(() => {
		if (!shouldHide) {
			return undefined;
		}
		document.body.classList.add(HIDE_BLOCK_TOOLBAR_BODY_CLASS);
		return () => {
			document.body.classList.remove(HIDE_BLOCK_TOOLBAR_BODY_CLASS);
		};
	}, [shouldHide]);
}
