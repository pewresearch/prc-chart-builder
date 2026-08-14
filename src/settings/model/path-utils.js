/**
 * @param {Record<string, unknown>|undefined|null} source
 * @param {string[]} pathParts
 * @return {unknown}
 */
export function getAtPath(source, pathParts) {
	let current = source;
	for (const part of pathParts) {
		if (
			current === null ||
			current === undefined ||
			typeof current !== 'object' ||
			Array.isArray(current)
		) {
			return undefined;
		}
		current = /** @type {Record<string, unknown>} */ (current)[part];
	}
	return current;
}

/**
 * @param {Record<string, unknown>} source
 * @param {string[]} pathParts
 * @param {unknown} value
 * @return {Record<string, unknown>}
 */
export function setAtPath(source, pathParts, value) {
	if (pathParts.length === 0) {
		return source;
	}

	if (pathParts.length === 1) {
		return { ...source, [pathParts[0]]: value };
	}

	const [head, ...tail] = pathParts;
	const existing = source[head];
	const child =
		existing && typeof existing === 'object' && !Array.isArray(existing)
			? /** @type {Record<string, unknown>} */ (existing)
			: {};

	return {
		...source,
		[head]: setAtPath(child, tail, value),
	};
}

/**
 * @param {Record<string, unknown>} source
 * @param {string[]} pathParts
 * @return {Record<string, unknown>}
 */
export function unsetAtPath(source, pathParts) {
	if (pathParts.length === 0) {
		return source;
	}

	if (pathParts.length === 1) {
		if (!(pathParts[0] in source)) {
			return source;
		}
		const next = { ...source };
		delete next[pathParts[0]];
		return next;
	}

	const [head, ...tail] = pathParts;
	if (!(head in source)) {
		return source;
	}

	const existing = source[head];
	if (!existing || typeof existing !== 'object' || Array.isArray(existing)) {
		return source;
	}

	const child = unsetAtPath(
		/** @type {Record<string, unknown>} */ (existing),
		tail
	);

	if (Object.keys(child).length === 0) {
		const next = { ...source };
		delete next[head];
		return next;
	}

	return { ...source, [head]: child };
}

/**
 * @param {unknown} left
 * @param {unknown} right
 * @return {boolean}
 */
export function valuesEqual(left, right) {
	return JSON.stringify(left) === JSON.stringify(right);
}

/**
 * @param {import('./store').ChartTheme} settings
 * @param {string} groupKey
 * @return {Record<string, unknown>}
 */
export function getConfigGroup(settings, groupKey) {
	const group = settings?.config?.[groupKey];
	if (group && typeof group === 'object' && !Array.isArray(group)) {
		return /** @type {Record<string, unknown>} */ (group);
	}
	return {};
}

/**
 * @param {import('./store').ChartTheme} settings
 * @param {string} groupKey
 * @param {Record<string, unknown>} groupValue
 * @return {import('./store').ChartTheme}
 */
export function replaceConfigGroup(settings, groupKey, groupValue) {
	const nextConfig = { ...(settings.config ?? {}) };

	if (!groupValue || Object.keys(groupValue).length === 0) {
		delete nextConfig[groupKey];
	} else {
		nextConfig[groupKey] = groupValue;
	}

	return {
		...settings,
		config: nextConfig,
	};
}

/**
 * @param {import('./store').ChartTheme} settings
 * @param {string} groupKey
 * @param {string[]} pathParts
 * @param {unknown} value
 * @param {unknown} shippedValue
 * @param {{ unsetOnShippedMatch?: boolean }} [options]
 * @return {import('./store').ChartTheme}
 */
export function applyFieldEdit(
	settings,
	groupKey,
	pathParts,
	value,
	shippedValue,
	{ unsetOnShippedMatch = true } = {}
) {
	const currentGroup = getConfigGroup(settings, groupKey);

	if (value === undefined || value === null) {
		return replaceConfigGroup(
			settings,
			groupKey,
			unsetAtPath(currentGroup, pathParts)
		);
	}

	const nextGroup =
		unsetOnShippedMatch && valuesEqual(value, shippedValue)
			? unsetAtPath(currentGroup, pathParts)
			: setAtPath(currentGroup, pathParts, value);

	return replaceConfigGroup(settings, groupKey, nextGroup);
}

/**
 * @param {Record<string, unknown>|undefined} group
 * @param {string[]} pathParts
 * @param {unknown} shippedValue
 * @return {unknown}
 */
export function getEffectiveFieldValue(group, pathParts, shippedValue) {
	const themed = getAtPath(group, pathParts);
	return themed !== undefined ? themed : shippedValue;
}

/**
 * @param {Record<string, unknown>|undefined} group
 * @param {string[]} pathParts
 * @param {unknown} shippedValue
 * @return {boolean}
 */
export function isFieldOverridden(group, pathParts, shippedValue) {
	return (
		getAtPath(group, pathParts) !== undefined &&
		!valuesEqual(getAtPath(group, pathParts), shippedValue)
	);
}

/**
 * Deep-clone a theme payload for dirty comparison.
 *
 * @param {import('./store').ChartTheme} theme
 * @return {import('./store').ChartTheme}
 */
export function cloneTheme(theme) {
	return JSON.parse(JSON.stringify(theme ?? {}));
}
