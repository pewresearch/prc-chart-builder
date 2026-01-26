/**
 * Drawing Overlay Component
 *
 * EXPERIMENTAL FEATURE - Not ready for production use
 *
 * Renders an interactive drawing layer on top of the chart in the editor.
 * Allows users to draw freehand paths, circles, and arrows on charts.
 * Only used in the editor - drawings are rendered separately on frontend.
 */

import { useRef, useState } from '@wordpress/element';

/**
 * Drawing Overlay Component
 *
 * @param {Object} props
 * @param {boolean} props.isActive - Whether drawing mode is active
 * @param {string} props.tool - Current drawing tool ('pen', 'circle', 'arrow')
 * @param {Function} props.onDrawingComplete - Callback when a drawing is completed
 * @param {Object} props.chartDimensions - Chart dimensions and padding
 * @param {number} props.chartWidth - Full chart width
 * @param {number} props.chartHeight - Full chart height
 */
export function DrawingOverlay({
	isActive,
	tool = 'pen',
	onDrawingComplete,
	chartDimensions,
	chartWidth,
	chartHeight,
	strokeColor = '#000000',
	strokeWidth = 2,
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

	/**
	 * Get SVG coordinates from mouse/touch event
	 * Returns coordinates relative to the inner chart area (accounting for padding)
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
	 * Handle mouse/touch down - start drawing
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
	 * Handle mouse/touch move - update drawing
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
	 * Handle mouse/touch up - complete drawing
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

		if (tool === 'pen') {
			// Create SVG path from points
			if (currentPath.length < 2) {
				setIsDrawing(false);
				setCurrentPath([]);
				return;
			}

			const pathData =
				`M ${currentPath[0].x} ${currentPath[0].y} ` +
				currentPath
					.slice(1)
					.map((p) => `L ${p.x} ${p.y}`)
					.join(' ');

			drawingData = {
				type: 'path',
				d: pathData,
				stroke: strokeColor,
				strokeWidth: strokeWidth,
				fill: 'none',
				id: `drawing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
			const radius = Math.sqrt(dx * dx + dy * dy);

			drawingData = {
				type: 'circle',
				cx: start.x,
				cy: start.y,
				r: radius,
				stroke: strokeColor,
				strokeWidth: strokeWidth,
				fill: 'none',
				id: `drawing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			};
		} else if (tool === 'arrow') {
			if (currentPath.length < 2) {
				setIsDrawing(false);
				setCurrentPath([]);
				return;
			}

			const [start, end] = currentPath;
			const dx = end.x - start.x;
			const dy = end.y - start.y;
			const angle = Math.atan2(dy, dx);

			// Arrow head size
			const arrowLength = 10;
			const arrowAngle = Math.PI / 6; // 30 degrees

			// Calculate arrow head points
			const arrowHead1 = {
				x: end.x - arrowLength * Math.cos(angle - arrowAngle),
				y: end.y - arrowLength * Math.sin(angle - arrowAngle),
			};
			const arrowHead2 = {
				x: end.x - arrowLength * Math.cos(angle + arrowAngle),
				y: end.y - arrowLength * Math.sin(angle + arrowAngle),
			};

			// Create path with arrow head
			const pathData = `M ${start.x} ${start.y} L ${end.x} ${end.y} M ${end.x} ${end.y} L ${arrowHead1.x} ${arrowHead1.y} M ${end.x} ${end.y} L ${arrowHead2.x} ${arrowHead2.y}`;

			drawingData = {
				type: 'path',
				d: pathData,
				stroke: strokeColor,
				strokeWidth: strokeWidth,
				fill: 'none',
				id: `drawing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
					opacity={0.7}
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
					opacity={0.7}
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
					opacity={0.7}
				/>
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
