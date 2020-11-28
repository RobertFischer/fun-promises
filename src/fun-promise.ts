/** @format */

/* What follows ensures that we have the entire Promise API implemented */
/// <reference path="../node_modules/typescript/lib/lib.es5.d.ts" />
/// <reference path="../node_modules/typescript/lib/lib.es2015.iterable.d.ts" />
/// <reference path="../node_modules/typescript/lib/lib.es2015.promise.d.ts" />
/// <reference path="../node_modules/typescript/lib/lib.es2015.symbol.wellknown.d.ts" />
/// <reference path="../node_modules/typescript/lib/lib.es2018.promise.d.ts" />
/// <reference path="../node_modules/typescript/lib/lib.es2020.promise.d.ts" />
/// <reference path="../node_modules/typescript/lib/lib.esnext.promise.d.ts" />

import type {
	Promisable,
	PromisableIterable,
	Unpromise,
	Item,
	FunctionReturnType,
} from "./types";

import _isFunction from "lodash/isFunction";
import _toArray from "lodash/toArray";
import _identity from "lodash/identity";
import _isError from "lodash/isError";
import _noop from "lodash/noop";
import _ from "lodash";

// import Debug from "debug";
// const debug = Debug("fun-promises");

/**
 * The class that you should use instead of [[`Promise`]].  It implements the `Promise` API, so it should be a drop-in replacement.
 */
export default class FunPromise<T> implements Promise<T> {
	/**
	 * Constructor, which takes the promise to wrap.
	 */
	constructor(protected readonly wrapped: Promise<T>) {}

	/**
	 * Takes a value (or a promise of a value) and returns a promise wrapping
	 * it.
	 */
	static resolve<T = void>(value?: Promisable<T>): FunPromise<T> {
		return new FunPromise(Promise.resolve(value));
	}

	/**
	 * Takes a value (or a promise of a value) and resolves to the new value,
	 * disregarding any previous resolution value.
	 *
	 */
	resolve<T2 = void>(value?: Promisable<T2>): FunPromise<T2> {
		return new FunPromise(this.wrapped.then(() => value));
	}

	/**
	 * Takes a value (or a promise of a value) and returns a promise rejecting
	 * with that value, after unwrapping as many layers of [[`PromiseLike`]]
	 * wrappers as necessary.
	 */
	static reject(value?: unknown): FunPromise<never> {
		return new FunPromise(Promise.reject(value));
	}

	/**
	 * Takes a value (or a promise of a value) and returns a promise rejecting
	 * with that value, after unwrapping as many layers of [[`PromiseLike`]]
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
		onrejected: (reason: any) => Promisable<TResult2>
	): FunPromise<TResult1 | TResult2>;
	then<TResult1 = T, TResult2 = TResult1>(
		onfulfilled: (value: T) => Promisable<TResult1>,
		onrejected?: (reason: any) => Promisable<TResult2>
	): FunPromise<TResult1 | TResult2> {
		if (_.isNil(onrejected)) {
			return new FunPromise(this.wrapped.then(onfulfilled));
		} else {
			return new FunPromise(this.wrapped.then(onfulfilled, onrejected));
		}
	}

	/**
	 * Attaches a callback for only the rejection of the Promise.
	 * @param onrejected The callback to execute when the Promise is rejected.
	 * @returns A Promise for the completion of the callback.
	 */
	catch<TResult = never>(
		onrejected: (reason: any) => Promisable<TResult> = _identity
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
		return FunPromise.resolve(_.flatten(values)).all();
	}
	all(): FunPromise<Item<T>[]> {
		return this.arrayify().then((ary) => Promise.all(ary));
	}

	/**
	 * Given a function (or a promise of a function) that returns a value (or a promise of a value),
	 * create a promise that executes the function and returns the value. If executing the function
	 * throws an exception, then that exception becomes the rejection of the promise.
	 *
	 * Any arguments after the first will be passed into the function when it is invoked. If they are
	 * a [[`PromiseLike`]], then they will be resolved and the resolution value will be passed into the
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
			if (_.isEmpty(args)) {
				return f();
			} else {
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
	simplify(): FunPromise<Unpromise<T>> {
		return (this as unknown) as FunPromise<Unpromise<T>>;
	}

	/**
	 * Coerces the resolve value (which must be an [[`Iterable`]]) into an array.  The `Iterable` requirement
	 * comes from the `Item<T>` return value: `Item<T>` is equivalent to `never` if `T` is not an `Iterable`.
	 *
	 * Note that this function does *NOT* resolve the items within the array.
	 */
	arrayify(): FunPromise<Item<T>[]> {
		return this.then(_.toArray);
	}

	/**
	 * Coerces the resolve value (which must be an [[`Iterable`]]) into an array.  The `Iterable` requirement
	 * comes from the `Item<T>` return value: `Item<T>` is equivalent to `never` if `T` is not an `Iterable`.
	 *
	 * Note that this function *ALSO* resolves the items within the array.
	 */
	arrayifyResolved(): FunPromise<Item<T>[]> {
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
	map<T2 = Item<T>>(mapper: (it: Item<T>) => Promisable<T2>): FunPromise<T2[]> {
		const results = [];
		return FunPromise.try(async () => {
			await Promise.all(
				_.map(await this.arrayify(), async (value, idx) => {
					results[idx] = await mapper(value);
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
	 * Required to implement [[`Promise`]], but you almost certainly don't care about it.
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
		if (_.isFunction(onfinally)) {
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
		test: (item: T) => Promisable<boolean> = _.negate(_.isNil)
	): FunPromise<T> {
		let resolved = false;
		let lastSeenReason = new Error("No values left after coalescing");
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
				new Promise((resolve) => _.defer(resolve, returnValue))
			);
		} else {
			return new FunPromise(
				new Promise((resolve) => _.delay(resolve, waitTimeMs, returnValue))
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
			return _.filter(ary, (it, idx) => results[idx]);
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
}
