/**
 * Drawing Layer Component
 *
 * Renders saved drawings on top of the chart in the editor.
 * Coordinates are scaled from reference layout dimensions to current display size.
 * This mirrors the DrawingsLayer component in @prc/charting-library.
 */

/**
 * Scale a coordinate from reference layout dimensions to current dimensions
 *
 * @param {number} value       - Value to scale
 * @param {number} width       - Current width
 * @param {number} layoutWidth - Reference width
 * @return {number} Scaled value
 */
function scaleX(value, width, layoutWidth) {
	return (value * width) / layoutWidth;
}

/**
 * Scale Y coordinate
 *
 * @param {number} value        - Value to scale
 * @param {number} height       - Current height
 * @param {number} layoutHeight - Reference height
 * @return {number} Scaled value
 */
function scaleY(value, height, layoutHeight) {
	return (value * height) / layoutHeight;
}

/**
 * Arrow marker component using SVG <marker> element.
 *
 * @param {Object} props       - Component props
 * @param {string} props.id    - Unique ID for the marker
 * @param {string} props.color - Fill color for the arrowhead
 */
function ArrowMarker({ id, color }) {
	return (
		<marker
			id={id}
			viewBox="0 0 10 10"
			refX="9"
			refY="5"
			markerWidth="6"
			markerHeight="6"
			orient="auto-start-reverse"
		>
			<path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
		</marker>
	);
}

/**
 * Lollipop marker component (circle at end of line)
 *
 * @param {Object} props        - Component props
 * @param {string} props.id     - Unique ID for the marker
 * @param {string} props.color  - Fill color for the dot
 * @param {number} props.radius - Radius of the dot
 */
function LollipopMarker({ id, color, radius }) {
	return (
		<marker
			id={id}
			viewBox="-10 -10 20 20"
			refX="0"
			refY="0"
			markerWidth={radius * 2}
			markerHeight={radius * 2}
			orient="auto"
		>
			<circle cx="0" cy="0" r="6" fill={color} />
		</marker>
	);
}

/**
 * Build a path string for a line with optional curve or breakpoints.
 *
 * @param {number}   x1                  - Start X
 * @param {number}   y1                  - Start Y
 * @param {number}   x2                  - End X
 * @param {number}   y2                  - End Y
 * @param {Object}   options             - Options
 * @param {string}   options.lineMode    - 'straight', 'curved', or 'angled'
 * @param {number}   options.bendX       - Curve control point X
 * @param {number}   options.bendY       - Curve control point Y
 * @param {Array}    options.breakpoints - Array of {x, y} breakpoints for angled mode
 * @param {Function} options.scaleXFn    - X scaling function
 * @param {Function} options.scaleYFn    - Y scaling function
 * @return {string} SVG path d attribute
 */
function buildLinePath(x1, y1, x2, y2, options) {
	const { lineMode, bendX, bendY, breakpoints, scaleXFn, scaleYFn } = options;

	// Angled mode with breakpoints
	if (lineMode === 'angled' && breakpoints && breakpoints.length > 0) {
		const scaledBreakpoints = breakpoints.map((bp) => ({
			x: scaleXFn(bp.x),
			y: scaleYFn(bp.y),
		}));
		let path = `M ${x1} ${y1}`;
		for (const bp of scaledBreakpoints) {
			path += ` L ${bp.x} ${bp.y}`;
		}
		path += ` L ${x2} ${y2}`;
		return path;
	}

	// Curved mode with bend point
	if (lineMode === 'curved' && bendX !== undefined && bendY !== undefined) {
		const scaledBendX = scaleXFn(bendX);
		const scaledBendY = scaleYFn(bendY);
		return `M ${x1} ${y1} Q ${scaledBendX} ${scaledBendY} ${x2} ${y2}`;
	}

	// Default: straight line
	return `M ${x1} ${y1} L ${x2} ${y2}`;
}

/**
 * Scale path data (d attribute) from reference to current dimensions
 *
 * @param {string} d            - Original path d attribute
 * @param {number} width        - Current width
 * @param {number} height       - Current height
 * @param {number} layoutWidth  - Reference width
 * @param {number} layoutHeight - Reference height
 * @return {string} Scaled path d attribute
 */
function scalePath(d, width, height, layoutWidth, layoutHeight) {
	return d.replace(
		/([ML])\s*([\d.-]+)\s+([\d.-]+)/gi,
		(match, command, x, y) => {
			const scaledX = scaleX(parseFloat(x), width, layoutWidth);
			const scaledY = scaleY(parseFloat(y), height, layoutHeight);
			return `${command} ${scaledX} ${scaledY}`;
		}
	);
}

/**
 * Render a single drawing element with scaling
 *
 * @param {Object} props              - Component props
 * @param {Object} props.drawing      - Drawing object
 * @param {number} props.width        - Current width
 * @param {number} props.height       - Current height
 * @param {number} props.layoutWidth  - Reference width
 * @param {number} props.layoutHeight - Reference height
 */
