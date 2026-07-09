import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import block from '../../src/chart/block.json';
import { CURATED_CONFIG_GROUPS } from '../../src/settings/constants';
import { getFieldsForGroup } from '../../src/settings/field-registry';
import generated from '../../src/settings/field-registry/generated.json';

const pluginRoot = join(__dirname, '../..');
const readme = readFileSync(join(pluginRoot, 'README.md'), 'utf8');

describe('field registry sync', () => {
	it('documents layout.padding.top in README Configuration Reference', () => {
		expect(readme).toMatch(/\|\s*`layout\.padding\.top`\s*\|/);
		const row = readme
			.split('\n')
			.find((line) => line.includes('`layout.padding.top`'));
		expect(row).toMatch(/number/i);
	});

	it('passes sync:field-registry:check (schema, README, block.json, generated.json)', () => {
		expect(() =>
			execSync('npm run sync:field-registry:check', {
				cwd: pluginRoot,
				encoding: 'utf8',
				stdio: ['pipe', 'pipe', 'pipe'],
			})
		).not.toThrow();
	});

	it('generated.json includes every curated config group', () => {
		for (const group of CURATED_CONFIG_GROUPS) {
			expect(generated[group]).toBeDefined();
			expect(Array.isArray(generated[group])).toBe(true);
		}
	});

	it('includes block.json default paths for documented layout fields', () => {
		const layoutDefaults = block.attributes.layout.default;
		const paths = getFieldsForGroup('layout').map((field) =>
			field.path.join('.')
		);
		expect(paths).toContain('padding.top');
		expect(layoutDefaults.padding.top).toBeDefined();
	});

	it('sources layout types + enums from the editor schema', () => {
		const byPath = (name) =>
			getFieldsForGroup('layout')?.find(
				(field) => field.path.join('.') === name
			);

		expect(byPath('type')?.enum).toContain('treemap');
		expect(byPath('type')?.enum).toContain('sankey');
		expect(byPath('type')?.enum?.length).toBeGreaterThan(20);
		expect(byPath('type')?.description).toBeTruthy();
		expect(byPath('type')?.description).not.toMatch(
			/default for newly inserted charts/i
		);

		expect(byPath('orientation')?.enum).toEqual(['vertical', 'horizontal']);
		expect(byPath('overflowX')?.enum).toContain('preserve-aspect-ratio');

		expect(byPath('name')?.themeable).toBe(false);
	});

	it('documents every curated config group in the editor schema', () => {
		for (const group of CURATED_CONFIG_GROUPS) {
			expect(getFieldsForGroup(group)?.length).toBeGreaterThan(0);
			expect(generated[group].length).toBeGreaterThan(0);
		}
	});

	it('sources metadata types from the editor schema', () => {
		const metadataDefaults = block.attributes.metadata.default;
		const fields = getFieldsForGroup('metadata');
		expect(fields).not.toBeNull();

		const paths = fields.map((field) => field.path.join('.')).sort();
		expect(paths).toEqual([
			'active',
			'alt',
			'note',
			'source',
			'subtitle',
			'tag',
			'title',
		]);

		const byPath = (name) =>
			fields.find((field) => field.path.join('.') === name);

		expect(byPath('active')?.type).toBe('boolean');
		expect(byPath('active')?.themeable).toBe(true);
		expect(metadataDefaults.active).toBe(true);

		for (const key of ['title', 'subtitle', 'note', 'source', 'tag']) {
			expect(byPath(key)?.type).toBe('string');
			expect(byPath(key)?.themeable).toBe(true);
			expect(metadataDefaults[key]).toBe('');
		}

		expect(byPath('alt')?.type).toBe('string');
		expect(byPath('alt')?.themeable).toBe(false);
	});

	it('sources plotBands types from the editor schema', () => {
		const plotBandsDefaults = block.attributes.plotBands.default;
		const fields = getFieldsForGroup('plotBands');
		expect(fields).not.toBeNull();

		const byPath = (name) =>
			fields.find((field) => field.path.join('.') === name);

		expect(byPath('active')?.type).toBe('boolean');
		expect(byPath('allowDrag')?.type).toBe('boolean');
		expect(byPath('allowResize')?.type).toBe('boolean');
		expect(byPath('dimension')?.enum).toEqual(['x', 'y']);
		expect(plotBandsDefaults.dimension).toBe('x');

		expect(byPath('bands')?.themeable).toBe(false);
	});

	it('sources independentAxis types from the editor schema', () => {
		const axisDefaults = block.attributes.independentAxis.default;
		const fields = getFieldsForGroup('independentAxis');
		expect(fields).not.toBeNull();
		expect(fields).toHaveLength(46);

		const byPath = (name) =>
			fields.find((field) => field.path.join('.') === name);

		expect(byPath('scale')?.enum).toEqual([
			'linear',
			'time',
			'log',
			'sqrt',
		]);
		expect(axisDefaults.scale).toBe('linear');

		expect(byPath('tickUnitPosition')?.enum).toEqual(['start', 'end']);
		expect(byPath('tickLabels.textAnchor')?.enum).toEqual([
			'start',
			'middle',
			'end',
		]);
		expect(byPath('tickLabels.verticalAnchor')?.enum).toEqual([
			'start',
			'middle',
			'end',
		]);

		expect(byPath('tickLabels.fill')?.type).toBe('color');
		expect(byPath('axis.stroke')?.type).toBe('color');
		expect(byPath('grid.stroke')?.type).toBe('color');

		for (const lockedPath of ['tickValues', 'tickFormat']) {
			expect(byPath(lockedPath)?.themeable).toBe(false);
		}

		// Slice 15: per-role fonts are themeable font pickers (new charts only).
		for (const fontPath of [
			'tickLabels.fontFamily',
			'axisLabel.fontFamily',
		]) {
			expect(byPath(fontPath)?.type).toBe('font');
			expect(byPath(fontPath)?.themeable).toBe(true);
		}

		expect(byPath('domain')?.type).toBe('numberPair');
		expect(byPath('domain')?.themeable).toBe(true);
		expect(axisDefaults.domain).toEqual([0, 100]);

		expect(byPath('tickMarksActive')?.type).toBe('boolean');
		expect(byPath('tickMarksActive')?.themeable).toBe(true);
	});

	it('sources dependentAxis types from the editor schema', () => {
		const axisDefaults = block.attributes.dependentAxis.default;
		const fields = getFieldsForGroup('dependentAxis');
		expect(fields).not.toBeNull();
		expect(fields).toHaveLength(44);

		const byPath = (name) =>
			fields.find((field) => field.path.join('.') === name);

		expect(byPath('scale')?.enum).toEqual([
			'linear',
			'time',
			'log',
			'sqrt',
		]);
		expect(axisDefaults.scale).toBe('linear');

		expect(byPath('domain')?.type).toBe('numberPair');
		expect(axisDefaults.domain).toEqual([0, 100]);

		expect(byPath('tickAngle')?.type).toBe('number');
		expect(axisDefaults.tickAngle).toBe(0);
		expect(axisDefaults.showZero).toBe(false);
		expect(axisDefaults.tickMarksActive).toBe(true);
		expect(axisDefaults.abbreviateTicks).toBe(true);

		expect(byPath('dateFormat')).toBeUndefined();
		expect(byPath('domainPadding')).toBeUndefined();
		expect(byPath('padding')).toBeUndefined();

		for (const lockedPath of ['tickValues', 'tickFormat']) {
			expect(byPath(lockedPath)?.themeable).toBe(false);
		}

		// Slice 15: per-role fonts are themeable font pickers (new charts only).
		for (const fontPath of [
			'tickLabels.fontFamily',
			'axisLabel.fontFamily',
		]) {
			expect(byPath(fontPath)?.type).toBe('font');
			expect(byPath(fontPath)?.themeable).toBe(true);
		}
	});

	it('keeps shapes paths present but locked (themeable: false)', () => {
		const fields = getFieldsForGroup('shapes');
		expect(fields).not.toBeNull();
		expect(fields.map((field) => field.path.join('.')).sort()).toEqual([
			'customStyles',
			'segmentStyles',
			'segmentsActive',
		]);
		for (const field of fields) {
			expect(field.themeable).toBe(false);
		}
	});

	it('sources legend types + enums from the editor schema', () => {
		const byPath = (name) =>
			getFieldsForGroup('legend')?.find(
				(field) => field.path.join('.') === name
			);

		// Enums are authored in schema.mjs (the editor source of truth).
		expect(byPath('orientation')?.enum).toEqual([
			'row',
			'column',
			'row-reverse',
			'column-reverse',
		]);
		expect(byPath('markerStyle')?.enum).toEqual([
			'rect',
			'circle',
			'line',
			'none',
			'label',
		]);
		expect(byPath('alignment')?.enum).toEqual([
			'flex-start',
			'center',
			'flex-end',
			'none',
		]);
		expect(byPath('variation')?.enum).toEqual([
			'grouped',
			'detached',
			'direct',
		]);

		// Editor-only divergence from runtime: fontWeight is an enum in the
		// editor even though it compiles to a plain string at runtime.
		expect(byPath('fontWeight')?.enum).toEqual([
			'normal',
			'bold',
			'600',
			'700',
		]);

		// Schema corrects the type the README heuristic got wrong: a legend
		// border is a color, not free text.
		expect(byPath('borderStroke')?.type).toBe('color');

		// Slice 15: legend font is a themeable font picker; fill stays a color.
		expect(byPath('fontFamily')?.type).toBe('font');
		expect(byPath('fontFamily')?.themeable).toBe(true);
		expect(byPath('fill')?.type).toBe('color');
	});

	it('sources chart-type and tooltip enums from the editor schema', () => {
		const tooltip = (name) =>
			getFieldsForGroup('tooltip')?.find(
				(field) => field.path.join('.') === name
			);

		expect(tooltip('caretPosition')?.enum).toEqual([
			'top',
			'bottom',
			'left',
			'right',
		]);
		expect(tooltip('customFormat')?.themeable).toBe(false);
		expect(tooltip('style.fontFamily')?.type).toBe('font');
		expect(tooltip('style.fontFamily')?.themeable).toBe(true);

		const bar = (name) =>
			getFieldsForGroup('bar')?.find(
				(field) => field.path.join('.') === name
			);
		expect(bar('stackOffset')?.enum).toContain('wiggle');

		const labels = (name) =>
			getFieldsForGroup('labels')?.find(
				(field) => field.path.join('.') === name
			);
		expect(labels('color')?.enum).toEqual([
			'contrast',
			'inherit',
			'black',
			'white',
		]);
		expect(labels('textOutlineMode')?.enum).toEqual([
			'background',
			'contrast',
		]);

		const lineField = (name) =>
			getFieldsForGroup('line')?.find(
				(field) => field.path.join('.') === name
			);
		expect(lineField('interpolation')?.enum).toContain('curveLinear');

		const treemap = (name) =>
			getFieldsForGroup('treemap')?.find(
				(field) => field.path.join('.') === name
			);
		expect(treemap('opacityRange')?.type).toBe('numberPair');
		expect(treemap('tile')?.enum).toContain('squarify');
	});
});
