/** @format */

module.exports = {
	preset: "ts-jest/presets/js-with-ts",
	testEnvironment: "node",
	testTimeout: 60 * 1000,
	collectCoverage: true,
	coverageDirectory: "coverage",
	coverageReporters: ["text", "text-summary"],
	errorOnDeprecated: true,
	maxWorkers: "80%",
	verbose: true,
};
