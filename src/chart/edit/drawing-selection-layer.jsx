/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
/**
 * Drawing Selection Layer Component
 *
 * Provides interactive selection and manipulation of drawings in the editor.
 * Allows users to select, move, and resize drawings with drag handles.
 * For lines/arrows/lollipops, endpoint handles allow repositioning individual ends.
 * For angled mode, breakpoint handles allow repositioning intermediate points.
 */

import { useState, useRef } from '@wordpress/element';
import { createDrawingCoordTransform } from './utils/drawing-coord-transforms';
import {
	addBreakpoint,
	findClickedSegment,
	getDrawingBounds,
	isLineTypeDrawing,
	moveBend,
	moveBreakpoint,
	moveLineEndpoint,
	removeBreakpoint,
	resizeDrawing,
	translateDrawing,
} from './utils/drawing-manipulation';

/**
 * Line/Arrow/Lollipop handles component.
 * Includes endpoint handles, bend control (curved mode), and breakpoint handles (angled mode).
 *
 * @param {Object}   props                       - Component props
 * @param {Object}   props.drawing               - The line-type drawing
 * @param {Function} props.toDisplayCoords       - Coordinate conversion function
 * @param {Function} props.toRefCoords           - Inverse coordinate conversion
 * @param {Function} props.onEndpointDragStart   - Callback when endpoint dragging starts
 * @param {Function} props.onBendDragStart       - Callback when bend handle dragging starts
 * @param {Function} props.onBreakpointDragStart - Callback when breakpoint handle dragging starts
 * @param {Function} props.onAddBreakpoint       - Callback to add a breakpoint
 * @param {Function} props.onRemoveBreakpoint    - Callback to remove a breakpoint
 * @param {Function} props.onDelete              - Callback when delete is clicked
 */
