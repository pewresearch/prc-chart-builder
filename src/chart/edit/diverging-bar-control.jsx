// V2
/* eslint-disable max-lines-per-function */
/**
 * External dependencies
 */
import styled from '@emotion/styled';
/**
 * WordPress dependencies
 */
import { PanelColorSettings } from '@wordpress/block-editor';
import {
	Button,
	__experimentalNumberControl as NumberControl,
	PanelBody,
	RangeControl,
	ToggleControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { formatNum } from '../utils/helpers';
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
function DivergingBarControls({ attributes, setAttributes, clientId }) {
	const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
		attributes,
		setAttributes
	);

	// Get viewport-aware divergingBar configuration
	const divergingBar = getCurrentValue('divergingBar') || {};
	const neutralBar = divergingBar.neutralBar || {};

	return (
		<PanelBody title={__('Diverging Bar')} initialOpen>
			<ToolsPanel
				label={__('Attributes')}
				panelId={clientId}
				style={{
					paddingLeft: '0',
					paddingRight: '0',
				}}
			>
				<WidePanelItem
					hasValue={() => true}
					label={__('Bar Padding')}
					isShownByDefault
					panelId={clientId}
				>
					<NumberControl
						label={__('Bar Padding')}
						withInputField
						min={0}
						max={10}
						step={0.05}
						value={parseFloat(
							getCurrentValue('bar', 'barPadding'),
							10
						)}
						onChange={(value) => {
							const currentBar = getCurrentValue('bar') || {};
							updateAttributeForDevice('bar', {
								...currentBar,
								barPadding: formatNum(value, 'float'),
							});
						}}
					/>
				</WidePanelItem>
				{neutralBar.active && (
					<>
						<WidePanelItem
							hasValue={() => true}
							label={__('Neutral Bar Separator')}
							isShownByDefault
							panelId={clientId}
						>
							<ToggleControl
								label={__('Neutral Bar Separator')}
								disabled={!neutralBar.active}
								checked={neutralBar.separator || false}
								onChange={(newValue) => {
									const currentNeutralBar =
										getCurrentValue(
											'divergingBar',
											'neutralBar'
										) || {};
									updateAttributeForDevice('divergingBar', {
										neutralBar: {
											...currentNeutralBar,
											separator: newValue,
										},
									});
								}}
								help={__(
									'If active, a separator will be added to the neutral bar.'
								)}
							/>
						</WidePanelItem>
						<WidePanelItem
							hasValue={() => neutralBar.offsetX}
							disabled={!neutralBar.active}
							label={__('Neutral Bar Positioning')}
							panelId={clientId}
						>
							<PanelDescription>
								<StyledLabel>
									Neutral Bar Positioning
								</StyledLabel>
							</PanelDescription>
							<NumberControl
								label={__('DX')}
								value={neutralBar.offsetX}
								disabled={!neutralBar.active}
								onChange={(value) => {
									const currentNeutralBar =
										getCurrentValue(
											'divergingBar',
											'neutralBar'
										) || {};
									updateAttributeForDevice('divergingBar', {
										neutralBar: {
											...currentNeutralBar,
											offsetX: formatNum(
												value,
												'integer'
											),
										},
									});
								}}
							/>
						</WidePanelItem>
						<WidePanelItem
							hasValue={() => neutralBar.separatorOffsetX}
							disabled={!neutralBar.separator}
							label={__('Neutral Bar Positioning')}
							panelId={clientId}
						>
							<PanelDescription>
								<StyledLabel>Separator Positioning</StyledLabel>
							</PanelDescription>
							<NumberControl
								label={__('DX')}
								value={neutralBar.separatorOffsetX}
								disabled={!neutralBar.separator}
								onChange={(value) => {
									const currentNeutralBar =
										getCurrentValue(
											'divergingBar',
											'neutralBar'
										) || {};
									updateAttributeForDevice('divergingBar', {
										neutralBar: {
											...currentNeutralBar,
											separatorOffsetX: formatNum(
												value,
												'integer'
											),
										},
									});
								}}
							/>
						</WidePanelItem>
						<WidePanelItem
							hasValue={() => divergingBar.percentOfInnerWidth}
							label={__('Diverging Bar Width')}
							panelId={clientId}
						>
							<RangeControl
								label={__('Percent of Inner Width')}
								help={__(
									'This calculates the percentage of the total chart area that the main bars (positive and negative) will occupy. This is useful for adjusting the width of the bars to ensure they fit within the chart area without overlapping.'
								)}
								withInputField
								disabled={!neutralBar.active}
								min={0}
								max={1}
								step={0.01}
								value={divergingBar.percentOfInnerWidth}
								onChange={(w) => {
									updateAttributeForDevice('divergingBar', {
										percentOfInnerWidth: formatNum(
											w,
											'integer'
										),
									});
								}}
							/>
						</WidePanelItem>
					</>
				)}
			</ToolsPanel>
		</PanelBody>
	);
}

