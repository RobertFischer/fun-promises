/** @format */

const _ = require("lodash");
const path = require("path");
const { name } = require("./package.json");

function readDistPath(file, prop = "outDir") {
	return path.relative(
		__dirname,
		path.resolve(
			"./tsconfig",
			require(`./tsconfig/${file}.json`).compilerOptions[prop]
		)
	);
}

const distributions = {
	NPM: `dist/${name}-v\${nextRelease.version}.tgz`,
	"Browser - Single File": "./dist/browser.index.js.xz",
	"Browser - with Source Maps": "./dist/browser.tar.xz",
	"ES6 AMD - Single File": "./dist/amd.index.js.xz",
	"ES6 AMD - with Source Maps": "./dist/amd.tar.xz",
	"ES6 CJS": "./dist/cjs.tar.xz",
	"ES6 ESM": "./dist/esm.tar.xz",
	"ES6 UMD": "./dist/umd.tar.xz",
	"Node 10": "./dist/v10.tar.xz",
	"Node 12": "./dist/v12.tar.xz",
	"Node 14": "./dist/v14.tar.xz",
	"React Native": "./dist/react-native-tar.xz",
};

const assets = _.concat(
	{ path: "dist/docs.tar.xz", label: "Docs" },
	{ path: "LICENSE", label: "License" },
	_.map(distributions, (path, label) => ({ path, label }))
);
console.debug(assets);

module.exports = {
	branches: [
		{ name: "latest" },
		"+([0-9])?(.{+([0-9]),x}).x",
		{ name: "next", prerelease: "rc" },
	],
	plugins: [
		"@semantic-release/commit-analyzer",
		"@semantic-release/changelog",
		"@semantic-release/release-notes-generator",
		"@semantic-release/github",
		"@semantic-release/npm",
		"@semantic-release/git",
		"semantic-release-npm-deprecate-old-versions",
	],
	preset: "conventionalcommits",
	tarballDir: "dist",
	changelogFile: "CHANGELOG.md",
	changelogTitle: `${name} Changelog`,
	assets,
};
