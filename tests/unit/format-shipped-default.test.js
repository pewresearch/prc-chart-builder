/**
 * @jest-environment jsdom
 */
import { formatShippedDefaultValue } from '../../src/settings/format-shipped-default';

describe('formatShippedDefaultValue', () => {
	it('formats booleans and missing values', () => {
		expect(formatShippedDefaultValue(undefined, 'string')).toBe('—');
		expect(formatShippedDefaultValue(true, 'boolean')).toBe('true');
		expect(formatShippedDefaultValue(false, 'boolean')).toBe('false');
	});

	it('stringifies scalar defaults', () => {
		expect(formatShippedDefaultValue('bar', 'string')).toBe('bar');
		expect(formatShippedDefaultValue(20, 'number')).toBe('20');
	});

	it('formats numberPair defaults', () => {
		expect(formatShippedDefaultValue([0, 100], 'numberPair')).toBe(
			'[0, 100]'
		);
	});

	it('maps font tokens to theme family names when available', () => {
		window.prcChartBuilderThemeEditor = {
			fontFamilies: [
				{
					slug: 'sans-serif',
					name: 'Sans-Serif',
					value: "'franklin-gothic-urw', Verdana, Geneva, sans-serif",
				},
			],
		};

		expect(
			formatShippedDefaultValue(
				'var:preset|font-family|sans-serif',
				'font'
			)
		).toBe('Sans-Serif');

		delete window.prcChartBuilderThemeEditor;
	});

	it('maps legacy font stacks to theme family names when available', () => {
		window.prcChartBuilderThemeEditor = {
			fontFamilies: [
				{
					slug: 'sans-serif',
					name: 'Sans-Serif',
					value: "'franklin-gothic-urw', Verdana, Geneva, sans-serif",
				},
			],
		};

		expect(
			formatShippedDefaultValue(
				"'franklin-gothic-urw', Verdana, Geneva, sans-serif",
				'font'
			)
		).toBe('Sans-Serif');

		delete window.prcChartBuilderThemeEditor;
	});
});
