/**
 * Sanitize a string for use as a chart export filename stem (PNG/CSV downloads, media uploads).
 * Strips punctuation; keeps Unicode letters and digits, hyphens, and underscores.
 *
 * @param {string} raw Raw title or label.
 * @return {string} Non-empty slug safe for cross-platform filenames.
 */
export function sanitizeChartExportFilename(raw) {
	if (typeof raw !== 'string' || !raw.trim()) {
		return 'chart';
	}
	let s = raw
		.toLowerCase()
		.replace(/\s+/g, '_')
		.replace(/[^\p{L}\p{N}\-_]/gu, '')
		.replace(/_+/g, '_')
		.replace(/^[\-_]+|[\-_]+$/g, '');
	return s || 'chart';
}
