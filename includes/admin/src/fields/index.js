/**
 * WordPress Dependencies
 */
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/components';
import { chartBar, globe, image, trendingUp } from '@wordpress/icons';
import { BlockPreview } from '@wordpress/block-editor';
import { parse } from '@wordpress/blocks';

// Mirrors the mapping in create-new-chart-modal.jsx — DataViews previewSize
// snap values mapped to BlockPreview viewportWidth.
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
 * Map chart type slugs to fallback icons shown when block content is empty.
 */
const CHART_TYPE_ICON_MAP = {
	area: trendingUp,
	bar: chartBar,
	column: chartBar,
	'diverging-bar': chartBar,
	'dot-plot': trendingUp,
	'exploded-bar': chartBar,
	freeform: image,
	line: trendingUp,
	'map-usa': globe,
	'map-usa-block': globe,
	'map-usa-county': globe,
	'map-usa-hex': globe,
	'map-world': globe,
	'map-world-orthographic': globe,
	pie: chartBar,
	sankey: trendingUp,
	scatter: trendingUp,
	'stacked-area': trendingUp,
	'stacked-bar': chartBar,
	'stacked-column': chartBar,
	treemap: image,
};

/**
 * Extract the chart type slug from a chart REST API record.
 * The chart_type taxonomy terms are embedded in the _links / _embedded data.
 *
 * @param {Object} item REST API chart post object.
 * @return {string} Chart type slug or empty string.
 */
function getChartType(item) {
	// Prefer the embedded taxonomy terms from ?_embed.
	const embedded = item?._embedded?.['wp:term'];
	if (embedded) {
		for (const termGroup of embedded) {
			for (const term of termGroup) {
				if (term.taxonomy === 'chart_type') {
					return term.slug;
				}
			}
		}
	}
	return '';
}

/**
 * Build the chart_type filter elements from the localized term list
 * (set by wp_localize_script in class-admin.php).
 * Values are slugs; use-charts.js sends them as chart_type_slug to the
 * WP REST API which accepts slug-based taxonomy filtering natively.
 */
function getChartTypeElements() {
	const terms = window?.prcChartBuilderLibrary?.chartTypeTerms || [];
	return terms.map((term) => ({
		value: term.slug,
		label: term.label,
	}));
}

/**
 * Block preview for a chart item. Falls back to an icon if content is empty.
 * Accepts viewportWidth so the caller can derive it from view.layout.previewSize.
 */
export function ChartPreviewField({ item, viewportWidth = 1160 }) {
	const blocks = useMemo(() => {
		const raw = item?.content?.raw || '';
		if (!raw) {
			return null;
		}
		return parse(raw, { __unstableSkipMigrationLogs: true });
	}, [item?.content?.raw]);

	const isEmpty = !blocks?.length;
	const chartType = getChartType(item);
	const iconDescriptor = CHART_TYPE_ICON_MAP[chartType] || chartBar;

	if (isEmpty) {
		return (
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					width: '100%',
					height: '100%',
					minHeight: '80px',
					background: '#f0f0f0',
					borderRadius: '2px',
				}}
			>
				<Icon
					icon={iconDescriptor}
					size={32}
					style={{ fill: '#757575' }}
				/>
			</div>
		);
	}

	return <BlockPreview blocks={blocks} viewportWidth={viewportWidth} />;
}

const fields = [
	{
		id: 'preview',
		label: __('Preview', 'prc-chart-builder'),
		// Render is overridden in dataviews.jsx where view state is available,
		// so viewportWidth can be derived from view.layout.previewSize.
		// This fallback uses the default viewport width.
		render: ({ item }) => <ChartPreviewField item={item} />,
		enableSorting: false,
		enableHiding: false,
		filterBy: false,
	},
	{
		id: 'title',
		type: 'text',
		label: __('Title', 'prc-chart-builder'),
		getValue: ({ item }) => item?.title?.rendered || '',
		enableGlobalSearch: true,
		enableSorting: true,
		enableHiding: false,
	},
	{
		id: 'chartType',
		label: __('Chart Type', 'prc-chart-builder'),
		getValue: ({ item }) => getChartType(item),
		render: ({ item }) => {
			const slug = getChartType(item);
			const elements = getChartTypeElements();
			const match = elements.find((el) => el.value === slug);
			return (
				<span>
					{match?.label || slug || __('—', 'prc-chart-builder')}
				</span>
			);
		},
		elements: getChartTypeElements(),
		filterBy: {
			operators: ['isAny', 'isNone'],
			isPrimary: true,
		},
		enableSorting: false,
	},
	{
		id: 'author',
		label: __('Author', 'prc-chart-builder'),
		getValue: ({ item }) => {
			const authorTerms = item?._embedded?.author;
			if (authorTerms?.length) {
				return authorTerms[0].name || '';
			}
			return '';
		},
		enableSorting: false,
		enableGlobalSearch: false,
	},
	{
		id: 'date',
		type: 'datetime',
		label: __('Date', 'prc-chart-builder'),
		getValue: ({ item }) => item?.date || '',
		enableSorting: true,
	},
	{
		id: 'modified',
		type: 'datetime',
		label: __('Last Modified', 'prc-chart-builder'),
		getValue: ({ item }) => item?.modified || '',
		enableSorting: true,
	},
	{
		id: 'designSlug',
		label: __('Design Slug', 'prc-chart-builder'),
		getValue: ({ item }) => item?.meta?.design_slug || '',
		render: ({ item }) => {
			const slug = item?.meta?.design_slug || '';
			return <span>{slug || __('—', 'prc-chart-builder')}</span>;
		},
		enableGlobalSearch: true,
		enableSorting: false,
	},
	{
		id: 'status',
		label: __('Status', 'prc-chart-builder'),
		getValue: ({ item }) => item?.status || '',
		elements: [
			{ value: 'publish', label: __('Published', 'prc-chart-builder') },
			{ value: 'draft', label: __('Draft', 'prc-chart-builder') },
			{ value: 'private', label: __('Private', 'prc-chart-builder') },
		],
		filterBy: {
			operators: ['isAny'],
		},
		enableSorting: false,
	},
];

export default fields;
