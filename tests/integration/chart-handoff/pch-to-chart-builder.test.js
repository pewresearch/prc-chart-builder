/**
 * pch-to-chart-builder.js — Unit Tests
 *
 * Verifies that PCH handoff objects are correctly converted to CB v2 block
 * attributes. Tests cover all 8 supported chart types, schema version
 * enforcement, data mapping, axis inference, and type-specific options.
 */

import { describe, test, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { pchToChartBuilder } from '../../../includes/chart-handoff/src/pch-to-chart-builder.js';

const FIXTURES_DIR = path.join(
	__dirname,
	'../../fixtures/chart-handoff'
);

function loadFixture(name) {
	return JSON.parse(
		fs.readFileSync(path.join(FIXTURES_DIR, name), 'utf-8')
	);
}

// ---------------------------------------------------------------------------
// Schema enforcement
// ---------------------------------------------------------------------------

describe('pchToChartBuilder — schema enforcement', () => {
	test('throws when $schema is wrong version', () => {
		expect(() =>
			pchToChartBuilder({ $schema: 'prc-chart-handoff/v99' })
		).toThrow('Unsupported PCH schema');
	});

	test('throws when $schema is completely wrong', () => {
		expect(() =>
			pchToChartBuilder({ $schema: 'something-else/v1' })
		).toThrow('Unsupported PCH schema');
	});

	test('accepts correct $schema', () => {
		const pch = loadFixture('bar-horizontal.pch.json');
		expect(() => pchToChartBuilder(pch)).not.toThrow();
	});
});

// ---------------------------------------------------------------------------
// _version
// ---------------------------------------------------------------------------

describe('pchToChartBuilder — output _version', () => {
	test('always sets _version to v2', () => {
		const attrs = pchToChartBuilder(loadFixture('bar-horizontal.pch.json'));
		expect(attrs._version).toBe('v2');
	});
});

// ---------------------------------------------------------------------------
// Layout mapping
// ---------------------------------------------------------------------------

describe('pchToChartBuilder — layout', () => {
	test('bar horizontal: layout.type=bar, orientation=horizontal', () => {
		const attrs = pchToChartBuilder(loadFixture('bar-horizontal.pch.json'));
		expect(attrs.layout.type).toBe('bar');
		expect(attrs.layout.orientation).toBe('horizontal');
	});

	test('bar vertical (column): layout.type=column, orientation=vertical', () => {
		const attrs = pchToChartBuilder(loadFixture('bar-vertical.pch.json'));
		expect(attrs.layout.type).toBe('column');
		expect(attrs.layout.orientation).toBe('vertical');
	});

	test('stacked-bar: layout.type=stacked-bar', () => {
		const attrs = pchToChartBuilder(loadFixture('stacked-bar.pch.json'));
		expect(attrs.layout.type).toBe('stacked-bar');
	});

	test('diverging-bar: layout.type=diverging-bar', () => {
		const attrs = pchToChartBuilder(loadFixture('diverging-bar.pch.json'));
		expect(attrs.layout.type).toBe('diverging-bar');
	});

	test('line: layout.type=line', () => {
		const attrs = pchToChartBuilder(loadFixture('line.pch.json'));
		expect(attrs.layout.type).toBe('line');
	});

	test('area: layout.type=area', () => {
		const attrs = pchToChartBuilder(loadFixture('area.pch.json'));
		expect(attrs.layout.type).toBe('area');
	});

	test('dot-plot: layout.type=dot-plot', () => {
		const attrs = pchToChartBuilder(loadFixture('dot-plot.pch.json'));
		expect(attrs.layout.type).toBe('dot-plot');
	});

	test('scatter: layout.type=scatter', () => {
		const attrs = pchToChartBuilder(loadFixture('scatter.pch.json'));
		expect(attrs.layout.type).toBe('scatter');
	});

	test('width and height are passed through', () => {
		const attrs = pchToChartBuilder(loadFixture('bar-horizontal.pch.json'));
		expect(attrs.layout.width).toBe(640);
		expect(attrs.layout.height).toBe(400);
	});
});

// ---------------------------------------------------------------------------
// Data mapping
// ---------------------------------------------------------------------------

describe('pchToChartBuilder — data', () => {
	test('io.chartData is wide format when categoryColumn is set (pivoted from tidy PCH)', () => {
		const pch = loadFixture('bar-horizontal.pch.json');
		const attrs = pchToChartBuilder(pch);
		expect(attrs.io.chartData).toEqual([
			{ x: 'Germany', Favorable: 40, Unfavorable: 20 },
			{ x: 'Spain', Favorable: 50, Unfavorable: 30 },
		]);
	});

	test('dataRender.x is always "x" (editor table parser convention)', () => {
		const attrs = pchToChartBuilder(loadFixture('bar-horizontal.pch.json'));
		expect(attrs.dataRender.x).toBe('x');
	});

	test('dataRender.y maps from data.yColumn', () => {
		const attrs = pchToChartBuilder(loadFixture('bar-horizontal.pch.json'));
		expect(attrs.dataRender.y).toBe('share');
	});

	test('dataRender.categories derived from categoryColumn values', () => {
		const attrs = pchToChartBuilder(loadFixture('bar-horizontal.pch.json'));
		expect(attrs.dataRender.categories).toEqual(['Favorable', 'Unfavorable']);
	});

	test('io.availableCategories matches dataRender.categories', () => {
		const attrs = pchToChartBuilder(loadFixture('bar-horizontal.pch.json'));
		expect(attrs.io.availableCategories).toEqual(attrs.dataRender.categories);
	});

	test('io.independentVariable is "x" (matches editor table parser key)', () => {
		const attrs = pchToChartBuilder(loadFixture('bar-horizontal.pch.json'));
		expect(attrs.io.independentVariable).toBe('x');
	});

	test('null categoryColumn produces empty categories array', () => {
		const attrs = pchToChartBuilder(loadFixture('bar-vertical.pch.json'));
		expect(attrs.dataRender.categories).toEqual([]);
	});

	test('xType=date maps to xScale=time', () => {
		const pch = loadFixture('bar-horizontal.pch.json');
		const modified = { ...pch, data: { ...pch.data, xType: 'date' } };
		const attrs = pchToChartBuilder(modified);
		expect(attrs.dataRender.xScale).toBe('time');
	});

	test('xType=categorical maps to xScale=linear', () => {
		const attrs = pchToChartBuilder(loadFixture('bar-horizontal.pch.json'));
		expect(attrs.dataRender.xScale).toBe('linear');
	});

	test('sortOrder is not set (defers to variation template default)', () => {
		const attrs = pchToChartBuilder(loadFixture('bar-horizontal.pch.json'));
		expect(attrs.dataRender.sortOrder).toBeUndefined();
	});
});

// ---------------------------------------------------------------------------
// Metadata mapping
// ---------------------------------------------------------------------------

describe('pchToChartBuilder — metadata', () => {
	test('maps title, subtitle, note, source', () => {
		const pch = loadFixture('bar-horizontal.pch.json');
		const attrs = pchToChartBuilder(pch);
		expect(attrs.metadata.title).toBe(pch.metadata.title);
		expect(attrs.metadata.subtitle).toBe(pch.metadata.subtitle);
		expect(attrs.metadata.note).toBe(pch.metadata.note);
		expect(attrs.metadata.source).toBe(pch.metadata.source);
	});

	test('metadata.active is true', () => {
		const attrs = pchToChartBuilder(loadFixture('bar-horizontal.pch.json'));
		expect(attrs.metadata.active).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

describe('pchToChartBuilder — colors', () => {
	test('config.colors passed through to CB colors attribute', () => {
		const attrs = pchToChartBuilder(loadFixture('bar-horizontal.pch.json'));
		expect(attrs.colors).toEqual(['#456A83', '#BF3B27']);
	});

	test('no colors in config leaves colors attribute absent', () => {
		const pch = loadFixture('bar-horizontal.pch.json');
		const { colors: _omit, ...configWithoutColors } = pch.config;
		const modified = { ...pch, config: configWithoutColors };
		const attrs = pchToChartBuilder(modified);
		expect(attrs.colors).toBeUndefined();
	});
});

// ---------------------------------------------------------------------------
// Axis mapping
// ---------------------------------------------------------------------------

describe('pchToChartBuilder — axis mapping', () => {
	test('yType=percentage infers dependentAxis.tickUnit=%', () => {
		const attrs = pchToChartBuilder(loadFixture('bar-horizontal.pch.json'));
		expect(attrs.dependentAxis.tickUnit).toBe('%');
	});

	test('explicit dependentAxis.tickUnit overrides yType inference', () => {
		const pch = loadFixture('bar-horizontal.pch.json');
		const modified = {
			...pch,
			data: { ...pch.data, yType: 'numeric' },
			config: { ...pch.config, dependentAxis: { tickUnit: '$' } },
		};
		const attrs = pchToChartBuilder(modified);
		expect(attrs.dependentAxis.tickUnit).toBe('$');
	});

	test('independentAxis.label is passed through', () => {
		const pch = loadFixture('line.pch.json');
		const modified = {
			...pch,
			config: { ...pch.config, independentAxis: { label: 'Year' } },
		};
		const attrs = pchToChartBuilder(modified);
		expect(attrs.independentAxis.label).toBe('Year');
	});
});

// ---------------------------------------------------------------------------
// Legend and labels
// ---------------------------------------------------------------------------

describe('pchToChartBuilder — legend and labels', () => {
	test('legend.active is mapped', () => {
		const attrs = pchToChartBuilder(loadFixture('bar-horizontal.pch.json'));
		expect(attrs.legend.active).toBe(true);
	});

	test('labels.active and position are mapped', () => {
		const attrs = pchToChartBuilder(loadFixture('bar-horizontal.pch.json'));
		expect(attrs.labels.active).toBe(true);
		expect(attrs.labels.labelPositionBar).toBe('inside');
	});
});

// ---------------------------------------------------------------------------
// Type-specific options
// ---------------------------------------------------------------------------

describe('pchToChartBuilder — type-specific options', () => {
	test('barOptions.stackOffset maps to bar.stackOffset', () => {
		const pch = loadFixture('stacked-bar.pch.json');
		const attrs = pchToChartBuilder(pch);
		expect(attrs.bar?.stackOffset).toBe('none');
	});

	test('lineOptions.strokeWidth maps to line.strokeWidth', () => {
		const attrs = pchToChartBuilder(loadFixture('line.pch.json'));
		expect(attrs.line?.strokeWidth).toBe(3);
	});

	test('lineOptions.showPoints maps to line.showPoints', () => {
		const attrs = pchToChartBuilder(loadFixture('line.pch.json'));
		expect(attrs.line?.showPoints).toBe(true);
	});

	test('dotPlotOptions.connectPoints maps to dotPlot.connectPoints', () => {
		const attrs = pchToChartBuilder(loadFixture('dot-plot.pch.json'));
		expect(attrs.dotPlot?.connectPoints).toBe(true);
	});

	test('scatterOptions.showRegressionLine maps to regression.active', () => {
		const attrs = pchToChartBuilder(loadFixture('scatter.pch.json'));
		expect(attrs.regression?.active).toBe(true);
	});

	test('scatterOptions.regressionType maps to regression.type', () => {
		const attrs = pchToChartBuilder(loadFixture('scatter.pch.json'));
		expect(attrs.regression?.type).toBe('linear');
	});

	test('divergingBarOptions.positiveCategories maps correctly', () => {
		const attrs = pchToChartBuilder(loadFixture('diverging-bar.pch.json'));
		expect(attrs.divergingBar?.positiveCategories).toEqual(['Favorable']);
	});

	test('divergingBarOptions.negativeCategories maps correctly', () => {
		const attrs = pchToChartBuilder(loadFixture('diverging-bar.pch.json'));
		expect(attrs.divergingBar?.negativeCategories).toEqual(['Unfavorable']);
	});

	test('areaFillOpacity maps to line.areaFillOpacity for area charts', () => {
		const attrs = pchToChartBuilder(loadFixture('area.pch.json'));
		expect(attrs.line?.areaFillOpacity).toBe(0.4);
	});
});
