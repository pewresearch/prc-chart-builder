/**
 * Orthographic (globe) world map variation template.
 *
 * Reuses the Robinson world map template wholesale — same sample table data and
 * choropleth config — and only swaps the layout type to the orthographic
 * renderer. Deep-cloned so the two variations never share mutable references.
 */
import mapWorldTemplate from './map-world';

const WorldOrthographicMapTemplate = JSON.parse(
	JSON.stringify(mapWorldTemplate)
);

// Template shape: [ [ 'prc-chart-builder/data-table', {...} ], [ 'prc-chart-builder/chart', {...} ] ]
const chartAttributes = WorldOrthographicMapTemplate[1][1];
chartAttributes.layout.type = 'map-world-orthographic';
if (chartAttributes.metadata) {
	chartAttributes.metadata.title = 'World Globe Chart';
}

export default WorldOrthographicMapTemplate;
