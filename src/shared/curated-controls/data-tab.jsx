/**
 * Data tab — accessors, scale, sort, and grouping.
 */
import {
	FormTokenField,
	SelectControl,
	ToggleControl,
	__experimentalNumberControl as NumberControl,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { canonicalRowValue } from '@prc/charting-utilities';

import FocusedPanelBody from '../../chart/edit/focused-panel-body';
import Sorter from '../../chart/edit/sorter';
import {
	GROUP_BREAKS_CHART_TYPES,
	GROUPABLE_CHART_TYPES,
	LINE_CHART_TYPES,
	SORTABLE_CHART_TYPES,
	SUPPLEMENTAL_COLUMN_CHART_TYPES,
	effectiveChartTypeForControls,
} from '../../chart/utils/chart-types';
import { formatNum } from '../../chart/utils/helpers';
import { applyCuratedControl } from './apply-curated-control';

const NO_CATEGORIES = [];

const SORT_ORDER_OPTIONS = [
	{ value: 'ascending', label: __('Ascending', 'prc-chart-builder') },
	{ value: 'descending', label: __('Descending', 'prc-chart-builder') },
	{ value: 'none', label: __('No Sort', 'prc-chart-builder') },
];

const X_SCALE_OPTIONS = [
	{ value: 'time', label: __('Time', 'prc-chart-builder') },
	{ value: 'linear', label: __('Linear', 'prc-chart-builder') },
];

const BREAK_LINE_STYLE_OPTIONS = [
	{ value: 'empty', label: __('Empty', 'prc-chart-builder') },
	{ value: 'solid', label: __('Solid', 'prc-chart-builder') },
	{ value: 'dotted', label: __('Dotted', 'prc-chart-builder') },
	{ value: 'dashed', label: __('Dashed', 'prc-chart-builder') },
	{ value: 'heartbeat', label: __('Heartbeat', 'prc-chart-builder') },
];

function uniqueCanonicalColumnValues(data, column) {
	const unique = new Set();
	if (!Array.isArray(data)) {
		return unique;
	}
	data.forEach((row) => {
		const value = canonicalRowValue(row?.[column]);
		if (value !== '') {
			unique.add(value);
		}
	});
	return unique;
}

/**
 * @param {Object}   props
 * @param {Object}   props.chartAttributes
 * @param {Function} props.onChange
 * @param {Function} props.setAttributes
 */
export default function DataTab({ chartAttributes, onChange, setAttributes }) {
	const layout = chartAttributes.layout ?? {};
	const chartType = layout.type ?? 'bar';
	const effectiveType = effectiveChartTypeForControls(chartAttributes);
	const io = chartAttributes.io ?? {};
	const dataRender = chartAttributes.dataRender ?? {};
	const divergingBar = chartAttributes.divergingBar ?? {};
	const diffColumn = chartAttributes.diffColumn ?? {};
	const netValues = chartAttributes.netValues ?? {};
	const chartFamily = io.chartFamily;
	const isSmallMultiples = chartType === 'small-multiples';
	const isDivergingBar = chartType === 'diverging-bar';
	const isSankey = chartType === 'sankey';
	const sankey = chartAttributes.sankey ?? {};
	const availableCategories = io.availableCategories ?? NO_CATEGORIES;

	const setPath = (path, value) =>
		onChange(applyCuratedControl(chartAttributes, path, value));

	const showXScale =
		LINE_CHART_TYPES.includes(effectiveType) || isSmallMultiples;
	const showSort = SORTABLE_CHART_TYPES.includes(effectiveType);
	const showSortKey = showSort && chartType !== 'treemap';
	const showGrouping = GROUPABLE_CHART_TYPES.includes(chartType);
	const showGroupBreakStyles = GROUP_BREAKS_CHART_TYPES.includes(chartType);
	const showSupplementalColumns =
		SUPPLEMENTAL_COLUMN_CHART_TYPES.includes(chartType);
	// Mirror inspector Data panel: maps skip category sorters; diverging-bar
	// uses positive / negative / neutral accessors instead of dataRender.categories.
	const showCategorySorter =
		chartFamily !== 'map' && !isDivergingBar && !isSankey;
	const showDivergingAccessors = isDivergingBar;
	const groupBreaksActive = Boolean(dataRender.groupBreaksActive);
	const groupBreaksCategory = dataRender.groupBreaksCategory || '';
	const groupBreaks = dataRender.groupBreaks ?? {};
	const breakStyles = groupBreaks.breakStyles ?? {};
	const positiveCategories = divergingBar.positiveCategories || NO_CATEGORIES;
	const negativeCategories = divergingBar.negativeCategories || NO_CATEGORIES;
	const neutralBar = divergingBar.neutralBar || {};

	const categoryOptions = useMemo(() => {
		const categories = dataRender.categories || [];
		return availableCategories.map((category) => ({
			label: category,
			// Use isHidden (not disabled) — react-movable blocks drag on `disabled`.
			isHidden:
				categories.length > 0 ? !categories.includes(category) : false,
		}));
	}, [availableCategories, dataRender.categories]);

	const positiveCategoryOptions = useMemo(
		() =>
			availableCategories.map((category) => ({
				label: category,
				isHidden: !positiveCategories.includes(category),
			})),
		[availableCategories, positiveCategories]
	);

	const negativeCategoryOptions = useMemo(
		() =>
			availableCategories.map((category) => ({
				label: category,
				isHidden: !negativeCategories.includes(category),
			})),
		[availableCategories, negativeCategories]
	);

	const neutralCategoryOptions = useMemo(
		() =>
			availableCategories.map((category) => ({
				label: category,
				value: category,
			})),
		[availableCategories]
	);

	const sortKeyOptions = useMemo(() => {
		const independentLabel =
			io.independentVariable ?? __('Category', 'prc-chart-builder');
		return [
			...availableCategories.map((category) => ({
				label: category,
				value: category,
			})),
			{ label: independentLabel, value: 'x' },
		];
	}, [availableCategories, io.independentVariable]);

	const sankeyColumnOptions = useMemo(
		() => [
			{
				label:
					io.independentVariable ??
					__('First column', 'prc-chart-builder'),
				value: 'x',
			},
			...availableCategories.map((category) => ({
				label: category,
				value: category,
			})),
		],
		[availableCategories, io.independentVariable]
	);

	const columnOptions = useMemo(() => {
		return [
			{
				value: '',
				label: __('— Select column —', 'prc-chart-builder'),
			},
			...availableCategories.map((category) => ({
				label: category,
				value: category,
			})),
		];
	}, [availableCategories]);

	const availableGroupValues = useMemo(() => {
		const chartData = io.chartData;
		if (!groupBreaksActive || !groupBreaksCategory || !chartData) {
			return [];
		}
		const uniqueGroups = new Set();
		chartData.forEach((datum) => {
			const groupValue = datum[groupBreaksCategory];
			if (groupValue) {
				uniqueGroups.add(groupValue);
			}
		});
		return Array.from(uniqueGroups);
	}, [groupBreaksActive, groupBreaksCategory, io.chartData]);

	const groupOrderOptions = useMemo(() => {
		const persisted = dataRender.groupBreaksCategoryValues || [];
		const ordered = [
			...persisted.filter((value) =>
				availableGroupValues.includes(value)
			),
			...availableGroupValues.filter(
				(value) => !persisted.includes(value)
			),
		];
		return ordered.map((value) => ({
			label: value,
			isHidden: false,
		}));
	}, [availableGroupValues, dataRender.groupBreaksCategoryValues]);
	const rowFilterSuggestions = useMemo(
		() => Array.from(uniqueCanonicalColumnValues(io.chartData, 'x')),
		[io.chartData]
	);

	return (
		<VStack spacing={2} className="prc-chart-modal__configure-tab-panel">
			<FocusedPanelBody
				panelId="wizardDataAccessors"
				title={__('Data series', 'prc-chart-builder')}
			>
				<VStack spacing={4}>
					{showCategorySorter && categoryOptions.length > 0 && (
						<>
							<p className="prc-chart-modal__control-group-label">
								{__('Categories', 'prc-chart-builder')}
							</p>
							<p className="prc-chart-modal__control-help">
								{__(
									'Enable and reorder the series columns used to render the chart.',
									'prc-chart-builder'
								)}
							</p>
							<Sorter
								options={categoryOptions}
								setAttributes={setAttributes}
								attribute="categories"
								parentObject="dataRender"
								parentObjectValue={dataRender}
							/>
						</>
					)}
					<FormTokenField
						__next40pxDefaultSize
						label={__('Exclude rows', 'prc-chart-builder')}
						value={dataRender.rowFilter?.exclude || []}
						suggestions={rowFilterSuggestions}
						onChange={(exclude) =>
							setPath('dataRender.rowFilter', {
								column: 'x',
								exclude,
							})
						}
						help={__(
							'Exclude values from the first table column. Those rows stay in the table and are not plotted.',
							'prc-chart-builder'
						)}
						__nextHasNoMarginBottom
					/>
					{isSankey && (
						<>
							<SelectControl
								__next40pxDefaultSize
								label={__('Source column', 'prc-chart-builder')}
								help={__(
									'The column that defines the source node for each flow.',
									'prc-chart-builder'
								)}
								value={sankey.sourceKey ?? 'x'}
								options={sankeyColumnOptions}
								onChange={(value) =>
									setPath('sankey.sourceKey', value)
								}
								__nextHasNoMarginBottom
							/>
							<SelectControl
								__next40pxDefaultSize
								label={__('Target column', 'prc-chart-builder')}
								help={__(
									'The column that defines the target node for each flow.',
									'prc-chart-builder'
								)}
								value={sankey.targetKey ?? 'target'}
								options={sankeyColumnOptions}
								onChange={(value) =>
									setPath('sankey.targetKey', value)
								}
								__nextHasNoMarginBottom
							/>
							<SelectControl
								__next40pxDefaultSize
								label={__('Value column', 'prc-chart-builder')}
								help={__(
									'The column that defines the size of each flow.',
									'prc-chart-builder'
								)}
								value={sankey.valueKey ?? 'value'}
								options={sankeyColumnOptions}
								onChange={(value) =>
									setPath('sankey.valueKey', value)
								}
								__nextHasNoMarginBottom
							/>
						</>
					)}
					{showDivergingAccessors &&
						availableCategories.length > 0 && (
							<>
								<p className="prc-chart-modal__control-help">
									{__(
										'A diverging bar chart can have three categories: one for the positive values, one for the negative values, and one for the neutral values (optional).',
										'prc-chart-builder'
									)}
								</p>
								<p className="prc-chart-modal__control-group-label">
									{__(
										'Positive categories',
										'prc-chart-builder'
									)}
								</p>
								<Sorter
									options={positiveCategoryOptions}
									setAttributes={setAttributes}
									attribute="positiveCategories"
									parentObject="divergingBar"
									parentObjectValue={divergingBar}
								/>
								<p className="prc-chart-modal__control-group-label">
									{__(
										'Negative categories',
										'prc-chart-builder'
									)}
								</p>
								<Sorter
									options={negativeCategoryOptions}
									setAttributes={setAttributes}
									attribute="negativeCategories"
									parentObject="divergingBar"
									parentObjectValue={divergingBar}
								/>
								<ToggleControl
									label={__(
										'Neutral column',
										'prc-chart-builder'
									)}
									checked={Boolean(neutralBar.active)}
									onChange={(value) =>
										setPath(
											'divergingBar.neutralBar.active',
											value
										)
									}
									help={__(
										'Add a neutral column to the right of the chart.',
										'prc-chart-builder'
									)}
									__nextHasNoMarginBottom
								/>
								{neutralBar.active && (
									<SelectControl
										__next40pxDefaultSize
										label={__(
											'Neutral category',
											'prc-chart-builder'
										)}
										value={neutralBar.category || ''}
										options={neutralCategoryOptions}
										onChange={(value) =>
											setPath(
												'divergingBar.neutralBar.category',
												value
											)
										}
										__nextHasNoMarginBottom
									/>
								)}
							</>
						)}
					{showXScale && (
						<SelectControl
							__next40pxDefaultSize
							label={__('X scale', 'prc-chart-builder')}
							value={dataRender.xScale || 'linear'}
							options={X_SCALE_OPTIONS}
							onChange={(value) => {
								onChange({
									...chartAttributes,
									dataRender: {
										...dataRender,
										xScale: value,
									},
									independentAxis: {
										...(chartAttributes.independentAxis ??
											{}),
										scale: value,
									},
								});
							}}
							__nextHasNoMarginBottom
						/>
					)}
					{showXScale && dataRender.xScale === 'time' && (
						<SelectControl
							__next40pxDefaultSize
							label={__(
								'Time series input format',
								'prc-chart-builder'
							)}
							value={dataRender.xFormat || 'YYYY'}
							options={[
								{ value: 'YYYY', label: 'YYYY' },
								{ value: 'YYYY-MM', label: 'YYYY-MM' },
								{ value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
								{ value: 'MM-YYYY', label: 'MM-YYYY' },
								{ value: 'MM-DD-YYYY', label: 'MM-DD-YYYY' },
								{ value: 'DD-MM-YYYY', label: 'DD-MM-YYYY' },
								{ value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
								{ value: 'MM/YYYY', label: 'MM/YYYY' },
								{ value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
							]}
							onChange={(value) =>
								setPath('dataRender.xFormat', value)
							}
							__nextHasNoMarginBottom
						/>
					)}
				</VStack>
			</FocusedPanelBody>

			{showSort && (
				<FocusedPanelBody
					panelId="wizardSorting"
					title={__('Sorting', 'prc-chart-builder')}
				>
					<VStack spacing={4}>
						{showSortKey && (
							<SelectControl
								__next40pxDefaultSize
								label={__('Sort key', 'prc-chart-builder')}
								value={dataRender.sortKey ?? 'x'}
								options={sortKeyOptions}
								onChange={(value) =>
									setPath('dataRender.sortKey', value)
								}
								help={__(
									'Column to sort the chart data by.',
									'prc-chart-builder'
								)}
								__nextHasNoMarginBottom
							/>
						)}
						<SelectControl
							__next40pxDefaultSize
							label={__('Sort order', 'prc-chart-builder')}
							value={dataRender.sortOrder ?? 'none'}
							options={SORT_ORDER_OPTIONS}
							onChange={(value) =>
								setPath('dataRender.sortOrder', value)
							}
							__nextHasNoMarginBottom
						/>
					</VStack>
				</FocusedPanelBody>
			)}

			{showGrouping && (
				<FocusedPanelBody
					panelId="wizardGrouping"
					title={__('Grouping', 'prc-chart-builder')}
				>
					<VStack spacing={4}>
						<ToggleControl
							label={__('Enable grouping', 'prc-chart-builder')}
							checked={Boolean(dataRender.groupBreaksActive)}
							onChange={(value) =>
								setPath('dataRender.groupBreaksActive', value)
							}
							help={__(
								'Partition data into groups by a category column.',
								'prc-chart-builder'
							)}
							__nextHasNoMarginBottom
						/>
						{groupBreaksActive && (
							<>
								<SelectControl
									__next40pxDefaultSize
									label={__('Group key', 'prc-chart-builder')}
									value={groupBreaksCategory}
									options={columnOptions}
									onChange={(value) => {
										const chartData = io.chartData;
										const categoryValues =
											value && chartData
												? [
														...new Set(
															chartData
																.map(
																	(datum) =>
																		datum[
																			value
																		]
																)
																.filter(Boolean)
														),
													]
												: [];
										onChange({
											...chartAttributes,
											dataRender: {
												...dataRender,
												groupBreaksCategory: value,
												groupBreaksActive: !!value,
												groupBreaksCategoryValues:
													categoryValues,
											},
										});
									}}
									__nextHasNoMarginBottom
								/>
								{showGroupBreakStyles && (
									<>
										<SelectControl
											__next40pxDefaultSize
											label={__(
												'Break line style',
												'prc-chart-builder'
											)}
											value={
												breakStyles.variation || 'empty'
											}
											options={BREAK_LINE_STYLE_OPTIONS}
											onChange={(value) =>
												setPath(
													'dataRender.groupBreaks.breakStyles.variation',
													value
												)
											}
											__nextHasNoMarginBottom
										/>
										<NumberControl
											label={__(
												'Break height',
												'prc-chart-builder'
											)}
											withInputField
											step={1}
											value={parseInt(
												breakStyles.height || 0,
												10
											)}
											onChange={(value) =>
												setPath(
													'dataRender.groupBreaks.breakStyles.height',
													formatNum(value, 'integer')
												)
											}
										/>
									</>
								)}
								{groupBreaksCategory &&
									groupOrderOptions.length > 0 && (
										<>
											<p className="prc-chart-modal__control-group-label">
												{__(
													'Group order',
													'prc-chart-builder'
												)}
											</p>
											<p className="prc-chart-modal__control-help">
												{__(
													'Drag to rearrange the order in which groups appear in the chart.',
													'prc-chart-builder'
												)}
											</p>
											<Sorter
												options={groupOrderOptions}
												setAttributes={setAttributes}
												attribute="groupBreaksCategoryValues"
												parentObject="dataRender"
												parentObjectValue={dataRender}
												allowDisabled={
													chartType === 'treemap'
												}
											/>
										</>
									)}
							</>
						)}
					</VStack>
				</FocusedPanelBody>
			)}

			{showSupplementalColumns && (
				<FocusedPanelBody
					panelId="wizardSupplementalColumns"
					title={__('Supplemental columns', 'prc-chart-builder')}
				>
					<VStack spacing={4}>
						<ToggleControl
							label={__('Additional column', 'prc-chart-builder')}
							checked={Boolean(diffColumn.active)}
							onChange={(value) =>
								setPath('diffColumn.active', value)
							}
							help={__(
								'Show the total, difference, or another data column to the right of the chart.',
								'prc-chart-builder'
							)}
							__nextHasNoMarginBottom
						/>
						{diffColumn.active && (
							<SelectControl
								__next40pxDefaultSize
								label={__(
									'Additional column category',
									'prc-chart-builder'
								)}
								value={diffColumn.category || ''}
								options={columnOptions}
								onChange={(value) =>
									setPath('diffColumn.category', value)
								}
								__nextHasNoMarginBottom
							/>
						)}
						<ToggleControl
							label={__('Net value labels', 'prc-chart-builder')}
							checked={Boolean(netValues.active)}
							onChange={(value) =>
								setPath('netValues.active', value)
							}
							help={__(
								'Show extra data columns as labels outside the bars (separate from the additional column).',
								'prc-chart-builder'
							)}
							__nextHasNoMarginBottom
						/>
						{netValues.active && (
							<SelectControl
								__next40pxDefaultSize
								label={__(
									'Positive column',
									'prc-chart-builder'
								)}
								value={netValues.positive?.category || ''}
								options={columnOptions}
								onChange={(value) =>
									setPath(
										'netValues.positive.category',
										value
									)
								}
								__nextHasNoMarginBottom
							/>
						)}
						{netValues.active && isDivergingBar && (
							<ToggleControl
								label={__(
									'Show negative value labels',
									'prc-chart-builder'
								)}
								checked={Boolean(netValues.negative?.active)}
								onChange={(value) =>
									setPath('netValues.negative.active', value)
								}
								__nextHasNoMarginBottom
							/>
						)}
						{netValues.active &&
							isDivergingBar &&
							netValues.negative?.active && (
								<SelectControl
									__next40pxDefaultSize
									label={__(
										'Negative column',
										'prc-chart-builder'
									)}
									value={netValues.negative?.category || ''}
									options={columnOptions}
									onChange={(value) =>
										setPath(
											'netValues.negative.category',
											value
										)
									}
									__nextHasNoMarginBottom
								/>
							)}
					</VStack>
				</FocusedPanelBody>
			)}
		</VStack>
	);
}
