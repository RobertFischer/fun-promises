/** @format */

const { name } = require("package.json");

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
	assets: [
		{ path: "dist/esnext/**/*", label: "ESNext Distribution" },
		{
			path: "dist/browser/min/index.js",
			label: "Browser Single-File Distribution",
		},
		{ path: "dist/browser/cjs/**/*", label: "Browser CJS Distribution" },
		{ path: "dist/browser/esm/**/*", label: "Browser ESM Distribution" },
		{ path: "dist/node/cjs/**/*", label: "Node CJS Distribution" },
		{ path: "dist/node/esm/**/*", label: "Node ESM Distribution" },
		{
			path: `dist/${name}-v\${nextRelease.version}.tgz`,
			label: "NPM Distribution",
		},
		{ path: "docs/**/*", label: "Docs" },
		{ path: "LICENSE", label: "License" },
		{ path: "README.md", label: "README" },
		{ path: "package.json", label: "package.json" },
	],
	tarballDir: "dist",
	changelogFile: "CHANGELOG.md",
	changelogTitle: `${name} Changelog`,
};
