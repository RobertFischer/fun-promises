/** @format */

import _ from "lodash";

/**
 * No type guard on this in Lodash's typing?
 */
function isError(it: unknown): it is Error {
	return _.isError(it);
}

/**
 * Provides the type of elements within an [[`Iterable`]], which may be wrapped in one or more promises.
 * The element type is also unwrapped any promises.
 */
export type Element<T> = Unpromise<T> extends Iterable<infer U>
	? Unpromise<U>
	: never;

/**
 * Provides the type of the resolution value of a [[`Promise`]].
 */
export type Unpromise<T> = T extends PromiseLike<infer U> ? Unpromise<U> : T;

/**
 * Something which can be resolved: that is, either a value or a promise of a value.
 */
/* THIS IS NOT TRUE AS OF NOW.
 *
 * Note that this type will unwrap multiple layers of promise wrapping, so the resulting type is
 * guaranteed to either be:
 *
 *    1. the base type of some nested promises, or
 *    2. a single promise wrapping a non-promise value
 */
export type Promisable<T> = T | PromiseLike<T>;

/**
 * An [[`Iterable`]] or a promise of an `Iterable`. Its elements are any mix of type `T` and/or `PromiseLike<T>`.
 * Used as a type for arguments.
 */
export type PromisableIterable<T> = Promisable<Iterable<Promisable<T>>>;

/**
 * Represents an `Iterable` that is not a promise but an actual value that is an `Iterable`,
 * although it may produce either values or promises of values or both.
 */
export type IterableOfPromisables<T> = Iterable<Promisable<T>>;

/**
 * The various states that a promise can be in.
 */
export enum PromiseState {
	/**
	 * The promise is neither resolved nor rejected.
	 */
	Pending = "pending",

	/**
	 * The promise has begun resolving, but is not yet fully resolved.
	 */
	Resolving = "resolving",

	/**
	 * The promise has resolved to a value.
	 */
	Resolved = "resolved",

	/**
	 * The promise has begun rejecting, but is not yet fully rejected.
	 */
	Rejecting = "rejecting",

	/**
	 * The promise has rejected with a cause.
	 */
	Rejected = "rejected",
}

/**
 * A class that is an "inside-out" [[`FunPromise`]]: the `resolve` and `reject` functions
 * from the callback are exposed as properties, and are therefore able to be called by
 * caller's code.
 *
 * Note that after the first call to either `resolve` or `reject`, the underlying promise
 * is settled. Any subsequent call to either `resolve` or `reject` is guaranteed to be
 * a no-op.
 */
export class Deferral<T> {
	/**
	 * The promise whose state is determined by `resolve` and `reject`.
	 */
	readonly promise: FunPromise<T>;

	/**
	 * The state of `promise`.
	 */
	private stateValue: PromiseState = PromiseState.Pending;

	/**
	 * The function used to resolve [[`promise`]].
	 */
	private resolver: (it: Promisable<T>) => Promisable<void> | null = null;

