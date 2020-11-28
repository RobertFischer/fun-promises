/** @format */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "tslib", "lodash/defer", "lodash/delay", "lodash/filter", "lodash/flatten", "lodash/identity", "lodash/isEmpty", "lodash/isError", "lodash/isFunction", "lodash/isNil", "lodash/map", "lodash/negate", "lodash/noop", "lodash/toArray"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const tslib_1 = require("tslib");
    const defer_1 = require("lodash/defer");
    const delay_1 = require("lodash/delay");
    const filter_1 = require("lodash/filter");
    const flatten_1 = require("lodash/flatten");
    const identity_1 = require("lodash/identity");
    const isEmpty_1 = require("lodash/isEmpty");
    require("lodash/isError");
    const isFunction_1 = require("lodash/isFunction");
    const isNil_1 = require("lodash/isNil");
    const map_1 = require("lodash/map");
    const negate_1 = require("lodash/negate");
    require("lodash/noop");
    const toArray_1 = require("lodash/toArray");
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
//# sourceMappingURL=fun-promise.js.map