/**
 * Block editor settings for wizard pattern previews.
 *
 * Mirrors edit-site's usePatternSettings(): BlockPreview iframes need
 * `settings.styles` from the provider, not document-level CSS alone.
 */
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useMemo } from '@wordpress/element';

/**
 * @return {Object} Block editor settings for BlockPreview iframes.
 */
export default function useWizardPreviewSettings() {
	const editorSettings = useSelect((select) => {
		try {
			return select(editorStore)?.getEditorSettings?.() ?? null;
		} catch (_) {
			return null;
		}
	}, []);

	return useMemo(() => {
		const localized =
			window?.prcChartBuilderLibrary?.previewSettings ?? null;
		const base =
			editorSettings && Object.keys(editorSettings).length
				? editorSettings
				: (localized ?? {});

		return {
			...base,
			isPreviewMode: true,
		};
	}, [editorSettings]);
}
