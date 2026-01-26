/**
 * Jest setup file
 * Mocks WordPress dependencies for testing
 */

// Mock @wordpress/block-editor
jest.mock('@wordpress/block-editor', () => ({
	InnerBlocks: () => null,
	useBlockProps: jest.fn(() => ({})),
}));

// Mock @wordpress/blocks
jest.mock('@wordpress/blocks', () => ({
	registerBlockType: jest.fn(),
}));

// Mock @wordpress/data
jest.mock('@wordpress/data', () => ({
	register: jest.fn(),
	select: jest.fn(),
	useSelect: jest.fn(),
	useDispatch: jest.fn(),
}));

// Mock @wordpress/hooks
jest.mock('@wordpress/hooks', () => ({
	addFilter: jest.fn(),
	addAction: jest.fn(),
}));

// Suppress console logs during tests
global.console = {
	...console,
	log: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
};

// Mock window object for charting library
global.window = {
	prcCustomCharts: {
		baseConfig: jest.fn(),
	},
	prcChartingLibrary: {
		baseConfig: jest.fn(),
	},
};
