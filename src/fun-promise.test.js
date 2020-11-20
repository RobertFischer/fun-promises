/** @format */

import FunPromise from "./fun-promise";
import _ from "lodash";

function waitingPromise(seconds, result) {
	return new FunPromise((resolve) => _.delay(resolve, seconds * 1000, result));
}

const simpleFunPromise = new FunPromise((resolve) => resolve(true));

_.forEach(
	{ "built-in Promise": Promise, FunPromise },
	(PromiseImpl, promiseImplName) => {
		describe(`${promiseImplName}'s implementation of Promise API`, () => {
			it("can be awaited", async () => {
				expect(await simpleFunPromise).toBe(true);
			});

			it("can resolve", async () => {
				await expect(
					new PromiseImpl((resolve) => resolve("Done!"))
				).resolves.toBe("Done!");
			});

			it("can reject with an error", async () => {
				const callback = (resolve, reject) => reject(new Error("BOOM!"));
				await expect(new PromiseImpl(callback)).rejects.toThrow("BOOM!");
			});

			it("can reject with a string", async () => {
				const callback = (resolve, reject) => reject("BOOM!");
				await expect(new PromiseImpl(callback)).rejects.toBe("BOOM!");
			});

			it("can accept a call to resolve followed by a call to reject", async () => {
				await expect(
					new PromiseImpl((resolve, reject) => {
						resolve("Done!");
						reject("BOOM!");
					})
				).resolves.toBe("Done!");
			});

			it("can accept a call to reject followed by a call to resolve", async () => {
				await expect(
					new PromiseImpl((resolve, reject) => {
						reject("BOOM!");
						resolve("Done!");
					})
				).rejects.toBe("BOOM!");
			});

			describe("then", () => {
				describe("with only the fulfilled handler", () => {
					it("calls the fulfilled handler on fulfillment", async () => {
						await expect(
							simpleFunPromise.then((value) => {
								expect(value).toBe(true);
								return false;
							})
						).resolves.toBe(false);
					});

					it("rejects on rejection", async () => {
						await expect(
							new PromiseImpl((resolve, reject) => {
								reject("BOOM!");
							}).then((value) => {
								throw new Error("Resolved when it should not have!");
							})
						).rejects.toBe("BOOM!");
					});
				});

				describe("with both fulfilled and rejected handlers", () => {
					it("calls the rejected handler", async () => {
						await expect(
							new PromiseImpl((resolve, reject) => reject("Boom!")).then(
								(value) => {
									throw new Error("Resolved when it should not have!");
								},
								(value) => {
									expect(value).toBe("Boom!");
									return "Bang!";
								}
							)
						).resolves.toBe("Bang!");
					});

					it("calls the fulfilled handler", async () => {
						await expect(
							new PromiseImpl((resolve, reject) => resolve(true)).then(
								(value) => {
									expect(value).toBe(true);
									return false;
								},
								(value) => {
									throw new Error("Rejected when it should not have!");
								}
							)
						).resolves.toBe(false);
					});

					it("rejects if the rejected handler explodes", async () => {
						await expect(
							new PromiseImpl((resolve, reject) => reject("Boom!")).then(
								() => {
									throw new Error("Resolved when it should not have!");
								},
								() => {
									throw new Error("Bang!");
								}
							)
						).rejects.toThrow("Bang!");
					});
				});
			});
		});
	}
);

