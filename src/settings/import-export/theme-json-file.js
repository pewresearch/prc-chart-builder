/**
 * Pure helpers for chart-theme.json download / upload (PRC-560).
 */

import { validateThemePayload } from './validate-theme-payload';
import themeSchemaPointer from './theme-schema-pointer.json';

/** @type {string} */
export const THEME_SCHEMA_POINTER = themeSchemaPointer.url;

export const THEME_JSON_FILENAME = 'chart-theme.json';

/**
 * Serialize a theme object for download.
 *
 * @param {unknown} theme Theme payload.
 * @return {string} Pretty-printed JSON with trailing newline.
 */
export function serializeThemeForDownload(theme) {
	const base =
		theme && typeof theme === 'object' && !Array.isArray(theme)
			? theme
			: { config: {}, palettes: {} };
	const { $schema: _ignored, ...rest } =
		/** @type {Record<string, unknown>} */ (base);
	const payload = {
		$schema: THEME_SCHEMA_POINTER,
		...rest,
	};
	return `${JSON.stringify(payload, null, '\t')}\n`;
}

/**
 * Trigger a browser download of the theme JSON.
 *
 * @param {unknown} theme      Theme payload.
 * @param {string}  [filename] Download filename.
 */
export function downloadThemeJson(theme, filename = THEME_JSON_FILENAME) {
	const text = serializeThemeForDownload(theme);
	const blob = new Blob([text], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}

/**
 * Parse and schema-validate uploaded theme JSON text.
 *
 * Present `config` / `palettes` values are checked against the field registry
 * (types, enums, unknown keys). Omitting a root key is allowed — replace merges
 * from the current draft. `$schema` is stripped before the draft is updated.
 *
 * @param {string} text Raw file contents.
 * @return {{ theme: { config?: Record<string, unknown>, palettes?: Record<string, unknown> } } | { error: string }} Parsed theme or error.
 */
export function parseThemeJsonText(text) {
	let decoded;
	try {
		decoded = JSON.parse(text);
	} catch {
		return { error: 'Invalid JSON.' };
	}

	const errors = validateThemePayload(decoded);
	if (errors.length > 0) {
		return { error: errors[0] };
	}

	const payload = /** @type {Record<string, unknown>} */ (decoded);

	// `$schema` is IDE-only; never keep it on the in-editor draft.
	return {
		theme: {
			...(payload.config
				? {
						config: /** @type {Record<string, unknown>} */ (
							payload.config
						),
					}
				: {}),
			...(payload.palettes
				? {
						palettes: /** @type {Record<string, unknown>} */ (
							payload.palettes
						),
					}
				: {}),
		},
	};
}
