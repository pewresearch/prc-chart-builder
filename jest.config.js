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
	transformIgnorePatterns: [
		'/node_modules/(?!(d3-force|d3-dispatch|d3-timer|d3-quadtree)/)',
	],
};
