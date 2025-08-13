/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __dangerousOptInToUnstableAPIsOnlyForCoreModules } from '@wordpress/private-apis';
import { parse } from '@wordpress/blocks';
import { parse as parseBlocks } from '@wordpress/block-serialization-spec-parser';
import {
	BlockPreview,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { EditorProvider, store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';
import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as editSiteStore } from '@wordpress/edit-site';
/**
 * Internal dependencies
 */
// import usePatternSettings from '../page-patterns/use-pattern-settings';

export const { unlock } = __dangerousOptInToUnstableAPIsOnlyForCoreModules(
	'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.',
	'@wordpress/block-editor' // Fibbing.
);

const { useGlobalStyle } = unlock(blockEditorPrivateApis);

function PreviewField({ item }) {
	const { storedSettings, template } = useSelect(
		(select) => {
			const { canUser, getPostType, getTemplateId, getEntityRecord } =
				unlock(select(coreStore));
			const canViewTemplate = canUser('read', {
				kind: 'postType',
				name: 'wp_template',
			});
			const _settings = select(editorStore).getEditorSettings();
			// @ts-ignore
			const { supportsTemplateMode } = _settings;
			const isViewable = getPostType(item.type)?.viewable ?? false;

			const templateId =
				supportsTemplateMode && isViewable && canViewTemplate
					? getTemplateId(item.type, item.id)
					: null;
			return {
				storedSettings: _settings,
				template: templateId
					? getEntityRecord('postType', 'wp_template', templateId)
					: undefined,
			};
		},
		[item.type, item.id]
	);

	const settings = useMemo(() => {
		const { ...restStoredSettings } = storedSettings;

		return {
			...restStoredSettings,
			isPreviewMode: true,
		};
	}, [storedSettings]);

	const [backgroundColor = 'white'] = useGlobalStyle('color.background');

	const blocks = useMemo(() => {
		const parsed = parseBlocks(item.content.raw);
		return parsed;
	}, [item.content.raw]);

	const isEmpty = !blocks?.length;
	// Wrap everything in a block editor provider to ensure 'styles' that are needed
	// for the previews are synced between the site editor store and the block editor store.
	// Additionally we need to have the `__experimentalBlockPatterns` setting in order to
	// render patterns inside the previews.
	// TODO: Same approach is used in the patterns list and it becomes obvious that some of
	// the block editor settings are needed in context where we don't have the block editor.
	// Explore how we can solve this in a better way.
	return (
		<EditorProvider settings={settings} post={item}>
			<div
				className="prc-chart-builder-preview-field"
				style={{ backgroundColor }}
			>
				{isEmpty && __('Empty Chart')}
				{!isEmpty && (
					<BlockPreview.Async>
						<BlockPreview blocks={blocks} />
					</BlockPreview.Async>
				)}
			</div>
		</EditorProvider>
	);
}

export default {
	label: __('Preview'),
	id: 'preview',
	render: PreviewField,
	enableSorting: false,
};
