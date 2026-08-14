const path = require('path');
const defaultConfig = require('@wordpress/scripts/config/webpack.config');

module.exports = {
	...defaultConfig,
	entry: {
		index: path.resolve(__dirname, 'src/admin-dataview/index.jsx'),
	},
	output: {
		...defaultConfig.output,
		path: path.resolve(__dirname, 'build/admin-dataview'),
	},
	plugins: (defaultConfig.plugins || [])
		.filter(Boolean)
		.filter((plugin) => plugin.constructor.name !== 'CopyPlugin'),
};
