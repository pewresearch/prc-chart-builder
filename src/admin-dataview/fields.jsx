/**
 * WordPress Dependencies
 */
import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { chartBar, globe, image, trendingUp } from '@wordpress/icons';

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
	'bee-swarm': trendingUp,
	'stacked-area': trendingUp,
	'stacked-bar': chartBar,
	'stacked-column': chartBar,
	treemap: image,
	waffle: chartBar,
	'heat-map-table': chartBar,
};

function getChartTypeTerms() {
	const terms = window?.prcWpAdminDataview?.chart?.chartTypeTerms || [];
	return terms.map((term) => ({
		value: term.slug,
		label: term.label,
	}));
}

function ChartPreviewField({ item }) {
	const url = item?.featuredImage || '';
	const chartType = item?.chartType || '';
	const iconDescriptor = CHART_TYPE_ICON_MAP[chartType] || chartBar;

	if (url) {
		return (
			<img
				className="prc-wp-admin-dataview__featured-image"
				src={url}
				alt=""
				loading="lazy"
				decoding="async"
			/>
		);
	}

	return (
		<div
			className="prc-wp-admin-dataview__featured-image prc-wp-admin-dataview__featured-image--empty"
			style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				minHeight: '80px',
				background: '#f0f0f0',
			}}
			aria-hidden="true"
		>
			<Icon icon={iconDescriptor} size={32} style={{ fill: '#757575' }} />
		</div>
	);
}

export function getDefaultVisibleFields() {
	return [
		'chartType',
		'designSlug',
		'researchTeams',
		'author',
		'date',
		'status',
	];
}

/**
 * Merge chart fields into the shell field list and override featuredImage render.
 *
 * @param {Array} fields Shell fields.
 * @return {Array} Fields for the chart list.
 */
export default function getChartFields(fields) {
	const chartTypeElements = getChartTypeTerms();
	const withPreview = fields.map((field) => {
		if (field.id !== 'featuredImage') {
			return field;
		}
		return {
			...field,
			enableHiding: false,
			render: ({ item }) => <ChartPreviewField item={item} />,
		};
	});

	return [
		...withPreview,
		{
			id: 'chartType',
			label: __('Chart Type', 'prc-chart-builder'),
			getValue: ({ item }) => item?.chartType || '',
			render: ({ item }) => {
				const slug = item?.chartType || '';
				const match = chartTypeElements.find((el) => el.value === slug);
				return (
					<span>
						{item?.chartTypeLabel ||
							match?.label ||
							slug ||
							__('—', 'prc-chart-builder')}
					</span>
				);
			},
			elements: chartTypeElements,
			filterBy: {
				operators: ['isAny', 'isNone'],
				isPrimary: true,
			},
			enableSorting: false,
		},
		{
			id: 'designSlug',
			label: __('Design Slug', 'prc-chart-builder'),
			getValue: ({ item }) => item?.designSlug || '',
			render: ({ item }) => (
				<span>{item?.designSlug || __('—', 'prc-chart-builder')}</span>
			),
			enableGlobalSearch: true,
			enableSorting: false,
		},
		{
			id: 'modified',
			type: 'datetime',
			label: __('Last Modified', 'prc-chart-builder'),
			getValue: ({ item }) => item?.modified || '',
			enableSorting: true,
		},
	];
}
