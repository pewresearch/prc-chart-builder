/**
 * Drawing Layer Component
 *
 * EXPERIMENTAL FEATURE - Not ready for production use
 *
 * Renders saved drawings on top of the chart.
 * Used both in editor (to show existing drawings) and frontend.
 */

/**
 * Drawing Layer Component
 *
 * @param {Object} props
 * @param {Array} props.drawings - Array of drawing objects to render
 * @param {Object} props.chartDimensions - Chart dimensions and padding
 * @param {number} props.chartWidth - Full chart width
 * @param {number} props.chartHeight - Full chart height
 */
export function DrawingLayer({
	drawings = [],
	chartDimensions,
	chartWidth,
	chartHeight,
}) {
	if (!drawings || drawings.length === 0 || !chartDimensions) {
		return null;
	}

	const { padding } = chartDimensions;

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
			<g transform={`translate(${padding.left}, ${padding.top})`}>
				{drawings.map((drawing, index) => {
					const key = drawing.id || `drawing-${index}`;
					if (drawing.type === 'path') {
						return (
							<path
								key={key}
								d={drawing.d}
								stroke={drawing.stroke || '#000000'}
								strokeWidth={drawing.strokeWidth || 2}
								fill={drawing.fill || 'none'}
							/>
						);
					}
					if (drawing.type === 'circle') {
						return (
							<circle
								key={key}
								cx={drawing.cx}
								cy={drawing.cy}
								r={drawing.r}
								stroke={drawing.stroke || '#000000'}
								strokeWidth={drawing.strokeWidth || 2}
								fill={drawing.fill || 'none'}
							/>
						);
					}
					return null;
				})}
			</g>
		</svg>
	);
}
