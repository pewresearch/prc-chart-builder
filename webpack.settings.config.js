const path = require('path');
const config = require('../../webpack.config');

module.exports = {
	...config,
	entry: {
		index: path.resolve(__dirname, 'src/settings/index.js'),
	},
	output: {
		...config.output,
		path: path.resolve(__dirname, 'build/settings'),
		library: undefined,
	},
};
