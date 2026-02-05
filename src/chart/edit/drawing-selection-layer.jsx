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

/**
 * Check if a drawing is a line-type (line, arrow, or lollipop).
 *
 * @param {Object} drawing - The drawing object
 * @return {boolean} True if line-type
 */
function isLineTypeDrawing(drawing) {
	return ['line', 'arrow', 'lollipop'].includes(drawing?.type);
}

/**
 * Get bounding box for a drawing.
 *
 * @param {Object} drawing - The drawing object
 * @return {Object} Bounding box with x, y, width, height
 */
function getDrawingBounds(drawing) {
	switch (drawing.type) {
		case 'line':
		case 'arrow':
		case 'lollipop': {
			let minX = Math.min(drawing.x1, drawing.x2);
			let maxX = Math.max(drawing.x1, drawing.x2);
			let minY = Math.min(drawing.y1, drawing.y2);
			let maxY = Math.max(drawing.y1, drawing.y2);

			// Include breakpoints in bounds calculation
			if (drawing.breakpoints && drawing.breakpoints.length > 0) {
				for (const bp of drawing.breakpoints) {
					minX = Math.min(minX, bp.x);
					maxX = Math.max(maxX, bp.x);
					minY = Math.min(minY, bp.y);
					maxY = Math.max(maxY, bp.y);
				}
			}

			// Include bend point in bounds calculation
			if (drawing.bendX !== undefined && drawing.bendY !== undefined) {
				minX = Math.min(minX, drawing.bendX);
				maxX = Math.max(maxX, drawing.bendX);
				minY = Math.min(minY, drawing.bendY);
				maxY = Math.max(maxY, drawing.bendY);
			}

			return {
				x: minX,
				y: minY,
				width: maxX - minX || 10,
				height: maxY - minY || 10,
			};
		}
		case 'circle':
			return {
				x: drawing.cx - drawing.r,
				y: drawing.cy - drawing.r,
				width: drawing.r * 2,
				height: drawing.r * 2,
			};
		case 'rect':
			return {
				x: drawing.x,
				y: drawing.y,
				width: drawing.width,
				height: drawing.height,
			};
		case 'path': {
			const matches = drawing.d.matchAll(
				/([ML])\s*([\d.-]+)\s+([\d.-]+)/gi
			);
			let minX = Infinity;
			let maxX = -Infinity;
			let minY = Infinity;
			let maxY = -Infinity;

			for (const match of matches) {
				const x = parseFloat(match[2]);
				const y = parseFloat(match[3]);
				minX = Math.min(minX, x);
				maxX = Math.max(maxX, x);
				minY = Math.min(minY, y);
				maxY = Math.max(maxY, y);
			}

			if (minX === Infinity) {
				return { x: 0, y: 0, width: 20, height: 20 };
			}

			return {
				x: minX,
				y: minY,
				width: maxX - minX || 10,
				height: maxY - minY || 10,
			};
		}
		default:
			return { x: 0, y: 0, width: 20, height: 20 };
	}
}

/**
 * Transform a drawing by offset (move entire shape).
 *
 * @param {Object} drawing - The drawing object
 * @param {number} dx      - X offset
 * @param {number} dy      - Y offset
 * @return {Object} Transformed drawing
 */
function translateDrawing(drawing, dx, dy) {
	switch (drawing.type) {
		case 'line':
		case 'arrow':
		case 'lollipop': {
			const updated = {
				...drawing,
				x1: drawing.x1 + dx,
				y1: drawing.y1 + dy,
				x2: drawing.x2 + dx,
				y2: drawing.y2 + dy,
			};
			// Move bend point if present
			if (drawing.bendX !== undefined && drawing.bendY !== undefined) {
				updated.bendX = drawing.bendX + dx;
				updated.bendY = drawing.bendY + dy;
			}
			// Move breakpoints if present
			if (drawing.breakpoints && drawing.breakpoints.length > 0) {
				updated.breakpoints = drawing.breakpoints.map((bp) => ({
					x: bp.x + dx,
					y: bp.y + dy,
				}));
			}
			return updated;
		}
		case 'circle':
			return {
				...drawing,
				cx: drawing.cx + dx,
				cy: drawing.cy + dy,
			};
		case 'rect':
			return {
				...drawing,
				x: drawing.x + dx,
				y: drawing.y + dy,
			};
		case 'path': {
			const newD = drawing.d.replace(
				/([ML])\s*([\d.-]+)\s+([\d.-]+)/gi,
				(match, command, x, y) => {
					const newX = parseFloat(x) + dx;
					const newY = parseFloat(y) + dy;
					return `${command} ${newX} ${newY}`;
				}
			);
			return {
				...drawing,
				d: newD,
			};
		}
		default:
			return drawing;
	}
}

