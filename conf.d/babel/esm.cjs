/** @format */

module.exports = {
	sourceMaps: true,
	compact: true,
	minified: true,
	comments: false,
	moduleId: "FunPromise",
	plugins: [
		[
			"@babel/plugin-transform-runtime",
			{ corejs: { version: 3, proposals: true }, useESModules: true },
		],
		"babel-plugin-lodash",
		["@babel/plugin-proposal-class-properties", { loose: true }],
	],
	presets: [
		[
			"@babel/preset-env",
			{
				bugfixes: true,
				loose: true,
				modules: false,
				useBuiltIns: "usage",
				corejs: { version: 3, proposals: true },
				shippedProposals: true,
				debug: true,
			},
		],
	],
};
