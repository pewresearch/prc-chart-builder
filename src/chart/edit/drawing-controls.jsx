/**
 * Drawing Controls Component
 *
 * Provides UI controls for drawing on charts in the editor.
 */

import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	PanelRow,
	Button,
	ButtonGroup,
	RangeControl,
} from '@wordpress/components';
import { PanelColorSettings } from '@wordpress/block-editor';

/**
 * Drawing Controls Component
 *
 * EXPERIMENTAL FEATURE - Not ready for production use
 *
 * @param {Object}   props                     - Component props
 * @param {Object}   props.attributes          - Block attributes
 * @param {Function} props.setAttributes       - Function to update block attributes
 * @param {Function} props.onDrawingModeChange - Callback when drawing mode changes
 * @param {string}   props.drawingTool         - Current drawing tool
 * @param {Function} props.onToolChange        - Callback when tool changes
 * @param {boolean}  props.isDrawingMode       - Whether drawing mode is active
 * @param {string}   props.strokeColor         - Current stroke color
 * @param {number}   props.strokeWidth         - Current stroke width
 * @param {Function} props.onStrokeColorChange - Callback when stroke color changes
 * @param {Function} props.onStrokeWidthChange - Callback when stroke width changes
 */
export default function DrawingControls({
	attributes,
	setAttributes,
	onDrawingModeChange,
	drawingTool = 'pen',
	onToolChange,
	isDrawingMode = false,
	strokeColor = '#000000',
	strokeWidth = 2,
	onStrokeColorChange,
	onStrokeWidthChange,
}) {
	const drawings = attributes?.drawings || [];
	function handleToggleDrawingMode() {
		const newMode = !isDrawingMode;
		if (onDrawingModeChange) {
			onDrawingModeChange(newMode);
		}
	}

	function handleToolChange(tool) {
		if (onToolChange) {
			onToolChange(tool);
		}
	}

	function handleClearDrawings() {
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
		}
	}

	function handleDeleteDrawing(drawingId) {
		const updatedDrawings = drawings.filter((d) => d.id !== drawingId);
		setAttributes({ drawings: updatedDrawings });
	}

	return (
		<PanelBody
			title={__('Drawing Tools (Experimental)', 'prc-chart-builder')}
			initialOpen={false}
		>
			<PanelRow>
				<p
					style={{
						fontSize: '12px',
						color: '#d63638',
						fontWeight: 'bold',
						marginBottom: '8px',
					}}
				>
					{__(
						'⚠️ EXPERIMENTAL FEATURE: This feature is still in development and may have issues.',
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
					<PanelRow>
						<ButtonGroup>
							<Button
								variant={
									drawingTool === 'pen'
										? 'primary'
										: 'secondary'
								}
								onClick={() => handleToolChange('pen')}
							>
								{__('Pen', 'prc-chart-builder')}
							</Button>
							<Button
								variant={
									drawingTool === 'circle'
										? 'primary'
										: 'secondary'
								}
								onClick={() => handleToolChange('circle')}
							>
								{__('Circle', 'prc-chart-builder')}
							</Button>
							<Button
								variant={
									drawingTool === 'arrow'
										? 'primary'
										: 'secondary'
								}
								onClick={() => handleToolChange('arrow')}
							>
								{__('Arrow', 'prc-chart-builder')}
							</Button>
						</ButtonGroup>
					</PanelRow>

					<PanelRow>
						<p style={{ fontSize: '12px', color: '#757575' }}>
							{__(
								'Click and drag on the chart to draw. Drawings are saved automatically.',
								'prc-chart-builder'
							)}
						</p>
					</PanelRow>

					<PanelRow>
						<RangeControl
							label={__('Stroke Width', 'prc-chart-builder')}
							value={strokeWidth}
							onChange={(value) => {
								if (onStrokeWidthChange) {
									onStrokeWidthChange(value);
								}
							}}
							min={1}
							max={10}
						/>
					</PanelRow>

					<PanelRow>
						<PanelColorSettings
							__experimentalHasMultipleOrigins
							__experimentalIsRenderedInSidebar
							title={__('Stroke Color', 'prc-chart-builder')}
							colorSettings={[
								{
									value: strokeColor,
									onChange: (value) => {
										if (onStrokeColorChange) {
											onStrokeColorChange(value);
										}
									},
									label: __(
										'Stroke Color',
										'prc-chart-builder'
									),
								},
							]}
						/>
					</PanelRow>
				</>
			)}

			{drawings && drawings.length > 0 && (
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
					{drawings.map((drawing, index) => {
						let drawingTypeLabel = __(
							'Drawing',
							'prc-chart-builder'
						);
						if (drawing.type === 'circle') {
							drawingTypeLabel = __(
								'Circle',
								'prc-chart-builder'
							);
						} else if (drawing.type === 'path') {
							if (
								drawing.d?.includes('M') &&
								drawing.d?.includes('L')
							) {
								drawingTypeLabel =
									drawing.d.split('M').length > 2
										? __('Arrow', 'prc-chart-builder')
										: __('Pen', 'prc-chart-builder');
							} else {
								drawingTypeLabel = __(
									'Path',
									'prc-chart-builder'
								);
							}
						}

						return (
							<PanelRow key={drawing.id || index}>
								<div
									style={{
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
										width: '100%',
										padding: '8px',
										border: '1px solid #ddd',
										borderRadius: '4px',
										marginBottom: '4px',
									}}
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
												backgroundColor:
													drawing.stroke || '#000000',
												border: '1px solid #ccc',
											}}
										/>
										<span style={{ fontSize: '12px' }}>
											{drawingTypeLabel}
										</span>
									</div>
									<Button
										variant="secondary"
										isDestructive
										isSmall
										onClick={() => {
											handleDeleteDrawing(drawing.id);
										}}
									>
										{__('Delete', 'prc-chart-builder')}
									</Button>
								</div>
							</PanelRow>
						);
					})}
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
