#!/usr/bin/env node
/**
 * Sync the theme settings field registry from the editor schema.
 *
 * The editor schema (src/settings/field-registry/schema.mjs) is the SOLE source
 * of truth for the Chart Theme settings panel:
 *   - generated.json is built entirely from schema-owned groups. Curated groups
 *     not yet migrated render as empty sections in the panel (intentional during
 *     migration) — there is no README backstop filling them in.
 *   - Schema fields are validated against block.json defaults; drift FAILS the
 *     build (missing/extra paths, enum defaults outside the schema, scalar
 *     defaults of the wrong kind).
 *   - chart-theme.json config is validated the same way (seed cannot drift).
 *   - chart-theme.schema.json is generated for IDE typing via `$schema`.
 *   - The README Configuration Reference table for each schema-owned group is
 *     regenerated from the schema (docs are an output, never a source).
 *
 * Usage:
 *   node bin/sync-field-registry.mjs          # write generated.json + README + theme schema
 *   node bin/sync-field-registry.mjs --check  # fail if outputs are stale or schema drifts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import prettier from 'prettier';

import block from '../src/chart/block.json' with { type: 'json' };
import schema from '../src/settings/field-registry/schema.mjs';
import themeSchemaPointer from '../src/settings/import-export/theme-schema-pointer.json' with { type: 'json' };
import { CURATED_CONFIG_GROUPS } from './field-registry-sync/curated-groups.mjs';
import {
	buildGroupFromSchema,
	schemaGroupKeys,
} from './field-registry-sync/build-schema-registry.mjs';
import { renderChartThemeSchemaFile } from './field-registry-sync/build-chart-theme-schema.mjs';
import { validateChartTheme } from './field-registry-sync/validate-chart-theme.mjs';
import { validateSchema } from './field-registry-sync/validate-schema.mjs';
import {
	renderGroupTable,
	spliceGroupTable,
} from './field-registry-sync/render-readme.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const readmePath = join(root, 'README.md');
const outputPath = join(root, 'src/settings/field-registry/generated.json');
const themeJsonPath = join(root, 'includes/settings/chart-theme.json');
const themeSchemaPath = join(root, 'includes/settings/chart-theme.schema.json');
const THEME_SCHEMA_POINTER = themeSchemaPointer.url;

const checkMode = process.argv.includes('--check');

const schemaGroups = schemaGroupKeys(schema);

/**
 * @param {string} heading
 * @param {string[]} messages
 * @param {string} hint
 */
function fail(heading, messages, hint) {
	console.error(`${heading}\n`);
	for (const message of messages) {
		console.error(`  - ${message}`);
	}
	if (hint) {
		console.error(`\n${hint}`);
	}
	process.exit(1);
}

// 1. Schema ↔ block.json drift is fatal in every mode.
const { errors: schemaErrors } = validateSchema(schema, block.attributes);
if (schemaErrors.length > 0) {
	fail(
		'Editor schema ↔ block.json drift:',
		schemaErrors,
		'Reconcile src/settings/field-registry/schema.mjs with src/chart/block.json defaults, then re-run sync.'
	);
}

// 2. Schema ↔ chart-theme.json drift is fatal in every mode.
const themeRaw = safeRead(themeJsonPath);
if (themeRaw === null) {
	fail(
		'Missing chart theme seed:',
		['includes/settings/chart-theme.json'],
		'Restore the committed fallback theme file.'
	);
}
/** @type {unknown} */
let themeJson;
try {
	themeJson = JSON.parse(themeRaw);
} catch {
	fail(
		'Invalid chart theme seed JSON:',
		['includes/settings/chart-theme.json'],
		'Fix JSON syntax, then re-run sync.'
	);
}
const { errors: themeErrors } = validateChartTheme(schema, themeJson);
if (themeErrors.length > 0) {
	fail(
		'Editor schema ↔ chart-theme.json drift:',
		themeErrors,
		'Reconcile includes/settings/chart-theme.json with src/settings/field-registry/schema.mjs, then re-run sync.'
	);
}

