/**
 * @format
 */

/* What follows ensures that we have the entire Promise API implemented */
/// <reference path="../node_modules/typescript/lib/lib.es5.d.ts" />
/// <reference path="../node_modules/typescript/lib/lib.es2015.iterable.d.ts" />
/// <reference path="../node_modules/typescript/lib/lib.es2015.promise.d.ts" />
/// <reference path="../node_modules/typescript/lib/lib.es2015.symbol.wellknown.d.ts" />
/// <reference path="../node_modules/typescript/lib/lib.es2018.promise.d.ts" />
/// <reference path="../node_modules/typescript/lib/lib.es2020.promise.d.ts" />
/// <reference path="../node_modules/typescript/lib/lib.esnext.promise.d.ts" />

import {
	Promisable,
	PromisableIterable,
	Unpromise,
	Item,
	Settlement,
	Fulfillment,
	Rejection,
} from "./types";
import { NestedError } from "ts-nested-error";

import _defer from "lodash/defer";
import _delay from "lodash/delay";
import _filter from "lodash/filter";
import _flatten from "lodash/flatten";
import _identity from "lodash/identity";
import _isEmpty from "lodash/isEmpty";
import _isError from "lodash/isError";
import _isFunction from "lodash/isFunction";
import _isNil from "lodash/isNil";
import _map from "lodash/map";
import _negate from "lodash/negate";
import _noop from "lodash/noop";
import _toArray from "lodash/toArray";

// import Debug from "debug";
// const debug = Debug("fun-promises");

/**
 * The class that you should use instead of `Promise`.  It implements the `Promise` API, so it should be a drop-in replacement.
 */
export default class FunPromise<T> implements Promise<T> {
	/**
	 * Whether or not this FunPromise has been cancelled.
	 */
	private _isCancelled: boolean = false;

	/**
	 * The promise that was wrapped after attaching our custom logic.
	 */
	protected readonly wrapped: Promise<T>;

	/**
	 * Constructor, which takes the promise to wrap.
	 */
	constructor(wrapped: Promise<T>) {
		this.wrapped = new Promise(async (resolve, reject) => {
			let resolved = null;
			try {
				resolved = await wrapped;
			} catch (e) {
				if (this._isCancelled) return;
				reject(e);
			}
			if (this._isCancelled) return;
			resolve(resolved);
		});
	}

	/**
	 * Takes a value (or a promise of a value) and returns a promise wrapping
	 * it.
	 */
	static resolve<T = void>(value?: Promisable<T>): FunPromise<T> {
		if (value instanceof FunPromise) {
			return value as FunPromise<T>;
		} else if (value instanceof Promise) {
			return new FunPromise(value);
		} else {
			return new FunPromise(new Promise((resolve) => resolve(value)));
		}
	}

	/**
	 * Takes a value (or a promise of a value) and resolves to the new value,
	 * disregarding any previous resolution value.
	 */
	resolve<T2 = void>(value?: Promisable<T2>): FunPromise<T2> {
		return new FunPromise(this.wrapped.then(() => value));
	}

	/**
	 * An alias for `resolve` provided for consistency with the instance `return` method.
	 *
	 * @deprecated Use `resolve` instead.
	 */
	static return<T = void>(value?: Promisable<T>): FunPromise<T> {
		return FunPromise.resolve(value);
	}

	/**
	 * An alias for `resolve` provided for compatibility with [the Bluebird API|http://bluebirdjs.com/docs/api/return.html].
	 *
	 * @deprecated Use `resolve` instead.
	 */
	return<T2 = void>(value?: Promisable<T2>): FunPromise<T2> {
		return this.resolve(value);
	}

	/**
	 * Takes a value (or a promise of a value) and returns a promise rejecting
	 * with that value, after unwrapping as many layers of `PromiseLike`
	 * wrappers as necessary.
	 */
	static reject(value?: unknown): FunPromise<never> {
		return new FunPromise(Promise.reject(value));
	}

