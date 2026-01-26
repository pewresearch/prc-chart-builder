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
};
