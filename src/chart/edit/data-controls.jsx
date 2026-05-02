/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
/**
 * External Dependencies
 */
import styled from '@emotion/styled';

/**
 * WordPress Dependencies
 */
import {
	FormTokenField,
	__experimentalNumberControl as NumberControl,
	PanelBody,
	SelectControl,
	TextareaControl,
	ToggleControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import {
	GROUP_BREAKS_CHART_TYPES,
	GROUPABLE_CHART_TYPES,
	POINT_CHART_TYPES,
	SORTABLE_CHART_TYPES,
	SUPPLEMENTAL_COLUMN_CHART_TYPES,
} from '../utils/chart-types';
import { formatNum } from '../utils/helpers';
import Sorter from './sorter';
import { useViewportAttributes } from './use-viewport-attributes';

const PanelDescription = styled.div`
	grid-column: span 2;
`;
const WidePanelItem = styled(ToolsPanelItem)`
	grid-column: span 2;
`;
const StyledLabel = styled.div`
	font-size: 11px;
	font-weight: 500;
	line-height: 1.4;
	text-transform: uppercase;
	display: inline-block;
	margin-bottom: calc(8px) !important;
	padding: 0px;
`;

function DataControls({ attributes, setAttributes, clientId }) {
	const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
		attributes,
		setAttributes
	);

	// Content attributes - NOT viewport-aware (same data across all viewports)
	const io = attributes.io || {};
	const dataRender = attributes.dataRender || {};
	const divergingBar = attributes.divergingBar || {};

	// Presentation attributes - viewport-aware
	const layout = getCurrentValue('layout') || {};

	const { availableCategories, independentVariable, chartFamily, chartData } =
		io;
	const { type: chartType } = layout;
	const categories = dataRender.categories || [];
	const positiveCategories = divergingBar.positiveCategories || [];
	const negativeCategories = divergingBar.negativeCategories || [];
	const groupBreaksActive = dataRender.groupBreaksActive || false;
	const groupBreaksCategory = dataRender.groupBreaksCategory || '';

	const availableOptions = useMemo(
		() =>
			(availableCategories || []).map((category) => {
				return {
					label: category,
					disabled:
						categories.length > 0
							? !categories.includes(category)
							: false,
				};
			}),
		[availableCategories, categories]
	);
	const availableSelectableOptions = useMemo(
		() =>
			availableOptions.map((option) => ({
				label: option.label,
				value: option.label,
			})),
		[availableOptions]
	);
	const availablePositiveOptions = useMemo(
		() =>
			availableCategories.map((category) => ({
				label: category,
				value: category,
				disabled: !positiveCategories.includes(category),
			})),
		[availableCategories, positiveCategories]
	);
	const availableNegativeOptions = useMemo(
		() =>
			availableCategories.map((category) => ({
				label: category,
				value: category,
				disabled: !negativeCategories.includes(category),
			})),
		[availableCategories, negativeCategories]
	);

	// Derive unique group values from the selected groupBreaksCategory
	const availableGroupValues = useMemo(() => {
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
	}, [groupBreaksActive, groupBreaksCategory, chartData]);

	// Create options for the Sorter component
	const groupOrderOptions = useMemo(
		() =>
			availableGroupValues.map((value) => ({
				label: value,
				disabled: false,
			})),
		[availableGroupValues]
	);
	return (
		<PanelBody title={__('Data')} initialOpen={true}>
			<ToolsPanel
				label={__('Data Rendering, Sorting, Grouping, and Accessors')}
				panelId={clientId}
				style={{
					paddingLeft: '0',
					paddingRight: '0',
				}}
			>
				<PanelDescription>
					<StyledLabel>1. Data Accessors</StyledLabel>
				</PanelDescription>
				{'line' === chartType ||
					('area' === chartType && (
						<WidePanelItem
							hasValue={() => true}
							label={__('X Scale')}
							isShownByDefault
							panelId={clientId}
						>
							<SelectControl
								label={__('X Scale')}
								value={dataRender.xScale}
								onChange={(value) =>
									setAttributes({
										dataRender: {
											...dataRender,
											xScale: value,
										},
									})
								}
								options={[
									{ value: 'time', label: 'Time' },
									{ value: 'linear', label: 'Linear' },
								]}
							/>
						</WidePanelItem>
					))}
				{'time' === dataRender.xScale && (
					<WidePanelItem
						hasValue={() => true}
						label={__('Time Series Input Format')}
						isShownByDefault
						panelId={clientId}
					>
						<SelectControl
							label={__('Time series input format')}
							value={dataRender.xFormat}
							help={__(
								`Choose the format of your table's time series data. This will be used to parse the data into a date object. If you do not see your format here, you must change your data to match one of the formats below.`
							)}
							onChange={(value) =>
								setAttributes({
									dataRender: {
										...dataRender,
										xFormat: value,
									},
								})
							}
							options={[
								{
									value: 'YYYY',
									label: 'YYYY',
								},
								{
									value: 'YYYY-MM',
									label: 'YYYY-MM',
								},
								{
									value: 'YYYY-MM-DD',
									label: 'YYYY-MM-DD',
								},
								{
									value: 'MM-YYYY',
									label: 'MM-YYYY',
								},
								{
									value: 'MM-DD-YYYY',
									label: 'MM-DD-YYYY',
								},
								{
									value: 'DD-MM-YYYY',
									label: 'DD-MM-YYYY',
								},
								{
									value: 'MM/DD/YYYY',
									label: 'MM/DD/YYYY',
								},
								{
									value: 'MM/YYYY',
									label: 'MM/YYYY',
								},
								{
									value: 'DD/MM/YYYY',
									label: 'DD/MM/YYYY',
								},
							]}
						/>
					</WidePanelItem>
				)}
				{'map' === chartFamily && (
					<>
						<WidePanelItem
							hasValue={() =>
								0 < availableSelectableOptions.length
							}
							label={__('Categories')}
							isShownByDefault
							panelId={clientId}
						>
							<PanelDescription>
								Select the category you would like chart builder
								to use to render your map’s data.
							</PanelDescription>
							<SelectControl
								label={__('Map Data Category')}
								value={dataRender.categories?.[0]}
								onChange={(value) =>
									setAttributes({
										dataRender: {
											...dataRender,
											categories: [value],
										},
									})
								}
								options={availableSelectableOptions}
							/>
						</WidePanelItem>
						<WidePanelItem
							hasValue={() => true}
							label={__('Map Color Scale')}
							isShownByDefault
							panelId={clientId}
						>
							<SelectControl
								label={__('Map Scale')}
								value={dataRender.mapScale}
								onChange={(value) =>
									setAttributes({
										dataRender: {
											...dataRender,
											mapScale: value,
										},
									})
								}
								options={[
									{
										value: 'threshold',
										label: 'Threshold',
									},
									{
										value: 'ordinal',
										label: 'Ordinal',
									},
									{
										value: 'linear',
										label: 'Linear',
									},
								]}
							/>
						</WidePanelItem>
						<WidePanelItem
							hasValue={() => true}
							label={__('Map Color Scale Domain')}
							isShownByDefault
							panelId={clientId}
						>
							{dataRender.mapScale === 'ordinal' ? (
								<>
									<PanelDescription>
										Enter the categories in the order you
										would like them to appear, one per line.
									</PanelDescription>
									<TextareaControl
										label={__('Map Color Scale Domain')}
										value={(
											dataRender.mapScaleDomain || []
										).join('\n')}
										onChange={(value) => {
											// Keep all lines during editing (including empty)
											const mapScaleCategories =
												value.split('\n');
											setAttributes({
												dataRender: {
													...dataRender,
													mapScaleDomain:
														mapScaleCategories,
												},
											});
										}}
										onBlur={() => {
											// Clean up empty lines when user leaves field
											const cleaned = (
												dataRender.mapScaleDomain || []
											).filter(
												(line) => line.trim() !== ''
											);
											setAttributes({
												dataRender: {
													...dataRender,
													mapScaleDomain: cleaned,
												},
											});
										}}
										help={__('One category per line.')}
										rows={5}
									/>
								</>
							) : (
								<>
									<PanelDescription>
										{dataRender.mapScale === 'threshold'
											? 'Enter the thresholds for each color.'
											: 'Enter the min and max values for the scale.'}
									</PanelDescription>
									<FormTokenField
										label={__('Map Color Scale Domain')}
										value={dataRender.mapScaleDomain || []}
										onChange={(c) => {
											c = c
												.map((v) => parseFloat(v))
												.filter((v) => !isNaN(v))
												.sort((a, b) => a - b);
											setAttributes({
												dataRender: {
													...dataRender,
													mapScaleDomain: c,
												},
											});
										}}
										help={__(
											'Separate with commas or the Enter key.'
										)}
									/>
								</>
							)}
						</WidePanelItem>
					</>
				)}
				{'diverging-bar' === chartType && (
					<WidePanelItem
						hasValue={() => 0 < availableSelectableOptions.length}
						label={__('Categories')}
						isShownByDefault
						panelId={clientId}
					>
						<PanelDescription>
							Select the categories you would like chart builder
							to use to render your data. A diverging bar chart
							can have three categories: one for the positive
							values, one for the negative values, and one for the
							neutral values (optional).
						</PanelDescription>
						<PanelDescription>
							<StyledLabel>Positive Categories</StyledLabel>
						</PanelDescription>
						<Sorter
							options={availablePositiveOptions}
							setAttributes={(updates) => {
								// Wrap Sorter's setAttributes to be viewport-aware
								if (updates.divergingBar) {
									updateAttributeForDevice(
										'divergingBar',
										updates.divergingBar
									);
								} else {
									setAttributes(updates);
								}
							}}
							attribute="positiveCategories"
							parentObject="divergingBar"
							parentObjectValue={divergingBar}
						/>
						<PanelDescription>
							<StyledLabel>Negative Categories</StyledLabel>
						</PanelDescription>
						<Sorter
							options={availableNegativeOptions}
							setAttributes={(updates) => {
								// Wrap Sorter's setAttributes to be viewport-aware
								if (updates.divergingBar) {
									updateAttributeForDevice(
										'divergingBar',
										updates.divergingBar
									);
								} else {
									setAttributes(updates);
								}
							}}
							attribute="negativeCategories"
							parentObject="divergingBar"
							parentObjectValue={divergingBar}
						/>
						<SelectControl
							label={__('Neutral Category')}
							value={divergingBar.neutralBar?.category}
							onChange={(value) => {
								const neutralBar =
									divergingBar.neutralBar || {};
								setAttributes({
									divergingBar: {
										...divergingBar,
										neutralBar: {
											...neutralBar,
											category: value,
										},
									},
								});
							}}
							options={availableSelectableOptions}
						/>
					</WidePanelItem>
				)}
				{'map' !== chartFamily && 'diverging-bar' !== chartType && (
					<WidePanelItem
						hasValue={() => 0 < availableOptions.length}
						label={__('Categories')}
						isShownByDefault
						panelId={clientId}
					>
						<PanelDescription>
							Select the categories you would like chart builder
							to use to render your data.
						</PanelDescription>
						<Sorter
							options={availableOptions}
							setAttributes={setAttributes}
							attribute="categories"
							parentObject="dataRender"
							parentObjectValue={dataRender}
						/>
					</WidePanelItem>
				)}
				{POINT_CHART_TYPES.includes(chartType) && (
					<WidePanelItem
						hasValue={() => !!dataRender.groupBreaksCategory}
						label={__('Group By')}
						isShownByDefault
						panelId={clientId}
					>
						<SelectControl
							label={__('Color Points By Group')}
							help={__(
								'Select a column to group and color points. Each unique value becomes a color group in the legend.'
							)}
							value={dataRender.groupBreaksCategory || ''}
							onChange={(value) => {
								const categoryValues =
									value && chartData
										? [
												...new Set(
													chartData
														.map((d) => d[value])
														.filter(Boolean)
												),
											]
										: [];
								setAttributes({
									dataRender: {
										...dataRender,
										groupBreaksCategory: value || '',
										groupBreaksActive: !!value,
										groupBreaksCategoryValues:
											categoryValues,
									},
								});
							}}
							options={[
								{
									value: '',
									label: __('— None (color by series) —'),
								},
								...availableCategories.map((category) => ({
									label: category,
									value: category,
								})),
							]}
						/>
					</WidePanelItem>
				)}
				{GROUPABLE_CHART_TYPES.includes(chartType) && (
					<>
						<PanelDescription>
							<StyledLabel>2. Group By</StyledLabel>
						</PanelDescription>
						<WidePanelItem
							hasValue={() => true}
							label={__('Group By')}
							isShownByDefault
							panelId={clientId}
						>
							<ToggleControl
								label={__('Enable Grouping')}
								checked={dataRender.groupBreaksActive || false}
								onChange={() =>
									setAttributes({
										dataRender: {
											...dataRender,
											groupBreaksActive:
												!dataRender.groupBreaksActive,
										},
									})
								}
							/>
							<PanelDescription>
								Partition your data into groups by selecting a
								category column. Each unique value in that
								column becomes a separate group.
							</PanelDescription>
							{dataRender.groupBreaksActive && (
								<>
									<SelectControl
										label={__('Group By Category')}
										value={dataRender.groupBreaksCategory}
										onChange={(value) =>
											setAttributes({
												dataRender: {
													...dataRender,
													groupBreaksCategory: value,
												},
											})
										}
										options={availableCategories.map(
											(category) => ({
												label: category,
												value: category,
											})
										)}
									/>
									{GROUP_BREAKS_CHART_TYPES.includes(
										chartType
									) && (
										<>
											<SelectControl
												label={__('Break Line Style')}
												value={
													dataRender.groupBreaks
														?.breakStyles?.variation
												}
												onChange={(value) => {
													const groupBreaks =
														getCurrentValue(
															'dataRender',
															'groupBreaks'
														) || {};
													const breakStyles =
														groupBreaks.breakStyles ||
														{};
													updateAttributeForDevice(
														'dataRender',
														{
															groupBreaks: {
																...groupBreaks,
																breakStyles: {
																	...breakStyles,
																	variation:
																		value,
																},
															},
														}
													);
												}}
												options={[
													{
														value: 'empty',
														label: 'Empty',
													},
													{
														value: 'solid',
														label: 'Solid',
													},
													{
														value: 'dotted',
														label: 'Dotted',
													},
													{
														value: 'dashed',
														label: 'Dashed',
													},
													{
														value: 'heartbeat',
														label: 'Heartbeat',
													},
												]}
											/>
											<NumberControl
												label={__('Break Height')}
												withInputField
												step={1}
												value={parseInt(
													getCurrentValue(
														'dataRender',
														'groupBreaks'
													)?.breakStyles?.height || 0,
													10
												)}
												onChange={(value) => {
													const groupBreaks =
														getCurrentValue(
															'dataRender',
															'groupBreaks'
														) || {};
													const breakStyles =
														groupBreaks.breakStyles ||
														{};
													updateAttributeForDevice(
														'dataRender',
														{
															groupBreaks: {
																...groupBreaks,
																breakStyles: {
																	...breakStyles,
																	height: formatNum(
																		value,
																		'integer'
																	),
																},
															},
														}
													);
												}}
											/>
										</>
									)}
								</>
							)}
						</WidePanelItem>
						<PanelDescription>
							<StyledLabel>3. Group Order</StyledLabel>
						</PanelDescription>
						{groupBreaksActive &&
							groupBreaksCategory &&
							availableGroupValues.length > 0 && (
								<WidePanelItem
									hasValue={() => true}
									label={__('Group Order')}
									isShownByDefault
									panelId={clientId}
								>
									<PanelDescription>
										Drag to rearrange the order in which
										groups appear in the chart.
									</PanelDescription>
									<Sorter
										options={groupOrderOptions}
										setAttributes={setAttributes}
										attribute="groupBreaksCategoryValues"
										parentObject="dataRender"
										parentObjectValue={dataRender}
										allowDisabled={chartType === 'treemap'}
									/>
								</WidePanelItem>
							)}
					</>
				)}
				{SORTABLE_CHART_TYPES.includes(chartType) && (
					<>
						<PanelDescription>
							<StyledLabel>4. Data Sorting</StyledLabel>
						</PanelDescription>
						<WidePanelItem
							hasValue={() => true}
							label={__('Sorting')}
							isShownByDefault
							panelId={clientId}
						>
							{/* Sort Key is meaningless for treemap (always the implicit value column). */}
							{chartType !== 'treemap' && (
								<SelectControl
									label={__('Sort Key')}
									value={dataRender.sortKey}
									help={__(
										'Choose the column you would like to sort your data by.'
									)}
									onChange={(value) =>
										setAttributes({
											dataRender: {
												...dataRender,
												sortKey: value,
											},
										})
									}
									options={[
										...availableSelectableOptions,
										{
											label: independentVariable,
											value: 'x',
										},
									]}
								/>
							)}
							<SelectControl
								label={__('Sort Order')}
								value={dataRender.sortOrder}
								help={
									chartType === 'treemap'
										? __(
												'How leaf rectangles are ordered inside each group. "Descending" mirrors classic treemap hierarchy; "No Sort" preserves the underlying data order.'
											)
										: undefined
								}
								options={[
									{
										value: 'ascending',
										label: 'Ascending',
									},
									{
										value: 'descending',
										label: 'Descending',
									},
									{
										value: 'none',
										label: 'No Sort',
									},
								]}
								onChange={(sort) => {
									setAttributes({
										dataRender: {
											...dataRender,
											sortOrder: sort,
										},
									});
								}}
							/>
						</WidePanelItem>
					</>
				)}
				{SUPPLEMENTAL_COLUMN_CHART_TYPES.includes(chartType) && (
					<>
						<PanelDescription>
							<StyledLabel>5. Diff Column</StyledLabel>
						</PanelDescription>
						<WidePanelItem
							hasValue={() => true}
							label={__('Diff Column')}
							isShownByDefault
							panelId={clientId}
						>
							<ToggleControl
								label={
									getCurrentValue('diffColumn', 'active')
										? __('Active')
										: __('Inactive')
								}
								checked={
									getCurrentValue('diffColumn', 'active') ||
									false
								}
								onChange={(value) =>
									updateAttributeForDevice('diffColumn', {
										active: value,
									})
								}
							/>
							<PanelDescription>
								Activate if you&apos;d like to include a column
								that shows the total/difference/or any other
								data column to the right of the chart
								(optional).
							</PanelDescription>
							{getCurrentValue('diffColumn', 'active') && (
								<SelectControl
									label={__('Diff Column Category')}
									value={getCurrentValue(
										'diffColumn',
										'category'
									)}
									onChange={(value) =>
										updateAttributeForDevice('diffColumn', {
											category: value,
										})
									}
									options={availableOptions.map((option) => ({
										label: option.label,
										value: option.label,
									}))}
								/>
							)}
						</WidePanelItem>
					</>
				)}
				{SUPPLEMENTAL_COLUMN_CHART_TYPES.includes(chartType) && (
					<>
						<PanelDescription>
							<StyledLabel>6. Net Value Labels</StyledLabel>
						</PanelDescription>
						<WidePanelItem
							hasValue={() => true}
							label={__('Net Value Labels')}
							isShownByDefault
							panelId={clientId}
						>
							<ToggleControl
								label={
									getCurrentValue('netValues', 'active')
										? __('Active')
										: __('Inactive')
								}
								checked={
									getCurrentValue('netValues', 'active') ||
									false
								}
								onChange={(value) =>
									updateAttributeForDevice('netValues', {
										active: value,
									})
								}
							/>
							<PanelDescription>
								Show extra data columns as labels outside the
								bars (separate from the Diff column).
							</PanelDescription>
							{getCurrentValue('netValues', 'active') && (
								<>
									<SelectControl
										label={__('Positive column')}
										value={
											getCurrentValue(
												'netValues',
												'positive'
											)?.category || ''
										}
										onChange={(value) => {
											const nv =
												getCurrentValue('netValues') ||
												{};
											updateAttributeForDevice(
												'netValues',
												{
													...nv,
													positive: {
														...(nv.positive || {}),
														category: value,
													},
												}
											);
										}}
										options={availableOptions.map(
											(option) => ({
												label: option.label,
												value: option.label,
											})
										)}
									/>
									{'diverging-bar' === chartType && (
										<>
											<ToggleControl
												label={__(
													'Negative labels active'
												)}
												checked={
													!!getCurrentValue(
														'netValues',
														'negative'
													)?.active
												}
												onChange={(value) => {
													const nv =
														getCurrentValue(
															'netValues'
														) || {};
													updateAttributeForDevice(
														'netValues',
														{
															...nv,
															negative: {
																...(nv.negative ||
																	{}),
																active: value,
															},
														}
													);
												}}
											/>
											{getCurrentValue(
												'netValues',
												'negative'
											)?.active && (
												<SelectControl
													label={__(
														'Negative column'
													)}
													value={
														getCurrentValue(
															'netValues',
															'negative'
														)?.category || ''
													}
													onChange={(value) => {
														const nv =
															getCurrentValue(
																'netValues'
															) || {};
														updateAttributeForDevice(
															'netValues',
															{
																...nv,
																negative: {
																	...(nv.negative ||
																		{}),
																	category:
																		value,
																},
															}
														);
													}}
													options={availableOptions.map(
														(option) => ({
															label: option.label,
															value: option.label,
														})
													)}
												/>
											)}
										</>
									)}
								</>
							)}
						</WidePanelItem>
					</>
				)}
			</ToolsPanel>
		</PanelBody>
	);
}

export default DataControls;
