/* eslint-disable max-lines-per-function */
/**
 * Drawing Overlay Component
 *
 * Renders an interactive drawing layer on top of the chart in the editor.
 * Allows users to draw freehand paths, circles, arrows, lines, and rectangles.
 * Only used in the editor - drawings are rendered via DrawingsLayer on frontend.
 *
 * Coordinates are stored at reference layout dimensions (same as annotations)
 * for proper responsive scaling when the chart resizes.
 */

import { useRef, useState } from '@wordpress/element';

/**
 * Drawing Overlay Component
 *
 * @param {Object}   props                   - Component props
 * @param {boolean}  props.isActive          - Whether drawing mode is active
 * @param {string}   props.tool              - Current drawing tool ('pen', 'circle', 'arrow', 'line', 'lollipop', 'rect')
 * @param {Function} props.onDrawingComplete - Callback when a drawing is completed
 * @param {Object}   props.chartDimensions   - Chart dimensions and padding
 * @param {number}   props.chartWidth        - Full chart width
 * @param {number}   props.chartHeight       - Full chart height
 * @param {string}   props.strokeColor       - Stroke color for drawings
 * @param {number}   props.strokeWidth       - Stroke width for drawings
 * @param {Object}   props.layoutDimensions  - Reference layout dimensions for coordinate storage
 */
