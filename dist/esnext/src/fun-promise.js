/**
 * @format
 */
/// <reference lib="es5" />
/// <reference lib="es2015.iterable" />
/// <reference lib="es2015.promise" />
/// <reference lib="es2015.symbol.wellknown" />
/// <reference lib="es2018.asyncgenerator" />
/// <reference lib="es2018.asynciterable" />
/// <reference lib="es2018.promise" />
/// <reference lib="es2020.promise" />
/// <reference lib="esnext.promise" />
import { Fulfillment, Rejection, } from "./types";
import { NestedError } from "ts-nested-error";
import _defer from "lodash/defer";
import _delay from "lodash/delay";
import _filter from "lodash/filter";
import _flatten from "lodash/flatten";
import _identity from "lodash/identity";
import _isEmpty from "lodash/isEmpty";
import "lodash/isError";
import _isFunction from "lodash/isFunction";
import _isNil from "lodash/isNil";
import _map from "lodash/map";
import _negate from "lodash/negate";
import "lodash/noop";
import _toArray from "lodash/toArray";
// import Debug from "debug";
// const debug = Debug("fun-promises");
/**
 * The class that you should use instead of `Promise`.  It implements the `Promise` API, so it should be a drop-in replacement.
 */
export default class FunPromise {
    /**
     * Whether or not this FunPromise has been cancelled.
     */
    _isCancelled = false;
    /**
     * The promise that was wrapped after attaching our custom logic.
     */
    wrapped;
    /**
     * Constructor, which takes the promise to wrap.
     */
    constructor(wrapped) {
        this.wrapped = new Promise(async (resolve, reject) => {
            let resolved = null;
            try {
                resolved = await wrapped;
            }
            catch (e) {
                if (this._isCancelled)
                    return;
                reject(e);
            }
            if (this._isCancelled)
                return;
            resolve(resolved);
        });
    }
    /**
     * Takes a value (or a promise of a value) and returns a promise wrapping
     * it.
     */
    static resolve(value) {
        if (value instanceof FunPromise) {
            return value;
        }
        else if (value instanceof Promise) {
            return new FunPromise(value);
        }
        else {
            return new FunPromise(new Promise((resolve) => resolve(value)));
        }
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
        if (_isNil(onrejected)) {
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
    catch(onrejected = _identity) {
        return new FunPromise(this.wrapped.catch(onrejected));
    }
    static all(...values) {
        return FunPromise.resolve(_flatten(values)).all();
    }
    all() {
        return this.arrayify(true);
    }
    static try(source, ...args) {
        return FunPromise.resolve(source).then((f) => {
            if (_isEmpty(args)) {
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
     * For each element of the resolved iterable, unwraps layers of `PromiseLike` wrappers as necessary.
     */
    simplifyAll() {
        return this.arrayify().map((it) => FunPromise.resolve(it).simplify());
    }
    /**
     * Coerces the resolve value (which must be an `Iterable`) into an array.  The `Iterable` requirement
     * comes from the `Item<T>` return value: `Item<T>` is equivalent to `never` if `T` is not an `Iterable`.
     *
     * Note that this function does *NOT* resolve the items within the array unless you pass the first argument
     * as `true`.  The items are not resolved sequentially unless you also pass a second argument as `true`.
     */
    arrayify(resolveValues = false, sequentialResolution = false) {
        const aryPromise = this.then(async (iterPromise) => _toArray(await iterPromise) // Just to be sure we're all de-promise'd
        );
        if (resolveValues) {
            if (sequentialResolution) {
                return aryPromise.then(async (ary) => {
                    const results = [];
                    while (!_isEmpty(ary)) {
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
            await Promise.all(_map(await this.arrayify(), async (value, idx) => {
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
        if (_isFunction(onfinally)) {
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
    static coalesce(fns, test = _negate(_isNil)) {
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
            return new FunPromise(new Promise((resolve) => _defer(resolve, returnValue)));
        }
        else {
            return new FunPromise(new Promise((resolve) => _delay(resolve, waitTimeMs, returnValue)));
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
            return _filter(ary, (it, idx) => results[idx]);
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
            const promises = _map(ary, async (value) => mapper(await value));
            const resolved = await Promise.all(promises);
            const flattened = _flatten(resolved);
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
                throw new NestedError("Error thrown in 'tapCatch'", err, err2);
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
            await Promise.all(_map(ary, callback));
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
            await Promise.all(_map(ary, async (promisableValue) => {
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
     * Given an initial array of values and an accumulator function, apply the accumlator function to each element of the promise's resolved value,
     * passing in the current array of values and the resolved item.  Returns an array with the concatenated results of the accumulation.
     * If any of the promise's values are rejected, the entire operation will be rejected.
     *
     * The resolution order is not guaranteed. The accumulator function will be passed values as those values resolve.
     */
    flatFold(initialValue, accumulator) {
        return this.arrayify().then(async (ary) => {
            let memoPromise = FunPromise.resolve(initialValue).arrayify();
            await Promise.all(_map(ary, async (promisableValue) => {
                const value = await promisableValue;
                memoPromise = memoPromise.then(async (memo) => memo.concat(_toArray(await accumulator(memo, value))));
            }));
            return memoPromise;
        });
    }
    /**
     * Equivalent to `FunPromise.resolve(values).flatFold(initialValue, accumulator)`.
     */
    static flatFold(values, initialValue, accumulator) {
        return FunPromise.resolve(values).flatFold(initialValue, accumulator);
    }
    /**
     * Handles rejections like 'catch', but wraps them in a [[`NestedError`]] with the given message.
     */
    wrapError(msg) {
        return this.catch(NestedError.rethrow(msg));
    }
    /**
     * Resolves all the elements of the resolved value, which is assumed to be an `Iterable`.  If any
     * of the values reject, all the reasons are collected and wrapped in a [[`NestedError`]].
     */
    wrapErrors(msg) {
        return this.arrayify().then(async (ary) => {
            let errors = [];
            await Promise.all(_map(ary, (val) => Promise.resolve(val).catch((e) => errors.push(e))));
            if (_isEmpty(errors)) {
                return ary;
            }
            else {
                throw new NestedError(msg, ...errors);
            }
        });
    }
    /**
     * Cancel the FunPromise.  A cancelled FunPromise will silently disregard any resolution or rejection which occurs after the cancellation.
     */
    cancel() {
        this._isCancelled = true;
        return this;
    }
    /**
     * Returns whether or not the promise has been cancelled.  See `cancel()` for more details.
     */
    isCancelled() {
        return this._isCancelled;
    }
    /**
     * Captures either fulfillment or rejection and resolves an object that describes the result.
     */
    settle() {
        return new FunPromise(this.wrapped.then((value) => new Fulfillment(value), (reason) => new Rejection(reason)));
    }
    /**
     * Assuming that the resolved value is an iterable, then for each element of the
     * array, captures either the fulfillment or rejection of that element.
     */
    settleAll() {
        return new FunPromise(this.arrayify().wrapped.then((ary) => Promise.all(_map(ary, (val) => Promise.resolve(val).then((value) => new Fulfillment(value), (reason) => new Rejection(reason))))));
    }
    /**
     *  Equivalent to `FunPromise.resolve(iterable).settleAll()`.
     */
    static settleAll(iterable) {
        return new FunPromise(Promise.resolve(iterable).then((ary) => Promise.all(_map(ary, (val) => Promise.resolve(val).then((value) => new Fulfillment(value), (reason) => new Rejection(reason))))));
    }
}
//# sourceMappingURL=fun-promise.js.map