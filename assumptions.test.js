/**
 * /*
 * This file contains tests for various assumptions that we made while implementing the code.
 * If these tests start to fail, then we will have bugs.
 *
 * @format
 */

const _ = require("lodash");

describe("lodash", () => {
	describe("castArray", () => {
		// In arrayify, we once assumed that iterables were turned into arrays by _.castArray
		it("DOES NOT turn iterables into arrays", () => {
			const rangeIterable = {
				from: 1,
				to: 5,

				[Symbol.iterator]() {
					this.current = this.from;
					return this;
				},

				next() {
					const { current, to } = this;
					this.current++;
					return {
						value: current,
						done: current > to,
					};
				},
			};

			expect([...rangeIterable]).toHaveLength(5);

			expect(_.castArray(rangeIterable)).toHaveLength(1);
		});
	});

	describe("toArray", () => {
		it("does turn iterables into arrays", () => {
			const rangeIterable = {
				from: 1,
				to: 5,

				[Symbol.iterator]() {
					this.current = this.from;
					return this;
				},

				next() {
					const { current, to } = this;
					this.current++;
					return {
						value: current,
						done: current > to,
					};
				},
			};

			expect([...rangeIterable]).toHaveLength(5);

			expect(_.toArray(rangeIterable)).toHaveLength(5);
		});
	});
});
