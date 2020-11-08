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
		{ path: "dist/esnext.tar.xz", label: "ESNext Distribution" },
		{ path: "dist/browser.tar.xz", label: "Browser Distribution" },
		{ path: "dist/node.tar.xz", label: "Node Distribution" },
		{
			path: `dist/${name}-v\${nextRelease.version}.tgz`,
			label: "NPM Distribution",
		},
		{ path: "docs/CHANGELOG.md", label: "Changelog" },
		{ path: "docs/index.md", label: "API" },
		{ path: "LICENSE", label: "License" },
		{ path: "README.md", label: "README" },
		{ path: "package.json", label: "package.json" },
	],
	tarballDir: "dist",
	changelogFile: "docs/CHANGELOG.md",
	changelogTitle: `${name} Changelog`,
};