function DrawingElement({ drawing, width, height, layoutWidth, layoutHeight }) {
	const {
		stroke = '#000000',
		strokeWidth = 1,
		strokeDasharray,
		fill = 'none',
		opacity = 1,
		fillOpacity,
	} = drawing;

	const commonProps = {
		stroke,
		strokeWidth,
		strokeDasharray,
		strokeLinecap: 'round',
		fill,
		opacity,
		fillOpacity,
		pointerEvents: 'none',
	};

	const scaleXFn = (v) => scaleX(v, width, layoutWidth);
	const scaleYFn = (v) => scaleY(v, height, layoutHeight);

	switch (drawing.type) {
		case 'line': {
			const x1 = scaleXFn(drawing.x1);
			const y1 = scaleYFn(drawing.y1);
			const x2 = scaleXFn(drawing.x2);
			const y2 = scaleYFn(drawing.y2);

			const linePath = buildLinePath(x1, y1, x2, y2, {
				lineMode: drawing.lineMode,
				bendX: drawing.bendX,
				bendY: drawing.bendY,
				breakpoints: drawing.breakpoints,
				scaleXFn,
				scaleYFn,
			});

			return <path d={linePath} {...commonProps} />;
		}

		case 'arrow': {
			const x1 = scaleXFn(drawing.x1);
			const y1 = scaleYFn(drawing.y1);
			const x2 = scaleXFn(drawing.x2);
			const y2 = scaleYFn(drawing.y2);
			const markerId = `arrow-marker-${drawing.id}`;

			const linePath = buildLinePath(x1, y1, x2, y2, {
				lineMode: drawing.lineMode,
				bendX: drawing.bendX,
				bendY: drawing.bendY,
				breakpoints: drawing.breakpoints,
				scaleXFn,
				scaleYFn,
			});

			return (
				<>
					<defs>
						<ArrowMarker id={markerId} color={stroke} />
					</defs>
					<path
						d={linePath}
						stroke={stroke}
						strokeWidth={strokeWidth}
						strokeDasharray={strokeDasharray}
						strokeLinecap="round"
						fill="none"
						opacity={opacity}
						markerEnd={`url(#${markerId})`}
						pointerEvents="none"
					/>
				</>
			);
		}

		case 'lollipop': {
			const x1 = scaleXFn(drawing.x1);
			const y1 = scaleYFn(drawing.y1);
			const x2 = scaleXFn(drawing.x2);
			const y2 = scaleYFn(drawing.y2);
			const markerId = `lollipop-marker-${drawing.id}`;
			const dotRadius = drawing.dotRadius || 4;

			const linePath = buildLinePath(x1, y1, x2, y2, {
				lineMode: drawing.lineMode,
				bendX: drawing.bendX,
				bendY: drawing.bendY,
				breakpoints: drawing.breakpoints,
				scaleXFn,
				scaleYFn,
			});

			return (
				<>
					<defs>
						<LollipopMarker
							id={markerId}
							color={stroke}
							radius={dotRadius}
						/>
					</defs>
					<path
						d={linePath}
						stroke={stroke}
						strokeWidth={strokeWidth}
						strokeDasharray={strokeDasharray}
						strokeLinecap="round"
						fill="none"
						opacity={opacity}
						markerEnd={`url(#${markerId})`}
						pointerEvents="none"
					/>
				</>
			);
		}

		case 'circle': {
			const cx = scaleXFn(drawing.cx);
			const cy = scaleYFn(drawing.cy);
			const scaleFactorX = width / layoutWidth;
			const scaleFactorY = height / layoutHeight;
			const avgScale = (scaleFactorX + scaleFactorY) / 2;
			const r = drawing.r * avgScale;

			return <circle cx={cx} cy={cy} r={r} {...commonProps} />;
		}

		case 'rect': {
			const x = scaleXFn(drawing.x);
			const y = scaleYFn(drawing.y);
			const rectWidth = scaleXFn(drawing.width);
			const rectHeight = scaleYFn(drawing.height);
			const rx = drawing.rx || 0;

			return (
				<rect
					x={x}
					y={y}
					width={rectWidth}
					height={rectHeight}
					rx={rx}
					{...commonProps}
				/>
			);
		}

		case 'path': {
			const scaledD = scalePath(
				drawing.d,
				width,
				height,
				layoutWidth,
				layoutHeight
			);

			return <path d={scaledD} {...commonProps} />;
		}

		default:
			return null;
	}
}

/**
 * Drawing Layer Component
 *
 * @param {Object} props                  - Component props
 * @param {Array}  props.drawings         - Array of drawing objects to render
 * @param {Object} props.chartDimensions  - Current chart dimensions and padding
 * @param {number} props.chartWidth       - Current chart width
 * @param {number} props.chartHeight      - Current chart height
 * @param {Object} props.layoutDimensions - Reference layout dimensions for scaling
 */
export function DrawingLayer({
	drawings = [],
	chartDimensions,
	chartWidth,
	chartHeight,
	layoutDimensions = null,
}) {
	if (!drawings || drawings.length === 0 || !chartDimensions) {
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

	const chartContextDrawings = drawings.filter(
		(d) => d.positioningContext === 'chart'
	);
	const innerContextDrawings = drawings.filter(
		(d) => !d.positioningContext || d.positioningContext === 'inner'
	);

	return (
		<svg
			width={chartWidth}
			height={chartHeight}
			style={{
				position: 'absolute',
				top: 0,
				left: 0,
				pointerEvents: 'none',
				zIndex: 100,
			}}
		>
			{chartContextDrawings.map((drawing) => (
				<DrawingElement
					key={drawing.id}
					drawing={drawing}
					width={chartWidth}
					height={chartHeight}
					layoutWidth={refLayout.width}
					layoutHeight={refLayout.height}
				/>
			))}

			<g transform={`translate(${padding.left}, ${padding.top})`}>
				{innerContextDrawings.map((drawing) => (
					<DrawingElement
						key={drawing.id}
						drawing={drawing}
						width={innerWidth}
						height={innerHeight}
						layoutWidth={refInnerWidth}
						layoutHeight={refInnerHeight}
					/>
				))}
			</g>
		</svg>
	);
}
