/**
 * Data tab — accessors, scale, sort, and grouping.
 */
import {
	PanelBody,
	SelectControl,
	ToggleControl,
	__experimentalNumberControl as NumberControl,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import Sorter from '../../chart/edit/sorter';
import {
	GROUP_BREAKS_CHART_TYPES,
	GROUPABLE_CHART_TYPES,
	LINE_CHART_TYPES,
	SORTABLE_CHART_TYPES,
	effectiveChartTypeForControls,
} from '../../chart/utils/chart-types';
import { formatNum } from '../../chart/utils/helpers';
import { applyCuratedControl } from './apply-curated-control';

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
	const chartFamily = io.chartFamily;
	const isSmallMultiples = chartType === 'small-multiples';
	const isDivergingBar = chartType === 'diverging-bar';
	const availableCategories = io.availableCategories ?? [];

	const setPath = (path, value) =>
		onChange(applyCuratedControl(chartAttributes, path, value));

	const showXScale =
		LINE_CHART_TYPES.includes(effectiveType) || isSmallMultiples;
	const showSort = SORTABLE_CHART_TYPES.includes(effectiveType);
	const showSortKey = showSort && chartType !== 'treemap';
	const showGrouping = GROUPABLE_CHART_TYPES.includes(chartType);
	const showGroupBreakStyles = GROUP_BREAKS_CHART_TYPES.includes(chartType);
	// Mirror inspector Data panel: maps skip category sorters; diverging-bar
	// uses positive / negative / neutral accessors instead of dataRender.categories.
	const showCategorySorter = chartFamily !== 'map' && !isDivergingBar;
	const showDivergingAccessors = isDivergingBar;
	const groupBreaksActive = Boolean(dataRender.groupBreaksActive);
	const groupBreaksCategory = dataRender.groupBreaksCategory || '';
	const groupBreaks = dataRender.groupBreaks ?? {};
	const breakStyles = groupBreaks.breakStyles ?? {};
	const positiveCategories = divergingBar.positiveCategories || [];
	const negativeCategories = divergingBar.negativeCategories || [];
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

	const groupKeyOptions = useMemo(() => {
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

	return (
		<VStack spacing={2} className="prc-chart-modal__configure-tab-panel">
			<PanelBody
				title={__('Data accessors', 'prc-chart-builder')}
				initialOpen={false}
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
			</PanelBody>

			{showSort && (
				<PanelBody
					title={__('Sorting', 'prc-chart-builder')}
					initialOpen={false}
				>
					<VStack spacing={4}>
						{showSortKey && (
							<SelectControl
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
							label={__('Sort order', 'prc-chart-builder')}
							value={dataRender.sortOrder ?? 'none'}
							options={SORT_ORDER_OPTIONS}
							onChange={(value) =>
								setPath('dataRender.sortOrder', value)
							}
							__nextHasNoMarginBottom
						/>
					</VStack>
				</PanelBody>
			)}

			{showGrouping && (
				<PanelBody
					title={__('Grouping', 'prc-chart-builder')}
					initialOpen={false}
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
									label={__('Group key', 'prc-chart-builder')}
									value={groupBreaksCategory}
									options={groupKeyOptions}
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
				</PanelBody>
			)}
		</VStack>
	);
}
