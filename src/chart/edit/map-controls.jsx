/* eslint-disable max-lines */
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
	SelectControl,
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
import { useViewportAttributes } from './use-viewport-attributes';

const WidePanelItem = styled(ToolsPanelItem)`
	grid-column: span 2;
`;

// Map projection presets
const MAP_PROJECTION_PRESETS = {
	default: {
		label: 'Default (World)',
		centerLongitude: 0,
		centerLatitude: 0,
		rotateLambda: 0,
		rotatePhi: 0,
		rotateGamma: 0,
		customScale: 1,
	},
	europe: {
		label: 'Europe',
		centerLongitude: 15,
		centerLatitude: 50,
		rotateLambda: 0,
		rotatePhi: 0,
		rotateGamma: 0,
		customScale: 3,
	},
	asia: {
		label: 'Asia',
		centerLongitude: 90,
		centerLatitude: 35,
		rotateLambda: 0,
		rotatePhi: 0,
		rotateGamma: 0,
		customScale: 2,
	},
	'east-asia': {
		label: 'East Asia',
		centerLongitude: 120,
		centerLatitude: 35,
		rotateLambda: 0,
		rotatePhi: 0,
		rotateGamma: 0,
		customScale: 3,
	},
	'south-asia': {
		label: 'South Asia',
		centerLongitude: 80,
		centerLatitude: 20,
		rotateLambda: 0,
		rotatePhi: 0,
		rotateGamma: 0,
		customScale: 3,
	},
	'southeast-asia': {
		label: 'Southeast Asia',
		centerLongitude: 110,
		centerLatitude: 5,
		rotateLambda: 0,
		rotatePhi: 0,
		rotateGamma: 0,
		customScale: 3.5,
	},
	'middle-east': {
		label: 'Middle East',
		centerLongitude: 45,
		centerLatitude: 30,
		rotateLambda: 0,
		rotatePhi: 0,
		rotateGamma: 0,
		customScale: 3.5,
	},
	africa: {
		label: 'Africa',
		centerLongitude: 20,
		centerLatitude: 0,
		rotateLambda: 0,
		rotatePhi: 0,
		rotateGamma: 0,
		customScale: 2,
	},
	'north-africa': {
		label: 'North Africa',
		centerLongitude: 15,
		centerLatitude: 25,
		rotateLambda: 0,
		rotatePhi: 0,
		rotateGamma: 0,
		customScale: 3,
	},
	'sub-saharan-africa': {
		label: 'Sub-Saharan Africa',
		centerLongitude: 20,
		centerLatitude: -5,
		rotateLambda: 0,
		rotatePhi: 0,
		rotateGamma: 0,
		customScale: 2.5,
	},
	'north-america': {
		label: 'North America',
		centerLongitude: -100,
		centerLatitude: 45,
		rotateLambda: 0,
		rotatePhi: 0,
		rotateGamma: 0,
		customScale: 2,
	},
	'central-america': {
		label: 'Central America & Caribbean',
		centerLongitude: -80,
		centerLatitude: 15,
		rotateLambda: 0,
		rotatePhi: 0,
		rotateGamma: 0,
		customScale: 4,
	},
	'south-america': {
		label: 'South America',
		centerLongitude: -60,
		centerLatitude: -15,
		rotateLambda: 0,
		rotatePhi: 0,
		rotateGamma: 0,
		customScale: 2.5,
	},
	oceania: {
		label: 'Oceania',
		centerLongitude: 140,
		centerLatitude: -25,
		rotateLambda: 0,
		rotatePhi: 0,
		rotateGamma: 0,
		customScale: 3,
	},
	custom: {
		label: 'Custom',
		centerLongitude: 0,
		centerLatitude: 0,
		rotateLambda: 0,
		rotatePhi: 0,
		rotateGamma: 0,
		customScale: 1,
	},
};

