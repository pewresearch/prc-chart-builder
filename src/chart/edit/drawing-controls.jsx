/* eslint-disable @wordpress/i18n-no-flanking-whitespace */
/* eslint-disable @wordpress/i18n-no-variables */
/**
 * Drawing Controls Component
 *
 * Provides UI controls for drawing on charts in the editor.
 * Supports line, arrow, lollipop, circle, rectangle, and freehand pen tools.
 */

import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	PanelRow,
	Button,
	ButtonGroup,
	RangeControl,
	SelectControl,
} from '@wordpress/components';
import { PanelColorSettings } from '@wordpress/block-editor';
import { getSmallMultiplesPanelKeys } from './popover/utils';
import { repositionDrawingToContext } from './utils/panel-anchor';

// Stroke dash array presets
const DASH_PRESETS = [
	{ label: __('Solid', 'prc-chart-builder'), value: '' },
	{ label: __('Dashed', 'prc-chart-builder'), value: '8 4' },
	{ label: __('Dotted', 'prc-chart-builder'), value: '2 4' },
	{ label: __('Dash-Dot', 'prc-chart-builder'), value: '8 4 2 4' },
	{ label: __('Long Dash', 'prc-chart-builder'), value: '16 8' },
];

/**
 * Check if a drawing type is a shape (circle, rect) that supports fill.
 *
 * @param {string} type - The drawing type
 * @return {boolean} True if shape type
 */
function isShapeType(type) {
	return ['circle', 'rect'].includes(type);
}

/**
 * Check if a drawing type is a line type (supports line modes).
 *
 * @param {string} type - The drawing type
 * @return {boolean} True if line type
 */
function isLineType(type) {
	return ['line', 'arrow', 'lollipop'].includes(type);
}

// Line mode presets
const LINE_MODE_OPTIONS = [
	{ label: __('Straight', 'prc-chart-builder'), value: 'straight' },
	{ label: __('Curved', 'prc-chart-builder'), value: 'curved' },
	{ label: __('Angled', 'prc-chart-builder'), value: 'angled' },
];

/**
 * Get a human-readable label for a drawing type.
 *
 * @param {Object} drawing - The drawing object
 * @return {string} The type label
 */
function getDrawingTypeLabel(drawing) {
	switch (drawing.type) {
		case 'line':
			return __('Line', 'prc-chart-builder');
		case 'arrow':
			return __('Arrow', 'prc-chart-builder');
		case 'lollipop':
			return __('Lollipop', 'prc-chart-builder');
		case 'circle':
			return __('Circle', 'prc-chart-builder');
		case 'rect':
			return __('Rectangle', 'prc-chart-builder');
		case 'path':
			return __('Pen', 'prc-chart-builder');
		default:
			return __('Drawing', 'prc-chart-builder');
	}
}

/**
 * Get variant for tool button.
 *
 * @param {string} currentTool - Currently selected tool
 * @param {string} buttonTool  - Tool this button represents
 * @return {string} Button variant
 */
function getToolVariant(currentTool, buttonTool) {
	return currentTool === buttonTool ? 'primary' : 'secondary';
}

/**
 * Drawing mode tool buttons.
 *
 * @param {Object}   props              - Component props
 * @param {string}   props.drawingTool  - Current tool
 * @param {Function} props.onToolChange - Callback when tool changes
 */
function DrawingModeTools({ drawingTool, onToolChange }) {
	const lineTools = ['line', 'arrow', 'lollipop'];
	// TODO: let's disable the pen tool for now. might be too much for users.
	// const shapeTools = ['circle', 'rect', 'pen'];
	const shapeTools = ['circle', 'rect'];

	return (
		<PanelRow>
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					gap: '8px',
					width: '100%',
				}}
			>
				<ButtonGroup style={{ display: 'flex', flexWrap: 'wrap' }}>
					{lineTools.map((tool) => (
						<Button
							key={tool}
							variant={getToolVariant(drawingTool, tool)}
							onClick={() => onToolChange(tool)}
							title={__(
								tool.charAt(0).toUpperCase() + tool.slice(1),
								'prc-chart-builder'
							)}
							size="compact"
						>
							{__(
								tool.charAt(0).toUpperCase() + tool.slice(1),
								'prc-chart-builder'
							)}
						</Button>
					))}
				</ButtonGroup>
				<ButtonGroup style={{ display: 'flex', flexWrap: 'wrap' }}>
					{shapeTools.map((tool) => (
						<Button
							key={tool}
							variant={getToolVariant(drawingTool, tool)}
							onClick={() => onToolChange(tool)}
							title={__(
								tool.charAt(0).toUpperCase() + tool.slice(1),
								'prc-chart-builder'
							)}
							size="compact"
						>
							{__(
								tool.charAt(0).toUpperCase() + tool.slice(1),
								'prc-chart-builder'
							)}
						</Button>
					))}
				</ButtonGroup>
			</div>
		</PanelRow>
	);
}

