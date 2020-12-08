"use strict";
/**
 * @format
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ts_nested_error_1 = require("ts-nested-error");
const defer_1 = __importDefault(require("lodash/defer"));
const delay_1 = __importDefault(require("lodash/delay"));
const filter_1 = __importDefault(require("lodash/filter"));
const flatten_1 = __importDefault(require("lodash/flatten"));
const identity_1 = __importDefault(require("lodash/identity"));
const isEmpty_1 = __importDefault(require("lodash/isEmpty"));
const isFunction_1 = __importDefault(require("lodash/isFunction"));
const isNil_1 = __importDefault(require("lodash/isNil"));
const map_1 = __importDefault(require("lodash/map"));
const negate_1 = __importDefault(require("lodash/negate"));
// import Debug from "debug";
// const debug = Debug("fun-promises");
/**
 * The class that you should use instead of `Promise`.  It implements the `Promise` API, so it should be a drop-in replacement.
 */
class FunPromise {
    /**
     * Constructor, which takes the promise to wrap.
     */
    constructor(wrapped) {
        this.wrapped = wrapped;
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
     */
    resolve(value) {
        return new FunPromise(this.wrapped.then(() => value));
    }
    /**
     * An alias for `resolve` provided for consistency with the instance `return` method.
     *
     * @deprecated Use `resolve` instead.
     */
    static return(value) {
        return FunPromise.resolve(value);
    }
    /**
     * An alias for `resolve` provided for compatibility with [the Bluebird API|http://bluebirdjs.com/docs/api/return.html].
     *
     * @deprecated Use `resolve` instead.
     */
    return(value) {
        return this.resolve(value);
    }
    /**
     * Takes a value (or a promise of a value) and returns a promise rejecting
     * with that value, after unwrapping as many layers of `PromiseLike`
     * wrappers as necessary.
     */
    static reject(value) {
        return new FunPromise(Promise.reject(value));
    }
    /**
     * Takes a value (or a promise of a value) and returns a promise rejecting
     * with that value, after unwrapping as many layers of `PromiseLike`
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
     * Attaches a callback for only the rejection of the Promise.  If the callback throws, then throws a [[`NestedError`]] with
     * both the original rejection reason and the new thrown value.
     *
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
        return this.arrayify(true);
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
     * Unwraps layers of `PromiseLike` wrappers as necessary.
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
     * Coerces the resolve value (which must be an `Iterable`) into an array.  The `Iterable` requirement
     * comes from the `Item<T>` return value: `Item<T>` is equivalent to `never` if `T` is not an `Iterable`.
     *
     * Note that this function does *NOT* resolve the items within the array unless you pass the first argument
     * as `true`.  The items are not resolved sequentially unless you also pass a second argument as `true`.
     */
    arrayify(resolveValues = false, sequentialResolution = false) {
        const aryPromise = this.then((iter) => [
            ...iter,
        ]);
        if (resolveValues) {
            if (sequentialResolution) {
                return aryPromise.then(async (ary) => {
                    const results = [];
                    while (!isEmpty_1.default(ary)) {
                        results.push(await ary.shift());
                    }
                    return results;
                });
            }
            else {
                return aryPromise.then((ary) => Promise.all(ary));
            }
        }
        else {
            return aryPromise;
        }
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
        return FunPromise.try(async () => {
            await Promise.all(map_1.default(await this.arrayify(), async (value, idx) => {
                results[idx] = await mapper(await value);
            }));
            return results;
        });
    }
    /**
     * Equivalent to `FunPromise.resolve(values).map(mapper)`.
     */
    static map(values, mapper) {
        return FunPromise.resolve(values).map(mapper);
    }
    /**
     * Required to implement `Promise`, but you almost certainly don't care about it.
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
        return this.arrayify().then(async (ary) => {
            const results = await FunPromise.map(ary, async (it) => test(await it));
            // @ts-ignore
            return filter_1.default(ary, (it, idx) => results[idx]);
        });
    }
    /**
     * Equivalent to `FunPromise.resolve(items).filter(test)`.
     */
    static filter(items, test) {
        return FunPromise.resolve(items).filter(test);
    }
    /**
     * Given a mapping function, apply the mapping function to each element of the promise's resolved value,
     * and return an array with the concatenated results of the mapping.  If any of the mapping results are
     * rejected, the entire operation will be rejected.
     *
     * The order of the elements in the result correspond to the order of the elements in the promise's
     * resolved value.  However, the resolution order is not guaranteed.
     */
    flatMap(mapper) {
        return this.arrayify().then(async (ary) => {
            const promises = map_1.default(ary, async (value) => mapper(await value));
            const resolved = await Promise.all(promises);
            const flattened = flatten_1.default(resolved);
            return flattened;
        });
    }
    /**
     * Equivalent to `FunPromise.resolve(values).flatMap(mapper)`.
     */
    static flatMap(values, mapper) {
        return FunPromise.resolve(values).flatMap(mapper);
    }
    /**
     * Access the resolved value without changing it.  Note that if the callback rejects (ie: throws),
     * then the resulting promise will be rejected.
     */
    tap(callback) {
        return this.then(async (val) => {
            await callback(val);
            return val;
        });
    }
    /**
     * Access the rejection reason without changing it.  Note that if the callback itself rejects (ie: throws),
     * both rejection reasons will be capture in a single [[`NestedError`]].
     */
    tapCatch(callback) {
        return this.catch(async (err) => {
            try {
                await callback(err);
            }
            catch (err2) {
                throw new ts_nested_error_1.NestedError("Error thrown in 'tapCatch'", err, err2);
            }
            throw err;
        });
    }
    /**
     * Access each of the resolved values of a resolved iterable without changing it.  Note that if the callback rejects (ie: throws),
     * then the resulting promise will be rejected.
     */
    tapEach(callback) {
        return this.arrayify(true).tap(async (ary) => {
            await Promise.all(map_1.default(ary, callback));
        });
    }
    /**
     * Given an initial value and an accumulator function, apply the accumlator function to each element of the promise's resolved value,
     * passing in the current value and the result.  Returns an array with the result of the accumulation.  If any of the promise's values are
     * rejected, the entire operation will be rejected.
     *
     * The resolution order is not guaranteed. The accumulator function will be passed values as those values resolve.
     */
    fold(initialValue, accumulator) {
        return this.arrayify().then(async (ary) => {
            let memoPromise = FunPromise.resolve(initialValue);
            await Promise.all(map_1.default(ary, async (promisableValue) => {
                const value = await promisableValue;
                memoPromise = memoPromise.then((memo) => accumulator(memo, value));
            }));
            return await memoPromise;
        });
    }
    /**
     * Equivalent to `FunPromise.resolve(values).fold(initialValue, accumulator)`.
     */
    static fold(values, initialValue, accumulator) {
        return FunPromise.resolve(values).fold(initialValue, accumulator);
    }
    /**
     * Handles rejections like 'catch', but wraps them in a [[`NestedError`]] with the given message.
     */
    wrapError(msg) {
        return this.catch(ts_nested_error_1.NestedError.rethrow(msg));
    }
    /**
     * Resolves all the elements of the resolved value, which is assumed to be an `Iterable`.  If any
     * of the values reject, all the reasons are collected and wrapped in a [[`NestedError`]].
     */
    wrapErrors(msg) {
        return this.arrayify().then(async (ary) => {
            let errors = [];
            await Promise.all(map_1.default(ary, (val) => Promise.resolve(val).catch((e) => errors.push(e))));
            if (isEmpty_1.default(errors)) {
                return ary;
            }
            else {
                throw new ts_nested_error_1.NestedError(msg, ...errors);
            }
        });
    }
}
exports.default = FunPromise;
//# sourceMappingURL=fun-promise.js.map