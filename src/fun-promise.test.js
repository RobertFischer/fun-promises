/** @format */

import FunPromise from "./fun-promise";
import _ from "lodash";

const tokenPromise = new Promise((resolve) => resolve(true));
const tokenFunPromise = new FunPromise(tokenPromise);

describe("FunPromise", () => {
	it("can be constructed and resolved", async () => {
		await expect(new FunPromise(tokenPromise)).resolves.toBe(true);
	});

	describe("resolve", () => {
		_.forEach(
			{ static: FunPromise, instance: tokenFunPromise },
			(impl, name) => {
				describe(name, () => {
					describe("resolves correctly", () => {
						it("with a value", async () => {
							await expect(impl.resolve(tokenPromise)).resolves.toBe(true);
						});

						it("without a value", async () => {
							await expect(impl.resolve()).resolves.toBeNil();
						});
					});
				});
			}
		);
	});

	describe("then", () => {
		it("works without onrejected", async () => {
			await expect(tokenFunPromise.then(_.identity)).resolves.toBe(true);
		});
	});

	describe("catch", () => {
		it("handles rejections", async () => {
			await expect(
				tokenFunPromise
					.then(() => {
						throw new Error("BOOM!");
					})
					.catch((e) => {
						expect(e).toBeInstanceOf(Error);
						expect(e).toHaveProperty("message", "BOOM!");
						return "DONE!";
					})
			).resolves.toBe("DONE!");
		});

		it("returns the error when not passed an argument", async () => {
			const error = new Error("BOOM!");
			await expect(
				tokenFunPromise
					.then(() => {
						throw error;
					})
					.catch()
			).resolves.toBe(error);
		});
	});

	describe("arrayify", () => {
		it("basically works", async () => {
			const value = [1, 2, 3, 4];
			await expect(FunPromise.resolve(value).arrayify()).resolves.toStrictEqual(
				value
			);
		});
	});

	describe("all", () => {
		_.forEach([true, false], (staticVersion) => {
			describe(staticVersion ? "static" : "instance", () => {
				describe("basically works", () => {
					_.times(10, (argCount) => {
						const simpleArgs = _.times(argCount, (i) => 2 ** i);

						function runAll(args) {
							if (staticVersion) {
								return FunPromise.all(args);
							} else {
								return FunPromise.resolve(args).all();
							}
						}

						it(`for ${argCount} arguments`, async () => {
							await expect(runAll(simpleArgs)).resolves.toStrictEqual(
								simpleArgs
							);
						});
					});
				});
			});
		});
	});

	describe("try", () => {
		it("basically works", async () => {
			await expect(FunPromise.try(() => true)).resolves.toBe(true);
		});

		it("works with one argument", async () => {
			await expect(FunPromise.try((i) => i, 42)).resolves.toBe(42);
		});

		it("explodes properly", async () => {
			await expect(
				FunPromise.try(() => {
					throw new Error("BOOM!");
				})
			).rejects.toHaveProperty("message", "BOOM!");
		});
	});

	describe("map", () => {
		_.forEach([true, false], (staticVersion) => {
			describe(staticVersion ? "static" : "instance", () => {
				function runMap(args, mapper) {
					if (staticVersion) {
						return FunPromise.map(args, mapper);
					} else {
						return FunPromise.resolve(args).map(mapper);
					}
				}

				it("basically works", async () => {
					await expect(
						runMap(["Hello", "Goodbye"], (it) => `${it}, World!`)
					).resolves.toStrictEqual(["Hello, World!", "Goodbye, World!"]);
				});
			});
		});
	});

	describe("Symbol.toStringTag", () => {
		it("is the same as the promise passed in", () => {
			const promise = new Promise((resolve) => resolve());
			const promiseTag = promise[Symbol.toStringTag];
			expect(promiseTag).not.toBeNil();
			expect(new FunPromise(promise)[Symbol.toStringTag]).toBe(promiseTag);
		});
	});

	describe("finally", () => {
		it("returns the same promise when given no arguments", () => {
			expect(tokenFunPromise.finally()).toBe(tokenFunPromise);
		});

		it("executes on resolution", async () => {
			let finallyExecuted = false;
			await expect(
				FunPromise.resolve(false).finally(() => {
					finallyExecuted = true;
				})
			).resolves.toBe(false);
			expect(finallyExecuted).toBe(true);
		});

		it("executes on rejection", async () => {
			let finallyExecuted = false;
			await expect(
				FunPromise.reject("BOOM!").finally(() => {
					finallyExecuted = true;
				})
			).rejects.toBe("BOOM!");
			expect(finallyExecuted).toBe(true);
		});
	});

	describe("reject", () => {
		_.forEach(
			{ static: FunPromise, instance: tokenFunPromise },
			(impl, name) => {
				describe(name, () => {
					it("rejects correctly", async () => {
						await expect(impl.reject(tokenPromise)).rejects.toBe(true);
					});
				});
			}
		);
	});

	describe("coalesce", () => {
		_.forEach([true, false], (staticVersion) => {
			describe(staticVersion ? "static" : "instance", () => {
				function runCoalesce(args, test) {
					if (staticVersion) {
						return FunPromise.coalesce(args, test);
					} else {
						return FunPromise.resolve(args).coalesce(test);
					}
				}

				it("basically works", async () => {
					await expect(runCoalesce([() => true, () => false])).resolves.toBe(
						true
					);
				});

				it("returns the first resolving value", async () => {
					await expect(
						runCoalesce([
							() => FunPromise.delay(1000).resolve(true),
							() => false,
						])
					).resolves.toBe(false);
				});

				it("returns the value that passes the test", async () => {
					await expect(
						runCoalesce([() => 2, () => 4], (it) => it > 2)
					).resolves.toBe(4);
				});

				it("throws the error if nothing passes the test", async () => {
					await expect(
						runCoalesce(
							[
								() => {
									throw "BOOM!";
								},
								() => 4,
							],
							(it) => it > 4
						)
					).rejects.toBe("BOOM!");
				});
			});
		});
	});

	describe("delay", () => {
		_.forEach([true, false], (staticVersion) => {
			describe(staticVersion ? "static" : "instance", () => {
				_.forEach([-1000, -1, 0, 1, 1000], (delayMs) => {
					describe(`When requesting a delay of ${delayMs} milliseconds`, () => {
						function runDelay(arg) {
							if (staticVersion) {
								return FunPromise.delay(delayMs, arg);
							} else {
								return FunPromise.resolve().delay(delayMs, arg);
							}
						}

						it("basically works with no arg", async () => {
							await expect(runDelay()).resolves;
						});

						it("basically works with one arg", async () => {
							await expect(runDelay(1000)).resolves.toBe(1000);
						});
					});
				});
			});
		});
	});
});
