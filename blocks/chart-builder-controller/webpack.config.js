const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const DependencyExtractionWebpackPlugin = require('@wordpress/dependency-extraction-webpack-plugin');

module.exports = {
	...defaultConfig,
	devtool: 'source-map',
	plugins: [
		...defaultConfig.plugins.filter(
			(plugin) =>
				'DependencyExtractionWebpackPlugin' !== plugin.constructor.name
		),
		new DependencyExtractionWebpackPlugin({
			injectPolyfill: true,
			// eslint-disable-next-line consistent-return
			requestToExternal(request) {
				if (request.includes('@prc/chart-builder')) {
					return 'prcChartBuilder';
				}
				if (request.includes('@prc/functions')) {
					return 'prcFunctions';
				}
				if (request.includes('@prc/hooks')) {
					return 'prcHooks';
				}
				if (request.includes('@prc/icons')) {
					return 'prcIcons';
				}
			},
			// eslint-disable-next-line consistent-return
			requestToHandle(request) {
				if ('@prc/chart-builder' === request) {
					return 'prc-charting-library';
				}
				if ('@prc/functions' === request) {
					return 'prc-functions';
				}
				if ('@prc/hooks' === request) {
					return 'prc-hooks';
				}
			},
		}),
	],
};