// 3. generated.json: schema-owned groups only; un-migrated groups stay empty.
/** @type {Record<string, unknown>} */
const orderedRegistry = {};
for (const groupKey of CURATED_CONFIG_GROUPS) {
	orderedRegistry[groupKey] = schemaGroups.has(groupKey)
		? buildGroupFromSchema(schema[groupKey])
		: [];
}
const nextRegistry = `${JSON.stringify(orderedRegistry, null, 2)}\n`;

// 4. chart-theme.schema.json for IDE typing.
const nextThemeSchema = renderChartThemeSchemaFile(schema);

// 5. Ensure the seed points at the generated schema without reformatting arrays.
const nextThemeJson = ensureThemeSchemaPointer(themeRaw);

// 6. Regenerate README tables for schema-owned groups. Only the generated
// table snippet is run through Prettier (so its column alignment is stable
// against lint-staged); the rest of the README is left byte-for-byte intact.
const readme = readFileSync(readmePath, 'utf8');
const prettierConfig = {
	...(await prettier.resolveConfig(readmePath)),
	parser: 'markdown',
};
let nextReadme = readme;
for (const groupKey of schemaGroups) {
	const rawTable = renderGroupTable(
		groupKey,
		schema[groupKey],
		block.attributes?.[groupKey]?.default
	);
	const table = (
		await prettier.format(`${rawTable}\n`, prettierConfig)
	).trimEnd();
	nextReadme = spliceGroupTable(nextReadme, groupKey, table);
}

if (checkMode) {
	/** @type {string[]} */
	const stale = [];
	if (safeRead(outputPath) !== nextRegistry) {
		stale.push('src/settings/field-registry/generated.json');
	}
	if (safeRead(themeSchemaPath) !== nextThemeSchema) {
		stale.push('includes/settings/chart-theme.schema.json');
	}
	if (safeRead(themeJsonPath) !== nextThemeJson) {
		stale.push('includes/settings/chart-theme.json');
	}
	if (safeRead(readmePath) !== nextReadme) {
		stale.push('README.md');
	}
	if (stale.length > 0) {
		fail(
			'Field registry outputs are stale:',
			stale,
			'Run: npm run sync:field-registry -w @prc/chart-builder'
		);
	}
	console.log(
		`Field registry sync OK (${schemaGroups.size} schema groups: ${[
			...schemaGroups,
		].join(', ')}).`
	);
	process.exit(0);
}

writeFileSync(outputPath, nextRegistry);
writeFileSync(themeSchemaPath, nextThemeSchema);
writeFileSync(themeJsonPath, nextThemeJson);
writeFileSync(readmePath, nextReadme);
console.log(
	`Wrote generated.json + chart-theme.schema.json + README (${schemaGroups.size} schema groups: ${[
		...schemaGroups,
	].join(', ')}).`
);

/**
 * @param {string} path
 * @return {string|null}
 */
function safeRead(path) {
	try {
		return readFileSync(path, 'utf8');
	} catch {
		return null;
	}
}

/**
 * Ensure the canonical `$schema` URL is the first property without
 * re-serializing the rest of the file (avoids reformatting compact arrays).
 *
 * @param {string} raw
 * @return {string}
 */
function ensureThemeSchemaPointer(raw) {
	const trimmed = raw.endsWith('\n') ? raw : `${raw}\n`;
	const pointerLine = `\t"$schema": ${JSON.stringify(THEME_SCHEMA_POINTER)},`;
	const expectedPrefix = `{\n${pointerLine}\n`;

	if (trimmed.startsWith(expectedPrefix)) {
		return trimmed;
	}

	// Drop a prior $schema line (any value / indentation) then insert the canonical one.
	const withoutSchema = trimmed.replace(
		/^\{\s*\n(\t"\$schema":\s*"[^"]*",\s*\n)?/,
		'{\n'
	);
	return withoutSchema.replace(/^\{\n/, expectedPrefix);
}
