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
	"Browser Single-File": "./dist/browser/index.js",
	"ES6 AMD Single-File": readDistPath("amd", "outFile"),
	"ES6 CJS": readDistPath("cjs"),
	"ES6 ESM": readDistPath("esm"),
	"ES6 UMD": readDistPath("umd"),
	"Node 10": readDistPath("node10"),
	"Node 12": readDistPath("node12"),
	"Node 14": readDistPath("node14"),
	"React Native": readDistPath("rn"),
};

const assets = _.concat(
	{ path: "dist/docs.tgz", label: "Docs" },
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
