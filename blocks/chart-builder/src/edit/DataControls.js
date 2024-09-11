/* eslint-disable max-lines-per-function */
/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	SelectControl,
	ToggleControl,
} from '@wordpress/components';

import Sorter from './Sorter';

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
	const {
		sortOrder,
		availableCategories,
		chartType,
		diffColumnActive,
		positiveCategories,
		negativeCategories,
		diffColumnCategory,
		neutralCategory,
		xScale,
		dateInputFormat,
		sortKey,
		independentVariable,
	} = attributes;
	const availableOptions = availableCategories.map((category) => ({
		label: category,
		disabled: false,
	}));
	const availablePositiveOptions = availableCategories.map((category) => ({
		label: category,
		disabled: !positiveCategories.includes(category),
	}));
	const availableNegativeOptions = availableCategories.map((category) => ({
		label: category,
		disabled: !negativeCategories.includes(category),
	}));
	return (
		<PanelBody title={__('Data')} initialOpen>
			<ToolsPanel
				label={__('Data Rendering and Sorting')}
				panelId={clientId}
				style={{
					paddingLeft: '0',
					paddingRight: '0',
				}}
			>
				<WidePanelItem
					hasValue={() => true}
					label={__('Sorting')}
					isShownByDefault
					panelId={clientId}
				>
					<SelectControl
						label={__('Sort Key')}
						value={sortKey}
						help={__(
							'Choose the column you would like to sort your data by.'
						)}
						onChange={(value) => setAttributes({ sortKey: value })}
						options={[
							...availableOptions,
							{
								label: independentVariable,
								value: 'x',
							},
						]}
					/>
					<SelectControl
						label={__('Sort Order')}
						value={sortOrder}
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
						onChange={(type) => {
							setAttributes({
								sortOrder: type,
							});
						}}
					/>
				</WidePanelItem>
				<PanelDescription>
					<StyledLabel>Data Accessors</StyledLabel>
				</PanelDescription>
				{'time' === xScale && (
					<WidePanelItem
						hasValue={() => true}
						label={__('Time Series Input Format')}
						isShownByDefault
						panelId={clientId}
					>
						<SelectControl
							label={__('Time series input format')}
							value={dateInputFormat}
							help={__(
								'Choose the format of your table’s time series data. This will be used to parse the data into a date object. If you do not see your format here, you must change your data to match one of the formats below.'
							)}
							onChange={(value) =>
								setAttributes({ dateInputFormat: value })
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
				{'diverging-bar' === chartType && (
					<WidePanelItem
						hasValue={() => 0 < availableOptions.length}
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
							setAttributes={setAttributes}
							attribute="positiveCategories"
						/>
						<PanelDescription>
							<StyledLabel>Negative Categories</StyledLabel>
						</PanelDescription>
						<Sorter
							options={availableNegativeOptions}
							setAttributes={setAttributes}
							attribute="negativeCategories"
						/>
						<SelectControl
							label={__('Neutral Category')}
							value={neutralCategory}
							onChange={(value) =>
								setAttributes({ neutralCategory: value })
							}
							options={availableOptions.map((option) => ({
								label: option.label,
								value: option.label,
							}))}
						/>
					</WidePanelItem>
				)}
				{'diverging-bar' !== chartType && (
					<WidePanelItem
						hasValue={() => 0 < availableOptions.length}
						label={__('Categories')}
						isShownByDefault
						panelId={clientId}
					>
						<PanelDescription>
							Select the catogories you would like chart builder
							to use to render your data.
						</PanelDescription>
						<Sorter
							options={availableOptions}
							setAttributes={setAttributes}
							attribute="categories"
						/>
					</WidePanelItem>
				)}

				<WidePanelItem
					hasValue={() => true}
					label={__('Diff Column')}
					isShownByDefault
					panelId={clientId}
				>
					<PanelDescription>
						<StyledLabel>Data Column</StyledLabel>
					</PanelDescription>
					<ToggleControl
						label={diffColumnActive ? __('Active') : __('Inactive')}
						checked={diffColumnActive}
						onChange={(value) =>
							setAttributes({ diffColumnActive: value })
						}
					/>
					<PanelDescription>
						Activate if you'd like to include a column that shows
						the total/difference/or any other data column to the
						right of the chart (optional).
					</PanelDescription>
					{diffColumnActive && (
						<SelectControl
							label={__('Diff Column Category')}
							value={diffColumnCategory}
							onChange={(value) =>
								setAttributes({ diffColumnCategory: value })
							}
							options={availableOptions.map((option) => ({
								label: option.label,
								value: option.label,
							}))}
						/>
					)}
				</WidePanelItem>
			</ToolsPanel>
		</PanelBody>
	);
}

export default DataControls;
