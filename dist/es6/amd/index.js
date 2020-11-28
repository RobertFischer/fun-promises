/** @format */
define("src/types", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PromiseState = void 0;
    /**
     * The various states that a promise can be in.
     */
    var PromiseState;
    (function (PromiseState) {
        /**
         * The promise is neither resolved nor rejected.
         */
        PromiseState["Pending"] = "pending";
        /**
         * The promise has begun resolving, but is not yet fully resolved.
         */
        PromiseState["Resolving"] = "resolving";
        /**
         * The promise has resolved to a value.
         */
        PromiseState["Resolved"] = "resolved";
        /**
         * The promise has begun rejecting, but is not yet fully rejected.
         */
        PromiseState["Rejecting"] = "rejecting";
        /**
         * The promise has rejected with a cause.
         */
        PromiseState["Rejected"] = "rejected";
        /**
         * The promise has been cancelled, which will prevent its
         * callbacks from firing.
         */
        PromiseState["Cancelled"] = "cancelled";
    })(PromiseState = exports.PromiseState || (exports.PromiseState = {}));
});
/** @format */
define("src/fun-promise", ["require", "exports", "tslib", "lodash/defer", "lodash/delay", "lodash/filter", "lodash/flatten", "lodash/identity", "lodash/isEmpty", "lodash/isFunction", "lodash/isNil", "lodash/map", "lodash/negate", "lodash/toArray", "lodash/isError", "lodash/noop"], function (require, exports, tslib_1, defer_1, delay_1, filter_1, flatten_1, identity_1, isEmpty_1, isFunction_1, isNil_1, map_1, negate_1, toArray_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // import Debug from "debug";
    // const debug = Debug("fun-promises");
    /**
     * The class that you should use instead of [[`Promise`]].  It implements the `Promise` API, so it should be a drop-in replacement.
     */
    class FunPromise {
        /**
         * Constructor, which takes the promise to wrap.
         */
        constructor(wrapped) {
            Object.defineProperty(this, "wrapped", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: wrapped
            });
        }
        /**
         * Takes a value (or a promise of a value) and returns a promise wrapping
         * it.
         */
        static resolve(value) {
            return new FunPromise(Promise.resolve(value));
        }
        /**
         * Takes a value (or a promise of a value) and resolves to the new value,
         * disregarding any previous resolution value.
         *
         */
        resolve(value) {
            return new FunPromise(this.wrapped.then(() => value));
        }
        /**
         * Takes a value (or a promise of a value) and returns a promise rejecting
         * with that value, after unwrapping as many layers of [[`PromiseLike`]]
         * wrappers as necessary.
         */
        static reject(value) {
            return new FunPromise(Promise.reject(value));
        }
        /**
         * Takes a value (or a promise of a value) and returns a promise rejecting
         * with that value, after unwrapping as many layers of [[`PromiseLike`]]
         * wrappers as necessary.  This disregards any existing status.
         */
        reject(value) {
            return FunPromise.reject(value);
        }
        then(onfulfilled, onrejected) {
            if (isNil_1.default(onrejected)) {
                return new FunPromise(this.wrapped.then(onfulfilled));
            }
            else {
                return new FunPromise(this.wrapped.then(onfulfilled, onrejected));
            }
        }
        /**
         * Attaches a callback for only the rejection of the Promise.
         * @param onrejected The callback to execute when the Promise is rejected.
         * @returns A Promise for the completion of the callback.
         */
        catch(onrejected = identity_1.default) {
            return new FunPromise(this.wrapped.catch(onrejected));
        }
        static all(...values) {
            return FunPromise.resolve(flatten_1.default(values)).all();
        }
        all() {
            return this.arrayify().then((ary) => Promise.all(ary));
        }
        static try(source, ...args) {
            return FunPromise.resolve(source).then((f) => {
                if (isEmpty_1.default(args)) {
                    return f();
                }
                else {
                    return Promise.all(args).then((realArgs) => f(...realArgs));
                }
            });
        }
        /**
         * Unwraps layers of [[`PromiseLike`]] wrappers as necessary.
         *
         * This behavior is actually part of the Promise/A+ spec, but the type system struggles with that fact,
         * so this method is a workaround.
         *
         * In a future version of this library, `FunPromise` will extend `Promise<Unpromise<T>>` instead of
         * just `Promise<T>`, which will render this method irrelevant. Unfortunately, Typescript's type system
         * doesn't seem capable of handling that reality quite yet, so this is what we get.
         */
        simplify() {
            return this;
        }
        /**
         * Coerces the resolve value (which must be an [[`Iterable`]]) into an array.  The `Iterable` requirement
         * comes from the `Item<T>` return value: `Item<T>` is equivalent to `never` if `T` is not an `Iterable`.
         *
         * Note that this function does *NOT* resolve the items within the array.
         */
        arrayify() {
            return this.then(toArray_1.default);
        }
        /**
         * Coerces the resolve value (which must be an [[`Iterable`]]) into an array.  The `Iterable` requirement
         * comes from the `Item<T>` return value: `Item<T>` is equivalent to `never` if `T` is not an `Iterable`.
         *
         * Note that this function *ALSO* resolves the items within the array.
         */
        arrayifyResolved() {
            return this.arrayify().then((ary) => Promise.all(ary));
        }
        /**
         * Given a mapping function, apply the mapping function to each element of the promise's resolved value,
         * and return an array with the results of the mapping.  If any of the mapping results are rejected,
         * the entire operation will be rejected.
         *
         * The order of the elements in the result correspond to the order of the elements in the promise's
         * resolved value.  However, the resolution order is not guaranteed.  For example, although the
         * output at index 0 will hold the mapping of the input element at index 0, it is not guaranteed that
         * the mapping of index 0 will be awaited before the mapping of index 1.
         */
        map(mapper) {
            const results = [];
            return FunPromise.try(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield Promise.all(map_1.default(yield this.arrayify(), (value, idx) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    results[idx] = yield mapper(value);
                })));
                return results;
            }));
        }
        /**
         * Equivalent to `FunPromise.resolve(values).map(mapper)`.
         */
        static map(values, mapper) {
            return FunPromise.resolve(values).map(mapper);
        }
        /**
         * Required to implement [[`Promise`]], but you almost certainly don't care about it.
         *
         * All the same, it returns the string tag of the underlying promise.
         */
        get [Symbol.toStringTag]() {
            return this.wrapped[Symbol.toStringTag];
        }
        finally(onfinally) {
            if (isFunction_1.default(onfinally)) {
                return new FunPromise(this.wrapped.finally(onfinally));
            }
            else {
                return this;
            }
        }
        /**
         * Given a [[`PromisableIterable`]] whose values are nullary functions returning [[Promisable|`Promisable<T>`]],
         * this executes all the functions simultaneously and returns the first whose return value passes the provided test.
         * The default test returns true if the value is not `null` or `undefined`.
         *
         * If no function resolves successfully, the last seen rejection is thrown. If some functions resolve but some reject,
         * and none of the resolved values pass the test, then the last seen rejection is thrown.
         *
         * If all the functions resolve but to a value but no value passes the test, then this rejects with an error saying as much.
         */
        static coalesce(fns, test = negate_1.default(isNil_1.default)) {
            let resolved = false;
            let lastSeenReason = new Error("No values left after coalescing");
            let resolveValue;
            return FunPromise.map(fns, (fn) => FunPromise.try(fn)
                .then((result) => {
                if (resolved)
                    return null;
                return FunPromise.try(test, result).then((testResult) => {
                    if (resolved)
                        return null;
                    if (testResult) {
                        resolved = true;
                        resolveValue = result;
                    }
                });
            })
                .catch((e) => {
                lastSeenReason = e;
            })).then(() => {
                if (resolved) {
                    return resolveValue;
                }
                else {
                    throw lastSeenReason;
                }
            });
        }
        static delay(waitTimeMs, returnValue) {
            return FunPromise.resolve().delay(waitTimeMs, returnValue);
        }
        /**
         * Waits for `waitTimeMs` milliseconds before resolving.  If `returnValue` is provided, resolves with the provided value.
         *
         * If `waitTimeMs` is less than or equal to zero, then it simply defers until the call stack is clear.
         */
        delay(waitTimeMs, returnValue) {
            if (waitTimeMs <= 0) {
                return new FunPromise(new Promise((resolve) => defer_1.default(resolve, returnValue)));
            }
            else {
                return new FunPromise(new Promise((resolve) => delay_1.default(resolve, waitTimeMs, returnValue)));
            }
        }
        /**
         * Given a filtering function, apply the filtering function to each element of the promise's resolved value,
         * and return an array with the values for which the filtering function returns `true`.  If any of the filtering
         * results are rejected, the entire operation will be rejected.
         *
         * The order of the elements in the result are stable with regard to the order of the elements in the promise's
         * resolved value.  That is, if `X < Y` and `input[X]` and `input[Y]` are both in the input, and `input[X]` and
         * `input[Y]` both pass the filtering function, then the output index of `input[X]` will be less than the output
         * index of `input[Y]`. However, the resolution order is not guaranteed: that is, `input[Y]` may be resolved and
         * tested before `input[X]` even though `input[X]` has a lower output index than `input[Y]`.
         */
        filter(test) {
            return this.arrayify().then((ary) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                const results = yield FunPromise.map(ary, (it) => tslib_1.__awaiter(this, void 0, void 0, function* () { return test(yield it); }));
                // @ts-ignore
                return filter_1.default(ary, (it, idx) => results[idx]);
            }));
        }
        /**
         * Equivalent to `FunPromise.resolve(items).filter(test)`.
         */
        static filter(items, test) {
            return FunPromise.resolve(items).filter(test);
        }
    }
    exports.default = FunPromise;
});
/** @format */
define("src/deferral", ["require", "exports", "src/fun-promise", "src/types", "lodash/defer", "lodash/noop"], function (require, exports, fun_promise_1, types_1, defer_2, noop_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * A class that is an "inside-out" [[`FunPromise`]]: the `resolve` and `reject` functions
     * from the callback are exposed as properties, and are therefore able to be called by
     * caller's code.
     *
     * Note that after the first call to either `resolve` or `reject`, the underlying promise
     * is settled. Any subsequent call to either `resolve` or `reject` is guaranteed to be
     * a no-op.
     */
    class Deferral {
        /**
         * Constructs a new promise and exposes its resolve
         * and reject functions.
         */
        constructor() {
            /**
             * The promise whose state is determined by `resolve` and `reject`.
             */
            Object.defineProperty(this, "promise", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            /**
             * The state of `promise`.
             */
            Object.defineProperty(this, "stateValue", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: types_1.PromiseState.Pending
            });
            /**
             * The function used to resolve [[`promise`]].
             */
            Object.defineProperty(this, "resolver", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: null
            });
            /**
             * The function used to reject [[`promise`]].
             */
            Object.defineProperty(this, "rejector", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: null
            });
            this.promise = new fun_promise_1.default(new Promise((resolve, reject) => {
                this.resolver = resolve;
                this.rejector = reject;
            }));
        }
        /**
         * Provides the state of `promise`.
         */
        get state() {
            return this.stateValue;
        }
        /**
         * Whether `promise` is in the process of resolving or rejecting.
         */
        get isSettling() {
            switch (this.stateValue) {
                case types_1.PromiseState.Resolving:
                    return true;
                case types_1.PromiseState.Rejecting:
                    return true;
                default:
                    return false;
            }
        }
        /**
         * Whether `promise` has resolved or rejected.
         */
        get isSettled() {
            switch (this.stateValue) {
                case types_1.PromiseState.Resolved:
                    return true;
                case types_1.PromiseState.Rejected:
                    return true;
                default:
                    return false;
            }
        }
        /**
         * Whether `promise` has resolved.
         */
        get isResolved() {
            return this.stateValue === types_1.PromiseState.Resolved;
        }
        /**
         * Whether `promise` was rejected.
         */
        get isRejected() {
            return this.stateValue === types_1.PromiseState.Rejected;
        }
        /**
         * Resolves `promise` with the given value.
         */
        resolve(it) {
            const { resolver } = this;
            if (resolver) {
                try {
                    const { rejector } = this;
                    this.stateValue = types_1.PromiseState.Resolving;
                    defer_2.default(() => {
                        try {
                            resolver(it);
                            this.stateValue = types_1.PromiseState.Resolved;
                        }
                        catch (e) {
                            if (rejector) {
                                this.rejector = rejector;
                                this.reject(e);
                            }
                            else {
                                console.warn(`Uncaught exception during resolution`, e);
                            }
                        }
                    });
                }
                catch (e) {
                    this.reject(e);
                }
                finally {
                    this.resolver = null;
                    this.rejector = null;
                }
            }
            return this.promise;
        }
        /**
         * Rejects `promise` with the given cause.
         */
        reject(e) {
            const { rejector } = this;
            if (rejector) {
                try {
                    this.stateValue = types_1.PromiseState.Rejecting;
                    defer_2.default(() => {
                        try {
                            rejector(e);
                        }
                        finally {
                            this.stateValue = types_1.PromiseState.Rejected;
                        }
                    });
                }
                finally {
                    this.resolver = null;
                    this.rejector = null;
                }
            }
            return this.promise;
        }
        /**
         * Whether or not the deferral is cancelled.
         */
        get isCancelled() {
            return !this.isSettled && this.resolver === null && this.resolver === null;
        }
        /**
         * Cancels the deferral.  If the deferral is not settled, its callbacks will
         * never be called. If the deferral is settled or cancelled, this is a noop.
         */
        cancel() {
            if (this.isSettled)
                return;
            this.stateValue = types_1.PromiseState.Cancelled;
            this.resolver = null;
            this.rejector = null;
            this.promise.catch(noop_1.default); // Suppress "UnhandledException" errors.
        }
    }
    exports.default = Deferral;
});
/** @format */
define("index", ["require", "exports", "tslib", "src/types", "src/fun-promise", "src/deferral"], function (require, exports, tslib_2, types_2, fun_promise_2, deferral_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Deferral = exports.FunPromise = void 0;
    tslib_2.__exportStar(types_2, exports);
    Object.defineProperty(exports, "FunPromise", { enumerable: true, get: function () { return fun_promise_2.default; } });
    Object.defineProperty(exports, "Deferral", { enumerable: true, get: function () { return deferral_1.default; } });
});
/** @format */
define("src/fun-promise.test", ["require", "exports", "tslib", "src/fun-promise", "lodash"], function (require, exports, tslib_3, fun_promise_3, lodash_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const tokenPromise = new Promise((resolve) => resolve(true));
    const tokenFunPromise = new fun_promise_3.default(tokenPromise);
    describe("FunPromise", () => {
        it("can be constructed and resolved", () => tslib_3.__awaiter(void 0, void 0, void 0, function* () {
            yield expect(new fun_promise_3.default(tokenPromise)).resolves.toBe(true);
        }));
        describe("resolve", () => {
            lodash_1.default.forEach({ static: fun_promise_3.default, instance: tokenFunPromise }, (impl, name) => {
                describe(name, () => {
                    describe("resolves correctly", () => {
                        it("with a value", () => tslib_3.__awaiter(void 0, void 0, void 0, function* () {
                            yield expect(impl.resolve(tokenPromise)).resolves.toBe(true);
                        }));
                        it("without a value", () => tslib_3.__awaiter(void 0, void 0, void 0, function* () {
                            yield expect(impl.resolve()).resolves.toBeNil();
                        }));
                        it("rejects when provided a rejection", () => tslib_3.__awaiter(void 0, void 0, void 0, function* () {
                            yield expect(impl.resolve(Promise.reject("BOOM!"))).rejects.toBe("BOOM!");
                        }));
                    });
                });
            });
        });
        describe("then", () => {
            it("works without onrejected", () => tslib_3.__awaiter(void 0, void 0, void 0, function* () {
                yield expect(tokenFunPromise.then(lodash_1.default.identity)).resolves.toBe(true);
            }));
        });
        describe("catch", () => {
            it("handles rejections", () => tslib_3.__awaiter(void 0, void 0, void 0, function* () {
                yield expect(tokenFunPromise
                    .then(() => Promise.reject("BOOM!"))
                    .catch((e) => {
                    expect(e).toBe("BOOM!");
                    return "DONE!";
                })).resolves.toBe("DONE!");
            }));
            it("returns the error when not passed an argument", () => tslib_3.__awaiter(void 0, void 0, void 0, function* () {
                const error = new Error("BOOM!");
                yield expect(tokenFunPromise.then(() => Promise.reject(error)).catch()).resolves.toBe(error);
            }));
        });
        describe("arrayify", () => {
            it("basically works", () => tslib_3.__awaiter(void 0, void 0, void 0, function* () {
                const value = [1, 2, 3, 4];
                yield expect(fun_promise_3.default.resolve(value).arrayify()).resolves.toStrictEqual(value);
            }));
            it("returns a clone", () => tslib_3.__awaiter(void 0, void 0, void 0, function* () {
                const value = [1, 2, 3, 4];
                yield expect(fun_promise_3.default.resolve(value)
                    .arrayify()
                    .then((it) => {
                    it.pop();
                    return it;
                })).resolves.not.toBe(value);
                expect(value).toHaveLength(4);
            }));
            it("does not resolve arguments", () => tslib_3.__awaiter(void 0, void 0, void 0, function* () {
                const rejection = Promise.reject("BOOM!");
                yield expect(fun_promise_3.default.resolve([1, 2, rejection]).arrayify()).resolves.toBeArrayOfSize(3);
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
                                    return fun_promise_3.default.all(args);
                                }
                                else {
                                    return fun_promise_3.default.resolve(args).all();
                                }
                            }
                            it(`for ${argCount} arguments`, () => tslib_3.__awaiter(void 0, void 0, void 0, function* () {
                                yield expect(runAll(simpleArgs)).resolves.toStrictEqual(simpleArgs);
                            }));
                        });
                    });
                });
            });
        });
        describe("try", () => {
            it("basically works", () => tslib_3.__awaiter(void 0, void 0, void 0, function* () {
                yield expect(fun_promise_3.default.try(() => true)).resolves.toBe(true);
            }));
            it("works with one argument", () => tslib_3.__awaiter(void 0, void 0, void 0, function* () {
                yield expect(fun_promise_3.default.try((i) => i, 42)).resolves.toBe(42);
            }));
            it("explodes properly", () => tslib_3.__awaiter(void 0, void 0, void 0, function* () {
                yield expect(fun_promise_3.default.try(() => Promise.reject("BOOM!"))).rejects.toBe("BOOM!");
            }));
        });
        describe("map", () => {
            lodash_1.default.forEach([true, false], (staticVersion) => {
                describe(staticVersion ? "static" : "instance", () => {
                    function runMap(args, mapper) {
                        if (staticVersion) {
                            return fun_promise_3.default.map(args, mapper);
                        }
                        else {
                            return fun_promise_3.default.resolve(args).map(mapper);
                        }
                    }
                    it("basically works", () => tslib_3.__awaiter(void 0, void 0, void 0, function* () {
                        yield expect(runMap(["Hello", "Goodbye"], (it) => `${it}, World!`)).resolves.toStrictEqual(["Hello, World!", "Goodbye, World!"]);
                    }));
                    it("works with some test values", () => tslib_3.__awaiter(void 0, void 0, void 0, function* () {
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
                expect(new fun_promise_3.default(promise)[Symbol.toStringTag]).toBe(promiseTag);
            });
        });
        describe("finally", () => {
            it("returns the same promise when given no arguments", () => {
                expect(tokenFunPromise.finally()).toBe(tokenFunPromise);
            });
            it("executes on resolution", () => tslib_3.__awaiter(void 0, void 0, void 0, function* () {
                let finallyExecuted = false;
                yield expect(fun_promise_3.default.resolve(false).finally(() => {
                    finallyExecuted = true;
                })).resolves.toBe(false);
                expect(finallyExecuted).toBe(true);
            }));
            it("executes on rejection", () => tslib_3.__awaiter(void 0, void 0, void 0, function* () {
                let finallyExecuted = false;
                yield expect(fun_promise_3.default.reject("BOOM!").finally(() => {
                    finallyExecuted = true;
                })).rejects.toBe("BOOM!");
                expect(finallyExecuted).toBe(true);
            }));
        });
        describe("reject", () => {
            lodash_1.default.forEach({ static: fun_promise_3.default, instance: tokenFunPromise }, (impl, name) => {
                describe(name, () => {
                    it("rejects correctly", () => tslib_3.__awaiter(void 0, void 0, void 0, function* () {
                        yield expect(impl.reject(true)).rejects.toBe(true);
                    }));
                    it("doesn't change the object that is rejected", () => tslib_3.__awaiter(void 0, void 0, void 0, function* () {
                        const reason = { foo: true, bar: 42 };
                        yield expect(impl.reject(reason)).rejects.toBe(reason);
                    }));
                });
            });
        });
        describe("coalesce", () => {
            function runCoalesce(args, test) {
                return fun_promise_3.default.coalesce(args, test);
            }
            it("basically works", () => tslib_3.__awaiter(void 0, void 0, void 0, function* () {
                yield expect(runCoalesce([() => null, Promise.resolve(() => true)])).resolves.toBe(true);
            }));
            it("returns the first resolving value", () => tslib_3.__awaiter(void 0, void 0, void 0, function* () {
                yield expect(runCoalesce([() => fun_promise_3.default.delay(1000).resolve(true), () => false])).resolves.toBe(false);
            }));
            it("returns the value that passes the test", () => tslib_3.__awaiter(void 0, void 0, void 0, function* () {
                yield expect(runCoalesce([() => 2, () => 4], (it) => it > 2)).resolves.toBe(4);
            }));
            it("throws the error if nothing passes the test", () => tslib_3.__awaiter(void 0, void 0, void 0, function* () {
                yield expect(runCoalesce([() => Promise.reject("BOOM!"), () => 4], (it) => it > 4)).rejects.toBe("BOOM!");
            }));
            it("punts appropriately after the first resolution", () => tslib_3.__awaiter(void 0, void 0, void 0, function* () {
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
                                    return fun_promise_3.default.delay(delayMs, arg);
                                }
                                else {
                                    return fun_promise_3.default.resolve().delay(delayMs, arg);
                                }
                            }
                            describe("basically works", () => {
                                it("with no arg", () => tslib_3.__awaiter(void 0, void 0, void 0, function* () {
                                    yield expect(runDelay()).resolves;
                                }));
                                it("with one arg", () => tslib_3.__awaiter(void 0, void 0, void 0, function* () {
                                    yield expect(runDelay(1000)).resolves.toBe(1000);
                                }));
                            });
                        });
                    });
                });
            });
        });
        describe("simplify", () => {
            it("basically works", () => tslib_3.__awaiter(void 0, void 0, void 0, function* () {
                yield expect(new fun_promise_3.default(Promise.resolve(Promise.resolve(true))).simplify()).resolves.toBe(true);
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
                            return fun_promise_3.default.filter(values, test);
                        }
                        else {
                            return fun_promise_3.default.resolve(values).filter(test);
                        }
                    }
                    it("basically works", () => tslib_3.__awaiter(void 0, void 0, void 0, function* () {
                        yield expect(doFilter()).resolves.not.toBeEmpty();
                        yield expect(doFilter()).resolves.toBeArrayOfSize(4);
                    }));
                });
            });
        });
        describe("arrayifyResolved", () => {
            it("basically works", () => tslib_3.__awaiter(void 0, void 0, void 0, function* () {
                const value = [1, 2, 3, 4];
                yield expect(fun_promise_3.default.resolve(value).arrayifyResolved()).resolves.toStrictEqual(value);
            }));
            it("returns a clone", () => tslib_3.__awaiter(void 0, void 0, void 0, function* () {
                const value = [1, 2, 3, 4];
                yield expect(fun_promise_3.default.resolve(value)
                    .arrayifyResolved()
                    .then((it) => {
                    it.pop();
                    return it;
                })).resolves.not.toBe(value);
                expect(value).toHaveLength(4);
            }));
            it("resolves arguments", () => tslib_3.__awaiter(void 0, void 0, void 0, function* () {
                yield expect(fun_promise_3.default.resolve([1, 2, Promise.reject("BOOM!")]).arrayifyResolved()).rejects.toBe("BOOM!");
            }));
        });
    });
});
//# sourceMappingURL=index.js.map