	/**
	 * The function used to reject [[`promise`]].
	 */
	private rejector: (err: unknown) => Promisable<void> | null = null;

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
			case PromiseState.Resolving:
				return true;
			case PromiseState.Rejecting:
				return true;
			default:
				return false;
		}
	}

	/**
	 * Whether `promise` has resolved.
	 */
	get isResolved() {
		return this.stateValue === PromiseState.Resolved;
	}

	/**
	 * Whether `promise` was rejected.
	 */
	get isRejected() {
		return this.stateValue === PromiseState.Rejected;
	}

	/**
	 * Resolves `promise` with the given value.
	 */
	resolve(it) {
		const { resolver } = this;
		if (resolver) {
			try {
				const { rejector } = this;
				this.stateValue = PromiseState.Resolving;
				_.defer(() => {
					try {
						resolver(it);
						this.stateValue = PromiseState.Resolved;
					} catch (e) {
						if (rejector) {
							this.rejector = rejector;
							this.reject(e);
						} else {
							console.warn(`Uncaught exception during resolution`, e);
						}
					}
				});
			} catch (e) {
				this.reject(e);
			} finally {
				this.resolver = null;
				this.rejector = null;
			}
		}
		return this.promise;
	}

	/**
	 * Rejects `promise` with the given cause.
	 */
	reject(e: Error) {
		const { rejector } = this;
		if (rejector) {
			try {
				this.stateValue = PromiseState.Rejecting;
				_.defer(() => {
					try {
						rejector(e);
					} finally {
						this.stateValue = PromiseState.Rejected;
					}
				});
			} finally {
				this.resolver = null;
				this.rejector = null;
			}
		}
		return this.promise;
	}

	/**
	 * Constructs a new promise and exposes its resolve
	 * and reject functions.
	 */
	constructor() {
		this.promise = FunPromise.new((resolve, reject) => {
			this.resolver = resolve;
			this.rejector = reject;
		});
	}
}

/**
 * The class that you should use instead of [[`Promise`]].  It implements the `Promise` API, so it should be a drop-in replacement.
 */
export default class FunPromise<T> implements Promise<Unpromise<T>> {
	/**
	 * Classic `[Symbol.toStringTag]` for compliance with [[`Promise<T>`]].
	 */
	readonly [Symbol.toStringTag];

	/**
	 * Constructor, which takes as an argument the promise to wrap.  See [[`FunPromise.new`]],
	 * [[`FunPromise.wrap`]], and [[`FunPromise.resolve`]] for the public ways to construct
	 * a `FunPromise`.
	 *
	 * This constructor is likely to change in the future, although any breaking change will
	 * cause a major version bump.
	 */
	protected constructor(protected readonly wrapped: Promise<T>) {
		this[Symbol.toStringTag] = wrapped[Symbol.toStringTag];
	}

	/**
	 * Wraps an existing [[`Promise`]] or [[`PromiseLike`]]. It's a noop if you
	 * pass in a `FunPromise`.
	 */
	static wrap<T>(
		promise: FunPromise<T> | Promise<T> | PromiseLike<T>
	): FunPromise<T> {
		if (promise instanceof FunPromise) {
			return promise;
		} else if (promise instanceof Promise) {
			return new FunPromise(promise);
		} else {
			return new FunPromise(new Promise((resolve) => resolve(promise)));
		}
	}

	/**
	 * Creates a `FunPromise` which resolves to the value of the argument, resolving the
	 * value if it is a [[`PromiseLike`]].
	 */
	static resolve<T>(it: Promisable<T>): FunPromise<T> {
		if (it instanceof Promise || it instanceof FunPromise) {
			return FunPromise.wrap(it);
		} else {
			return FunPromise.new((resolver) => resolver(it));
		}
	}

	/**
	 * Constructor-like factory function that delegates directly to the [[`Promise`]] constructor.  See
	 * [the MDN documentation on the `Promise` constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/Promise)
	 * for more information.
	 */
	static new<T>(executor): FunPromise<T> {
		return FunPromise.wrap(new Promise(executor));
	}

	/**
	 * Processes the resolved value of this promise as an array, returning an array result.  If the resolved value of this
	 * promise is not an array, then it is coerced into an array using
	 * [`_.castArray` from Lodash](https://lodash.com/docs/4.17.15#castArray).
	 */
	protected processArray<U = Element<T>>(
		handler: (values: Element<T>[]) => PromisableIterable<U>
	): FunPromise<U[]> {
		return FunPromise.wrap(
			this.arrayify().wrapped.then(async (inputIterable) => {
				const ary: Element<T>[] = _.clone(_.castArray(inputIterable));
				const resultIterable = handler(ary);
				return Promise.all(_.toArray(resultIterable));
			})
		);
	}

