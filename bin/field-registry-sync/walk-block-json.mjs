/**
 * Collect dot-paths from block.json group defaults.
 *
 * @param {unknown} value
 * @param {string[]} prefix
 * @return {Set<string>}
 */
export function collectBlockJsonPaths(value, prefix = []) {
	/** @type {Set<string>} */
	const paths = new Set();

	if (value === null || value === undefined) {
		if (prefix.length > 0) {
			paths.add(prefix.join('.'));
		}
		return paths;
	}

	if (Array.isArray(value)) {
		if (prefix.length > 0) {
			paths.add(prefix.join('.'));
		}
		return paths;
	}

	if (typeof value !== 'object') {
		if (prefix.length > 0) {
			paths.add(prefix.join('.'));
		}
		return paths;
	}

	const keys = Object.keys(value);
	if (keys.length === 0 && prefix.length > 0) {
		paths.add(prefix.join('.'));
		return paths;
	}

	for (const key of keys) {
		const childPaths = collectBlockJsonPaths(value[key], [...prefix, key]);
		for (const childPath of childPaths) {
			paths.add(childPath);
		}
	}

	return paths;
}
