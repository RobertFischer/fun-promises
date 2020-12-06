"use strict";
/** @format */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const fun_promise_1 = require("./fun-promise");
const lodash_1 = require("lodash");
const ts_nested_error_1 = require("ts-nested-error");
const tokenPromise = new Promise((resolve) => resolve(true));
const tokenFunPromise = new fun_promise_1.default(tokenPromise);
describe("FunPromise", () => {
    it("can be constructed and resolved", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        yield expect(new fun_promise_1.default(tokenPromise)).resolves.toBe(true);
    }));
    describe("resolve", () => {
        lodash_1.default.forEach({ static: fun_promise_1.default, instance: tokenFunPromise }, (impl, name) => {
            describe(name, () => {
                describe("resolves correctly", () => {
                    it("with a value", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
                        yield expect(impl.resolve(tokenPromise)).resolves.toBe(true);
                    }));
                    it("without a value", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
                        yield expect(impl.resolve()).resolves.toBeNil();
                    }));
                    it("rejects when provided a rejection", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
                        yield expect(impl.resolve(Promise.reject("BOOM!"))).rejects.toBe("BOOM!");
                    }));
                });
            });
        });
    });
    describe("then", () => {
        it("works without onrejected", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            yield expect(tokenFunPromise.then(lodash_1.default.identity)).resolves.toBe(true);
        }));
    });
    describe("catch", () => {
        it("handles rejections", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            yield expect(tokenFunPromise
                .then(() => Promise.reject("BOOM!"))
                .catch((e) => {
                expect(e).toBe("BOOM!");
                return "DONE!";
            })).resolves.toBe("DONE!");
        }));
        it("returns the error when not passed an argument", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            const error = new Error("BOOM!");
            yield expect(tokenFunPromise.then(() => Promise.reject(error)).catch()).resolves.toBe(error);
        }));
    });
    describe("arrayify", () => {
        it("basically works", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            const value = [1, 2, 3, 4];
            yield expect(fun_promise_1.default.resolve(value).arrayify()).resolves.toStrictEqual(value);
        }));
        it("returns a clone", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            const value = [1, 2, 3, 4];
            yield expect(fun_promise_1.default.resolve(value)
                .arrayify()
                .then((it) => {
                it.pop();
                return it;
            })).resolves.not.toBe(value);
            expect(value).toHaveLength(4);
        }));
        it("does not resolve values when called without an argument", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            const rejection = Promise.reject("BOOM!");
            try {
                yield expect(fun_promise_1.default.resolve([1, 2, rejection]).arrayify()).resolves.toBeArrayOfSize(3);
            }
            finally {
                rejection.catch((e) => { }); // Disarm the rejection
            }
        }));
        it("resolves values when called with the sole argument `true`", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            yield expect(fun_promise_1.default.resolve([
                Promise.resolve(1),
                fun_promise_1.default.resolve(2),
            ]).arrayify(true)).resolves.toEqual([1, 2]);
        }));
        it("rejects values when called with the sole argument `true` and a rejection in the mix", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            const rejection = Promise.reject("BOOM!");
            yield expect(fun_promise_1.default.resolve([1, 2, rejection]).arrayify(true)).rejects.toBe("BOOM!");
        }));
        it("rejects values in order when called with the arguments `(true, true)`", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            const rejection1 = Promise.reject("BOOM!");
            const rejection2 = Promise.reject("BANG!");
            try {
                yield expect(fun_promise_1.default.resolve([1, 2, rejection1, rejection2]).arrayify(true, true)).rejects.toBe("BOOM!");
            }
            finally {
                rejection1.catch((e) => { }); // Disarm the rejection
                rejection2.catch((e) => { }); // Disarm the rejection
            }
        }));
        it("resolves values in order when called with the arguments `(true, true)`", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            let sawFirst = false;
            let sawSecond = false;
            let sawThird = false;
            let sawFourth = false;
            yield expect(fun_promise_1.default.resolve([
                fun_promise_1.default.try(() => {
                    expect(sawFirst).toBe(false);
                    expect(sawSecond).toBe(false);
                    expect(sawThird).toBe(false);
                    expect(sawFourth).toBe(false);
                    sawFirst = true;
                    return 1;
                }),
                fun_promise_1.default.try(() => {
                    expect(sawFirst).toBe(true);
                    expect(sawSecond).toBe(false);
                    expect(sawThird).toBe(false);
                    expect(sawFourth).toBe(false);
                    sawSecond = true;
                    return 2;
                }),
                fun_promise_1.default.try(() => {
                    expect(sawFirst).toBe(true);
                    expect(sawSecond).toBe(true);
                    expect(sawThird).toBe(false);
                    expect(sawFourth).toBe(false);
                    sawThird = true;
                    return 3;
                }),
                fun_promise_1.default.try(() => {
                    expect(sawFirst).toBe(true);
                    expect(sawSecond).toBe(true);
                    expect(sawThird).toBe(true);
                    expect(sawFourth).toBe(false);
                    sawFourth = true;
                    return 4;
                }),
            ]).arrayify(true, true)).resolves.toStrictEqual([1, 2, 3, 4]);
            expect(sawFirst).toBe(true);
            expect(sawSecond).toBe(true);
            expect(sawThird).toBe(true);
            expect(sawFourth).toBe(true);
        }));
    });
    describe("all", () => {
        lodash_1.default.forEach([true, false], (staticVersion) => {
            describe(staticVersion ? "static" : "instance", () => {
                describe("basically works", () => {
                    lodash_1.default.times(10, (argCount) => {
                        const simpleArgs = lodash_1.default.times(argCount, (i) => Math.pow(2, i));
                        function runAll(args) {
                            if (staticVersion) {
                                return fun_promise_1.default.all(args);
                            }
                            else {
                                return fun_promise_1.default.resolve(args).all();
                            }
                        }
                        it(`for ${argCount} arguments`, () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
                            yield expect(runAll(simpleArgs)).resolves.toStrictEqual(simpleArgs);
                        }));
                    });
                });
            });
        });
    });
    describe("try", () => {
        it("basically works", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            yield expect(fun_promise_1.default.try(() => true)).resolves.toBe(true);
        }));
        it("works with one argument", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            yield expect(fun_promise_1.default.try((i) => i, 42)).resolves.toBe(42);
        }));
        it("explodes properly", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            yield expect(fun_promise_1.default.try(() => Promise.reject("BOOM!"))).rejects.toBe("BOOM!");
        }));
    });
    describe("map", () => {
        lodash_1.default.forEach([true, false], (staticVersion) => {
            describe(staticVersion ? "static" : "instance", () => {
                function runMap(args, mapper) {
                    if (staticVersion) {
                        return fun_promise_1.default.map(args, mapper);
                    }
                    else {
                        return fun_promise_1.default.resolve(args).map(mapper);
                    }
                }
                it("basically works", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
                    yield expect(runMap(["Hello", "Goodbye"], (it) => `${it}, World!`)).resolves.toStrictEqual(["Hello, World!", "Goodbye, World!"]);
                }));
                it("works with some test values", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
                    const defaultValues = [1, 2, 4, 8, 16];
                    const defaultMapper = (it) => {
                        if (Math.random() < 0.5) {
                            return Promise.resolve(it * 2);
                        }
                        else {
                            return it * 2;
                        }
                    };
                    yield expect(runMap(defaultValues, defaultMapper)).resolves.toStrictEqual([2, 4, 8, 16, 32]);
                }));
            });
        });
    });
    describe("Symbol.toStringTag", () => {
        it("is the same as the promise passed in", () => {
            const promise = new Promise((resolve) => resolve());
            const promiseTag = promise[Symbol.toStringTag];
            expect(promiseTag).not.toBeNil();
            expect(new fun_promise_1.default(promise)[Symbol.toStringTag]).toBe(promiseTag);
        });
    });
    describe("finally", () => {
        it("returns the same promise when given no arguments", () => {
            expect(tokenFunPromise.finally()).toBe(tokenFunPromise);
        });
        it("executes on resolution", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            let finallyExecuted = false;
            yield expect(fun_promise_1.default.resolve(false).finally(() => {
                finallyExecuted = true;
            })).resolves.toBe(false);
            expect(finallyExecuted).toBe(true);
        }));
        it("executes on rejection", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            let finallyExecuted = false;
            yield expect(fun_promise_1.default.reject("BOOM!").finally(() => {
                finallyExecuted = true;
            })).rejects.toBe("BOOM!");
            expect(finallyExecuted).toBe(true);
        }));
    });
    describe("reject", () => {
        lodash_1.default.forEach({ static: fun_promise_1.default, instance: tokenFunPromise }, (impl, name) => {
            describe(name, () => {
                it("rejects correctly", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
                    yield expect(impl.reject(true)).rejects.toBe(true);
                }));
                it("doesn't change the object that is rejected", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
                    const reason = { foo: true, bar: 42 };
                    yield expect(impl.reject(reason)).rejects.toBe(reason);
                }));
            });
        });
    });
    describe("coalesce", () => {
        function runCoalesce(args, test) {
            return fun_promise_1.default.coalesce(args, test);
        }
        it("basically works", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            yield expect(runCoalesce([() => null, Promise.resolve(() => true)])).resolves.toBe(true);
        }));
        it("returns the first resolving value", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            yield expect(runCoalesce([() => fun_promise_1.default.delay(1000).resolve(true), () => false])).resolves.toBe(false);
        }));
        it("returns the value that passes the test", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            yield expect(runCoalesce([() => 2, () => 4], (it) => it > 2)).resolves.toBe(4);
        }));
        it("throws the error if nothing passes the test", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            yield expect(runCoalesce([() => Promise.reject("BOOM!"), () => 4], (it) => it > 4)).rejects.toBe("BOOM!");
        }));
        it("punts appropriately after the first resolution", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            yield expect(runCoalesce(lodash_1.default.times(3, (idx) => () => idx))).resolves.toBe(0);
        }));
    });
    describe("delay", () => {
        lodash_1.default.forEach([true, false], (staticVersion) => {
            describe(staticVersion ? "static" : "instance", () => {
                lodash_1.default.forEach([-1000, -1, 0, 1, 1000], (delayMs) => {
                    describe(`When requesting a delay of ${delayMs} milliseconds`, () => {
                        function runDelay(arg) {
                            if (staticVersion) {
                                return fun_promise_1.default.delay(delayMs, arg);
                            }
                            else {
                                return fun_promise_1.default.resolve().delay(delayMs, arg);
                            }
                        }
                        describe("basically works", () => {
                            it("with no arg", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
                                yield expect(runDelay()).resolves;
                            }));
                            it("with one arg", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
                                yield expect(runDelay(1000)).resolves.toBe(1000);
                            }));
                        });
                    });
                });
            });
        });
    });
    describe("simplify", () => {
        it("basically works", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            yield expect(new fun_promise_1.default(Promise.resolve(Promise.resolve(true))).simplify()).resolves.toBe(true);
        }));
    });
    describe("filter", () => {
        lodash_1.default.forEach([true, false], (staticVersion) => {
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
                const defaultTest = (it) => !lodash_1.default.isNil(it);
                function doFilter(values = defaultValues, test = defaultTest) {
                    if (staticVersion) {
                        return fun_promise_1.default.filter(values, test);
                    }
                    else {
                        return fun_promise_1.default.resolve(values).filter(test);
                    }
                }
                it("basically works", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
                    yield expect(doFilter()).resolves.not.toBeEmpty();
                    yield expect(doFilter()).resolves.toBeArrayOfSize(4);
                }));
            });
        });
    });
    describe("flatMap", () => {
        lodash_1.default.forEach([true, false], (staticVersion) => {
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
                    if (lodash_1.default.isNil(it)) {
                        return [];
                    }
                    else {
                        return [it];
                    }
                };
                const defaultExpect = [1, true, {}, "Hello, Dolly!"];
                function doFlatMap(values = defaultValues, mapper = defaultMapper) {
                    if (staticVersion) {
                        return fun_promise_1.default.flatMap(values, mapper);
                    }
                    else {
                        return fun_promise_1.default.resolve(values).flatMap(mapper);
                    }
                }
                it("basically works", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
                    yield expect(doFlatMap()).resolves.toStrictEqual(defaultExpect);
                }));
            });
        });
    });
    describe("tap", () => {
        it("basically works", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            let sawTap = false;
            yield expect(tokenFunPromise.tap((val) => {
                expect(val).toBe(true);
                sawTap = true;
                return false;
            })).resolves.toBe(true);
            expect(sawTap).toBe(true);
        }));
        it("rejects if it throws an exception", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            let sawTap = false;
            yield expect(tokenFunPromise.tap((val) => {
                sawTap = true;
                throw "BOOM!";
            })).rejects.toBe("BOOM!");
            expect(sawTap).toBe(true);
        }));
    });
    describe("fold", () => {
        lodash_1.default.forEach([true, false], (staticVersion) => {
            describe(staticVersion ? "static" : "instance", () => {
                const defaultValues = [1, 2, 3, 4, 5];
                function doFold(values = defaultValues, initialValue = 0, accumulator = (a, b) => a + b) {
                    if (staticVersion) {
                        return fun_promise_1.default.fold(values, initialValue, accumulator);
                    }
                    else {
                        return fun_promise_1.default.resolve(values).fold(initialValue, accumulator);
                    }
                }
                it("basically works", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
                    const values = [1, 2, 3, 4, 5];
                    yield expect(doFold()).resolves.toBe(1 + 2 + 3 + 4 + 5);
                }));
            });
        });
    });
    describe("tapCatch", () => {
        it("basically works", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            let sawTapCatch = false;
            yield expect(fun_promise_1.default.reject("BOOM!").tapCatch((e) => {
                sawTapCatch = true;
                expect(e).toBe("BOOM!");
                return "BANG!";
            })).rejects.toBe("BOOM!");
            expect(sawTapCatch).toBe(true);
        }));
        it("nests explosions", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            let sawCatch = false;
            const err1 = new Error("BOOM!");
            const err2 = new Error("BANG!");
            yield expect(fun_promise_1.default.reject(err1)
                .tapCatch((e) => {
                throw err2;
            })
                .catch((e) => {
                sawCatch = true;
                expect(e).toBeInstanceOf(ts_nested_error_1.NestedError);
                expect(e).toHaveProperty("message", "Error thrown in 'tapCatch'");
                expect(e).toHaveProperty("innerErrors");
                expect(e.innerErrors).toHaveLength(2);
                expect(e.innerErrors).toEqual([err1, err2]);
                return "Hello!";
            })).resolves.toBe("Hello!");
            expect(sawCatch).toBe(true);
        }));
    });
    describe("tapEach", () => {
        it("basically works", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            const values = [
                123,
                Promise.resolve(true),
                "Hello, Dolly!",
                null,
                undefined,
            ];
            const funPromise = fun_promise_1.default.resolve(values);
            let count = 0;
            yield expect(funPromise.tapEach(() => {
                count++;
            })).resolves.toEqual(yield Promise.all(values));
            expect(count).toBe(values.length);
        }));
    });
    describe("wrapError", () => {
        it("basically works", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            const reason = "BOOM!";
            yield expect(fun_promise_1.default.reject(reason).wrapError("BANG!")).rejects.toHaveProperty("message", "BANG!");
            yield expect(fun_promise_1.default.reject(reason).wrapError("BANG!")).rejects.toHaveProperty("innerError");
        }));
    });
    describe("wrapErrors", () => {
        it("basically works", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            const err1 = new Error("BOOM!");
            const err2 = new Error("BANG!");
            yield expect(fun_promise_1.default.resolve([Promise.reject(err1), Promise.reject(err2)])
                .wrapErrors("ERRORS!")
                .catch((e) => {
                expect(e).toBeInstanceOf(ts_nested_error_1.NestedError);
                expect(e).toHaveProperty("message", "ERRORS!");
                expect(e.innerErrors).toHaveLength(2);
                expect(e.innerErrors).toEqual([err1, err2]);
                return true;
            })).resolves.toBe(true);
        }));
        it("doesn't do anything if there is no error", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            const values = [1, 2, 3, true, false, null, undefined];
            yield expect(fun_promise_1.default.resolve(values).wrapErrors("ERRORS!")).resolves.toEqual(values);
        }));
    });
});
//# sourceMappingURL=fun-promise.test.js.map