	/**
	 * Processes the resolved value of this promise as an array, returning a single value as a result.
	 * If the resolved value of this promise is not an array, then it is coerced into an array using
	 * [`_.castArray` from Lodash](https://lodash.com/docs/4.17.15#castArray).
	 */
	protected reduceArray<U = Element<T>>(
		handler: (values: Element<T>[]) => Promisable<U>
	): FunPromise<U> {
		const toWrap = this.arrayify().wrapped.then(handler);
		return FunPromise.wrap(toWrap);
	}

	/**
	 * Executes the provided function in a [[`FunPromise`]]. Useful to avoid [releasing Zalgo](https://blog.izs.me/2013/08/designing-apis-for-asynchrony)
	 * when the means of creating the promise might explode.
	 */
	static try<T>(fn: () => Promisable<T>): FunPromise<T> {
		return FunPromise.new((resolver) => resolver(fn()));
	}

	/**
	 * Classic [[`Promise.all`]], but returning a [[`FunPromise`]].
	 */
	static all<T>(them: PromisableIterable<T>) {
		return FunPromise.resolve(them).all();
	}

	/**
	 * `this.all()` is the same as [[ FunPromise.all | `FunPromise.all(this)` ]].  If the payload
	 * is not an array, then it is coerced into an array using
	 * [`_.castArray` from Lodash](https://lodash.com/docs/4.17.15#castArray).
	 */
	all() {
		return this.processArray(_.identity);
	}

	/**
	 * Resolves to the first promise to resolve in the [[`PromisableIterable`]] argument.  If all
	 * the promises in the argument reject, then this rejects with the cause of the final
	 * rejection encountered.
	 *
	 * Note that after the first promise resolves, the other promises are left executing but
	 * the results of their executions are dropped.
	 *
	 * The second argument allows you to handle all the rejections that may be received
	 * (whether before or after the first resolution).
	 *
	 * This builds off [[ ``FunPromise.processArray` ]].
	 */
	static race<T>(
		them: PromisableIterable<T>,
		errorHandler?: (e: unknown) => void
	) {
		return FunPromise.resolve(them).race(errorHandler);
	}

	/**
	 * `this.race(errorHandler?)` is the same as [[ FunPromise.race | `FunPromise.race(this, errorHandler?)` ]].
	 */
	race(errorHandler?: (e: unknown) => void): FunPromise<Element<T>> {
		return this.reduceArray(
			(ary) =>
				new Promise(async (resolver, rejector) => {
					const doResolve = _.once(resolver);
					_.forEach(ary, (it) =>
						FunPromise.resolve(it)
							.tapFinally(() => {
								_.pull(ary, it);
							})
							.then(doResolve, (e) => {
								if (!_.isNil(errorHandler)) errorHandler(e);
								if (_.isEmpty(ary)) rejector(e);
							})
					);
				})
		);
	}

	/**
	 * Given a [[`PromisableIterable`]] whose resolved elements are nullary functions,
	 * this executes the functions in order until one resolves to a non-[nil|https://lodash.com/docs/4.17.15#isNil]
	 * value.  If they all reject, then this rejects with the last rejection. If the
	 * collection is empty, it rejects with an [[`Error`]] stating so.
	 *
	 * If the payload is not an array, then it is coerced into an array using
	 * [`_.castArray` from Lodash](https://lodash.com/docs/4.17.15#castArray).
	 */
	static coalesce<T>(them: PromisableIterable<() => Promisable<T>>) {
		return FunPromise.resolve(them).coalesce();
	}

	/**
	 * `this.coalesce()` is the same as [[ FunPromise.coalesce | `FunPromise.coalesce(this)` ]].
	 */
	coalesce() {
		return this.reduceArray(async (ary) => {
			let lastRejection = null;
			while (!_.isEmpty(ary)) {
				try {
					const factory = ary.shift();
					if (_.isFunction(factory)) {
						return await factory();
					}
				} catch (e) {
					lastRejection = e;
				}
			}
			throw lastRejection ?? new Error("No values found to coalesce");
		});
	}

