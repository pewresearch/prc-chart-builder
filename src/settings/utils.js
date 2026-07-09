/**
 * Human-readable label for a theme.config group key.
 *
 * @param {string} groupKey
 * @return {string}
 */
export function formatGroupLabel(groupKey) {
	return groupKey
		.replace(/([A-Z])/g, ' $1')
		.replace(/^./, (char) => char.toUpperCase())
		.trim();
}

/**
 * Deep-merge a partial object into a target (objects only; arrays replace).
 *
 * @param {Record<string, unknown>} target
 * @param {Record<string, unknown>} partial
 * @return {Record<string, unknown>}
 */
export function deepMergePartial(target, partial) {
	const result = { ...target };

	for (const key of Object.keys(partial)) {
		const partialValue = partial[key];
		const targetValue = target[key];

		if (
			partialValue &&
			typeof partialValue === 'object' &&
			!Array.isArray(partialValue) &&
			targetValue &&
			typeof targetValue === 'object' &&
			!Array.isArray(targetValue)
		) {
			result[key] = deepMergePartial(
				/** @type {Record<string, unknown>} */ (targetValue),
				/** @type {Record<string, unknown>} */ (partialValue)
			);
		} else {
			result[key] = partialValue;
		}
	}

	return result;
}

/**
 * Merge a partial into one theme.config group on a settings payload.
 *
 * @param {import('./store').ChartTheme} settings
 * @param {string} groupKey
 * @param {Record<string, unknown>} partial
 * @return {import('./store').ChartTheme}
 */
export function applyConfigGroupPartial(settings, groupKey, partial) {
	const currentGroup =
		settings.config?.[groupKey] &&
		typeof settings.config[groupKey] === 'object' &&
		!Array.isArray(settings.config[groupKey])
			? /** @type {Record<string, unknown>} */ (settings.config[groupKey])
			: {};

	return {
		...settings,
		config: {
			...settings.config,
			[groupKey]: deepMergePartial(currentGroup, partial),
		},
	};
}

/**
 * @param {Record<string, unknown>} theme
 * @return {boolean}
 */
export function isThemeEmpty(theme) {
	if (!theme || typeof theme !== 'object') {
		return true;
	}

	const config = theme.config;
	const palettes = theme.palettes;

	const hasConfig =
		config && typeof config === 'object' && Object.keys(config).length > 0;

	const hasPalettes =
		palettes &&
		typeof palettes === 'object' &&
		((Array.isArray(palettes.colorNames) &&
			palettes.colorNames.length > 0) ||
			(palettes.colors &&
				typeof palettes.colors === 'object' &&
				Object.keys(palettes.colors).length > 0));

	return !hasConfig && !hasPalettes;
}
