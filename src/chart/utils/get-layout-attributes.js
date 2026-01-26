/* eslint-disable max-lines-per-function */
/**
 * Extract layout attributes from nested structure for copy/paste functionality
 * Returns attributes in nested format that can be merged into attributes object
 */
const getLayoutAttributes = (attributes) => {
	// Extract from nested structure
	const {
		layout,
		independentAxis,
		dependentAxis,
		labels,
		legend,
		tooltip,
		bar,
		divergingBar,
		dotPlot,
		line,
		plotBands,
		io,
		dataRender,
	} = attributes;

	// Return nested structure for copying
	return {
		layout: layout ? { ...layout } : undefined,
		independentAxis: independentAxis ? { ...independentAxis } : undefined,
		dependentAxis: dependentAxis ? { ...dependentAxis } : undefined,
		labels: labels ? { ...labels } : undefined,
		legend: legend ? { ...legend } : undefined,
		tooltip: tooltip ? { ...tooltip } : undefined,
		bar: bar ? { ...bar } : undefined,
		divergingBar: divergingBar ? { ...divergingBar } : undefined,
		dotPlot: dotPlot ? { ...dotPlot } : undefined,
		line: line ? { ...line } : undefined,
		plotBands: plotBands ? { ...plotBands } : undefined,
		colors: attributes.colors ? [...attributes.colors] : undefined,
		dataRender: dataRender ? { ...dataRender } : undefined,
		// Include io.colorValue and io.customColors for color handling
		io: io
			? {
					colorValue: io.colorValue,
					customColors: io.customColors,
				}
			: undefined,
	};
};

export default getLayoutAttributes;