function SecondaryOverlayControls({ attributes, setAttributes, clientId }) {
	const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
		attributes,
		setAttributes
	);

	const divergingBar = getCurrentValue('divergingBar') || {};
	const secondary = divergingBar.secondary || {};
	const secondaryActive = secondary.active || false;

	const allSecondaryCategories = [
		...(secondary.negativeCategories || []),
		...(secondary.positiveCategories || []),
	];

	const updateSecondary = (updates) => {
		const current = divergingBar.secondary || {};
		updateAttributeForDevice('divergingBar', {
			secondary: {
				...current,
				...updates,
			},
		});
	};

	const updateCategoryStyle = (cat, updates) => {
		const currentStyles = secondary.categoryStyles || {};
		const nextCatStyle = { ...(currentStyles[cat] || {}), ...updates };
		// Remove undefined and empty-string fields; preserve null (null fill = transparent).
		Object.keys(nextCatStyle).forEach((k) => {
			if (nextCatStyle[k] === undefined || nextCatStyle[k] === '') {
				delete nextCatStyle[k];
			}
		});
		const nextStyles = { ...currentStyles, [cat]: nextCatStyle };
		if (Object.keys(nextCatStyle).length === 0) {
			delete nextStyles[cat];
		}
		updateSecondary({ categoryStyles: nextStyles });
	};

	const resetCategoryStyle = (cat) => {
		const nextStyles = { ...(secondary.categoryStyles || {}) };
		delete nextStyles[cat];
		updateSecondary({ categoryStyles: nextStyles });
	};

	return (
		<PanelBody title={__('Secondary (Ghost) Overlay')} initialOpen={false}>
			<ToolsPanel
				label={__('Secondary Overlay')}
				panelId={`${clientId}-secondary`}
				style={{ paddingLeft: '0', paddingRight: '0' }}
			>
				<WidePanelItem
					hasValue={() =>
						secondary.fill !== undefined ||
						secondary.stroke !== undefined
					}
					label={__('Secondary Fill & Stroke')}
					isShownByDefault
					panelId={`${clientId}-secondary`}
				>
					<PanelColorSettings
						__experimentalHasMultipleOrigins
						__experimentalIsRenderedInSidebar
						title={__('Secondary Colors')}
						initialOpen
						colorSettings={[
							{
								value: secondary.fill ?? '',
								onChange: (value) =>
									updateSecondary({
										fill: value ?? null,
									}),
								label: __('Fill (leave empty for transparent)'),
							},
							{
								value: secondary.stroke ?? '#000000',
								onChange: (value) =>
									updateSecondary({
										stroke: value ?? '#000000',
									}),
								label: __('Stroke'),
							},
						]}
					/>
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => secondary.strokeWidth !== undefined}
					label={__('Secondary Stroke Width')}
					panelId={`${clientId}-secondary`}
				>
					<NumberControl
						label={__('Stroke Width')}
						value={secondary.strokeWidth ?? 0.5}
						disabled={!secondaryActive}
						min={0}
						max={10}
						step={0.1}
						onChange={(value) =>
							updateSecondary({
								strokeWidth: formatNum(value, 'float'),
							})
						}
					/>
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => secondary.opacity !== undefined}
					label={__('Secondary Opacity')}
					panelId={`${clientId}-secondary`}
				>
					<RangeControl
						label={__('Opacity')}
						value={secondary.opacity ?? 0.4}
						disabled={!secondaryActive}
						min={0}
						max={1}
						step={0.05}
						withInputField
						onChange={(value) =>
							updateSecondary({ opacity: value })
						}
					/>
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => secondary.showInLegend === true}
					label={__('Show in Legend')}
					isShownByDefault
					panelId={`${clientId}-secondary`}
				>
					<ToggleControl
						label={__('Show in legend')}
						checked={secondary.showInLegend ?? false}
						onChange={(v) => updateSecondary({ showInLegend: v })}
						disabled={!secondaryActive}
						help={__(
							'Adds secondary categories to the chart legend with their ghost fill colors.'
						)}
					/>
				</WidePanelItem>
			</ToolsPanel>

			{/* Per-category style overrides — rendered outside the ToolsPanel
			    so each category gets its own collapsible PanelBody. Only shown
			    when the overlay is active and at least one category is set. */}
			{secondaryActive && allSecondaryCategories.length > 0 && (
				<>
					<StyledLabel
						style={{ marginTop: '16px', display: 'block' }}
					>
						{__('Per-Category Overrides')}
					</StyledLabel>
					{allSecondaryCategories.map((cat) => {
						const catStyle =
							(secondary.categoryStyles || {})[cat] || {};
						const hasOverride = Object.keys(catStyle).length > 0;
						return (
							<PanelBody
								key={cat}
								title={cat}
								initialOpen={false}
							>
								<PanelColorSettings
									__experimentalHasMultipleOrigins
									__experimentalIsRenderedInSidebar
									title={__('Colors')}
									initialOpen
									colorSettings={[
										{
											value: catStyle.fill ?? '',
											onChange: (value) =>
												updateCategoryStyle(cat, {
													fill: value ?? null,
												}),
											label: __(
												'Fill (empty = transparent)'
											),
										},
										{
											value: catStyle.stroke ?? '',
											onChange: (value) =>
												updateCategoryStyle(cat, {
													stroke: value ?? '',
												}),
											label: __('Stroke'),
										},
									]}
								/>
								<NumberControl
									label={__('Stroke Width')}
									value={catStyle.strokeWidth ?? ''}
									min={0}
									max={10}
									step={0.1}
									placeholder={String(
										secondary.strokeWidth ?? 0.5
									)}
									onChange={(value) =>
										updateCategoryStyle(cat, {
											strokeWidth:
												value !== '' &&
												value !== undefined
													? formatNum(value, 'float')
													: undefined,
										})
									}
								/>
								<RangeControl
									label={__('Opacity')}
									value={
										catStyle.opacity ??
										secondary.opacity ??
										0.4
									}
									min={0}
									max={1}
									step={0.05}
									withInputField
									onChange={(value) =>
										updateCategoryStyle(cat, {
											opacity: value,
										})
									}
								/>
								{hasOverride && (
									<Button
										variant="secondary"
										isDestructive
										onClick={() => resetCategoryStyle(cat)}
										style={{ marginTop: '8px' }}
									>
										{__('Reset to defaults')}
									</Button>
								)}
							</PanelBody>
						);
					})}
				</>
			)}
		</PanelBody>
	);
}

function DivergingBarPanel({ attributes, setAttributes, clientId }) {
	return (
		<>
			<DivergingBarControls
				attributes={attributes}
				setAttributes={setAttributes}
				clientId={clientId}
			/>
			<SecondaryOverlayControls
				attributes={attributes}
				setAttributes={setAttributes}
				clientId={clientId}
			/>
		</>
	);
}

export default DivergingBarPanel;
