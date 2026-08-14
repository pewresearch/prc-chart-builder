import generated from './generated.json';
import { CURATED_CONFIG_GROUPS } from '../constants';

export * from './field-grid-layout';
export * from './format-shipped-default';

/** @typedef {import('./types').FieldDefinition} FieldDefinition */

/** @type {Record<string, FieldDefinition[]>} */
export const FIELD_REGISTRY = Object.fromEntries(
	CURATED_CONFIG_GROUPS.map((groupKey) => [
		groupKey,
		generated[groupKey] ?? [],
	])
);

/** @type {string[]} */
export const REGISTERED_CONFIG_GROUPS = CURATED_CONFIG_GROUPS.filter(
	(groupKey) => (FIELD_REGISTRY[groupKey]?.length ?? 0) > 0
);

/**
 * @param {string} groupKey
 * @return {FieldDefinition[]|null}
 */
export function getFieldsForGroup(groupKey) {
	const fields = FIELD_REGISTRY[groupKey];
	return fields?.length ? fields : null;
}

/**
 * @param {string[]} path
 * @return {string}
 */
export function formatFieldPath(path) {
	return path.join('.');
}