/**
 * Single drawing list item.
 *
 * @param {Object}   props            - Component props
 * @param {Object}   props.drawing    - The drawing object
 * @param {boolean}  props.isSelected - Whether this drawing is selected
 * @param {Function} props.onDelete   - Callback to delete
 * @param {Function} props.onSelect   - Callback to select
 */
function DrawingListItem({ drawing, isSelected, onDelete, onSelect }) {
	const borderStyle = isSelected ? '2px solid #0073aa' : '1px solid #ddd';
	const backgroundColor = isSelected ? '#f0f7fc' : 'transparent';

	return (
		<PanelRow>
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					width: '100%',
					padding: '8px',
					border: borderStyle,
					borderRadius: '4px',
					marginBottom: '4px',
					cursor: 'pointer',
					backgroundColor,
				}}
				onClick={() => onSelect(drawing.id)}
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						onSelect(drawing.id);
					}
				}}
				role="button"
				tabIndex={0}
			>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
					}}
				>
					<div
						style={{
							width: '20px',
							height: '20px',
							borderRadius: '50%',
							backgroundColor: drawing.stroke || '#000000',
							border: '1px solid #ccc',
						}}
					/>
					<span style={{ fontSize: '12px' }}>
						{getDrawingTypeLabel(drawing)}
					</span>
				</div>
				<Button
					variant="secondary"
					isDestructive
					isSmall
					onClick={(e) => {
						e.stopPropagation();
						onDelete(drawing.id);
					}}
				>
					{__('Delete', 'prc-chart-builder')}
				</Button>
			</div>
		</PanelRow>
	);
}

/**
 * Style controls for a selected drawing.
 *
 * @param {Object}   props            - Component props
 * @param {Object}   props.drawing    - The selected drawing
 * @param {Function} props.onUpdate   - Callback to update drawing properties
 * @param {string[]} props.panelKeys  - Small-multiples panel keys (optional)
 * @param {Object|null} props.smDrawingGeometry - Live SM panel geometry
 */
