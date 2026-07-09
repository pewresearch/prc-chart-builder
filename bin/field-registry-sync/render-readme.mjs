/**
 * Render the README Configuration Reference table for a schema-owned group.
 *
 * For groups present in the editor schema the README is an *output*: the table
 * is generated from the schema (types/enums/descriptions) plus block.json
 * (default values), then spliced back into the existing section so the prose
 * around it is preserved. The raw output is intentionally un-padded; the sync
 * orchestrator runs the whole README through Prettier so the on-disk result is
 * stable against the lint-staged formatter.
 */

/**
 * @typedef {import('../../src/settings/field-registry/schema.mjs').SchemaField} SchemaField
 */

/**
 * @param {unknown} root
 * @param {string[]} path
 * @return {unknown}
 */
function valueAtPath(root, path) {
	let current = root;
	for (const segment of path) {
		if (current === null || typeof current !== 'object') {
			return undefined;
		}
		current = /** @type {Record<string, unknown>} */ (current)[segment];
	}
	return current;
}

/**
 * @param {string} value
 * @return {string}
 */
function escapeCell(value) {
	return value.replace(/\|/g, '\\|');
}

/**
 * @param {SchemaField} field
 * @return {string}
 */
function typeColumn(field) {
	if (field.type === 'enum') {
		const union = (field.enum ?? [])
			.map((value) => `'${value}'`)
			.join(' \\| ');
		return `\`${union}\``;
	}
	if (field.type === 'color') {
		return 'color (hex)';
	}
	if (field.type === 'numberPair') {
		return '[number, number]';
	}
	return field.type;
}

/**
 * @param {SchemaField} field
 * @return {string}
 */
function notesColumn(field) {
	const note = escapeCell(field.description);
	return field.themeable ? note : `${note} _(read-only)_`;
}

/**
 * @param {string} groupKey
 * @param {Record<string, SchemaField>} schemaGroup
 * @param {unknown} blockDefault
 * @return {string} Markdown table (no surrounding blank lines).
 */
export function renderGroupTable(groupKey, schemaGroup, blockDefault) {
	const rows = Object.keys(schemaGroup)
		.sort((left, right) => left.localeCompare(right))
		.map((dotPath) => {
			const field = schemaGroup[dotPath];
			const defaultValue = valueAtPath(blockDefault, dotPath.split('.'));
			const cells = [
				`\`${groupKey}.${dotPath}\``,
				typeColumn(field),
				`\`${JSON.stringify(defaultValue)}\``,
				notesColumn(field),
			];
			return `| ${cells.join(' | ')} |`;
		});

	return [
		'| Attribute | Type | Default | Notes |',
		'| --- | --- | --- | --- |',
		...rows,
	].join('\n');
}

/**
 * @param {string} text
 * @return {string}
 */
function escapeRegExp(text) {
	return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Replace the markdown table inside a group's README section with `table`.
 *
 * @param {string} readme
 * @param {string} groupKey
 * @param {string} table
 * @return {string}
 */
export function spliceGroupTable(readme, groupKey, table) {
	const lines = readme.split('\n');
	const headerRe = new RegExp(`^#{2,4}\\s+\`${escapeRegExp(groupKey)}\``);
	const headerIdx = lines.findIndex((line) => headerRe.test(line));
	if (headerIdx === -1) {
		throw new Error(`README has no \`${groupKey}\` section header.`);
	}

	let start = -1;
	for (let i = headerIdx + 1; i < lines.length; i += 1) {
		if (/^#{1,4}\s/.test(lines[i])) {
			break;
		}
		if (lines[i].trimStart().startsWith('|')) {
			start = i;
			break;
		}
	}
	if (start === -1) {
		throw new Error(
			`README \`${groupKey}\` section has no table to replace.`
		);
	}

	let end = start;
	while (
		end + 1 < lines.length &&
		lines[end + 1].trimStart().startsWith('|')
	) {
		end += 1;
	}

	return [
		...lines.slice(0, start),
		...table.split('\n'),
		...lines.slice(end + 1),
	].join('\n');
}
