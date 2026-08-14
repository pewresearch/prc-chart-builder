/**
 * @typedef {import('./types').FieldDefinition} FieldDefinition
 */

/**
 * @typedef {{ kind: 'group', key: string, label: string }} ConfigGridGroupRow
 */

/**
 * @typedef {{ kind: 'field', field: FieldDefinition, depth: number, attributeLabel: string, pathLabel: string }} ConfigGridFieldRow
 */

/** @typedef {ConfigGridGroupRow | ConfigGridFieldRow} ConfigGridRow */

/**
 * Compare dot-path segments depth-first so nested fields stay with their parent
 * prefix instead of appearing as siblings of unrelated top-level keys.
 *
 * @param {string[]} left
 * @param {string[]} right
 * @return {number}
 */
export function compareFieldPaths(left, right) {
	const maxLength = Math.max(left.length, right.length);

	for (let index = 0; index < maxLength; index += 1) {
		if (index >= left.length) {
			return -1;
		}
		if (index >= right.length) {
			return 1;
		}

		const segmentCompare = left[index].localeCompare(right[index]);
		if (segmentCompare !== 0) {
			return segmentCompare;
		}
	}

	return 0;
}

/**
 * @param {FieldDefinition[]} fields
 * @return {FieldDefinition[]}
 */
export function sortFieldsForDisplay(fields) {
	return [...fields].sort((left, right) =>
		compareFieldPaths(left.path, right.path)
	);
}

/**
 * Flat registry fields → table rows with explicit parent group headers so
 * indented nested fields are not mistaken for children of the prior row.
 *
 * @param {FieldDefinition[]} fields
 * @return {ConfigGridRow[]}
 */
export function buildConfigGridRows(fields) {
	const sorted = sortFieldsForDisplay(fields);
	/** @type {ConfigGridRow[]} */
	const rows = [];
	/** @type {string|null} */
	let currentGroup = null;

	for (const field of sorted) {
		const pathLabel = field.path.join('.');

		if (field.path.length === 1) {
			currentGroup = null;
			rows.push({
				kind: 'field',
				field,
				depth: 0,
				attributeLabel: field.path[0],
				pathLabel,
			});
			continue;
		}

		const groupKey = field.path[0];
		if (groupKey !== currentGroup) {
			rows.push({
				kind: 'group',
				key: groupKey,
				label: groupKey,
			});
			currentGroup = groupKey;
		}

		rows.push({
			kind: 'field',
			field,
			depth: field.path.length - 1,
			attributeLabel: field.path.slice(1).join('.'),
			pathLabel,
		});
	}

	return rows;
}

/**
 * @param {number} depth
 * @return {number}
 */
export function configGridNamePadding(depth) {
	return 12 + Math.max(0, depth) * 16;
}
