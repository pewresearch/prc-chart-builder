/**
 * Alignment Overlay Component
 *
 * Renders alignment guide lines as an overlay on top of the chart.
 * Only used in the editor - never appears in published content.
 * Re-renders independently without affecting chart performance.
 */

export function AlignmentOverlay({ alignments, chartDimensions }) {
	if (!alignments || !chartDimensions) {
		return null;
	}

	const { width, height, padding } = chartDimensions;
	const innerWidth = width - padding.left - padding.right;
	const innerHeight = height - padding.top - padding.bottom;

	// No alignments to show
	if (
		(!alignments.vertical || alignments.vertical.length === 0) &&
		(!alignments.horizontal || alignments.horizontal.length === 0)
	) {
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
				pointerEvents: 'none',
				zIndex: 1000,
			}}
		>
			<svg
				width={width}
				height={height}
				style={{
					position: 'absolute',
					top: 0,
					left: 0,
					pointerEvents: 'none',
				}}
			>
				<g transform={`translate(${padding.left}, ${padding.top})`}>
					{/* Vertical alignment guides */}
					{alignments.vertical?.map((guide) => (
						<line
							key={`v-${guide.id}`}
							x1={guide.x}
							y1={0}
							x2={guide.x}
							y2={innerHeight}
							stroke="#4A90E2"
							strokeWidth={1}
							strokeDasharray="4 4"
							opacity={0.6}
						/>
					))}

					{/* Horizontal alignment guides */}
					{alignments.horizontal?.map((guide) => (
						<line
							key={`h-${guide.id}`}
							x1={0}
							y1={guide.y}
							x2={innerWidth}
							y2={guide.y}
							stroke="#4A90E2"
							strokeWidth={1}
							strokeDasharray="4 4"
							opacity={0.6}
						/>
					))}
				</g>
			</svg>
		</div>
	);
}
