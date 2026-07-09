import DOMPurify from 'dompurify';

/**
 * Resolve the effective metadata object for a chart store slice.
 *
 * Merges base `attributes.metadata`, viewport overrides, and live
 * `config.metadata` (from setConfig / setChart) so SSR first paint,
 * viewport switches, and runtime patches all converge on one shape.
 *
 * @param {Object|undefined} slice Per-chart state from `state.charts[id]`.
 * @return {Object} Resolved metadata fields.
 */
export function resolveChartMetadata(slice) {
	if (!slice) {
		return {};
	}

	const currentViewport = slice.currentViewport || 'desktop';
	const attributes = slice.attributes || {};
	const base = attributes.metadata || {};
	const viewportOverrides =
		currentViewport !== 'desktop'
			? attributes[currentViewport]?.metadata || {}
			: {};
	const fromAttributes = { ...base, ...viewportOverrides };

	const configMeta = slice.config?.metadata;
	if (!configMeta || typeof configMeta !== 'object') {
		return fromAttributes;
	}

	return { ...fromAttributes, ...configMeta };
}

/**
 * @param {Object|undefined} slice  Per-chart state slice.
 * @param {string}           field  Metadata field key.
 * @return {string} HTML string for metadata `[data-meta-field]` elements (innerHTML).
 */
export function resolveChartMetadataField(slice, field) {
	const metadata = resolveChartMetadata(slice);
	const value = metadata[field];
	if (value === undefined || value === null) {
		return '';
	}
	// Match server first paint (wp_kses_post) and table cell patches.
	return DOMPurify.sanitize(String(value));
}
