/**
 * Synced chart search — entity status must include scheduled ("future") charts
 * so editors can attach synced-chart blocks before publish time.
 *
 * @see feat(chart-builder): allow synced chart block to reference scheduled charts
 */

import '../polyfill-text-encoding.js';
import { describe, test, expect, jest } from '@jest/globals';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

jest.mock('@prc/components', () => ({
	WPEntitySearch: jest.fn(() => null),
}));

import ChartSearch from '../../src/synced-chart/chart-search.jsx';
import { WPEntitySearch } from '@prc/components';

describe('ChartSearch', () => {
	test('requests publish, draft, and future charts', () => {
		const setAttributes = jest.fn();
		renderToStaticMarkup(
			React.createElement(ChartSearch, { setAttributes })
		);

		expect(WPEntitySearch).toHaveBeenCalledTimes(1);
		const passed = WPEntitySearch.mock.calls[0][0];
		expect(passed.entityStatus).toEqual(['publish', 'draft', 'future']);
		expect(passed.entityType).toBe('postType');
		expect(passed.entitySubType).toBe('chart');
	});
});
