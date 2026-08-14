/**
 * Jest configuration for chart-builder plugin.
 * Unit tests live under monorepo root tests/prc-chart-builder/unit/.
 */
const path = require('path');

const unitRoot = path.resolve(__dirname, '../../tests/prc-chart-builder/unit');

module.exports = {
	...require('@wordpress/scripts/config/jest-unit.config'),
	rootDir: __dirname,
	roots: [unitRoot],
	testMatch: ['**/*.test.js'],
	setupFilesAfterEnv: [`${unitRoot}/setup-jest.js`],
	moduleNameMapper: {
		'\\.(scss|css)$': `${unitRoot}/__mocks__/styleMock.js`,
	},
	transform: {
		'^.+\\.(js|jsx|ts|tsx)$':
			require.resolve('@wordpress/scripts/config/babel-transform'),
	},
	// Transform ESM d3 / @visx packages pulled in via @prc/charting-utilities.
	// Match any `d3-*` package (prefix), not only the force family.
	transformIgnorePatterns: [
		'/node_modules/(?!((@visx|internmap|delaunator|robust-predicates)/|d3-))',
	],
};
