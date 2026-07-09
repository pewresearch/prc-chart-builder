/**
 * Jest configuration for chart-builder plugin
 */
module.exports = {
	...require('@wordpress/scripts/config/jest-unit.config'),
	testMatch: ['**/tests/**/*.test.js'],
	setupFilesAfterEnv: ['<rootDir>/tests/setup-jest.js'],
	moduleNameMapper: {
		'\\.(scss|css)$': '<rootDir>/tests/__mocks__/styleMock.js',
	},
	transform: {
		'^.+\\.(js|jsx|ts|tsx)$':
			require.resolve('@wordpress/scripts/config/babel-transform'),
	},
	transformIgnorePatterns: [
		'/node_modules/(?!(d3-force|d3-dispatch|d3-timer|d3-quadtree)/)',
	],
};
