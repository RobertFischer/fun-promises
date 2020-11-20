/** @format */

/* What follows ensures that we have the entire Promise API implemented */
/// <reference path="../node_modules/typescript/lib/lib.es5.d.ts" />
/// <reference path="../node_modules/typescript/lib/lib.es2015.iterable.d.ts" />
/// <reference path="../node_modules/typescript/lib/lib.es2015.promise.d.ts" />
/// <reference path="../node_modules/typescript/lib/lib.es2015.symbol.wellknown.d.ts" />
/// <reference path="../node_modules/typescript/lib/lib.es2018.promise.d.ts" />
/// <reference path="../node_modules/typescript/lib/lib.es2020.promise.d.ts" />
/// <reference path="../node_modules/typescript/lib/lib.esnext.promise.d.ts" />

import type { Promisable, PromisableIterable, Unpromise } from "./types";

import isFunction from "lodash/isFunction";
import toArray from "lodash/toArray";
import identity from "lodash/identity";
import _noop from "lodash/noop";

/**
 * The class that you should use instead of [[`Promise`]].  It implements the `Promise` API, so it should be a drop-in replacement.
 */
export default class FunPromise<T>
	extends Promise<T>
	implements PromiseLike<T> {
	/**
	 * Whether or not this promise has been cancelled.
	 */
	private cancelled: boolean = false;

	/**
	 * Constructor, which takes as an argument the promise callback.  Note that we guarantee in the constructor that
	 * every promise is settled precisely once, so don't worry about that logic in your callbacks.
	 */
	constructor(
		callback: (
			resolve: (value: Promisable<T>) => void,
			reject?: (reason?: any) => void
		) => void
	) {
		super((baseResolve, baseReject) => {
			const resolve = (it) => {
				if (this.cancelled) return;
				this.cancel();
				return baseResolve(it);
			};
			const reject = (e) => {
				if (this.cancelled) return;
				this.cancel();
				if (isFunction(baseReject)) {
					return baseReject(e);
				} else {
					throw e;
				}
			};
			callback(resolve, reject);
		});
	}

	/**
	 * Takes a value (or a promise of a value) and returns a promise wrapping
	 * it, after unwrapping as many layers of [[`PromiseLike`]] wrappers as
	 * necessary.
	 */
	static resolve<T = void>(value?: Promisable<T>): FunPromise<T> {
		if (value instanceof FunPromise) {
			return value;
		} else {
			return new FunPromise<T>((resolve) => resolve(value));
		}
	}

	/**
	 * Attaches callbacks for the resolution and/or rejection of the Promise.
	 * @param onfulfilled The optional callback to execute when the Promise is resolved.
	 * @param onrejected The optional callback to execute when the Promise is rejected.  If provided, the result of this callback is the new resolution value, and this promise is resolved, not rejected.
	 * @returns A Promise for the completion of which ever callback is executed.
	 */
	then<TResult1 = T, TResult2 = never>(
		onfulfilled: (value: T) => Promisable<TResult1>,
		onrejected?: (reason: unknown) => Promisable<TResult2>
	): FunPromise<TResult1 | TResult2> {
		return FunPromise.resolve(super.then(onfulfilled, onrejected));
	}

	/**
	 * Attaches a callback for only the rejection of the Promise.
	 * @param onrejected The callback to execute when the Promise is rejected.
	 * @returns A Promise for the completion of the callback.
	 */
	catch<TResult = never>(
		onrejected: (reason: any) => Promisable<TResult> = identity
	): FunPromise<T | TResult> {
		return FunPromise.resolve(super.catch(onrejected));
	}

	/**
	 * Creates a Promise that is resolved with an array of results when all of the
	 * provided Promises resolve, or rejected when any Promise is rejected.
	 * @param values An array of Promises.
	 * @returns A new Promise.
	 */
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
	static all<T>(values: PromisableIterable<T>): FunPromise<T[]>;
	static all(values: any): any {
		return FunPromise.resolve(values).then(toArray).then(Promise.all);
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
	 * This function is really useful to [avoid releasing Zalgo](https://blog.izs.me/2013/08/designing-apis-for-asynchrony).
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
		source: (...args: ArgT[]) => Promisable<T>,
		args?: ArgT[]
	): FunPromise<T> {
		return new FunPromise(async (resolve, reject) => {
			try {
				const f = await source;
				if (!args || args.length === 0) {
					resolve(f());
				} else {
					const realArgs = await Promise.all(args);
					resolve(f(...realArgs));
				}
			} catch (e) {
				reject(e);
			}
		});
	}

	/**
	 * If this promise is still pending, then cancelling prevents any of the handlers from
	 * firing.  Calling this method multiple times has no effect.
	 */
	cancel() {
		if (this.cancelled) return;
		this.catch(_noop); // Disable unhandled rejection errors
		this.cancelled = true;
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
}
