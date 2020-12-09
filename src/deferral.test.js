/** @format */

import FunPromise from "./fun-promise";
import Deferral from "./deferral";
import { PromiseState } from "./types";
import _ from "lodash";

describe("Deferral", () => {
	it("can be constructed", () => {
		const deferral = new Deferral();
		expect(deferral).not.toBeNil();
	});

	describe("promise", () => {
		it("is a FunPromise", () => {
			const deferral = new Deferral();
			expect(deferral.promise).toBeInstanceOf(FunPromise);
		});
	});

	describe("resolve", () => {
		it("basically works", async () => {
			const deferral = new Deferral();
			deferral.resolve(true);
			await expect(deferral.resolve(true)).resolves.toBe(true);
		});

		it("does not change resolved value if called multiple times", async () => {
			const deferral = new Deferral();
			await expect(deferral.resolve(true)).resolves.toBe(true);
			await expect(deferral.resolve(false)).resolves.toBe(true);
		});
	});

	describe("reject", () => {
		it("basically works", async () => {
			const deferral = new Deferral();
			await expect(deferral.reject(new Error("BOOM!"))).rejects.toHaveProperty(
				"message",
				"BOOM!"
			);
		});

		it("does not change reason if called multiple times", async () => {
			const deferral = new Deferral();
			await expect(deferral.reject(new Error("BOOM!"))).rejects.toHaveProperty(
				"message",
				"BOOM!"
			);
			await expect(deferral.reject(new Error("BANG!"))).rejects.toHaveProperty(
				"message",
				"BOOM!"
			);
		});
	});
});