	/**
	 * Given a [[`PromisableIterable`]], resolves each value provided and passes each value through the
	 * `mapper` function, collecting the results.
	 *
	 * The order of input elements is maintained, but the
	 * resolution order is not -- that is, while the element at index 0 might not resolve until after the
	 * element at index 1, the input at index 0 is guaranteed to be mapped to the output at index 0.
	 *
	 * If the payload is not an array, then it is coerced into an array using
	 * [`_.castArray` from Lodash](https://lodash.com/docs/4.17.15#castArray).
	 */
	static map<T>(them: PromisableIterable<T>, mapper) {
		return FunPromise.resolve(them).map(mapper);
	}

	/**
	 * `this.map(mapper)` is the same as [[ FunPromise.map | `FunPromise.map(this, mapper)` ]].
	 */
	map<U = Element<T>>(
		mapper: (it: Element<T>) => Promisable<U>
	): FunPromise<U[]> {
		return this.reduceArray((ary) => Promise.all(_.map(ary, mapper)));
	}

	/**
	 * Given a [[`PromisableIterable`]], resolves each value provided and passes each value through the
	 * `mapper` function, collecting the results.
	 *
	 * The order of input elements is maintained, as is the resolution order -- that is, the element at
	 * index 1 will wait to be resolved by this method until until after the
	 * element at index 0.
	 *
	 * If the payload is not an array, then it is coerced into an array using
	 * [`_.castArray` from Lodash](https://lodash.com/docs/4.17.15#castArray).
	 */
	static mapSeq<T>(them: PromisableIterable<T>, mapper) {
		return FunPromise.resolve(them).map(mapper);
	}

	/**
	 * `this.mapSeq(mapper)` is the same as [[ FunPromise.mapSeq | `FunPromise.mapSeq(this, mapper)` ]].
	 */
	mapSeq<U = Element<T>>(
		mapper: (it: Element<T>) => Promisable<U>
	): FunPromise<U[]> {
		return this.reduceArray(async (ary) => {
			const result = [];
			result.length = ary.length;
			while (!_.isEmpty(ary)) {
				result.push(mapper(await ary.shift()));
			}
			return result;
		});
	}

	/**
	 * Given a [[`PromisableIterable`]] and an initial value, `fold` resolves each value provided and passes
	 * each value through the `handler` function along with the current state of the `memo`.  The return from
	 * `handler` becomes the `memo` input of the next round. When there are no more elements, returns the
	 * final `memo` that was returned.
	 *
	 * This implementation does not guarantee any particular order for the inputs to be processed through 'handler':
	 * the results of the promise values are processed as soon as they are resolved.
	 *
	 * If the payload is not an array, then it is coerced into an array using
	 * [`_.castArray` from Lodash](https://lodash.com/docs/4.17.15#castArray).
	 */
	static fold<T, MEMO = Element<T>>(
		them: PromisableIterable<T>,
		initialValue: Promisable<MEMO>,
		handler
	): FunPromise<MEMO> {
		return FunPromise.resolve(them).fold(initialValue, handler);
	}

	/**
	 * `this.fold(initialValue, handler)` is the same as [[ FunPromise.fold | `FunPromise.fold(this, initialValue, handler)` ]].
	 */
	fold<MEMO = Element<T>>(
		initialValue: Promisable<MEMO>,
		handler: (memo: MEMO, nextItem: Element<T>) => Promisable<MEMO>
	): FunPromise<MEMO> {
		return this.reduceArray((ary) => {
			let memo: Promise<MEMO> = FunPromise.resolve(initialValue);
			return Promise.all(
				_.map(ary, async (it) => {
					const result = await it;
					memo = memo.then((newMemo) => handler(newMemo, result));
				})
			).then(async () => await memo);
		});
	}