export function DrawingOverlay({
	isActive,
	tool = 'pen',
	onDrawingComplete,
	chartDimensions,
	chartWidth,
	chartHeight,
	strokeColor = '#000000',
	strokeWidth = 1,
	layoutDimensions = null,
}) {
	const svgRef = useRef(null);
	const [isDrawing, setIsDrawing] = useState(false);
	const [currentPath, setCurrentPath] = useState([]);
	const [startPoint, setStartPoint] = useState(null);

	if (!isActive || !chartDimensions) {
		return null;
	}

	const { width, height, padding } = chartDimensions;
	const innerWidth = width - padding.left - padding.right;
	const innerHeight = height - padding.top - padding.bottom;

	// Reference layout dimensions (for storing coordinates)
	// Fall back to current dimensions if not provided
	const refLayout = layoutDimensions || { width, height, padding };
	const refInnerWidth =
		refLayout.width - refLayout.padding.left - refLayout.padding.right;
	const refInnerHeight =
		refLayout.height - refLayout.padding.top - refLayout.padding.bottom;

	/**
	 * Convert display coordinates to reference layout coordinates.
	 * This ensures drawings scale properly when chart resizes.
	 *
	 * @param {number} displayX - X coordinate in display space
	 * @param {number} displayY - Y coordinate in display space
	 * @return {Object} Coordinates in reference layout space
	 */
	function toRefCoords(displayX, displayY) {
		return {
			x: (displayX * refInnerWidth) / innerWidth,
			y: (displayY * refInnerHeight) / innerHeight,
		};
	}

	/**
	 * Get SVG coordinates from mouse/touch event.
	 * Returns coordinates relative to the inner chart area (accounting for padding).
	 *
	 * @param {PointerEvent} event - The pointer event
	 * @return {Object|null} SVG coordinates or null if unavailable
	 */
	function getSVGPoint(event) {
		if (!svgRef.current) {
			return null;
		}

		const svg = svgRef.current;
		const rect = svg.getBoundingClientRect();

		// Get coordinates relative to SVG
		const svgX = event.clientX - rect.left;
		const svgY = event.clientY - rect.top;

		// Convert to coordinates relative to inner chart area (subtract padding)
		return {
			x: svgX - padding.left,
			y: svgY - padding.top,
		};
	}

	/**
	 * Handle mouse/touch down - start drawing.
	 *
	 * @param {PointerEvent} event - The pointer event
	 */
	function handlePointerDown(event) {
		if (!isActive) {
			return;
		}

		event.preventDefault();
		const point = getSVGPoint(event);
		if (!point) {
			return;
		}

		setIsDrawing(true);
		setStartPoint(point);

		if (tool === 'pen') {
			setCurrentPath([point]);
		} else {
			// For circle and arrow, store start point
			setCurrentPath([point]);
		}
	}

	/**
	 * Handle mouse/touch move - update drawing.
	 *
	 * @param {PointerEvent} event - The pointer event
	 */
	function handlePointerMove(event) {
		if (!isDrawing || !isActive) {
			return;
		}

		event.preventDefault();
		const point = getSVGPoint(event);
		if (!point) {
			return;
		}

		if (tool === 'pen') {
			setCurrentPath((prev) => [...prev, point]);
		} else {
			// For circle and arrow, update end point
			setCurrentPath([startPoint, point]);
		}
	}

	/**
	 * Handle mouse/touch up - complete drawing.
	 * Coordinates are converted to reference layout dimensions for storage.
	 *
	 * @param {PointerEvent} event - The pointer event
	 */
	function handlePointerUp(event) {
		if (!isDrawing) {
			return;
		}

		event.preventDefault();

		if (currentPath.length === 0) {
			setIsDrawing(false);
			return;
		}

		let drawingData = null;
		const drawingId = `drawing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

		if (tool === 'pen') {
			// Create SVG path from points (converted to reference coordinates)
			if (currentPath.length < 2) {
				setIsDrawing(false);
				setCurrentPath([]);
				return;
			}

			// Convert all points to reference coordinates
			const refPath = currentPath.map((p) => toRefCoords(p.x, p.y));
			const pathData =
				`M ${refPath[0].x} ${refPath[0].y} ` +
				refPath
					.slice(1)
					.map((p) => `L ${p.x} ${p.y}`)
					.join(' ');

			drawingData = {
				type: 'path',
				d: pathData,
				stroke: strokeColor,
				strokeWidth,
				fill: 'none',
				id: drawingId,
				positioningContext: 'inner',
			};
		} else if (tool === 'circle') {
			if (currentPath.length < 2) {
				setIsDrawing(false);
				setCurrentPath([]);
				return;
			}

			const [start, end] = currentPath;
			const dx = end.x - start.x;
			const dy = end.y - start.y;
			const displayRadius = Math.sqrt(dx * dx + dy * dy);

			// Convert center to reference coordinates
			const refCenter = toRefCoords(start.x, start.y);
			// Scale radius to reference dimensions (use average scale factor)
			const refRadius = (displayRadius * refInnerWidth) / innerWidth;

			drawingData = {
				type: 'circle',
				cx: refCenter.x,
				cy: refCenter.y,
				r: refRadius,
				stroke: strokeColor,
				strokeWidth,
				fill: 'none',
				id: drawingId,
				positioningContext: 'inner',
			};
		} else if (tool === 'arrow') {
			if (currentPath.length < 2) {
				setIsDrawing(false);
				setCurrentPath([]);
				return;
			}

			const [start, end] = currentPath;
			// Convert to reference coordinates
			const refStart = toRefCoords(start.x, start.y);
			const refEnd = toRefCoords(end.x, end.y);

			drawingData = {
				type: 'arrow',
				x1: refStart.x,
				y1: refStart.y,
				x2: refEnd.x,
				y2: refEnd.y,
				arrowSize: 10,
				stroke: strokeColor,
				strokeWidth,
				fill: 'none',
				id: drawingId,
				positioningContext: 'inner',
			};
		} else if (tool === 'line') {
			if (currentPath.length < 2) {
				setIsDrawing(false);
				setCurrentPath([]);
				return;
			}

			const [start, end] = currentPath;
			// Convert to reference coordinates
			const refStart = toRefCoords(start.x, start.y);
			const refEnd = toRefCoords(end.x, end.y);

			drawingData = {
				type: 'line',
				x1: refStart.x,
				y1: refStart.y,
				x2: refEnd.x,
				y2: refEnd.y,
				stroke: strokeColor,
				strokeWidth,
				id: drawingId,
				positioningContext: 'inner',
			};
		} else if (tool === 'rect') {
			if (currentPath.length < 2) {
				setIsDrawing(false);
				setCurrentPath([]);
				return;
			}

			const [start, end] = currentPath;
			// Convert to reference coordinates
			const refStart = toRefCoords(start.x, start.y);
			const refEnd = toRefCoords(end.x, end.y);

			// Calculate top-left corner and dimensions
			const x = Math.min(refStart.x, refEnd.x);
			const y = Math.min(refStart.y, refEnd.y);
			const rectWidth = Math.abs(refEnd.x - refStart.x);
			const rectHeight = Math.abs(refEnd.y - refStart.y);

			drawingData = {
				type: 'rect',
				x,
				y,
				width: rectWidth,
				height: rectHeight,
				stroke: strokeColor,
				strokeWidth,
				fill: 'none',
				id: drawingId,
				positioningContext: 'inner',
			};
		} else if (tool === 'lollipop') {
			if (currentPath.length < 2) {
				setIsDrawing(false);
				setCurrentPath([]);
				return;
			}

			const [start, end] = currentPath;
			// Convert to reference coordinates
			const refStart = toRefCoords(start.x, start.y);
			const refEnd = toRefCoords(end.x, end.y);

			drawingData = {
				type: 'lollipop',
				x1: refStart.x,
				y1: refStart.y,
				x2: refEnd.x,
				y2: refEnd.y,
				dotRadius: 4,
				stroke: strokeColor,
				strokeWidth,
				id: drawingId,
				positioningContext: 'inner',
			};
		}

		if (drawingData && onDrawingComplete) {
			onDrawingComplete(drawingData);
		}

		setIsDrawing(false);
		setCurrentPath([]);
		setStartPoint(null);
	}

	// Handle pointer events leaving the SVG
	function handlePointerLeave() {
		if (isDrawing) {
			handlePointerUp(new Event('pointerup'));
		}
	}

	// Render current drawing preview
	function renderCurrentDrawing() {
		if (currentPath.length === 0) {
			return null;
		}

		const previewOpacity = 0.7;

		if (tool === 'pen') {
			if (currentPath.length < 2) {
				return null;
			}
			const pathData =
				`M ${currentPath[0].x} ${currentPath[0].y} ` +
				currentPath
					.slice(1)
					.map((p) => `L ${p.x} ${p.y}`)
					.join(' ');
			return (
				<path
					d={pathData}
					stroke={strokeColor}
					strokeWidth={strokeWidth}
					fill="none"
					opacity={previewOpacity}
				/>
			);
		}

		if (tool === 'circle') {
			if (currentPath.length < 2) {
				return null;
			}
			const [start, end] = currentPath;
			const dx = end.x - start.x;
			const dy = end.y - start.y;
			const radius = Math.sqrt(dx * dx + dy * dy);
			return (
				<circle
					cx={start.x}
					cy={start.y}
					r={radius}
					stroke={strokeColor}
					strokeWidth={strokeWidth}
					fill="none"
					opacity={previewOpacity}
				/>
			);
		}

		if (tool === 'arrow') {
			if (currentPath.length < 2) {
				return null;
			}
			const [start, end] = currentPath;
			const dx = end.x - start.x;
			const dy = end.y - start.y;
			const angle = Math.atan2(dy, dx);
			const arrowLength = 10;
			const arrowAngle = Math.PI / 6;

			const arrowHead1 = {
				x: end.x - arrowLength * Math.cos(angle - arrowAngle),
				y: end.y - arrowLength * Math.sin(angle - arrowAngle),
			};
			const arrowHead2 = {
				x: end.x - arrowLength * Math.cos(angle + arrowAngle),
				y: end.y - arrowLength * Math.sin(angle + arrowAngle),
			};

			const pathData = `M ${start.x} ${start.y} L ${end.x} ${end.y} M ${end.x} ${end.y} L ${arrowHead1.x} ${arrowHead1.y} M ${end.x} ${end.y} L ${arrowHead2.x} ${arrowHead2.y}`;

			return (
				<path
					d={pathData}
					stroke={strokeColor}
					strokeWidth={strokeWidth}
					fill="none"
					opacity={previewOpacity}
				/>
			);
		}

		if (tool === 'line') {
			if (currentPath.length < 2) {
				return null;
			}
			const [start, end] = currentPath;
			return (
				<line
					x1={start.x}
					y1={start.y}
					x2={end.x}
					y2={end.y}
					stroke={strokeColor}
					strokeWidth={strokeWidth}
					opacity={previewOpacity}
				/>
			);
		}

		if (tool === 'rect') {
			if (currentPath.length < 2) {
				return null;
			}
			const [start, end] = currentPath;
			const x = Math.min(start.x, end.x);
			const y = Math.min(start.y, end.y);
			const rectWidth = Math.abs(end.x - start.x);
			const rectHeight = Math.abs(end.y - start.y);
			return (
				<rect
					x={x}
					y={y}
					width={rectWidth}
					height={rectHeight}
					stroke={strokeColor}
					strokeWidth={strokeWidth}
					fill="none"
					opacity={previewOpacity}
				/>
			);
		}

		if (tool === 'lollipop') {
			if (currentPath.length < 2) {
				return null;
			}
			const [start, end] = currentPath;
			const dotRadius = 4;
			return (
				<>
					<line
						x1={start.x}
						y1={start.y}
						x2={end.x}
						y2={end.y}
						stroke={strokeColor}
						strokeWidth={strokeWidth}
						strokeLinecap="round"
						opacity={previewOpacity}
					/>
					<circle
						cx={end.x}
						cy={end.y}
						r={dotRadius}
						fill={strokeColor}
						opacity={previewOpacity}
					/>
				</>
			);
		}

		return null;
	}

	return (
		<div
			style={{
				position: 'absolute',
				top: 0,
				left: 0,
				width: '100%',
				height: '100%',
				pointerEvents: isActive ? 'auto' : 'none',
				zIndex: 1000,
				cursor: isActive ? 'crosshair' : 'default',
			}}
		>
			<svg
				ref={svgRef}
				width={chartWidth}
				height={chartHeight}
				style={{
					position: 'absolute',
					top: 0,
					left: 0,
					pointerEvents: isActive ? 'auto' : 'none',
				}}
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
				onPointerLeave={handlePointerLeave}
			>
				<g transform={`translate(${padding.left}, ${padding.top})`}>
					{renderCurrentDrawing()}
				</g>
			</svg>
		</div>
	);
}
