"use strict";
/** @format */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const fun_promise_1 = require("./fun-promise");
const lodash_1 = require("lodash");
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
        it("does not resolve arguments", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            const rejection = Promise.reject("BOOM!");
            yield expect(fun_promise_1.default.resolve([1, 2, rejection]).arrayify()).resolves.toBeArrayOfSize(3);
            rejection.catch((e) => { }); // Disarm the rejection
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
    describe("arrayifyResolved", () => {
        it("basically works", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            const value = [1, 2, 3, 4];
            yield expect(fun_promise_1.default.resolve(value).arrayifyResolved()).resolves.toStrictEqual(value);
        }));
        it("returns a clone", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            const value = [1, 2, 3, 4];
            yield expect(fun_promise_1.default.resolve(value)
                .arrayifyResolved()
                .then((it) => {
                it.pop();
                return it;
            })).resolves.not.toBe(value);
            expect(value).toHaveLength(4);
        }));
        it("resolves arguments", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            yield expect(fun_promise_1.default.resolve([1, 2, Promise.reject("BOOM!")]).arrayifyResolved()).rejects.toBe("BOOM!");
        }));
    });
});
//# sourceMappingURL=fun-promise.test.js.map