/**
 * Move a specific endpoint of a line-type drawing.
 *
 * @param {Object} drawing  - The drawing object
 * @param {string} endpoint - Which endpoint: 'start' or 'end'
 * @param {number} newX     - New X coordinate
 * @param {number} newY     - New Y coordinate
 * @return {Object} Updated drawing
 */
function moveLineEndpoint(drawing, endpoint, newX, newY) {
	if (endpoint === 'start') {
		return {
			...drawing,
			x1: newX,
			y1: newY,
		};
	}
	return {
		...drawing,
		x2: newX,
		y2: newY,
	};
}

/**
 * Move the bend control point of a line-type drawing.
 *
 * @param {Object} drawing - The drawing object
 * @param {number} newX    - New X coordinate for bend point
 * @param {number} newY    - New Y coordinate for bend point
 * @return {Object} Updated drawing with bend point
 */
function moveBend(drawing, newX, newY) {
	return {
		...drawing,
		bendX: newX,
		bendY: newY,
		lineMode: 'curved',
	};
}

/**
 * Move a specific breakpoint.
 *
 * @param {Object} drawing       - The drawing object
 * @param {number} breakpointIdx - Index of breakpoint to move
 * @param {number} newX          - New X coordinate
 * @param {number} newY          - New Y coordinate
 * @return {Object} Updated drawing
 */
function moveBreakpoint(drawing, breakpointIdx, newX, newY) {
	if (!drawing.breakpoints || breakpointIdx >= drawing.breakpoints.length) {
		return drawing;
	}
	const newBreakpoints = [...drawing.breakpoints];
	newBreakpoints[breakpointIdx] = { x: newX, y: newY };
	return {
		...drawing,
		breakpoints: newBreakpoints,
	};
}

/**
 * Add a breakpoint at a specific position.
 *
 * @param {Object} drawing  - The drawing object
 * @param {number} afterIdx - Index after which to insert (-1 for after start)
 * @param {number} x        - X coordinate
 * @param {number} y        - Y coordinate
 * @return {Object} Updated drawing
 */
function addBreakpoint(drawing, afterIdx, x, y) {
	const breakpoints = drawing.breakpoints || [];
	const newBreakpoints = [...breakpoints];
	newBreakpoints.splice(afterIdx + 1, 0, { x, y });
	return {
		...drawing,
		breakpoints: newBreakpoints,
		lineMode: 'angled',
	};
}

/**
 * Remove a breakpoint.
 *
 * @param {Object} drawing       - The drawing object
 * @param {number} breakpointIdx - Index of breakpoint to remove
 * @return {Object} Updated drawing
 */
function removeBreakpoint(drawing, breakpointIdx) {
	if (!drawing.breakpoints || breakpointIdx >= drawing.breakpoints.length) {
		return drawing;
	}
	const newBreakpoints = drawing.breakpoints.filter(
		(_, i) => i !== breakpointIdx
	);
	const updated = {
		...drawing,
		breakpoints: newBreakpoints,
	};
	// If no breakpoints left, switch back to straight mode
	if (newBreakpoints.length === 0) {
		updated.lineMode = 'straight';
		delete updated.breakpoints;
	}
	return updated;
}

/**
 * Resize a shape by moving a corner handle.
 *
 * @param {Object} drawing - The drawing object
 * @param {string} corner  - Which corner: 'nw', 'ne', 'sw', 'se'
 * @param {number} newX    - New X coordinate of corner
 * @param {number} newY    - New Y coordinate of corner
 * @return {Object} Updated drawing
 */
function resizeDrawing(drawing, corner, newX, newY) {
	switch (drawing.type) {
		case 'circle': {
			const cx = drawing.cx;
			const cy = drawing.cy;
			const dx = newX - cx;
			const dy = newY - cy;
			const newRadius = Math.max(5, Math.sqrt(dx * dx + dy * dy));
			return {
				...drawing,
				r: newRadius,
			};
		}
		case 'rect': {
			let x = drawing.x;
			let y = drawing.y;
			let width = drawing.width;
			let height = drawing.height;

			if (corner === 'nw') {
				width = drawing.x + drawing.width - newX;
				height = drawing.y + drawing.height - newY;
				x = newX;
				y = newY;
			} else if (corner === 'ne') {
				width = newX - drawing.x;
				height = drawing.y + drawing.height - newY;
				y = newY;
			} else if (corner === 'sw') {
				width = drawing.x + drawing.width - newX;
				height = newY - drawing.y;
				x = newX;
			} else if (corner === 'se') {
				width = newX - drawing.x;
				height = newY - drawing.y;
			}

			width = Math.max(10, width);
			height = Math.max(10, height);

			return {
				...drawing,
				x,
				y,
				width,
				height,
			};
		}
		default:
			return drawing;
	}
}