	/**
	 * Takes a value (or a promise of a value) and returns a promise rejecting
	 * with that value, after unwrapping as many layers of `PromiseLike`
	 * wrappers as necessary.  This disregards any existing status.
	 */
	reject(value?: unknown): FunPromise<never> {
		return FunPromise.reject(value);
	}

	/**
	 * Attaches callbacks for the resolution and/or rejection of the Promise.
	 * @param onfulfilled The optional callback to execute when the Promise is resolved.
	 * @param onrejected The optional callback to execute when the Promise is rejected.  If provided, the result of this callback is the new resolution value, and this promise is resolved, not rejected.
	 * @returns A Promise for the completion of which ever callback is executed.
	 */
	then<TResult1 = T>(
		onfulfilled: (value: T) => Promisable<TResult1>
	): FunPromise<TResult1>;
	then<TResult1 = T, TResult2 = TResult1>(
		onfulfilled: (value: T) => Promisable<TResult1>,
		onrejected: (reason: unknown) => Promisable<TResult2>
	): FunPromise<TResult1 | TResult2>;
	then<TResult1 = T, TResult2 = TResult1>(
		onfulfilled: (value: T) => Promisable<TResult1>,
		onrejected?: (reason: unknown) => Promisable<TResult2>
	): FunPromise<TResult1 | TResult2> {
		if (_isNil(onrejected)) {
			return new FunPromise(this.wrapped.then(onfulfilled));
		} else {
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
	catch<TResult = never>(
		onrejected: (reason: unknown) => Promisable<TResult> = _identity
	): FunPromise<T | TResult> {
		return new FunPromise(this.wrapped.catch(onrejected));
	}

	/**
	 * Creates a Promise that is resolved with an array of results when all of the
	 * provided Promises resolve, or rejected when any Promise is rejected.
	 * @param values An array of Promises.
	 * @returns A new Promise.
	 */
	static all<T>(values: PromisableIterable<T>): FunPromise<T[]>;
	static all<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
		values: [
			Promisable<T1>,
			Promisable<T2>,
			Promisable<T3>,
			Promisable<T4>,
			Promisable<T5>,
			Promisable<T6>,
			Promisable<T7>,
			Promisable<T8>,
			Promisable<T9>,
			Promisable<T10>
		]
	): FunPromise<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]>;
	static all<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
		values: [
			Promisable<T1>,
			Promisable<T2>,
			Promisable<T3>,
			Promisable<T4>,
			Promisable<T5>,
			Promisable<T6>,
			Promisable<T7>,
			Promisable<T8>,
			Promisable<T9>
		]
	): FunPromise<[T1, T2, T3, T4, T5, T6, T7, T8, T9]>;
	static all<T1, T2, T3, T4, T5, T6, T7, T8>(
		values: [
			Promisable<T1>,
			Promisable<T2>,
			Promisable<T3>,
			Promisable<T4>,
			Promisable<T5>,
			Promisable<T6>,
			Promisable<T7>,
			Promisable<T8>
		]
	): FunPromise<[T1, T2, T3, T4, T5, T6, T7, T8]>;
	static all<T1, T2, T3, T4, T5, T6, T7>(
		values: [
			Promisable<T1>,
			Promisable<T2>,
			Promisable<T3>,
			Promisable<T4>,
			Promisable<T5>,
			Promisable<T6>,
			Promisable<T7>
		]
	): FunPromise<[T1, T2, T3, T4, T5, T6, T7]>;
	static all<T1, T2, T3, T4, T5, T6>(
		values: [
			Promisable<T1>,
			Promisable<T2>,
			Promisable<T3>,
			Promisable<T4>,
			Promisable<T5>,
			Promisable<T6>
		]
	): FunPromise<[T1, T2, T3, T4, T5, T6]>;
	static all<T1, T2, T3, T4, T5>(
		values: [
			Promisable<T1>,
			Promisable<T2>,
			Promisable<T3>,
			Promisable<T4>,
			Promisable<T5>
		]
	): FunPromise<[T1, T2, T3, T4, T5]>;
	static all<T1, T2, T3, T4>(
		values: [Promisable<T1>, Promisable<T2>, Promisable<T3>, Promisable<T4>]
	): FunPromise<[T1, T2, T3, T4]>;
	static all<T1, T2, T3>(
		values: [Promisable<T1>, Promisable<T2>, Promisable<T3>]
	): FunPromise<[T1, T2, T3]>;
	static all<T1, T2>(
		values: [Promisable<T1>, Promisable<T2>]
	): FunPromise<[T1, T2]>;
	static all<T1>(values: [Promisable<T1>]): FunPromise<[T1]>;
	static all(...values: any[]): any {
		return FunPromise.resolve(_flatten(values)).all();
	}
	all(): FunPromise<Item<T>[]> {
		return this.arrayify(true);
	}

	/**
	 * Given a function (or a promise of a function) that returns a value (or a promise of a value),
	 * create a promise that executes the function and returns the value. If executing the function
	 * throws an exception, then that exception becomes the rejection of the promise.
	 *
	 * Any arguments after the first will be passed into the function when it is invoked. If they are
	 * a `PromiseLike`, then they will be resolved and the resolution value will be passed into the
	 * function instead.
	 *
	 * This function is really useful in the following cases:
	 *   1. to [avoid releasing Zalgo](https://blog.izs.me/2013/08/designing-apis-for-asynchrony)
	 *   2. when you want to create a `FunPromise` based on an `async` function
	 *   3. when you want to create a `FunPromise` based on a normal function
	 */
	static try<T, Arg1, Arg2, Arg3, Arg4, Arg5, Arg6, Arg7, Arg8>(
		source: Promisable<
			(
				arg1: Arg1,
				arg2: Arg2,
				arg3: Arg3,
				arg4: Arg4,
				arg5: Arg5,
				arg6: Arg6,
				arg7: Arg7,
				arg8: Arg8
			) => Promisable<T>
		>,
		arg1: Promisable<Arg1>,
		arg2: Promisable<Arg2>,
		arg3: Promisable<Arg3>,
		arg4: Promisable<Arg4>,
		arg5: Promisable<Arg5>,
		arg6: Promisable<Arg6>,
		arg7: Promisable<Arg7>,
		arg8: Promisable<Arg8>
	): FunPromise<T>;
	static try<T, Arg1, Arg2, Arg3, Arg4, Arg5, Arg6, Arg7>(
		source: Promisable<
			(
				arg1: Arg1,
				arg2: Arg2,
				arg3: Arg3,
				arg4: Arg4,
				arg5: Arg5,
				arg6: Arg6,
				arg7: Arg7
			) => Promisable<T>
		>,
		arg1: Promisable<Arg1>,
		arg2: Promisable<Arg2>,
		arg3: Promisable<Arg3>,
		arg4: Promisable<Arg4>,
		arg5: Promisable<Arg5>,
		arg6: Promisable<Arg6>,
		arg7: Promisable<Arg7>
	): FunPromise<T>;
	static try<T, Arg1, Arg2, Arg3, Arg4, Arg5, Arg6>(
		source: Promisable<
			(
				arg1: Arg1,
				arg2: Arg2,
				arg3: Arg3,
				arg4: Arg4,
				arg5: Arg5,
				arg6: Arg6
			) => Promisable<T>
		>,
		arg1: Promisable<Arg1>,
		arg2: Promisable<Arg2>,
		arg3: Promisable<Arg3>,
		arg4: Promisable<Arg4>,
		arg5: Promisable<Arg5>,
		arg6: Promisable<Arg6>
	): FunPromise<T>;
	static try<T, Arg1, Arg2, Arg3, Arg4, Arg5>(
		source: Promisable<
			(
				arg1: Arg1,
				arg2: Arg2,
				arg3: Arg3,
				arg4: Arg4,
				arg5: Arg5
			) => Promisable<T>
		>,
		arg1: Promisable<Arg1>,
		arg2: Promisable<Arg2>,
		arg3: Promisable<Arg3>,
		arg4: Promisable<Arg4>,
		arg5: Promisable<Arg5>
	): FunPromise<T>;
	static try<T, Arg1, Arg2, Arg3, Arg4>(
		source: Promisable<
			(arg1: Arg1, arg2: Arg2, arg3: Arg3, arg4: Arg4) => Promisable<T>
		>,
		arg1: Promisable<Arg1>,
		arg2: Promisable<Arg2>,
		arg3: Promisable<Arg3>,
		arg4: Promisable<Arg4>
	): FunPromise<T>;
	static try<T, Arg1, Arg2, Arg3>(
		source: Promisable<(arg1: Arg1, arg2: Arg2, arg3: Arg3) => Promisable<T>>,
		arg1: Promisable<Arg1>,
		arg2: Promisable<Arg2>,
		arg3: Promisable<Arg3>
	): FunPromise<T>;
	static try<T, Arg1, Arg2>(
		source: Promisable<(arg1: Arg1, arg2: Arg2) => Promisable<T>>,
		arg1: Promisable<Arg1>,
		arg2: Promisable<Arg2>
	): FunPromise<T>;
	static try<T, Arg1>(
		source: Promisable<(arg1: Arg1) => Promisable<T>>,
		arg1: Promisable<Arg1>
	): FunPromise<T>;
	static try<T>(source: Promisable<() => Promisable<T>>): FunPromise<T>;
	static try<T, ArgT = any>(
		source: Promisable<(...args: ArgT[]) => Promisable<T>>,
		...args: ArgT[]
	): FunPromise<T> {
		return FunPromise.resolve(source).then((f) => {
			if (_isEmpty(args)) {
				return f();
			} else {
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
	simplify(): FunPromise<Unpromise<T>> {
		return (this as unknown) as FunPromise<Unpromise<T>>;
	}

	/**
	 * For each element of the resolved iterable, unwraps layers of `PromiseLike` wrappers as necessary.
	 */
	simplifyAll(): FunPromise<Unpromise<Item<T>>[]> {
		return this.arrayify().map((it) => FunPromise.resolve(it).simplify());
	}

	/**
	 * Coerces the resolve value (which must be an `Iterable`) into an array.  The `Iterable` requirement
	 * comes from the `Item<T>` return value: `Item<T>` is equivalent to `never` if `T` is not an `Iterable`.
	 *
	 * Note that this function does *NOT* resolve the items within the array unless you pass the first argument
	 * as `true`.  The items are not resolved sequentially unless you also pass a second argument as `true`.
	 */
	arrayify(
		resolveValues: boolean = false,
		sequentialResolution: boolean = false
	): FunPromise<Item<T>[]> {
		const aryPromise: FunPromise<Item<T>[]> = this.then((iter) => [
			...((iter as unknown) as Iterable<Item<T>>),
		]);
		if (resolveValues) {
			if (sequentialResolution) {
				return aryPromise.then(async (ary) => {
					const results = [];
					while (!_isEmpty(ary)) {
						results.push(await ary.shift());
					}
					return results;
				});
			} else {
				return aryPromise.then((ary) => Promise.all(ary));
			}
		} else {
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
	map<T2 = Item<T>>(mapper: (it: Item<T>) => Promisable<T2>): FunPromise<T2[]> {
		const results = [];
		return FunPromise.try(async () => {
			await Promise.all(
				_map(await this.arrayify(), async (value, idx) => {
					results[idx] = await mapper(await value);
				})
			);
			return results;
		});
	}

	/**
	 * Equivalent to `FunPromise.resolve(values).map(mapper)`.
	 */
	static map<T, T2 = T>(
		values: PromisableIterable<T>,
		mapper: (it: T) => Promisable<T2>
	): FunPromise<T2[]> {
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

	/**
	 * Executes the provided code whether the promise rejects or resolves.
	 */
	finally(): FunPromise<T>;
	finally(onfinally: () => void): FunPromise<T>;
	finally(onfinally?) {
		if (_isFunction(onfinally)) {
			return new FunPromise(this.wrapped.finally(onfinally));
		} else {
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
	static coalesce<T>(
		fns: PromisableIterable<() => Promisable<T>>,
		test: (item: T) => Promisable<boolean> = _negate(_isNil)
	): FunPromise<T> {
		let resolved = false;
		let lastSeenReason: unknown = new Error("No values left after coalescing");
		let resolveValue;
		return FunPromise.map(fns, (fn) =>
			FunPromise.try(fn)
				.then((result) => {
					if (resolved) return null;
					return FunPromise.try(test, result).then((testResult) => {
						if (resolved) return null;
						if (testResult) {
							resolved = true;
							resolveValue = result;
						}
					});
				})
				.catch((e) => {
					lastSeenReason = e;
				})
		).then(() => {
			if (resolved) {
				return resolveValue;
			} else {
				throw lastSeenReason;
			}
		});
	}

	/**
	 * Waits for `waitTimeMs` milliseconds before resolving.  If `returnValue` is provided, resolves with the provided value.
	 *
	 * If `waitTimeMs` is less than or equal to zero, then it simply defers until the call stack is clear.
	 */
	static delay(waitTimeMs: number): FunPromise<void>;
	static delay<T>(
		waitTimeMs: number,
		returnValue: Promisable<T>
	): FunPromise<T>;
	static delay(waitTimeMs, returnValue?) {
		return FunPromise.resolve().delay(waitTimeMs, returnValue);
	}

	/**
	 * Waits for `waitTimeMs` milliseconds before resolving.  If `returnValue` is provided, resolves with the provided value.
	 *
	 * If `waitTimeMs` is less than or equal to zero, then it simply defers until the call stack is clear.
	 */
	delay<T = void>(
		waitTimeMs: number,
		returnValue?: Promisable<T>
	): FunPromise<T> {
		if (waitTimeMs <= 0) {
			return new FunPromise(
				new Promise((resolve) => _defer(resolve, returnValue))
			);
		} else {
			return new FunPromise(
				new Promise((resolve) => _delay(resolve, waitTimeMs, returnValue))
			);
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
	filter(test: (it: Item<T>) => Promisable<boolean>): FunPromise<Item<T>[]> {
		return this.arrayify().then(async (ary) => {
			const results = await FunPromise.map(ary, async (it) => test(await it));
			// @ts-ignore
			return _filter(ary, (it, idx) => results[idx]);
		});
	}

	/**
	 * Equivalent to `FunPromise.resolve(items).filter(test)`.
	 */
	static filter<T>(
		items: PromisableIterable<T>,
		test: (it: Item<PromisableIterable<T>>) => Promisable<boolean>
	): FunPromise<Item<PromisableIterable<T>>[]> {
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
	flatMap<T2 = Item<T>>(
		mapper: (it: Item<T>) => Promisable<T2[]>
	): FunPromise<T2[]> {
		return this.arrayify().then(async (ary: Promisable<Item<T>>[]) => {
			const promises: Array<Promise<Array<T2>>> = _map(ary, async (value) =>
				mapper(await value)
			);
			const resolved: T2[][] = await Promise.all(promises);
			const flattened: T2[] = _flatten(resolved);
			return flattened;
		});
	}

	/**
	 * Equivalent to `FunPromise.resolve(values).flatMap(mapper)`.
	 */
	static flatMap<T, T2 = T>(
		values: PromisableIterable<T>,
		mapper: (it: T) => Promisable<T2[]>
	): FunPromise<T2[]> {
		return FunPromise.resolve(values).flatMap(mapper);
	}

	/**
	 * Access the resolved value without changing it.  Note that if the callback rejects (ie: throws),
	 * then the resulting promise will be rejected.
	 */
	tap(callback: (val: T) => Promisable<void>): FunPromise<T> {
		return this.then(async (val) => {
			await callback(val);
			return val;
		});
	}

	/**
	 * Access the rejection reason without changing it.  Note that if the callback itself rejects (ie: throws),
	 * both rejection reasons will be capture in a single [[`NestedError`]].
	 */
	tapCatch(callback: (reason: unknown) => Promisable<void>): FunPromise<T> {
		return this.catch(async (err) => {
			try {
				await callback(err);
			} catch (err2) {
				throw new NestedError("Error thrown in 'tapCatch'", err, err2);
			}
			throw err;
		});
	}

	/**
	 * Access each of the resolved values of a resolved iterable without changing it.  Note that if the callback rejects (ie: throws),
	 * then the resulting promise will be rejected.
	 */
	tapEach(callback: (val: Item<T>) => Promisable<void>): FunPromise<Item<T>[]> {
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
	fold<T2 = Item<T>>(
		initialValue: T2,
		accumulator: (memo: T2, it: Item<T>) => Promisable<T2>
	): FunPromise<T2> {
		return this.arrayify().then(async (ary: Promisable<Item<T>>[]) => {
			let memoPromise = FunPromise.resolve(initialValue);
			await Promise.all(
				_map(ary, async (promisableValue) => {
					const value = await promisableValue;
					memoPromise = memoPromise.then((memo) => accumulator(memo, value));
				})
			);
			return await memoPromise;
		});
	}

	/**
	 * Equivalent to `FunPromise.resolve(values).fold(initialValue, accumulator)`.
	 */
	static fold<T, T2 = T>(
		values: PromisableIterable<T>,
		initialValue: T2,
		accumulator: (memo: T2, it: T) => Promisable<T2>
	): FunPromise<T2> {
		return FunPromise.resolve(values).fold(initialValue, accumulator);
	}

	/**
	 * Handles rejections like 'catch', but wraps them in a [[`NestedError`]] with the given message.
	 */
	wrapError(msg: string): FunPromise<T> {
		return this.catch(NestedError.rethrow(msg));
	}

	/**
	 * Resolves all the elements of the resolved value, which is assumed to be an `Iterable`.  If any
	 * of the values reject, all the reasons are collected and wrapped in a [[`NestedError`]].
	 */
	wrapErrors(msg: string): FunPromise<Item<T>[]> {
		return this.arrayify().then(async (ary) => {
			let errors = [];
			await Promise.all(
				_map(ary, (val) => Promise.resolve(val).catch((e) => errors.push(e)))
			);
			if (_isEmpty(errors)) {
				return ary;
			} else {
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
	settle(): FunPromise<Settlement<T>> {
		return new FunPromise(
			this.wrapped.then(
				(value) => new Fulfillment(value),
				(reason) => new Rejection(reason)
			)
		);
	}

	/**
	 * Assuming that the resolved value is an iterable, then for each element of the
	 * array, captures either the fulfillment or rejection of that element.
	 */
	settleAll(): FunPromise<Settlement<Item<T>>[]> {
		return new FunPromise(
			this.arrayify().wrapped.then((ary) =>
				Promise.all(
					_map(ary, (val) =>
						Promise.resolve(val).then(
							(value) => new Fulfillment(value),
							(reason) => new Rejection(reason)
						)
					)
				)
			)
		);
	}

	/**
	 *  Equivalent to `FunPromise.resolve(iterable).settleAll()`.
	 */
	static settleAll<T>(
		iterable: PromisableIterable<T>
	): FunPromise<Settlement<T>[]> {
		return new FunPromise(
			Promise.resolve(iterable).then((ary) =>
				Promise.all(
					_map(ary, (val) =>
						Promise.resolve(val).then(
							(value) => new Fulfillment(value),
							(reason) => new Rejection(reason)
						)
					)
				)
			)
		);
	}
}
