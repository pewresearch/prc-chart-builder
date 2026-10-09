export const SCREENSHOT_NUMBER_KEYS = [
	'delay_seconds',
	'device_scale_factor',
	'viewport_side_padding',
	'default_chart_width',
	'default_chart_height',
];

/**
 * Shape an in-progress screenshot settings draft for saving.
 *
 * Number inputs hold raw strings while editing; blanks fall back to defaults.
 *
 * @param {Object} draft    Draft settings (number fields may be strings).
 * @param {Object} defaults Hardcoded service defaults from the REST payload.
 * @return {Object} Settings ready for POST.
 */
export function normalizeScreenshotDraft(draft, defaults) {
	const next = { ...draft };

	const selector = String(draft.selector ?? '').trim();
	next.selector = selector || defaults.selector;

	for (const key of SCREENSHOT_NUMBER_KEYS) {
		const raw = String(draft[key] ?? '').trim();
		const value = Number(raw);
		next[key] =
			raw === '' || !Number.isFinite(value) ? defaults[key] : value;
	}

	return next;
}

/**
 * Whether the draft would change the saved settings.
 *
 * @param {Object} draft    Draft settings.
 * @param {Object} saved    Last saved settings.
 * @param {Object} defaults Hardcoded service defaults.
 * @return {boolean} True when saving would change at least one field.
 */
export function isScreenshotDraftDirty(draft, saved, defaults) {
	const normalized = normalizeScreenshotDraft(draft, defaults);

	return Object.keys(normalized).some(
		(key) => normalized[key] !== saved[key]
	);
}