function LineTypeHandles({
	drawing,
	toDisplayCoords,
	toRefCoords,
	onEndpointDragStart,
	onBendDragStart,
	onBreakpointDragStart,
	onAddBreakpoint,
	onRemoveBreakpoint,
	onDelete,
}) {
	const handleSize = 10;
	const start = toDisplayCoords(drawing.x1, drawing.y1);
	const end = toDisplayCoords(drawing.x2, drawing.y2);

	const isAngled =
		drawing.lineMode === 'angled' &&
		drawing.breakpoints &&
		drawing.breakpoints.length > 0;
	const isCurved =
		drawing.lineMode === 'curved' ||
		(drawing.bendX !== undefined && drawing.bendY !== undefined);

	// Breakpoints for angled mode
	const breakpoints = isAngled
		? drawing.breakpoints.map((bp) => toDisplayCoords(bp.x, bp.y))
		: [];

	// Bend point for curved mode
	let bendX = null;
	let bendY = null;
	if (isCurved) {
		bendX =
			drawing.bendX !== undefined
				? drawing.bendX
				: (drawing.x1 + drawing.x2) / 2;
		bendY =
			drawing.bendY !== undefined
				? drawing.bendY
				: (drawing.y1 + drawing.y2) / 2;
	}
	const bend = isCurved ? toDisplayCoords(bendX, bendY) : null;

	// Build path for visualization
	let pathD;
	if (isAngled) {
		pathD = `M ${start.x} ${start.y}`;
		for (const bp of breakpoints) {
			pathD += ` L ${bp.x} ${bp.y}`;
		}
		pathD += ` L ${end.x} ${end.y}`;
	} else if (isCurved && bend) {
		pathD = `M ${start.x} ${start.y} Q ${bend.x} ${bend.y} ${end.x} ${end.y}`;
	} else {
		pathD = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
	}

	/**
	 * Handle double-click on path to add breakpoint.
	 *
	 * @param {MouseEvent} e - The event
	 */
	function handlePathDoubleClick(e) {
		if (isCurved) {
			return; // Don't add breakpoints to curved lines
		}
		e.stopPropagation();
		const rect = e.currentTarget.ownerSVGElement.getBoundingClientRect();
		const displayX =
			e.clientX -
			rect.left -
			parseFloat(
				e.currentTarget
					.closest('g[transform]')
					?.getAttribute('transform')
					?.match(/translate\(([\d.]+)/)?.[1] || 0
			);
		const displayY =
			e.clientY -
			rect.top -
			parseFloat(
				e.currentTarget
					.closest('g[transform]')
					?.getAttribute('transform')
					?.match(/,\s*([\d.]+)/)?.[1] || 0
			);
		const refPos = toRefCoords(displayX, displayY);
		const segmentIdx = findClickedSegment(
			drawing,
			refPos.x,
			refPos.y,
			Infinity
		);
		if (segmentIdx !== null) {
			onAddBreakpoint(segmentIdx, refPos.x, refPos.y);
		}
	}

	return (
		<g className="drawing-line-handles">
			{/* Path visualization */}
			<path
				d={pathD}
				stroke="#0073aa"
				strokeWidth={1}
				strokeDasharray="4 2"
				fill="none"
				pointerEvents="stroke"
				style={{ cursor: 'crosshair', pointerEvents: 'auto' }}
				onDoubleClick={handlePathDoubleClick}
			/>

			{/* Control lines for curved mode */}
			{isCurved && bend && (
				<>
					<line
						x1={start.x}
						y1={start.y}
						x2={bend.x}
						y2={bend.y}
						stroke="#10b981"
						strokeWidth={1}
						strokeDasharray="2 2"
						opacity={0.6}
						pointerEvents="none"
					/>
					<line
						x1={bend.x}
						y1={bend.y}
						x2={end.x}
						y2={end.y}
						stroke="#10b981"
						strokeWidth={1}
						strokeDasharray="2 2"
						opacity={0.6}
						pointerEvents="none"
					/>
				</>
			)}

			{/* Start endpoint handle */}
			<circle
				cx={start.x}
				cy={start.y}
				r={handleSize / 2}
				fill="#0073aa"
				stroke="#fff"
				strokeWidth={2}
				style={{ cursor: 'move', pointerEvents: 'auto' }}
				onPointerDown={(e) => {
					e.stopPropagation();
					onEndpointDragStart(e, 'start');
				}}
			/>

			{/* End endpoint handle */}
			<circle
				cx={end.x}
				cy={end.y}
				r={handleSize / 2}
				fill="#0073aa"
				stroke="#fff"
				strokeWidth={2}
				style={{ cursor: 'move', pointerEvents: 'auto' }}
				onPointerDown={(e) => {
					e.stopPropagation();
					onEndpointDragStart(e, 'end');
				}}
			/>

			{/* Bend control point handle (curved mode) */}
			{isCurved && bend && (
				<circle
					cx={bend.x}
					cy={bend.y}
					r={handleSize / 2}
					fill="#10b981"
					stroke="#fff"
					strokeWidth={2}
					style={{ cursor: 'move', pointerEvents: 'auto' }}
					onPointerDown={(e) => {
						e.stopPropagation();
						onBendDragStart(e);
					}}
				/>
			)}

			{/* Breakpoint handles (angled mode) */}
			{isAngled &&
				breakpoints.map((bp, idx) => (
					<circle
						key={`bp-${idx}`}
						cx={bp.x}
						cy={bp.y}
						r={handleSize / 2}
						fill="#f59e0b"
						stroke="#fff"
						strokeWidth={2}
						style={{ cursor: 'move', pointerEvents: 'auto' }}
						onPointerDown={(e) => {
							e.stopPropagation();
							onBreakpointDragStart(e, idx);
						}}
						onDoubleClick={(e) => {
							e.stopPropagation();
							onRemoveBreakpoint(idx);
						}}
					/>
				))}

			{/* Delete button - positioned near the midpoint */}
			<g
				transform={`translate(${(start.x + end.x) / 2 + 15}, ${(start.y + end.y) / 2 - 15})`}
				style={{ cursor: 'pointer', pointerEvents: 'auto' }}
				onClick={(e) => {
					e.stopPropagation();
					onDelete();
				}}
			>
				<circle cx={0} cy={0} r={10} fill="#d63638" />
				<text
					x={0}
					y={4}
					textAnchor="middle"
					fill="#fff"
					fontSize={14}
					fontWeight="bold"
				>
					×
				</text>
			</g>
		</g>
	);
}

/**
 * Shape resize handles component (for circle, rect, path).
 *
 * @param {Object}   props                   - Component props
 * @param {Object}   props.bounds            - Bounding box of the selected drawing
 * @param {Function} props.onResizeDragStart - Callback when resize drag starts
 * @param {Function} props.onDelete          - Callback when delete is clicked
 */
function ShapeResizeHandles({ bounds, onResizeDragStart, onDelete }) {
	const handleSize = 8;
	const shapePadding = 4;

	const outerBounds = {
		x: bounds.x - shapePadding,
		y: bounds.y - shapePadding,
		width: bounds.width + shapePadding * 2,
		height: bounds.height + shapePadding * 2,
	};

	const corners = [
		{ id: 'nw', x: outerBounds.x, y: outerBounds.y, cursor: 'nwse-resize' },
		{
			id: 'ne',
			x: outerBounds.x + outerBounds.width,
			y: outerBounds.y,
			cursor: 'nesw-resize',
		},
		{
			id: 'sw',
			x: outerBounds.x,
			y: outerBounds.y + outerBounds.height,
			cursor: 'nesw-resize',
		},
		{
			id: 'se',
			x: outerBounds.x + outerBounds.width,
			y: outerBounds.y + outerBounds.height,
			cursor: 'nwse-resize',
		},
	];

	return (
		<g className="drawing-selection-handles">
			{/* Selection outline */}
			<rect
				x={outerBounds.x}
				y={outerBounds.y}
				width={outerBounds.width}
				height={outerBounds.height}
				fill="none"
				stroke="#0073aa"
				strokeWidth={1}
				strokeDasharray="4 2"
				pointerEvents="none"
			/>

			{/* Corner handles */}
			{corners.map((corner) => (
				<rect
					key={corner.id}
					x={corner.x - handleSize / 2}
					y={corner.y - handleSize / 2}
					width={handleSize}
					height={handleSize}
					fill="#0073aa"
					stroke="#fff"
					strokeWidth={1}
					style={{ cursor: corner.cursor, pointerEvents: 'auto' }}
					onPointerDown={(e) => {
						e.stopPropagation();
						onResizeDragStart(e, corner.id);
					}}
				/>
			))}

			{/* Delete button */}
			<g
				transform={`translate(${outerBounds.x + outerBounds.width + 12}, ${outerBounds.y - 8})`}
				style={{ cursor: 'pointer', pointerEvents: 'auto' }}
				onClick={(e) => {
					e.stopPropagation();
					onDelete();
				}}
			>
				<circle cx={0} cy={0} r={10} fill="#d63638" />
				<text
					x={0}
					y={4}
					textAnchor="middle"
					fill="#fff"
					fontSize={14}
					fontWeight="bold"
				>
					×
				</text>
			</g>
		</g>
	);
}

/**
 * Drawing Selection Layer Component.
 *
 * @param {Object}   props                   - Component props
 * @param {Array}    props.drawings          - Array of drawing objects
 * @param {Object}   props.chartDimensions   - Chart dimensions and padding
 * @param {number}   props.chartWidth        - Full chart width
 * @param {number}   props.chartHeight       - Full chart height
 * @param {Object}   props.layoutDimensions  - Reference layout dimensions for scaling
 * @param {Function} props.onDrawingsChange  - Callback when drawings are modified
 * @param {boolean}  props.isDrawingMode     - Whether drawing mode is active
 * @param {string}   props.selectedDrawingId - Controlled selected drawing ID (optional)
 * @param {Function} props.onSelectionChange - Callback when selection changes (optional)
 */
export function DrawingSelectionLayer({
	drawings = [],
	chartDimensions,
	chartWidth,
	chartHeight,
	layoutDimensions = null,
	onDrawingsChange,
	isDrawingMode = false,
	selectedDrawingId = null,
	onSelectionChange = null,
}) {
	const [internalSelectedId, setInternalSelectedId] = useState(null);
	const selectedId =
		onSelectionChange !== null ? selectedDrawingId : internalSelectedId;
	const setSelectedId = onSelectionChange || setInternalSelectedId;
	const [dragState, setDragState] = useState(null);
	const svgRef = useRef(null);

	// Panel-anchored drawings are handled in-chart for small multiples.
	const selectableDrawings = (drawings || []).filter((drawing) => {
		const context = drawing.positioningContext || 'inner';
		return context !== 'panel' && context !== 'panel-inner';
	});

	if (isDrawingMode || selectableDrawings.length === 0 || !chartDimensions) {
		return null;
	}

	const { width, height, padding } = chartDimensions;
	const effectiveChartWidth = chartWidth ?? width;
	const effectiveChartHeight = chartHeight ?? height;
	const innerWidth = effectiveChartWidth - padding.left - padding.right;
	const innerHeight = effectiveChartHeight - padding.top - padding.bottom;

	const refLayout = layoutDimensions || chartDimensions;
	const refInnerWidth =
		refLayout.width - refLayout.padding.left - refLayout.padding.right;
	const refInnerHeight =
		refLayout.height - refLayout.padding.top - refLayout.padding.bottom;

	const coordTransformOptions = {
		padding,
		chartWidth: effectiveChartWidth,
		chartHeight: effectiveChartHeight,
		layoutDimensions: refLayout,
	};

	function getCoordTransform(drawing) {
		return createDrawingCoordTransform(drawing, coordTransformOptions);
	}

	/**
	 * Scale coordinates from reference to display (inner chart area).
	 *
	 * @param {Object} drawing - Drawing whose positioning context defines the scale
	 * @param {number} x       - X in reference coordinates
	 * @param {number} y       - Y in reference coordinates
	 * @return {Object} Display coordinates
	 */
	function toDisplayCoordsForDrawing(drawing, x, y) {
		return getCoordTransform(drawing).toDisplayCoords(x, y);
	}

	/**
	 * Scale coordinates from display to reference.
	 *
	 * @param {Object} drawing - Drawing whose positioning context defines the scale
	 * @param {number} x       - X in display coordinates
	 * @param {number} y       - Y in display coordinates
	 * @return {Object} Reference coordinates
	 */
	function toRefCoordsForDrawing(drawing, x, y) {
		return getCoordTransform(drawing).toRefCoords(x, y);
	}

	/**
	 * Get display-scaled bounds for a drawing.
	 *
	 * @param {Object} drawing - The drawing
	 * @return {Object} Bounds in display coordinates
	 */
	function getDisplayBounds(drawing) {
		const toDisplayCoords = (x, y) =>
			toDisplayCoordsForDrawing(drawing, x, y);
		const refBounds = getDrawingBounds(drawing);
		const topLeft = toDisplayCoords(refBounds.x, refBounds.y);
		const bottomRight = toDisplayCoords(
			refBounds.x + refBounds.width,
			refBounds.y + refBounds.height
		);
		return {
			x: topLeft.x,
			y: topLeft.y,
			width: bottomRight.x - topLeft.x,
			height: bottomRight.y - topLeft.y,
		};
	}

	const selectedDrawing = selectableDrawings.find((d) => d.id === selectedId);
	const selectedBounds = selectedDrawing
		? getDisplayBounds(selectedDrawing)
		: null;
	const isLineType = isLineTypeDrawing(selectedDrawing);

	/**
	 * Get pointer position relative to inner chart area.
	 *
	 * @param {PointerEvent} event - The pointer event
	 * @return {Object} Position { x, y }
	 */
	function getPointerPosition(event) {
		const svg = svgRef.current || event.currentTarget;
		const rect = svg.getBoundingClientRect();
		return {
			x: event.clientX - rect.left - padding.left,
			y: event.clientY - rect.top - padding.top,
		};
	}

	/**
	 * Handle click on a drawing's hit area.
	 *
	 * @param {string} drawingId - ID of the clicked drawing
	 */
	function handleDrawingClick(drawingId) {
		setSelectedId(drawingId);
	}

	/**
	 * Handle delete of selected drawing.
	 */
	function handleDelete() {
		if (selectedId && onDrawingsChange) {
			onDrawingsChange(drawings.filter((d) => d.id !== selectedId));
			setSelectedId(null);
		}
	}

	/**
	 * Handle start of endpoint drag (for line-types).
	 *
	 * @param {PointerEvent} event    - The pointer event
	 * @param {string}       endpoint - 'start' or 'end'
	 */
	function handleEndpointDragStart(event, endpoint) {
		const pos = getPointerPosition(event);
		setDragState({
			type: 'endpoint',
			startPos: pos,
			endpoint,
		});
		if (svgRef.current) {
			svgRef.current.setPointerCapture(event.pointerId);
		}
	}

	/**
	 * Handle start of resize drag (for shapes).
	 *
	 * @param {PointerEvent} event  - The pointer event
	 * @param {string}       corner - 'nw', 'ne', 'sw', 'se'
	 */
	function handleResizeDragStart(event, corner) {
		const pos = getPointerPosition(event);
		setDragState({
			type: 'resize',
			startPos: pos,
			corner,
			originalBounds: selectedBounds,
		});
		if (svgRef.current) {
			svgRef.current.setPointerCapture(event.pointerId);
		}
	}

	/**
	 * Handle start of bend drag (for curved line-types).
	 *
	 * @param {PointerEvent} event - The pointer event
	 */
	function handleBendDragStart(event) {
		const pos = getPointerPosition(event);
		setDragState({
			type: 'bend',
			startPos: pos,
		});
		if (svgRef.current) {
			svgRef.current.setPointerCapture(event.pointerId);
		}
	}

	/**
	 * Handle start of breakpoint drag (for angled line-types).
	 *
	 * @param {PointerEvent} event         - The pointer event
	 * @param {number}       breakpointIdx - Index of the breakpoint
	 */
	function handleBreakpointDragStart(event, breakpointIdx) {
		const pos = getPointerPosition(event);
		setDragState({
			type: 'breakpoint',
			startPos: pos,
			breakpointIdx,
		});
		if (svgRef.current) {
			svgRef.current.setPointerCapture(event.pointerId);
		}
	}

	/**
	 * Handle adding a breakpoint.
	 *
	 * @param {number} segmentIdx - Segment index where to add
	 * @param {number} x          - X coordinate
	 * @param {number} y          - Y coordinate
	 */
	function handleAddBreakpoint(segmentIdx, x, y) {
		if (!selectedId || !onDrawingsChange) {
			return;
		}
		const updatedDrawings = drawings.map((d) => {
			if (d.id !== selectedId) {
				return d;
			}
			return addBreakpoint(d, segmentIdx, x, y);
		});
		onDrawingsChange(updatedDrawings);
	}

	/**
	 * Handle removing a breakpoint.
	 *
	 * @param {number} breakpointIdx - Index of breakpoint to remove
	 */
	function handleRemoveBreakpoint(breakpointIdx) {
		if (!selectedId || !onDrawingsChange) {
			return;
		}
		const updatedDrawings = drawings.map((d) => {
			if (d.id !== selectedId) {
				return d;
			}
			return removeBreakpoint(d, breakpointIdx);
		});
		onDrawingsChange(updatedDrawings);
	}

	/**
	 * Handle start of move drag (for entire shape).
	 *
	 * @param {PointerEvent} event - The pointer event
	 */
	function handleMoveDragStart(event) {
		if (!selectedId) {
			return;
		}
		if (dragState) {
			return;
		}
		const pos = getPointerPosition(event);
		setDragState({
			type: 'move',
			startPos: pos,
		});
		if (svgRef.current) {
			svgRef.current.setPointerCapture(event.pointerId);
		}
	}

	/**
	 * Handle pointer move during drag.
	 *
	 * @param {PointerEvent} event - The pointer event
	 */
	function handlePointerMove(event) {
		if (
			!dragState ||
			!selectedId ||
			!selectedDrawing ||
			!onDrawingsChange
		) {
			return;
		}

		const pos = getPointerPosition(event);
		const refPos = toRefCoordsForDrawing(selectedDrawing, pos.x, pos.y);

		const updatedDrawings = drawings.map((d) => {
			if (d.id !== selectedId) {
				return d;
			}

			if (dragState.type === 'endpoint') {
				return moveLineEndpoint(
					d,
					dragState.endpoint,
					refPos.x,
					refPos.y
				);
			}

			if (dragState.type === 'resize') {
				return resizeDrawing(d, dragState.corner, refPos.x, refPos.y);
			}

			if (dragState.type === 'bend') {
				return moveBend(d, refPos.x, refPos.y);
			}

			if (dragState.type === 'breakpoint') {
				return moveBreakpoint(
					d,
					dragState.breakpointIdx,
					refPos.x,
					refPos.y
				);
			}

			if (dragState.type === 'move') {
				const displayDx = pos.x - dragState.startPos.x;
				const displayDy = pos.y - dragState.startPos.y;
				const refDelta = toRefCoordsForDrawing(
					selectedDrawing,
					displayDx,
					displayDy
				);
				const refOffset = toRefCoordsForDrawing(selectedDrawing, 0, 0);
				const dx = refDelta.x - refOffset.x;
				const dy = refDelta.y - refOffset.y;

				setDragState({
					...dragState,
					startPos: pos,
				});

				return translateDrawing(d, dx, dy);
			}

			return d;
		});

		onDrawingsChange(updatedDrawings);
	}

	/**
	 * Handle pointer up - end drag.
	 */
	function handlePointerUp() {
		setDragState(null);
	}

	return (
		<svg
			ref={svgRef}
			width={effectiveChartWidth}
			height={effectiveChartHeight}
			style={{
				position: 'absolute',
				top: 0,
				left: 0,
				pointerEvents: 'none',
				zIndex: 99,
			}}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
		>
			{/* Background rect for deselecting - only when a drawing is selected */}
			{selectedId && (
				<rect
					x={0}
					y={0}
					width={effectiveChartWidth}
					height={effectiveChartHeight}
					fill="transparent"
					style={{ pointerEvents: 'auto' }}
					onClick={() => setSelectedId(null)}
				/>
			)}

			<g transform={`translate(${padding.left}, ${padding.top})`}>
				{/* Invisible hit areas for each drawing */}
				{selectableDrawings.map((drawing) => {
					const bounds = getDisplayBounds(drawing);
					const hitPadding = 8;
					const isSelected = selectedId === drawing.id;
					return (
						<rect
							key={`hit-${drawing.id}`}
							x={bounds.x - hitPadding}
							y={bounds.y - hitPadding}
							width={bounds.width + hitPadding * 2}
							height={bounds.height + hitPadding * 2}
							fill="transparent"
							style={{
								cursor: isSelected ? 'move' : 'pointer',
								pointerEvents: 'auto',
							}}
							onClick={(e) => {
								e.stopPropagation();
								handleDrawingClick(drawing.id);
							}}
							onPointerDown={(e) => {
								if (isSelected) {
									handleMoveDragStart(e);
								}
							}}
						/>
					);
				})}

				{/* Selection handles for selected drawing */}
				{selectedId && selectedDrawing && (
					<>
						{isLineType ? (
							<LineTypeHandles
								drawing={selectedDrawing}
								toDisplayCoords={(x, y) =>
									toDisplayCoordsForDrawing(
										selectedDrawing,
										x,
										y
									)
								}
								toRefCoords={(x, y) =>
									toRefCoordsForDrawing(selectedDrawing, x, y)
								}
								onEndpointDragStart={handleEndpointDragStart}
								onBendDragStart={handleBendDragStart}
								onBreakpointDragStart={
									handleBreakpointDragStart
								}
								onAddBreakpoint={handleAddBreakpoint}
								onRemoveBreakpoint={handleRemoveBreakpoint}
								onDelete={handleDelete}
							/>
						) : (
							selectedBounds && (
								<ShapeResizeHandles
									bounds={selectedBounds}
									onResizeDragStart={handleResizeDragStart}
									onDelete={handleDelete}
								/>
							)
						)}
					</>
				)}
			</g>
		</svg>
	);
}
