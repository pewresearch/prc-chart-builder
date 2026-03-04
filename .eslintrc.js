module.exports = {
	extends: ['../../.eslintrc.js'],
	rules: {
		// Disable problematic WordPress design system token rules
		'@wordpress/no-setting-ds-tokens': 'off',
		'@wordpress/no-unknown-ds-tokens': 'off',
		'max-lines-per-function': 'off',
		'max-lines': 'off',
		// Disable import resolution errors
		'import/no-unresolved': 'off',
		'import/no-extraneous-dependencies': 'off',
	},
	settings: {
		// Override import resolver to prevent typescript resolver errors
		'import/resolver': {
			node: {},
		},
	},
};
