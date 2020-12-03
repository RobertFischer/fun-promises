/** @format */

import FunPromise from "./fun-promise";
import _ from "lodash";
import { NestedError } from "@robertfischer/ts-nested-error";

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

						it("rejects when provided a rejection", async () => {
							await expect(impl.resolve(Promise.reject("BOOM!"))).rejects.toBe(
								"BOOM!"
							);
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
					.then(() => Promise.reject("BOOM!"))
					.catch((e) => {
						expect(e).toBe("BOOM!");
						return "DONE!";
					})
			).resolves.toBe("DONE!");
		});

		it("returns the error when not passed an argument", async () => {
			const error = new Error("BOOM!");
			await expect(
				tokenFunPromise.then(() => Promise.reject(error)).catch()
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

		it("returns a clone", async () => {
			const value = [1, 2, 3, 4];
			await expect(
				FunPromise.resolve(value)
					.arrayify()
					.then((it) => {
						it.pop();
						return it;
					})
			).resolves.not.toBe(value);
			expect(value).toHaveLength(4);
		});

		it("does not resolve values when called without an argument", async () => {
			const rejection = Promise.reject("BOOM!");
			try {
				await expect(
					FunPromise.resolve([1, 2, rejection]).arrayify()
				).resolves.toBeArrayOfSize(3);
			} finally {
				rejection.catch((e) => {}); // Disarm the rejection
			}
		});

		it("resolves values when called with the sole argument `true`", async () => {
			const rejection = Promise.reject("BOOM!");
			await expect(
				FunPromise.resolve([1, 2, rejection]).arrayify(true)
			).rejects.toBe("BOOM!");
		});

		it("rejects values in order when called with the arguments `(true, true)`", async () => {
			const rejection1 = Promise.reject("BOOM!");
			const rejection2 = Promise.reject("BANG!");
			try {
				await expect(
					FunPromise.resolve([1, 2, rejection1, rejection2]).arrayify(
						true,
						true
					)
				).rejects.toBe("BOOM!");
			} finally {
				rejection1.catch((e) => {}); // Disarm the rejection
				rejection2.catch((e) => {}); // Disarm the rejection
			}
		});

		it("resolves values in order when called with the arguments `(true, true)`", async () => {
			let sawFirst = false;
			let sawSecond = false;
			let sawThird = false;
			let sawFourth = false;
			await expect(
				FunPromise.resolve([
					FunPromise.try(() => {
						expect(sawFirst).toBe(false);
						expect(sawSecond).toBe(false);
						expect(sawThird).toBe(false);
						expect(sawFourth).toBe(false);
						sawFirst = true;
						return 1;
					}),
					FunPromise.try(() => {
						expect(sawFirst).toBe(true);
						expect(sawSecond).toBe(false);
						expect(sawThird).toBe(false);
						expect(sawFourth).toBe(false);
						sawSecond = true;
						return 2;
					}),
					FunPromise.try(() => {
						expect(sawFirst).toBe(true);
						expect(sawSecond).toBe(true);
						expect(sawThird).toBe(false);
						expect(sawFourth).toBe(false);
						sawThird = true;
						return 3;
					}),
					FunPromise.try(() => {
						expect(sawFirst).toBe(true);
						expect(sawSecond).toBe(true);
						expect(sawThird).toBe(true);
						expect(sawFourth).toBe(false);
						sawFourth = true;
						return 4;
					}),
				]).arrayify(true, true)
			).resolves.toStrictEqual([1, 2, 3, 4]);
			expect(sawFirst).toBe(true);
			expect(sawSecond).toBe(true);
			expect(sawThird).toBe(true);
			expect(sawFourth).toBe(true);
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
			await expect(FunPromise.try(() => Promise.reject("BOOM!"))).rejects.toBe(
				"BOOM!"
			);
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

				it("works with some test values", async () => {
					const defaultValues = [1, 2, 4, 8, 16];
					const defaultMapper = (it) => {
						if (Math.random() < 0.5) {
							return Promise.resolve(it * 2);
						} else {
							return it * 2;
						}
					};
					await expect(
						runMap(defaultValues, defaultMapper)
					).resolves.toStrictEqual([2, 4, 8, 16, 32]);
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
						await expect(impl.reject(true)).rejects.toBe(true);
					});

					it("doesn't change the object that is rejected", async () => {
						const reason = { foo: true, bar: 42 };
						await expect(impl.reject(reason)).rejects.toBe(reason);
					});
				});
			}
		);
	});

	describe("coalesce", () => {
		function runCoalesce(args, test) {
			return FunPromise.coalesce(args, test);
		}

		it("basically works", async () => {
			await expect(
				runCoalesce([() => null, Promise.resolve(() => true)])
			).resolves.toBe(true);
		});

		it("returns the first resolving value", async () => {
			await expect(
				runCoalesce([() => FunPromise.delay(1000).resolve(true), () => false])
			).resolves.toBe(false);
		});

		it("returns the value that passes the test", async () => {
			await expect(
				runCoalesce([() => 2, () => 4], (it) => it > 2)
			).resolves.toBe(4);
		});

		it("throws the error if nothing passes the test", async () => {
			await expect(
				runCoalesce([() => Promise.reject("BOOM!"), () => 4], (it) => it > 4)
			).rejects.toBe("BOOM!");
		});

		it("punts appropriately after the first resolution", async () => {
			await expect(runCoalesce(_.times(3, (idx) => () => idx))).resolves.toBe(
				0
			);
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

						describe("basically works", () => {
							it("with no arg", async () => {
								await expect(runDelay()).resolves;
							});

							it("with one arg", async () => {
								await expect(runDelay(1000)).resolves.toBe(1000);
							});
						});
					});
				});
			});
		});
	});

	describe("simplify", () => {
		it("basically works", async () => {
			await expect(
				new FunPromise(Promise.resolve(Promise.resolve(true))).simplify()
			).resolves.toBe(true);
		});
	});

	describe("filter", () => {
		_.forEach([true, false], (staticVersion) => {
			describe(staticVersion ? "static" : "instance", () => {
				const defaultValues = [
					1,
					true,
					{},
					null,
					Promise.resolve(null),
					Promise.resolve(),
					"Hello, Dolly!",
				];
				const defaultExpect = [1, true, {}, "Hello, Dolly!"];
				const defaultTest = (it) => !_.isNil(it);
				function doFilter(values = defaultValues, test = defaultTest) {
					if (staticVersion) {
						return FunPromise.filter(values, test);
					} else {
						return FunPromise.resolve(values).filter(test);
					}
				}

				it("basically works", async () => {
					await expect(doFilter()).resolves.not.toBeEmpty();
					await expect(doFilter()).resolves.toBeArrayOfSize(4);
				});
			});
		});
	});

	describe("flatMap", () => {
		_.forEach([true, false], (staticVersion) => {
			describe(staticVersion ? "static" : "instance", () => {
				const defaultValues = [
					1,
					true,
					{},
					null,
					Promise.resolve(null),
					Promise.resolve(),
					"Hello, Dolly!",
				];
				const defaultMapper = (it) => {
					if (_.isNil(it)) {
						return [];
					} else {
						return [it];
					}
				};
				const defaultExpect = [1, true, {}, "Hello, Dolly!"];
				function doFlatMap(values = defaultValues, mapper = defaultMapper) {
					if (staticVersion) {
						return FunPromise.flatMap(values, mapper);
					} else {
						return FunPromise.resolve(values).flatMap(mapper);
					}
				}

				it("basically works", async () => {
					await expect(doFlatMap()).resolves.toStrictEqual(defaultExpect);
				});
			});
		});
	});

	describe("tap", () => {
		it("basically works", async () => {
			let sawTap = false;
			await expect(
				tokenFunPromise.tap((val) => {
					expect(val).toBe(true);
					sawTap = true;
					return false;
				})
			).resolves.toBe(true);
			expect(sawTap).toBe(true);
		});

		it("rejects if it throws an exception", async () => {
			let sawTap = false;
			await expect(
				tokenFunPromise.tap((val) => {
					sawTap = true;
					throw "BOOM!";
				})
			).rejects.toBe("BOOM!");
			expect(sawTap).toBe(true);
		});
	});

	describe("fold", () => {
		_.forEach([true, false], (staticVersion) => {
			describe(staticVersion ? "static" : "instance", () => {
				const defaultValues = [1, 2, 3, 4, 5];

				function doFold(
					values = defaultValues,
					initialValue = 0,
					accumulator = (a, b) => a + b
				) {
					if (staticVersion) {
						return FunPromise.fold(values, initialValue, accumulator);
					} else {
						return FunPromise.resolve(values).fold(initialValue, accumulator);
					}
				}

				it("basically works", async () => {
					const values = [1, 2, 3, 4, 5];
					await expect(doFold()).resolves.toBe(1 + 2 + 3 + 4 + 5);
				});
			});
		});
	});

	describe("tapCatch", () => {
		it("basically works", async () => {
			let sawTapCatch = false;
			await expect(
				FunPromise.reject("BOOM!").tapCatch((e) => {
					sawTapCatch = true;
					expect(e).toBe("BOOM!");
					return "BANG!";
				})
			).rejects.toBe("BOOM!");
			expect(sawTapCatch).toBe(true);
		});

		it("nests explosions", async () => {
			let sawCatch = false;
			const err1 = new Error("BOOM!");
			const err2 = new Error("BANG!");
			await expect(
				FunPromise.reject(err1)
					.tapCatch((e) => {
						throw err2;
					})
					.catch((e) => {
						sawCatch = true;
						expect(e).toBeInstanceOf(NestedError);
						expect(e).toHaveProperty("innerErrors");
						expect(e.innerErrors).toHaveLength(2);
						expect(e.innerErrors).toEqual([err1, err2]);
						return "Hello!";
					})
			).resolves.toBe("Hello!");
			expect(sawCatch).toBe(true);
		});
	});
});
