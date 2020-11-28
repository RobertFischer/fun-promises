/** @format */

module.exports = {
	preset: "ts-jest/presets/js-with-ts",
	testEnvironment: "node",
	testTimeout: 60 * 1000,
	collectCoverage: true,
	coverageDirectory: "docs/coverage",
	coverageReporters: ["text", "text-summary"],
	errorOnDeprecated: true,
	maxWorkers: "80%",
	verbose: true,
	setupFilesAfterEnv: ["jest-extended"],
	globals: {
		"ts-jest": {
			tsconfig: `${__dirname}/tsconfig/test.json`,
		},
	},
	coverageThreshold: {
		global: {
			branches: 99,
			functions: 99,
			lines: 99,
			statements: -10,
		},
	},
};
