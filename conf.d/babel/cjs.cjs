/** @format */

module.exports = {
	sourceMaps: true,
	compact: true,
	minified: true,
	comments: false,
	moduleId: "FunPromise",
	plugins: [
		["@babel/plugin-proposal-class-properties", { loose: true }],
		[
			"@babel/plugin-transform-runtime",
			{ corejs: { version: 3, proposals: true }, useESModules: false },
		],
		"babel-plugin-lodash",
	],
	presets: [
		[
			"@babel/preset-env",
			{
				bugfixes: true,
				loose: true,
				modules: "commonjs",
				useBuiltIns: "usage",
				corejs: { version: 3, proposals: true },
				shippedProposals: true,
				debug: true,
			},
		],
		"minify",
	],
};
