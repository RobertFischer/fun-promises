/** @format */

const { dependencies } = require("./package.json");

module.exports = (api) => {
	api.cache(() => !!process.env.BABEL_RESET_CACHE || true);
	return {
		sourceMaps: true,
		preset: ["@babel/preset-env"],
		plugins: [
			[
				"babel-plugin-import",
				{
					libraryName: "lodash",
					libraryDirectory: "",
					camel2DashComponentName: false,
				},
			],
			[
				"@babel/plugin-transform-runtime",
				{
					corejs: 3,
					version: dependencies["@babel/runtime-corejs3"],
				},
			],
			["babel-plugin-minify-dead-code-elimination", { tdz: true }],
			"babel-plugin-minify-simplify",
			"babel-plugin-remove-debug",
		],
	};
};