function SelectedDrawingStyles({
	drawing,
	onUpdate,
	panelKeys = [],
	smDrawingGeometry = null,
}) {
	const isShape = isShapeType(drawing.type);
	const isLine = isLineType(drawing.type);
	const isLollipop = drawing.type === 'lollipop';
	const hasPanelKeys = Array.isArray(panelKeys) && panelKeys.length > 0;
	const isPanelContext = (ctx) => ctx === 'panel' || ctx === 'panel-inner';

	function handlePositioningContextChange(value) {
		if (!isPanelContext(value)) {
			if (smDrawingGeometry) {
				onUpdate(
					repositionDrawingToContext(
						drawing,
						smDrawingGeometry,
						value,
						null,
						{ useDesignGeometry: false }
					)
				);
				return;
			}
			onUpdate({ positioningContext: value, panelKey: '' });
			return;
		}
		const panelKey = drawing.panelKey || String(panelKeys[0] || '');
		if (smDrawingGeometry) {
			onUpdate(
				repositionDrawingToContext(
					drawing,
					smDrawingGeometry,
					value,
					panelKey,
					{ useDesignGeometry: false }
				)
			);
			return;
		}
		onUpdate({
			positioningContext: value,
			panelKey,
		});
	}

	function handlePanelKeyChange(value) {
		if (!smDrawingGeometry || !isPanelContext(drawing.positioningContext)) {
			onUpdate({ panelKey: value });
			return;
		}
		onUpdate(
			repositionDrawingToContext(
				drawing,
				smDrawingGeometry,
				drawing.positioningContext || 'panel-inner',
				value,
				{ useDesignGeometry: false }
			)
		);
	}

	const opacityValue = drawing.opacity !== undefined ? drawing.opacity : 1;
	const fillOpacityValue =
		drawing.fillOpacity !== undefined ? drawing.fillOpacity : 1;

	/**
	 * Handle line mode change - reset mode-specific properties.
	 *
	 * @param {string} newMode - The new line mode
	 */
	function handleLineModeChange(newMode) {
		const updates = { lineMode: newMode };

		// Reset mode-specific properties when switching modes
		if (newMode === 'straight') {
			// Clear both bend and breakpoints
			updates.bendX = undefined;
			updates.bendY = undefined;
			updates.breakpoints = undefined;
		} else if (newMode === 'curved') {
			// Clear breakpoints, set default bend to midpoint
			updates.breakpoints = undefined;
			if (drawing.bendX === undefined) {
				updates.bendX = (drawing.x1 + drawing.x2) / 2;
				updates.bendY = (drawing.y1 + drawing.y2) / 2;
			}
		} else if (newMode === 'angled') {
			// Clear bend point, initialize empty breakpoints
			updates.bendX = undefined;
			updates.bendY = undefined;
			if (!drawing.breakpoints || drawing.breakpoints.length === 0) {
				// Add a default midpoint breakpoint
				updates.breakpoints = [
					{
						x: (drawing.x1 + drawing.x2) / 2,
						y: (drawing.y1 + drawing.y2) / 2,
					},
				];
			}
		}

		onUpdate(updates);
	}

	// Determine current line mode
	let currentLineMode = drawing.lineMode || 'straight';
	if (!drawing.lineMode) {
		// Infer mode from existing properties
		if (drawing.breakpoints && drawing.breakpoints.length > 0) {
			currentLineMode = 'angled';
		} else if (drawing.bendX !== undefined && drawing.bendY !== undefined) {
			currentLineMode = 'curved';
		}
	}

	return (
		<>
			<PanelRow>
				<p
					style={{
						fontSize: '12px',
						fontWeight: 'bold',
						marginBottom: '4px',
						color: '#0073aa',
					}}
				>
					{__('Selected:', 'prc-chart-builder')}{' '}
					{getDrawingTypeLabel(drawing)}
				</p>
			</PanelRow>

			{hasPanelKeys && (
				<>
					<SelectControl
						label={__('Positioning Context', 'prc-chart-builder')}
						value={drawing.positioningContext || 'inner'}
						options={[
							{
								label: __(
									'Full Chart Area',
									'prc-chart-builder'
								),
								value: 'chart',
							},
							{
								label: __(
									'Data Area (Inner)',
									'prc-chart-builder'
								),
								value: 'inner',
							},
							{
								label: __(
									'Panel (full cell)',
									'prc-chart-builder'
								),
								value: 'panel',
							},
							{
								label: __(
									'Panel data area',
									'prc-chart-builder'
								),
								value: 'panel-inner',
							},
						]}
						onChange={handlePositioningContextChange}
						help={__(
							'Panel data area stays glued to the cell on restack. New drawings auto-anchor here.',
							'prc-chart-builder'
						)}
					/>
					{isPanelContext(drawing.positioningContext) && (
						<SelectControl
							label={__('Panel', 'prc-chart-builder')}
							value={drawing.panelKey || String(panelKeys[0])}
							options={panelKeys.map((key) => ({
								label: String(key),
								value: String(key),
							}))}
							onChange={handlePanelKeyChange}
						/>
					)}
				</>
			)}

			{isLine && (
				<SelectControl
					label={__('Line Mode', 'prc-chart-builder')}
					value={currentLineMode}
					options={LINE_MODE_OPTIONS}
					onChange={handleLineModeChange}
					help={
						currentLineMode === 'curved'
							? __(
									'Drag the green handle to adjust curve',
									'prc-chart-builder'
								)
							: currentLineMode === 'angled'
								? __(
										'Double-click line to add points, double-click points to remove',
										'prc-chart-builder'
									)
								: null
					}
				/>
			)}

			<RangeControl
				label={__('Stroke Width', 'prc-chart-builder')}
				value={drawing.strokeWidth || 1}
				onChange={(value) => onUpdate({ strokeWidth: value })}
				min={1}
				max={10}
			/>

			<SelectControl
				label={__('Stroke Style', 'prc-chart-builder')}
				value={drawing.strokeDasharray || ''}
				options={DASH_PRESETS}
				onChange={(value) => onUpdate({ strokeDasharray: value })}
			/>

			<RangeControl
				label={__('Opacity', 'prc-chart-builder')}
				value={opacityValue}
				onChange={(value) => onUpdate({ opacity: value })}
				min={0}
				max={1}
				step={0.1}
			/>

			{isLollipop && (
				<RangeControl
					label={__('Dot Size', 'prc-chart-builder')}
					value={drawing.dotRadius || 4}
					onChange={(value) => onUpdate({ dotRadius: value })}
					min={2}
					max={20}
				/>
			)}

			<PanelColorSettings
				__experimentalHasMultipleOrigins
				__experimentalIsRenderedInSidebar
				title={__('Stroke Color', 'prc-chart-builder')}
				initialOpen
				colorSettings={[
					{
						value: drawing.stroke,
						onChange: (value) => onUpdate({ stroke: value ?? '' }),
						label: __('Stroke Color', 'prc-chart-builder'),
					},
				]}
			/>

			{isShape && (
				<>
					<PanelColorSettings
						__experimentalHasMultipleOrigins
						__experimentalIsRenderedInSidebar
						title={__('Fill Color', 'prc-chart-builder')}
						initialOpen={false}
						colorSettings={[
							{
								value: drawing.fill || 'transparent',
								onChange: (value) =>
									onUpdate({ fill: value ?? '' }),
								label: __('Fill Color', 'prc-chart-builder'),
							},
						]}
					/>
					<RangeControl
						label={__('Fill Opacity', 'prc-chart-builder')}
						value={fillOpacityValue}
						onChange={(value) => onUpdate({ fillOpacity: value })}
						min={0}
						max={1}
						step={0.1}
					/>
				</>
			)}
		</>
	);
}