	/**
	 * Given a [[`PromisableIterable`]] and an initial value, `foldSeq` resolves each value provided and passes
	 * each value through the `handler` function along with the current state of the `memo`.  The return from
	 * `handler` becomes the `memo` input of the next round. When there are no more elements, returns the
	 * final `memo` that was returned.
	 *
	 * This implementation maintains the particular order for the inputs to be processed through 'handler':
	 * the fulfillment of the promise is processed in the order of the iterable.
	 */
	static foldSeq<T, MEMO = Element<T>>(
		them: PromisableIterable<T>,
		initialValue: Promisable<MEMO>,
		handler
	): FunPromise<MEMO> {
		return FunPromise.resolve(them).fold(initialValue, handler);
	}

	/**
	 * `this.fold(initialValue, handler)` is the same as [[ FunPromise.fold | `FunPromise.fold(this, initialValue, handler)` ]].
	 */
	foldSeq<MEMO = Element<T>>(
		initialValue: Promisable<MEMO>,
		handler: (memo: MEMO, nextItem: Element<T>) => Promisable<MEMO>
	): FunPromise<MEMO> {
		return this.reduceArray((ary) => {
			let memoPromise: Promise<MEMO> = FunPromise.resolve(initialValue);
			while (!_.isEmpty(ary)) {
				const nextPromise = ary.shift();
				memoPromise = memoPromise.then(async (memo) =>
					handler(memo, await nextPromise)
				);
			}
			return memoPromise;
		});
	}

	/**
	 * Given a [[`PromisableIterable`]], resolves each value provided and passes each value through the
	 * `test` function, retaining only those for which the test returned `true`.
	 *
	 * The order of input elements is maintained, but not the resolution order.
	 *
	 * If the payload is not an array, then it is coerced into an array using
	 * [`_.castArray` from Lodash](https://lodash.com/docs/4.17.15#castArray).
	 */
	static filter<T>(them: PromisableIterable<T>, filter) {
		return FunPromise.resolve(them).filter(filter);
	}

	/**
	 * `this.filter(test)` is the same as [[ FunPromise.filter | `FunPromise.filter(this, test)` ]].
	 */
	filter(
		test: (it: Element<T>) => Promisable<boolean>
	): FunPromise<Element<T>[]> {
		return this.processArray(async (ary) => {
			const testResults = await Promise.all(_.map(ary, test));
			return _.filter(ary, (item, idx) => {
				item; // Need to refer to it in order to avoid a compile error.
				return testResults[idx];
			});
		});
	}

	/**
	 * Given a [[`PromisableIterable`]], resolves each value provided and passes each value through the
	 * `test` function, retaining only those for which the test returned `true`.
	 *
	 * The order of input elements and the resultion order are maintained.
	 *
	 * If the payload is not an array, then it is coerced into an array using
	 * [`_.castArray` from Lodash](https://lodash.com/docs/4.17.15#castArray).
	 */
	static filterSeq<T>(them: PromisableIterable<T>, filter) {
		return FunPromise.resolve(them).filterSeq(filter);
	}

	/**
	 * `this.filterSeq(test)` is the same as [[ FunPromise.filterSeq | `FunPromise.filterSeq(this, test)` ]].
	 */
	filterSeq(
		test: (it: Element<T>) => Promisable<boolean>
	): FunPromise<Element<T>[]> {
		return this.processArray(async (ary) => {
			const result = [];
			while (!_.isEmpty(ary)) {
				const it = ary.shift();
				if (await test(it)) result.push(it);
			}
			return result;
		});
	}

	/**
	 * Classic `then`, but returning a `FunPromise`.
	 */
	then(onfulfilled, onrejected?) {
		return FunPromise.wrap(this.wrapped.then(onfulfilled, onrejected));
	}

	/**
	 * Classic `catch`, but returning a `FunPromise`.
	 */
	catch(handler) {
		return FunPromise.wrap(this.wrapped.catch(handler));
	}