/**
 * Find which segment of a line was clicked (for adding breakpoints).
 *
 * @param {Object} drawing   - The line-type drawing
 * @param {number} clickX    - Click X in reference coordinates
 * @param {number} clickY    - Click Y in reference coordinates
 * @param {number} threshold - Distance threshold
 * @return {number} Segment index (-1 for start-to-first, 0+ for breakpoint segments)
 */
function findClickedSegment(drawing, clickX, clickY, threshold = 15) {
	const points = [
		{ x: drawing.x1, y: drawing.y1 },
		...(drawing.breakpoints || []),
		{ x: drawing.x2, y: drawing.y2 },
	];

	for (let i = 0; i < points.length - 1; i++) {
		const p1 = points[i];
		const p2 = points[i + 1];

		// Distance from point to line segment
		const dx = p2.x - p1.x;
		const dy = p2.y - p1.y;
		const lengthSq = dx * dx + dy * dy;

		if (lengthSq === 0) {
			continue;
		}

		let t = ((clickX - p1.x) * dx + (clickY - p1.y) * dy) / lengthSq;
		t = Math.max(0, Math.min(1, t));

		const closestX = p1.x + t * dx;
		const closestY = p1.y + t * dy;
		const distance = Math.sqrt(
			(clickX - closestX) ** 2 + (clickY - closestY) ** 2
		);

		if (distance < threshold) {
			return i - 1; // Return index relative to breakpoints array
		}
	}

	return null;
}

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

	if (
		isDrawingMode ||
		!drawings ||
		drawings.length === 0 ||
		!chartDimensions
	) {
		return null;
	}

	const { width, height, padding } = chartDimensions;
	const innerWidth = width - padding.left - padding.right;
	const innerHeight = height - padding.top - padding.bottom;

	const refLayout = layoutDimensions || chartDimensions;
	const refInnerWidth =
		refLayout.width - refLayout.padding.left - refLayout.padding.right;
	const refInnerHeight =
		refLayout.height - refLayout.padding.top - refLayout.padding.bottom;

	/**
	 * Scale coordinates from reference to display.
	 *
	 * @param {number} x - X in reference coordinates
	 * @param {number} y - Y in reference coordinates
	 * @return {Object} Display coordinates
	 */
	function toDisplayCoords(x, y) {
		return {
			x: (x * innerWidth) / refInnerWidth,
			y: (y * innerHeight) / refInnerHeight,
		};
	}

	/**
	 * Scale coordinates from display to reference.
	 *
	 * @param {number} x - X in display coordinates
	 * @param {number} y - Y in display coordinates
	 * @return {Object} Reference coordinates
	 */
	function toRefCoords(x, y) {
		return {
			x: (x * refInnerWidth) / innerWidth,
			y: (y * refInnerHeight) / innerHeight,
		};
	}

	/**
	 * Get display-scaled bounds for a drawing.
	 *
	 * @param {Object} drawing - The drawing
	 * @return {Object} Bounds in display coordinates
	 */
	function getDisplayBounds(drawing) {
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

	const selectedDrawing = drawings.find((d) => d.id === selectedId);
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
		if (!dragState || !selectedId || !onDrawingsChange) {
			return;
		}

		const pos = getPointerPosition(event);
		const refPos = toRefCoords(pos.x, pos.y);

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
				const refDelta = toRefCoords(displayDx, displayDy);
				const refOffset = toRefCoords(0, 0);
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
			width={chartWidth}
			height={chartHeight}
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
					width={chartWidth}
					height={chartHeight}
					fill="transparent"
					style={{ pointerEvents: 'auto' }}
					onClick={() => setSelectedId(null)}
				/>
			)}

			<g transform={`translate(${padding.left}, ${padding.top})`}>
				{/* Invisible hit areas for each drawing */}
				{drawings.map((drawing) => {
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
								toDisplayCoords={toDisplayCoords}
								toRefCoords={toRefCoords}
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
