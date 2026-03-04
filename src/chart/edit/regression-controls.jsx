// V2
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import {
	PanelBody,
	ToggleControl,
	SelectControl,
	TextControl,
	__experimentalNumberControl as NumberControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { PanelColorSettings } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { formatNum } from '../utils/helpers';
import { useViewportAttributes } from './use-viewport-attributes';

const REGRESSION_TYPE_OPTIONS = [
	{ label: 'Linear', value: 'linear' },
	{ label: 'Exponential', value: 'exponential' },
	{ label: 'Polynomial', value: 'polynomial' },
	{ label: 'Logarithmic', value: 'logarithmic' },
	{ label: 'Power', value: 'power' },
	{ label: 'Quadratic', value: 'quadratic' },
	{ label: 'LOESS (Smoothed)', value: 'loess' },
];

const { computeRegressionStats } =
	window.prcCustomCharts || window.prcChartingLibrary || {};

function RegressionControls({ attributes, setAttributes, clientId }) {
	const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
		attributes,
		setAttributes
	);

	const isActive = getCurrentValue('regression', 'active');
	const regressionType = getCurrentValue('regression', 'type') || 'linear';
	const perGroupBreak =
		getCurrentValue('regression', 'perGroupBreak') || false;

	// Group breaks — only relevant when the chart is in long/narrow format.
	const groupBreaksActive = getCurrentValue(
		'dataRender',
		'groupBreaksActive'
	);
	const groupBreaksCategory = getCurrentValue(
		'dataRender',
		'groupBreaksCategory'
	);
	const storedGroupBreaksCategoryValues =
		getCurrentValue('dataRender', 'groupBreaksCategoryValues') || [];
	const xKey = getCurrentValue('dataRender', 'x') || 'x';
	const chartData = getCurrentValue('io', 'chartData');

	// For scatter, the y-axis values live in the category columns (e.g. "y1"),
	// not in dataRender.y (which is a generic default of "y"). Use the first
	// active category column as the y-key.
	const categories = getCurrentValue('dataRender', 'categories') || [];
	const availableCategories =
		getCurrentValue('io', 'availableCategories') || [];
	const yKey = categories[0] || availableCategories[0] || 'y';

	// Use stored values when available, otherwise derive live from chartData
	// (matches how data-controls.jsx computes availableGroupValues).
	const groupBreaksCategoryValues = useMemo(() => {
		if (storedGroupBreaksCategoryValues.length) return storedGroupBreaksCategoryValues;
		if (!groupBreaksActive || !groupBreaksCategory || !chartData?.length) return [];
		return [ ...new Set( chartData.map((d) => d[groupBreaksCategory]).filter(Boolean) ) ];
	}, [storedGroupBreaksCategoryValues, groupBreaksActive, groupBreaksCategory, chartData]);


	// Compute regression fit statistics for display in the editor.
	// Only runs when groupBreaksActive, since that's when per-group lines are meaningful.
	// - perGroupBreak mode: returns { [groupValue]: RegressionStats }
	// - combined mode: returns a single RegressionStats object
	const regressionStats = useMemo(() => {
		if (!computeRegressionStats || !groupBreaksActive) return null;
		if (!chartData || chartData.length < 2) return null;

		if (perGroupBreak) {
			if (!groupBreaksCategoryValues?.length) return null;
			const statsByGroup = {};
			for (const groupVal of groupBreaksCategoryValues) {
				const points = chartData
					.filter((d) => d[groupBreaksCategory] === groupVal)
					.map((d) => {
						const xVal = parseFloat(d[xKey]);
						const yVal = parseFloat(d[yKey]);
						if (isNaN(xVal) || isNaN(yVal)) return null;
						return { x: xVal, y: yVal };
					})
					.filter(Boolean);
				statsByGroup[groupVal] = computeRegressionStats(points, regressionType);
			}
			return statsByGroup;
		}

		// Combined mode — all rows in one point set.
		const points = chartData
			.map((d) => {
				const xVal = parseFloat(d[xKey]);
				const yVal = parseFloat(d[yKey]);
				if (isNaN(xVal) || isNaN(yVal)) return null;
				return { x: xVal, y: yVal };
			})
			.filter(Boolean);

		if (points.length < 2) return null;
		return computeRegressionStats(points, regressionType);
	}, [
		regressionType,
		perGroupBreak,
		groupBreaksActive,
		groupBreaksCategory,
		groupBreaksCategoryValues,
		xKey,
		yKey,
		chartData,
	]);

	return (
		<PanelBody title={__('Regression Line')} initialOpen={false}>
			<ToolsPanel
				label={__('Attributes')}
				panelId={clientId}
				style={{
					paddingLeft: '0',
					paddingRight: '0',
				}}
			>
				<ToolsPanelItem
					hasValue={() => true}
					label={__('Active')}
					isShownByDefault
					panelId={clientId}
					style={{ gridColumn: 'span 2' }}
				>
					<ToggleControl
						label={__('Show regression line')}
						help={
							isActive
								? __('Regression line is visible on the chart.')
								: __('No regression line.')
						}
						checked={isActive}
						onChange={(newValue) =>
							updateAttributeForDevice('regression', {
								active: newValue,
							})
						}
					/>
				</ToolsPanelItem>
				{/* Per-group options are only meaningful when group breaks are active */}
				{isActive && groupBreaksActive && (
					<>
						<ToolsPanelItem
							hasValue={() => true}
							label={__('Per Group Break')}
							isShownByDefault
							panelId={clientId}
							style={{ gridColumn: 'span 2' }}
						>
							<ToggleControl
								label={__('One line per group break')}
								help={
									perGroupBreak
										? __(
												'A separate regression line is drawn for each group of data points, using its chart color (e.g. Democrats, Republicans).'
										  )
										: __(
												'A single regression line is drawn across all data points.'
										  )
								}
								checked={perGroupBreak}
								onChange={(newValue) =>
									updateAttributeForDevice('regression', {
										perGroupBreak: newValue,
									})
								}
							/>
						</ToolsPanelItem>
						<ToolsPanelItem
							hasValue={() => true}
							label={__('Fit Statistics')}
							isShownByDefault
							panelId={clientId}
							style={{ gridColumn: 'span 2' }}
						>
							{'loess' === regressionType ? (
								<p
									style={{
										fontSize: 11,
										color: '#757575',
										margin: '0 0 8px',
										fontStyle: 'italic',
									}}
								>
									{__(
										'No equation or R² — LOESS is a local smoothing algorithm with no closed-form expression.'
									)}
								</p>
							) : perGroupBreak &&
							  typeof regressionStats === 'object' &&
							  regressionStats !== null ? (
								Object.entries(regressionStats).map(
									([groupVal, stats]) => (
										<div
											key={groupVal}
											style={{ marginBottom: 8 }}
										>
											<p
												style={{
													fontSize: 11,
													fontWeight: 600,
													color: '#444',
													margin: '0 0 2px',
												}}
											>
												{groupVal}
											</p>
											{stats?.equation && (
												<p
													style={{
														fontSize: 11,
														color: '#757575',
														margin: '0 0 2px',
														fontFamily: 'monospace',
													}}
												>
													{stats.equation}
												</p>
											)}
											{stats?.rSquared != null ? (
												<p
													style={{
														fontSize: 11,
														color: '#757575',
														margin: 0,
													}}
												>
													{`R² = ${Number(
														stats.rSquared
													).toFixed(4)}`}
												</p>
											) : (
												<p
													style={{
														fontSize: 11,
														color: '#757575',
														margin: 0,
														fontStyle: 'italic',
													}}
												>
													{__('Insufficient data.')}
												</p>
											)}
										</div>
									)
								)
							) : regressionStats?.rSquared != null ? (
								<>
									{regressionStats?.equation && (
										<p
											style={{
												fontSize: 11,
												color: '#757575',
												margin: '0 0 4px',
												fontFamily: 'monospace',
											}}
										>
											{regressionStats.equation}
										</p>
									)}
									<p
										style={{
											fontSize: 11,
											color: '#757575',
											margin: '0 0 8px',
										}}
									>
										{`R² = ${Number(
											regressionStats.rSquared
										).toFixed(4)}`}
									</p>
								</>
							) : (
								<p
									style={{
										fontSize: 11,
										color: '#757575',
										margin: '0 0 8px',
										fontStyle: 'italic',
									}}
								>
									{__('Insufficient data to compute.')}
								</p>
							)}
						</ToolsPanelItem>
					</>
				)}
				<ToolsPanelItem
					hasValue={() => true}
					label={__('Regression Type')}
					isShownByDefault
					panelId={clientId}
					style={{ gridColumn: 'span 2' }}
				>
					<SelectControl
						label={__('Regression Type')}
						options={REGRESSION_TYPE_OPTIONS}
						value={getCurrentValue('regression', 'type')}
						disabled={!isActive}
						onChange={(value) =>
							updateAttributeForDevice('regression', {
								type: value,
							})
						}
					/>
				</ToolsPanelItem>
				<ToolsPanelItem
					hasValue={() => true}
					label={__('Line Color')}
					isShownByDefault
					panelId={clientId}
					style={{ gridColumn: 'span 2' }}
				>
					<PanelColorSettings
						__experimentalHasMultipleOrigins
						__experimentalIsRenderedInSidebar
						title={__('Line Color')}
						initialOpen
						colorSettings={[
							{
								value: getCurrentValue('regression', 'stroke'),
								onChange: (value) =>
									updateAttributeForDevice('regression', {
										stroke: value ?? '#2a2a2a',
									}),
								label: __('Stroke color'),
							},
						]}
					/>
				</ToolsPanelItem>
				<ToolsPanelItem
					hasValue={() => true}
					label={__('Stroke Width')}
					isShownByDefault
					panelId={clientId}
					style={{ gridColumn: 'span 2' }}
				>
					<NumberControl
						min={1}
						label={__('Stroke Width')}
						value={getCurrentValue('regression', 'strokeWidth')}
						disabled={!isActive}
						onChange={(value) =>
							updateAttributeForDevice('regression', {
								strokeWidth: formatNum(value, 'integer'),
							})
						}
					/>
				</ToolsPanelItem>
				<ToolsPanelItem
					hasValue={() => true}
					label={__('Stroke Dash Array')}
					isShownByDefault
					panelId={clientId}
					style={{ gridColumn: 'span 2' }}
				>
					<TextControl
						label={__('Stroke Dash Array')}
						help={__(
							'Alternating dash and gap lengths, e.g. "4,2" or "5,3,2". Leave empty for a solid line.'
						)}
						value={getCurrentValue('regression', 'strokeDasharray')}
						placeholder=""
						disabled={!isActive}
						onChange={(val) =>
							updateAttributeForDevice('regression', {
								strokeDasharray: val,
							})
						}
					/>
				</ToolsPanelItem>
			</ToolsPanel>
		</PanelBody>
	);
}

export default RegressionControls;