function MapControls({ attributes, setAttributes, clientId }) {
	// Viewport-aware attribute management
	const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
		attributes,
		setAttributes
	);

	const layout = getCurrentValue('layout') || {};
	const { type: chartType } = layout;

	// Handler for preset selection
	const handlePresetChange = (presetKey) => {
		const preset = MAP_PROJECTION_PRESETS[presetKey];
		if (!preset) return;

		// If custom is selected, don't change the projection values
		if (presetKey === 'custom') {
			updateAttributeForDevice('map', {
				projectionPreset: 'custom',
			});
			return;
		}

		// Apply preset values AND set topology region to match (viewport-aware)
		updateAttributeForDevice('map', {
			projectionPreset: presetKey,
			topologyRegion: presetKey,
			centerLongitude: preset.centerLongitude,
			centerLatitude: preset.centerLatitude,
			rotateLambda: preset.rotateLambda,
			rotatePhi: preset.rotatePhi,
			rotateGamma: preset.rotateGamma,
			customScale: preset.customScale,
		});
	};
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
					{'map-usa-counties' === chartType && (
						<>
							<ToggleControl
								label={__('Show State Boundaries')}
								checked={getCurrentValue(
									'map',
									'showStateBoundaries'
								)}
								onChange={(newValue) =>
									updateAttributeForDevice('map', {
										showStateBoundaries: newValue,
									})
								}
								help={__(
									'If active, the map will show state boundaries. This is only available for the US country map.'
								)}
							/>
							<ToggleControl
								label={__('Show County Boundaries')}
								checked={getCurrentValue(
									'map',
									'showCountyBoundaries'
								)}
								onChange={(newValue) =>
									updateAttributeForDevice('map', {
										showCountyBoundaries: newValue,
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
								value: getCurrentValue(
									'map',
									'pathBackgroundFill'
								),
								onChange: (value) =>
									updateAttributeForDevice('map', {
										pathBackgroundFill: value ?? '',
									}),
								label: __('Background Fill'),
							},
							{
								value: getCurrentValue('map', 'pathStroke'),
								onChange: (value) =>
									updateAttributeForDevice('map', {
										pathStroke: value ?? '',
									}),
								label: __('Stroke'),
							},
						]}
					/>
					<NumberControl
						label={__('Stroke Width')}
						value={getCurrentValue('map', 'pathStrokeWidth')}
						onChange={(value) =>
							updateAttributeForDevice('map', {
								pathStrokeWidth: formatNum(value, 'float'),
							})
						}
						min={0.1}
						max={10}
						step={0.1}
					/>
				</WidePanelItem>
				{/* Projection Controls - for World Map */}
				{'map-world' === chartType && (
					<>
						<WidePanelItem
							hasValue={() => true}
							label={__('Region Preset')}
							isShownByDefault={true}
							panelId={clientId}
						>
							<SelectControl
								label={__('Select Region')}
								value={
									getCurrentValue(
										'map',
										'projectionPreset'
									) || 'default'
								}
								options={Object.entries(
									MAP_PROJECTION_PRESETS
								).map(([key, value]) => ({
									label: value.label,
									value: key,
								}))}
								onChange={handlePresetChange}
								help={__(
									'Choose a region preset or select "Custom" to manually adjust projection settings.'
								)}
							/>
						</WidePanelItem>
						<WidePanelItem
							hasValue={() => true}
							label={__('Projection View Controls')}
							isShownByDefault={false}
							panelId={clientId}
						>
							<p
								style={{
									fontSize: '12px',
									marginBottom: '12px',
									color: '#757575',
								}}
							>
								{__(
									'Adjust the map view to focus on specific regions. Use center to position, rotate to orient, and scale to zoom.'
								)}
							</p>
							<NumberControl
								label={__('Center Longitude')}
								value={getCurrentValue(
									'map',
									'centerLongitude'
								)}
								onChange={(value) =>
									updateAttributeForDevice('map', {
										projectionPreset: 'custom',
										centerLongitude: formatNum(
											value,
											'float'
										),
									})
								}
								min={-180}
								max={180}
								step={1}
								help={__(
									'Longitude: -180 to 180 (0 = Prime Meridian)'
								)}
							/>
							<NumberControl
								label={__('Center Latitude')}
								value={getCurrentValue('map', 'centerLatitude')}
								onChange={(value) =>
									updateAttributeForDevice('map', {
										projectionPreset: 'custom',
										centerLatitude: formatNum(
											value,
											'float'
										),
									})
								}
								min={-90}
								max={90}
								step={1}
								help={__('Latitude: -90 to 90 (0 = Equator)')}
							/>
						</WidePanelItem>
						<WidePanelItem
							hasValue={() => true}
							label={__('Rotation Controls')}
							isShownByDefault={false}
							panelId={clientId}
						>
							<NumberControl
								label={__('Rotate Lambda (Yaw)')}
								value={getCurrentValue('map', 'rotateLambda')}
								onChange={(value) =>
									updateAttributeForDevice('map', {
										projectionPreset: 'custom',
										rotateLambda: formatNum(value, 'float'),
									})
								}
								min={-180}
								max={180}
								step={1}
								help={__(
									'Horizontal rotation around vertical axis'
								)}
							/>
							<NumberControl
								label={__('Rotate Phi (Pitch)')}
								value={getCurrentValue('map', 'rotatePhi')}
								onChange={(value) =>
									updateAttributeForDevice('map', {
										projectionPreset: 'custom',
										rotatePhi: formatNum(value, 'float'),
									})
								}
								min={-180}
								max={180}
								step={1}
								help={__(
									'Vertical rotation around horizontal axis'
								)}
							/>
							<NumberControl
								label={__('Rotate Gamma (Roll)')}
								value={getCurrentValue('map', 'rotateGamma')}
								onChange={(value) =>
									updateAttributeForDevice('map', {
										projectionPreset: 'custom',
										rotateGamma: formatNum(value, 'float'),
									})
								}
								min={-180}
								max={180}
								step={1}
								help={__('Axial rotation')}
							/>
						</WidePanelItem>
						<WidePanelItem
							hasValue={() => true}
							label={__('Scale Control')}
							isShownByDefault={false}
							panelId={clientId}
						>
							<NumberControl
								label={__('Custom Scale Multiplier')}
								value={getCurrentValue('map', 'customScale')}
								onChange={(value) =>
									updateAttributeForDevice('map', {
										projectionPreset: 'custom',
										customScale: formatNum(value, 'float'),
									})
								}
								min={0.1}
								max={10}
								step={0.1}
								help={__(
									'Scale multiplier: 1 = default, >1 = zoom in, <1 = zoom out'
								)}
							/>
						</WidePanelItem>
						<WidePanelItem
							hasValue={() => true}
							label={__('Interactive Zoom')}
							isShownByDefault={false}
							panelId={clientId}
						>
							<ToggleControl
								label={__('Enable Interactive Zoom')}
								checked={getCurrentValue('map', 'zoomActive')}
								onChange={(newValue) =>
									updateAttributeForDevice('map', {
										zoomActive: newValue,
									})
								}
								help={__(
									'Allow users to zoom and pan the map interactively'
								)}
							/>
						</WidePanelItem>
					</>
				)}
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
