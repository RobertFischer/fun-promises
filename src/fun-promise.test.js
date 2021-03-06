/** @format */

import FunPromise from "./fun-promise";
import _ from "lodash";
import { NestedError } from "ts-nested-error";
import { Fulfillment, Rejection } from "./types";

const tokenPromise = new Promise((resolve) => resolve(true));
const tokenFunPromise = new FunPromise(tokenPromise);

function withRejection(rejectionReason, callback) {
	const rejection = Promise.reject(rejectionReason);
	try {
		return callback(rejection);
	} finally {
		rejection.catch(_.noop); // Disable uncaught exception issues
	}
}

describe("FunPromise", () => {
	it("can be constructed and resolved", async () => {
		await expect(new FunPromise(tokenPromise)).resolves.toBe(true);
	});

	describe("resolve/return", () => {
		_.forEach(
			{ static: FunPromise, instance: tokenFunPromise },
			(impl, implName) => {
				_.forEach(["resolve", "return"], (methodName) => {
					describe(methodName, () => {
						describe(implName, () => {
							function doResolve(value) {
								return impl[methodName](value);
							}

							it("rejects when provided a rejection", async () => {
								await expect(doResolve(Promise.reject("BOOM!"))).rejects.toBe(
									"BOOM!"
								);
							});

							it("does not resolve the elements of an array", async () => {
								expect.hasAssertions();
								await withRejection("BOOM!", async (rejection) => {
									await expect(doResolve([rejection])).resolves.toHaveLength(1);
								});
							});

							describe("resolves correctly", () => {
								it("with a value", async () => {
									await expect(doResolve(tokenPromise)).resolves.toBe(true);
								});

								it("returns the FunPromise if passed a FunPromise", () => {
									expect(doResolve(tokenFunPromise)).toEqual(tokenFunPromise);
								});

								it("without a value", async () => {
									await expect(doResolve()).resolves.toBeNil();
								});
							});
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
			await expect(
				FunPromise.resolve([
					Promise.resolve(1),
					FunPromise.resolve(2),
				]).arrayify(true)
			).resolves.toEqual([1, 2]);
		});

		it("rejects values when called with the sole argument `true` and a rejection in the mix", async () => {
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
						expect(e).toHaveProperty("message", "Error thrown in 'tapCatch'");
						expect(e).toHaveProperty("innerErrors");
						expect(e.innerErrors).toHaveLength(2);
						expect(e.innerErrors).toEqual([err1, err2]);
						return "Hello!";
					})
			).resolves.toBe("Hello!");
			expect(sawCatch).toBe(true);
		});
	});

	describe("tapEach", () => {
		it("basically works", async () => {
			const values = [
				123,
				Promise.resolve(true),
				"Hello, Dolly!",
				null,
				undefined,
			];
			const funPromise = FunPromise.resolve(values);
			let count = 0;
			await expect(
				funPromise.tapEach(() => {
					count++;
				})
			).resolves.toEqual(await Promise.all(values));
			expect(count).toBe(values.length);
		});
	});

	describe("wrapError", () => {
		it("basically works", async () => {
			const reason = "BOOM!";
			await expect(
				FunPromise.reject(reason).wrapError("BANG!")
			).rejects.toHaveProperty("message", "BANG!");
			await expect(
				FunPromise.reject(reason).wrapError("BANG!")
			).rejects.toHaveProperty("innerError");
		});
	});

	describe("wrapErrors", () => {
		it("basically works", async () => {
			const err1 = new Error("BOOM!");
			const err2 = new Error("BANG!");
			await expect(
				FunPromise.resolve([Promise.reject(err1), Promise.reject(err2)])
					.wrapErrors("ERRORS!")
					.catch((e) => {
						expect(e).toBeInstanceOf(NestedError);
						expect(e).toHaveProperty("message", "ERRORS!");
						expect(e.innerErrors).toHaveLength(2);
						expect(e.innerErrors).toEqual([err1, err2]);
						return true;
					})
			).resolves.toBe(true);
		});

		it("doesn't do anything if there is no error", async () => {
			const values = [1, 2, 3, true, false, null, undefined];
			await expect(
				FunPromise.resolve(values).wrapErrors("ERRORS!")
			).resolves.toEqual(values);
		});
	});

	describe("cancellation", () => {
		it("initially reports not cancelled", () => {
			expect(FunPromise.resolve(true).isCancelled()).toBe(false);
		});

		it("reports cancelled after cancel is called", () => {
			expect(FunPromise.resolve(true).cancel().isCancelled()).toBe(true);
		});

		it("prevents resolution after cancellation", () => {
			let resolver;
			let sawResolve = false;
			const promise = new Promise((resolve) => {
				resolver = resolve;
			}).then(() => {
				sawResolve = true;
			});
			expect(resolver).not.toBeNil();
			const cancelled = new FunPromise(promise).cancel();
			resolver(true);
			expect(sawResolve).toBe(false);
		});

		it("prevents rejection after cancellation", () => {
			let rejector;
			let sawReject = false;
			const promise = new Promise((resolve, reject) => {
				rejector = reject;
			}).catch(() => {
				sawReject = true;
			});
			expect(rejector).not.toBeNil();
			const cancelled = new FunPromise(promise).cancel();
			rejector("BOOM!");
			expect(sawReject).toBe(false);
		});

		it("prevents rejection when resolving throws after cancellation", () => {
			let resolver;
			let sawThen = true;
			let sawCatch = false;
			let doCancel;
			const promise = new Promise((resolve) => {
				resolver = resolve;
			}).then(() => {
				sawThen = true;
				doCancel();
				throw "BOOM!";
			});
			expect(resolver).not.toBeNil();
			const toCancel = new FunPromise(promise);
			doCancel = () => {
				toCancel.cancel();
			};
			toCancel.catch((e) => {
				sawCatch = true;
			});
			resolver(true);
			expect(sawThen).toBe(true);
			expect(sawCatch).toBe(false);
		});
	});

	describe("simplifyAll", () => {
		it("basically works", async () => {
			await expect(FunPromise.resolve("Hello").simplifyAll()).resolves.toEqual([
				"H",
				"e",
				"l",
				"l",
				"o",
			]);
		});

		it("doesn't explode on an empty list", async () => {
			await expect(FunPromise.resolve([]).simplifyAll()).resolves.toEqual([]);
		});
	});

	describe("settle", () => {
		it("basically works for rejections", async () => {
			await expect(FunPromise.reject("BOOM!").settle()).resolves.toHaveProperty(
				"reason",
				"BOOM!"
			);
		});

		it("basically works for fulfillments", async () => {
			await expect(FunPromise.resolve(true).settle()).resolves.toHaveProperty(
				"value",
				true
			);
		});
	});

	describe("settleAll", () => {
		_.forEach([true, false], (staticVersion) => {
			describe(staticVersion ? "static" : "instance", () => {
				function doSettleAll(values) {
					if (staticVersion) {
						return FunPromise.settleAll(values);
					} else {
						return FunPromise.resolve(values).settleAll();
					}
				}

				it("basically works", async () => {
					const values = [
						{ in: Promise.resolve(true), out: new Fulfillment(true) },
						{ in: Promise.reject("BOOM!"), out: new Rejection("BOOM!") },
						{ in: Promise.reject(null), out: new Rejection(null) },
						{ in: null, out: new Fulfillment(null) },
					];
					await expect(doSettleAll(_.map(values, "in"))).resolves.toEqual(
						_.map(values, "out")
					);
				});

				it("doesn't explode on empty lists", async () => {
					await expect(doSettleAll([])).resolves.toEqual([]);
				});
			});
		});
	});

	describe("flatFold", () => {
		_.forEach([true, false], (staticVersion) => {
			describe(staticVersion ? "static" : "instance", () => {
				function doFlatFold(values, initialValues, accumulator) {
					if (staticVersion) {
						return FunPromise.flatFold(values, initialValues, accumulator);
					} else {
						return FunPromise.resolve(values).flatFold(
							initialValues,
							accumulator
						);
					}
				}

				it("basically works", async () => {
					const values = [4, 5, 6];
					const initialValues = [1, 2, 3];
					const accumulator = (xs, x) => [x, x];
					await expect(
						doFlatFold(values, initialValues, accumulator)
					).resolves.toEqual([1, 2, 3, 4, 4, 5, 5, 6, 6]);
				});
			});
		});
	});
});