describe("extensions to the Promise API", () => {
	describe("static extensions", () => {
		describe("try", () => {
			it("basically works", async () => {
				await expect(FunPromise.try(() => 1)).resolves.toBe(1);
			});

			it("rejects if the argument explodes", async () => {
				await expect(
					FunPromise.try(() => {
						throw new Error("BOOM!");
					})
				).rejects.toThrow("BOOM!");
			});
		});
	});

	describe("instance extensions", () => {
		describe("cancel", () => {
			it("prevents 'then' from firing", (done) => {
				let thenExecuted = false;
				const promise = new FunPromise((resolve) => {
					resolve(true);
				});
				promise.cancel();
				promise.then(() => {
					thenExecuted = true;
				});
				_.defer(() => {
					expect(thenExecuted).toBe(false);
					done();
				});
			});

			it("prevents 'catch' from firing", (done) => {
				let catchExecuted = false;
				const promise = new FunPromise((resolve, reject) => {
					reject(new Error("BOOM!"));
				});
				promise.cancel();
				promise.catch(() => {
					catchExecuted = true;
				});
				_.defer(() => {
					expect(catchExecuted).toBe(false);
					done();
				});
			});
		});

		describe("simplify", () => {
			it("returns the same promise", () => {
				expect(simpleFunPromise.simplify()).toBe(simpleFunPromise);
			});
		});

		describe("catchError", () => {
			it("passes in an error when an error is thrown", async () => {
				await expect(
					new FunPromise(() => {
						throw new Error("BOOM!");
					})
						.catchError((e) => {
							expect(e).toBeInstanceOf(Error);
							return e.message;
						})
						.resolves.toBe("BOOM!")
				);
			});

			it("passes in an error when string is thrown", async () => {
				await expect(
					new FunPromise(() => {
						throw "BOOM!";
					}).catchError((e) => {
						expect(e).toBeInstanceOf(Error);
						return e.message;
					})
				).resolves.toBe("BOOM!");
			});
		});

		describe("tap", () => {
			it("does not change resolved value", async () => {
				await expect(
					FunPromise.resolve(true).tap((val) => {
						expect(val).toBe(true);
						return false;
					})
				).resolves.toBe(true);
			});

			it("does not fire on rejection", async () => {
				let tapFired = false;
				await expect(
					FunPromise.reject("BOOM!").tap((val) => {
						tapFired = true;
						return false;
					})
				).rejects.toBe("BOOM!");
				expect(tapFired).toBe(false);
			});
		});

		describe("tapCatch", () => {
			it("does not change the value on reject", async () => {
				await expect(
					new FunPromise(() => {
						throw "BOOM!";
					})
						.tapCatch((error) => {
							expect(error).toBeInstanceOf(Error);
							expect(error).toHaveProperty("message", "BOOM!");
							return false;
						})
						.catch((error) => {
							expect(error).toBeInstanceOf(Error);
							expect(error).toHaveProperty("message", "BOOM!");
							return true;
						})
				).resolves.toBe(true);
			});

			it("does not fire when promise resolves", async () => {
				let tapFired = false;
				await expect(
					simpleFunPromise.tapCatch(() => {
						tapFired = true;
						return false;
					})
				).resolves.toBe(true);
				expect(tapFired).toBe(false);
			});
		});

		describe("tapFinally", () => {
			it("does not change the value on resolve", async () => {
				await expect(
					new FunPromise((resolve) => resolve(true)).tapFinally((value) => {
						expect(value).toBe(true);
						return false;
					})
				).resolves.toBe(true);
			});

			it("does not change the value on reject", async () => {
				await expect(
					new FunPromise((resolve, reject) => reject("BOOM!")).tapFinally(
						(error) => {
							expect(error)
								.toBeInstanceOf(Error)
								.and.toHaveProperty("message", "BOOM!");
							return false;
						}
					)
				)
					.rejects.toBeInstanceOf(Error)
					.and.toHaveProperty("message", "BOOM!");
			});
		});
	});

	describe("instance and static extensions", () => {
		_.forEach([true, false], (staticVersion) => {
			describe(staticVersion ? "static version" : "instance version", () => {
				describe("resolve", () => {
					it("returns the value provided", async () => {
						const value = "Yes!";
						const promise = staticVersion
							? FunPromise.resolve(value)
							: simpleFunPromise.resolve(value);
						await expect(promise).resolves.toBe(value);
					});
				});

				describe("reject", () => {
					it("returns the reason provided", async () => {
						const value = new Error("BOOM!");
						const promise = staticVersion
							? FunPromise.reject(value)
							: simpleFunPromise.reject(value);
						await expect(promise).rejects.toBe(value);
						await expect(simpleFunPromise).resolves.toBe(true);
					});
				});

				describe("delay", () => {
					it("delays for the expected time period", async () => {
						const startTimeMs = Date.now();
						const delayPeriodMs = 1000;
						const delayedPromise = staticVersion
							? FunPromise.delay(delayPeriodMs, true)
							: simpleFunPromise.delay(delayPeriodMs);
						await expect(
							delayedPromise.tap((result) => {
								expect(result).toBe(true);
								expect(Date.now()).toBeGreaterThanOrEqual(
									startTimeMs + delayPeriodMs
								);
							})
						).resolves.toBe(true);
					});

					it("defers if the time period is 0", async () => {
						const startTimeMs = Date.now();
						const delayPeriodMs = 0;
						const delayedPromise = staticVersion
							? FunPromise.delay(delayPeriodMs, true)
							: simpleFunPromise.delay(delayPeriodMs);
						await expect(
							delayedPromise.tap((result) => {
								expect(result).toBe(true);
								expect(Date.now()).toBeLessThanOrEqual(startTimeMs + 100); // 0.1 sec is way more than enough time for a deferral to hit
							})
						).resolves.toBe(true);
					});

					it("defers if the time period is less than 0", async () => {
						const startTimeMs = Date.now();
						const delayPeriodMs = -20000;
						const delayedPromise = staticVersion
							? FunPromise.delay(delayPeriodMs, true)
							: simpleFunPromise.delay(delayPeriodMs);
						await expect(
							delayedPromise.tap((result) => {
								expect(result).toBe(true);
								expect(Date.now()).toBeLessThanOrEqual(startTimeMs + 100); // 0.1 sec is way more than enough time for a deferral to hit
							})
						).resolves.toBe(true);
					});
				});

				describe("race", () => {
					it("returns the single value when given one value wrapped inside a promise", async () => {
						const value = FunPromise.resolve([FunPromise.resolve("foo")]);
						const result = staticVersion
							? FunPromise.race(value)
							: FunPromise.resolve(value).race();
						await expect(result).resolves.toBe("foo");
					});

					it("returns the quicker value when given two values", async () => {
						const value = [
							FunPromise.delay(1000).return("foo"),
							FunPromise.resolve(true),
						];
						const result = staticVersion
							? FunPromise.race(value)
							: FunPromise.resolve(value).race();
						await expect(result).resolves.toBe(true);
					});

					it("returns the successful resolve value when given one resolving and one rejecting", async () => {
						const value = [
							FunPromise.reject("BOOM!"),
							FunPromise.delay(1000).return("foo"),
						];
						const result = staticVersion
							? FunPromise.race(value)
							: FunPromise.resolve(value).race();
						await expect(result).resolves.toBe("foo");
					});

					it("returns the faster successful resolve value when given two resolving and two rejecting", async () => {
						const value = [
							FunPromise.reject("BOOM!"),
							FunPromise.delay(1000).return("foo"),
							FunPromise.delay(900).reject("BANG!"),
							FunPromise.delay(100).resolve(true),
						];
						const result = staticVersion
							? FunPromise.race(value)
							: FunPromise.resolve(value).race();
						await expect(result).resolves.toBe(true);
					});

					it("returns the latest rejection reason when given five rejecting", async () => {
						const value = [
							FunPromise.delay(1000).reject("One!"),
							FunPromise.delay(500).reject("Two!"),
							FunPromise.delay(750).reject("Three!"),
							FunPromise.delay(1250).reject("Four!"),
							FunPromise.delay(900).reject("Five!"),
						];
						const result = staticVersion
							? FunPromise.race(value)
							: FunPromise.resolve(value).race();
						await expect(result).rejects.toBe("Four!");
					});
				});
			});
		});
	});

	// TODO Coalesce
	// TODO Fold
	// TODO Map
	// TODO Iter
	// TODO Filter
	// TODO AllSettled
	// TODO MapSettled
	// TODO FlatMap
	// TODO Arrayify
	// TODO All Accepting Multiple Args (Join)
});
