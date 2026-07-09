/**
 * Shipped block.json defaults for curated theme.config groups (Bucket 3 source of truth).
 */
import chartBlock from '../chart/block.json';

/** @type {Record<string, Record<string, unknown>>} */
export const SHIPPED_CONFIG_DEFAULTS = Object.fromEntries(
	Object.entries(chartBlock.attributes)
		.filter(([, def]) => def?.type === 'object' && def?.default)
		.map(([key, def]) => [key, structuredClone(def.default)])
);

/**
 * @param {string} groupKey
 * @return {Record<string, unknown>}
 */
export function getShippedGroupDefault(groupKey) {
	return SHIPPED_CONFIG_DEFAULTS[groupKey] ?? {};
}
