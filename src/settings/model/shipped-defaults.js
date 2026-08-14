/**
 * Shipped block.json defaults for curated theme.config groups (Bucket 3 source of truth).
 */
import chartBlock from '../../chart/block.json';
import { cloneTheme } from './path-utils';

/** @type {Record<string, Record<string, unknown>>} */
export const SHIPPED_CONFIG_DEFAULTS = Object.fromEntries(
	Object.entries(chartBlock.attributes)
		.filter(([, def]) => def?.type === 'object' && def?.default)
		// block.json defaults are pure JSON, so a JSON clone is exact and avoids
		// depending on the `structuredClone` global (absent in the jsdom test env).
		.map(([key, def]) => [key, cloneTheme(def.default)])
);

/**
 * @param {string} groupKey
 * @return {Record<string, unknown>}
 */
export function getShippedGroupDefault(groupKey) {
	return SHIPPED_CONFIG_DEFAULTS[groupKey] ?? {};
}
