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
	TextControl,
	__experimentalNumberControl as NumberControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	ToggleControl,
} from '@wordpress/components';
import { PanelColorSettings } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { formatNum } from '../utils/helpers';

const WidePanelItem = styled(ToolsPanelItem)`
	grid-column: span 2;
`;

function MapControls({ attributes, setAttributes, clientId }) {
	const {
		chartType,
		mapShowCountyBoundaries,
		mapShowStateBoundaries,
		mapPathBackgroundFill,
		mapPathStroke,
		mapBlockRectSize,
	} = attributes;
	return (
		<PanelBody title={__('Map')} initialOpen={false}>
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
					label={__('Boundaries')}
					isShownByDefault
					panelId={clientId}
				>
					{'map-usa-county' === chartType && (
						<>
							<ToggleControl
								label={__('Show State Boundaries')}
								checked={mapShowStateBoundaries}
								onChange={() =>
									setAttributes({
										mapShowStateBoundaries:
											!mapShowStateBoundaries,
									})
								}
								help={__(
									'If active, the map will show state boundaries. This is only available for the US country map.'
								)}
							/>
							<ToggleControl
								label={__('Show County Boundaries')}
								checked={mapShowCountyBoundaries}
								onChange={() =>
									setAttributes({
										mapShowCountyBoundaries:
											!mapShowCountyBoundaries,
									})
								}
								help={__(
									'If active, the map will show county boundaries. This is only available for the US country map.'
								)}
							/>
						</>
					)}
					<PanelColorSettings
						__experimentalHasMultipleOrigins
						__experimentalIsRenderedInSidebar
						title={__('Map Styles')}
						initialOpen
						colorSettings={[
							{
								value: mapPathBackgroundFill,
								onChange: (value) =>
									setAttributes({
										mapPathBackgroundFill: value,
									}),
								label: __('Background Fill'),
							},
							{
								value: mapPathStroke,
								onChange: (value) =>
									setAttributes({
										mapPathStroke: value,
									}),
								label: __('Stroke'),
							},
						]}
					/>
				</WidePanelItem>
				{/* TODO: this doesn't quite work yet */}
				{/* {'map-usa-block' === chartType && (
					<WidePanelItem
						hasValue={() => true}
						label={__('Block Size')}
						isShownByDefault
						panelId={clientId}
					>
						<NumberControl
							label={__('State Block Size')}
							value={mapBlockRectSize}
							onChange={(value) =>
								setAttributes({
									mapBlockRectSize: formatNum(
										value,
										'integer'
									),
								})
							}
							min={1}
							step={1}
						/>
					</WidePanelItem>
				)} */}
			</ToolsPanel>
		</PanelBody>
	);
}

export default MapControls;