	/**
	 * Classic `finally`, but returning a `FunPromise`.
	 */
	finally(handler) {
		return FunPromise.wrap(this.wrapped.finally(handler));
	}

	/**
	 * Like [[`catch`]], but any non-[[`Error`]] that was thrown is
	 * wrapped in an `Error`. (I bet a lot of your code assumes that
	 * an error was thrown, doesn't it?)
	 */
	catchError<U = never>(
		handler: (reason: Error) => U extends never ? void : U
	): FunPromise<T | U> {
		return this.catch((reason?: unknown) => {
			if (_.isNil(reason)) {
				throw new Error(`Promise was rejected without a reason`);
			} else if (isError(reason)) {
				handler(reason);
			} else {
				handler(
					new Error(
						`Promise was rejected; expected Error, but saw: ${_.toString(
							reason
						)} (${typeof reason})`
					)
				);
			}
		});
	}

	/**
	 * Allows you to "tap" into a chain and work with the result at that point in the chain without modifying the value.
	 *
	 * Note that if the handler provided throws an exception, that _will_ be propagated as the cause for rejecting, so
	 * it's not _impossible_ for `tap` to change the state of the promise.
	 */
	tap(handler: (result: T) => Promisable<void>): FunPromise<T> {
		return this.then(async (result) => {
			await handler(result);
			return result;
		});
	}

	/**
	 * Allows you to "tap" into the error handling of a chain and work with the rejection reason at that point in the chain without
	 * changing the rejected state.  It leverages [[`FunPromise.catchError`]] to make your typing much nicer.
	 *
	 * Note that if the handler provided throws an exception, that _will_ be propagated as the cause for rejecting, so
	 * it's not _impossible_ for `tapCatch` to change the state of the promise.
	 */
	tapCatch(handler: (result: Error) => Promisable<void>): FunPromise<T> {
		return this.catchError((e) =>
			FunPromise.try(() => handler(e)).finally(() => {
				throw e;
			})
		);
	}

	/**
	 * Allows you to "tap" into the chain and work with either the rejection reason or the resolved value.
	 * It leverages [[`FunPromise.catchError`]] to make your typing much nicer.
	 *
	 * Note that if the handler provided throws an exception, that _will_ be propagated as the cause for rejecting, so
	 * it's not _impossible_ for `tapFinally` to change the state of the promise.
	 */
	tapFinally(handler: (result: T | Error) => Promisable<void>): FunPromise<T>;
	tapFinally(
		handler: (result: T) => Promisable<void>,
		errHandler: (result: Error) => Promisable<void>
	): FunPromise<T>;
	tapFinally(handler, errHandler?): FunPromise<T> {
		return this.tap(handler).tapCatch(errHandler ?? handler);
	}

	/**
	 * Sets the argument as the resolution value for the promise.
	 */
	return<U>(value: Promisable<U>): FunPromise<U> {
		return FunPromise.wrap(this.wrapped.then(() => value));
	}

	/**
	 * Converts a wrapped [[`Iterable`]] into an array.
	 *
	 * This method _mostly_ exists for the sake of type safety/sanity: it gets the value to [[ Element | `Element<T>[]` ]]
	 * from a lot of weird places.
	 */
	arrayify(): FunPromise<Element<T>[]> {
		return FunPromise.wrap(
			this.wrapped.then((iterable) => _.toArray(iterable) as Element<T>[])
		);
	}

	/**
	 * Simplifies multiple layers of promise wrappers down to a single wrapper.
	 *
	 * This method exists solely for the sake of the type system: its behavior is actually implied in the `Promise/A+` spec.
	 */
	simplify(): FunPromise<Unpromise<T>> {
		return (this as unknown) as FunPromise<Unpromise<T>>;
	}

	/**
	 * If the promise rejects, returns the cause as an [``Error``].  If the promise resolves, returns the resolved value.
	 */
	result(): FunPromise<Error | T> {
		return this.catchError(_.identity);
	}
}