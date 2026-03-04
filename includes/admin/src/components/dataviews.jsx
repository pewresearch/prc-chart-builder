/**
 * External Dependencies
 */
import { DataViews as DataViewsComponent } from '@wordpress/dataviews';

/**
 * WordPress Dependencies
 */
import { useState, useMemo, useCallback } from '@wordpress/element';
import { Notice } from '@wordpress/components';
import { BlockEditorProvider } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal Dependencies
 */
import actions from '../actions';
import baseFields, { ChartPreviewField } from '../fields';
import useCharts from '../hooks/use-charts';

// DataViews previewSize snap values → BlockPreview viewportWidth.
const DEFAULT_PREVIEW_SIZE = 290;
const PREVIEW_SIZE_VIEWPORT_MAP = {
	120: 480,
	170: 680,
	230: 920,
	290: 1160,
	350: 1400,
	430: 1720,
};
function previewSizeToViewportWidth(previewSize = DEFAULT_PREVIEW_SIZE) {
	return PREVIEW_SIZE_VIEWPORT_MAP[previewSize] ?? 1160;
}

/**
 * Build an edit URL for a given post ID, preserving the current origin and
 * subsite path (multisite-safe).
 */
function getEditUrl(postId) {
	const url = new URL(window.location.href);
	url.pathname = url.pathname.replace(/\/wp-admin\/.*/, '/wp-admin/post.php');
	url.search = '';
	url.searchParams.set('post', postId);
	url.searchParams.set('action', 'edit');
	return url.toString();
}

const DEFAULT_VIEW = {
	type: 'grid',
	page: 1,
	perPage: 20,
	sort: {
		field: 'date',
		direction: 'desc',
	},
	search: '',
	filters: [],
	titleField: 'title',
	mediaField: 'preview',
	fields: ['chartType', 'designSlug', 'date', 'status'],
	layout: {
		mediaField: 'preview',
		primaryField: 'title',
		previewSize: DEFAULT_PREVIEW_SIZE,
	},
};

const DEFAULT_LAYOUTS = {
	grid: {
		layout: {
			mediaField: 'preview',
			primaryField: 'title',
			previewSize: DEFAULT_PREVIEW_SIZE,
		},
	},
	table: {
		layout: {
			primaryField: 'title',
		},
	},
};

const EMPTY_BLOCKS = [];

export default function DataViews() {
	const [view, setView] = useState(DEFAULT_VIEW);
	const { charts, paginationInfo, isLoading, error, refresh } =
		useCharts(view);

	// Derive viewportWidth from the live previewSize so the Appearance slider
	// actually scales BlockPreview content.
	const viewportWidth = previewSizeToViewportWidth(
		view.layout?.previewSize ?? DEFAULT_PREVIEW_SIZE
	);

	// Override the preview field render to close over the current viewportWidth.
	const fields = useMemo(
		() =>
			baseFields.map((field) => {
				if (field.id !== 'preview') {
					return field;
				}
				return {
					...field,
					render: ({ item }) => (
						<ChartPreviewField
							item={item}
							viewportWidth={viewportWidth}
						/>
					),
				};
			}),
		[viewportWidth]
	);

	// Expose refresh so parent components can trigger re-fetch after create/delete.
	const actionsWithRefresh = useMemo(
		() =>
			actions.map((action) => {
				if (action.id !== 'trash-chart') {
					return action;
				}
				return {
					...action,
					RenderModal: (props) => {
						const OriginalModal = action.RenderModal;
						return (
							<OriginalModal
								{...props}
								onActionPerformed={(items) => {
									props.onActionPerformed?.(items);
									refresh();
								}}
							/>
						);
					},
				};
			}),
		[refresh]
	);

	const handleChangeView = useCallback((newView) => {
		setView(newView);
	}, []);

	if (error) {
		return (
			<Notice status="error" isDismissible={false}>
				{error}
			</Notice>
		);
	}

	// BlockEditorProvider bootstraps the block editor Redux store needed for
	// BlockPreview to render registered block types (same pattern as the modal).
	return (
		<BlockEditorProvider value={EMPTY_BLOCKS} settings={{}}>
			<DataViewsComponent
				data={charts}
				fields={fields}
				view={view}
				onChangeView={handleChangeView}
				defaultLayouts={DEFAULT_LAYOUTS}
				actions={actionsWithRefresh}
				paginationInfo={paginationInfo}
				isLoading={isLoading}
				search={true}
				searchLabel={__('Search charts…', 'prc-chart-builder')}
				getItemId={(item) => item.id.toString()}
				isItemClickable={() => true}
				onClickItem={(item) => {
					window.location.href = getEditUrl(item.id);
				}}
			/>
		</BlockEditorProvider>
	);
}