/**
 * Drawing Controls Component.
 *
 * @param {Object}   props                         - Component props
 * @param {Object}   props.attributes              - Block attributes
 * @param {Function} props.setAttributes           - Set attributes function
 * @param {Function} props.onDrawingModeChange     - Toggle drawing mode
 * @param {string}   props.drawingTool             - Current drawing tool
 * @param {Function} props.onToolChange            - Change tool callback
 * @param {boolean}  props.isDrawingMode           - Whether drawing mode is active
 * @param {string}   props.strokeColor             - Default stroke color
 * @param {number}   props.strokeWidth             - Default stroke width
 * @param {Function} props.onStrokeColorChange     - Change default stroke color
 * @param {Function} props.onStrokeWidthChange     - Change default stroke width
 * @param {string}   props.selectedDrawingId       - Currently selected drawing ID
 * @param {Function} props.onSelectedDrawingChange - Change selected drawing
 * @param {Object|null} props.smDrawingGeometry    - Live SM panel geometry
 */
export default function DrawingControls({
	attributes,
	setAttributes,
	onDrawingModeChange,
	drawingTool = 'pen',
	onToolChange,
	isDrawingMode = false,
	strokeColor = '#000000',
	strokeWidth = 1,
	onStrokeColorChange,
	onStrokeWidthChange,
	selectedDrawingId = null,
	onSelectedDrawingChange = null,
	smDrawingGeometry = null,
}) {
	const drawings = attributes?.drawings || [];
	const layoutType = attributes?.layout?.type;
	const panelKeys =
		layoutType === 'small-multiples'
			? getSmallMultiplesPanelKeys(attributes)
			: [];
	const selectedDrawing = selectedDrawingId
		? drawings.find((d) => d.id === selectedDrawingId)
		: null;

	function handleToggleDrawingMode() {
		if (onDrawingModeChange) {
			onDrawingModeChange(!isDrawingMode);
		}
	}

	function handleClearDrawings() {
		// eslint-disable-next-line no-alert
		if (
			// eslint-disable-next-line no-alert
			window.confirm(
				__(
					'Are you sure you want to clear all drawings?',
					'prc-chart-builder'
				)
			)
		) {
			setAttributes({ drawings: [] });
			if (onSelectedDrawingChange) {
				onSelectedDrawingChange(null);
			}
		}
	}

	function handleDeleteDrawing(drawingId) {
		const updatedDrawings = drawings.filter((d) => d.id !== drawingId);
		setAttributes({ drawings: updatedDrawings });
		if (selectedDrawingId === drawingId && onSelectedDrawingChange) {
			onSelectedDrawingChange(null);
		}
	}

	function handleUpdateDrawing(drawingId, updates) {
		const updatedDrawings = drawings.map((d) =>
			d.id === drawingId ? { ...d, ...updates } : d
		);
		setAttributes({ drawings: updatedDrawings });
	}

	function handleSelectDrawing(drawingId) {
		if (onSelectedDrawingChange) {
			onSelectedDrawingChange(drawingId);
		}
	}

	function handleDeselectDrawing() {
		if (onSelectedDrawingChange) {
			onSelectedDrawingChange(null);
		}
	}

	return (
		<PanelBody
			title={__('Drawing Tools (Experimental)', 'prc-chart-builder')}
			initialOpen={false}
		>
			<PanelRow>
				<p style={{ color: 'red', fontWeight: 'bold' }}>
					{__(
						'Drawing tools are extremely experimental and may not behave as expected. Use at your own risk.',
						'prc-chart-builder'
					)}
				</p>
			</PanelRow>
			<PanelRow>
				<Button
					variant={isDrawingMode ? 'primary' : 'secondary'}
					onClick={handleToggleDrawingMode}
				>
					{isDrawingMode
						? __('Exit Drawing Mode', 'prc-chart-builder')
						: __('Enable Drawing Mode', 'prc-chart-builder')}
				</Button>
			</PanelRow>

			{isDrawingMode && (
				<>
					<DrawingModeTools
						drawingTool={drawingTool}
						onToolChange={onToolChange}
					/>
					<PanelRow>
						<p style={{ fontSize: '12px', color: '#757575' }}>
							{__(
								'Click and drag on the chart to draw. Double-click on a line segment to add a breakpoint (angled mode).',
								'prc-chart-builder'
							)}
						</p>
					</PanelRow>
					<RangeControl
						label={__('Stroke Width', 'prc-chart-builder')}
						value={strokeWidth}
						onChange={onStrokeWidthChange}
						min={1}
						max={10}
					/>
					<PanelColorSettings
						__experimentalHasMultipleOrigins
						__experimentalIsRenderedInSidebar
						title={__('Stroke Color', 'prc-chart-builder')}
						initialOpen
						colorSettings={[
							{
								value: strokeColor,
								onChange: onStrokeColorChange,
								label: __('Stroke Color', 'prc-chart-builder'),
							},
						]}
					/>
				</>
			)}

			{selectedDrawing && !isDrawingMode && (
				<>
					<SelectedDrawingStyles
						drawing={selectedDrawing}
						panelKeys={panelKeys}
						smDrawingGeometry={smDrawingGeometry}
						onUpdate={(updates) =>
							handleUpdateDrawing(selectedDrawingId, updates)
						}
					/>
					<PanelRow>
						<Button variant="link" onClick={handleDeselectDrawing}>
							{__('Deselect', 'prc-chart-builder')}
						</Button>
					</PanelRow>
				</>
			)}

			{drawings.length > 0 && (
				<>
					<PanelRow>
						<p
							style={{
								fontSize: '12px',
								fontWeight: 'bold',
								marginBottom: '8px',
							}}
						>
							{__('Drawings', 'prc-chart-builder')} (
							{drawings.length})
						</p>
					</PanelRow>
					{drawings.map((drawing) => (
						<DrawingListItem
							key={drawing.id}
							drawing={drawing}
							isSelected={selectedDrawingId === drawing.id}
							onDelete={handleDeleteDrawing}
							onSelect={handleSelectDrawing}
						/>
					))}
					<PanelRow>
						<Button
							variant="secondary"
							isDestructive
							onClick={handleClearDrawings}
						>
							{__('Clear All Drawings', 'prc-chart-builder')}
						</Button>
					</PanelRow>
				</>
			)}
		</PanelBody>
	);
}
