/** @format */

"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = exports.Deferral = exports.PromiseState = void 0;

var _filter2 = _interopRequireDefault(
	require("@babel/runtime-corejs3/core-js/instance/filter")
);

var _flatMap = _interopRequireDefault(
	require("@babel/runtime-corejs3/core-js/instance/flat-map")
);

var _map2 = _interopRequireDefault(
	require("@babel/runtime-corejs3/core-js/instance/map")
);

var _promise = _interopRequireDefault(
	require("@babel/runtime-corejs3/core-js/promise")
);

var _toStringTag = _interopRequireDefault(
	require("@babel/runtime-corejs3/core-js/symbol/to-string-tag")
);

var _toString2 = _interopRequireDefault(require("lodash/toString"));

var _filter3 = _interopRequireDefault(require("lodash/filter"));

var _map3 = _interopRequireDefault(require("lodash/map"));

var _isFunction2 = _interopRequireDefault(require("lodash/isFunction"));

var _isEmpty2 = _interopRequireDefault(require("lodash/isEmpty"));

var _isNil2 = _interopRequireDefault(require("lodash/isNil"));

var _pull2 = _interopRequireDefault(require("lodash/pull"));

var _forEach2 = _interopRequireDefault(require("lodash/forEach"));

var _once2 = _interopRequireDefault(require("lodash/once"));

var _identity2 = _interopRequireDefault(require("lodash/identity"));

var _toArray2 = _interopRequireDefault(require("lodash/toArray"));

var _castArray2 = _interopRequireDefault(require("lodash/castArray"));

var _clone2 = _interopRequireDefault(require("lodash/clone"));

var _defer2 = _interopRequireDefault(require("lodash/defer"));

var _isError2 = _interopRequireDefault(require("lodash/isError"));

let _Symbol$toStringTag;

/**
 * No type guard on this in Lodash's typing?
 */
function isError(it) {
	return (0, _isError2.default)(it);
}
/**
 * The various states that a promise can be in.
 */

var PromiseState;
exports.PromiseState = PromiseState;

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
})(PromiseState || (exports.PromiseState = PromiseState = {}));
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
	 * The promise whose state is determined by `resolve` and `reject`.
	 */

	/**
	 * The state of `promise`.
	 */

	/**
	 * The function used to resolve [[`promise`]].
	 */

	/**
	 * The function used to reject [[`promise`]].
	 */

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
				(0, _defer2.default)(() => {
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

	reject(e) {
		const { rejector } = this;

		if (rejector) {
			try {
				this.stateValue = PromiseState.Rejecting;
				(0, _defer2.default)(() => {
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
		this.promise = void 0;
		this.stateValue = PromiseState.Pending;
		this.resolver = null;
		this.rejector = null;
		this.promise = FunPromise.new((resolve, reject) => {
			this.resolver = resolve;
			this.rejector = reject;
		});
	}
}
/**
 * The class that you should use instead of [[`Promise`]].  It implements the `Promise` API, so it should be a drop-in replacement.
 */

exports.Deferral = Deferral;
_Symbol$toStringTag = _toStringTag.default;

class FunPromise {
	/**
	 * Classic `[Symbol.toStringTag]` for compliance with [[`Promise<T>`]].
	 */

	/**
	 * Constructor, which takes as an argument the promise to wrap.  See [[`FunPromise.new`]],
	 * [[`FunPromise.wrap`]], and [[`FunPromise.resolve`]] for the public ways to construct
	 * a `FunPromise`.
	 *
	 * This constructor is likely to change in the future, although any breaking change will
	 * cause a major version bump.
	 */
	constructor(wrapped) {
		this.wrapped = void 0;
		this[_Symbol$toStringTag] = void 0;
		this.wrapped = wrapped;
		this[_toStringTag.default] = wrapped[_toStringTag.default];
	}
	/**
	 * Wraps an existing [[`Promise`]] or [[`PromiseLike`]]. It's a noop if you
	 * pass in a `FunPromise`.
	 */

	static wrap(promise) {
		if (promise instanceof FunPromise) {
			return promise;
		} else if (promise instanceof _promise.default) {
			return new FunPromise(promise);
		} else {
			return new FunPromise(
				new _promise.default((resolve) => resolve(promise))
			);
		}
	}
	/**
	 * Creates a `FunPromise` which resolves to the value of the argument, resolving the
	 * value if it is a [[`PromiseLike`]].  If you are trying to decide between this and
	 * [[`wrap`]], pick this.
	 */

	static resolve(it) {
		if (it instanceof _promise.default || it instanceof FunPromise) {
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

	static new(executor) {
		return FunPromise.wrap(new _promise.default(executor));
	}
	/**
	 * Processes the resolved value of this promise as an array, returning an array result.  If the resolved value of this
	 * promise is not an array, then it is coerced into an array using
	 * [`_.castArray` from Lodash](https://lodash.com/docs/4.17.15#castArray).
	 */

	processArray(handler) {
		return FunPromise.wrap(
			this.arrayify().wrapped.then(async (inputIterable) => {
				const ary = (0, _clone2.default)(
					(0, _castArray2.default)(inputIterable)
				);
				const resultIterable = handler(ary);
				return _promise.default.all((0, _toArray2.default)(resultIterable));
			})
		);
	}
	/**
	 * Processes the resolved value of this promise as an array, returning a single value as a result.
	 * If the resolved value of this promise is not an array, then it is coerced into an array using
	 * [`_.castArray` from Lodash](https://lodash.com/docs/4.17.15#castArray).
	 */

	reduceArray(handler) {
		const toWrap = this.arrayify().wrapped.then(handler);
		return FunPromise.wrap(toWrap);
	}
	/**
	 * Executes the provided function in a [[`FunPromise`]]. Useful to avoid [releasing Zalgo](https://blog.izs.me/2013/08/designing-apis-for-asynchrony)
	 * when the means of creating the promise might explode.
	 */

	static try(fn) {
		return FunPromise.new((resolver) => resolver(fn()));
	}
	/**
	 * Classic [[`Promise.all`]], but returning a [[`FunPromise`]].
	 */

	static all(them) {
		return FunPromise.resolve(them).all();
	}
	/**
	 * `this.all()` is the same as [[ FunPromise.all | `FunPromise.all(this)` ]].  If the payload
	 * is not an array, then it is coerced into an array using
	 * [`_.castArray` from Lodash](https://lodash.com/docs/4.17.15#castArray).
	 */

	all() {
		return this.processArray(_identity2.default);
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

	static race(them, errorHandler) {
		return FunPromise.resolve(them).race(errorHandler);
	}
	/**
	 * `this.race(errorHandler?)` is the same as [[ FunPromise.race | `FunPromise.race(this, errorHandler?)` ]].
	 */

	race(errorHandler) {
		return this.reduceArray(
			(ary) =>
				new _promise.default(async (resolver, rejector) => {
					const doResolve = (0, _once2.default)(resolver);
					(0, _forEach2.default)(ary, (it) =>
						FunPromise.resolve(it)
							.tapFinally(() => {
								(0, _pull2.default)(ary, it);
							})
							.then(doResolve, (e) => {
								if (!(0, _isNil2.default)(errorHandler)) errorHandler(e);
								if ((0, _isEmpty2.default)(ary)) rejector(e);
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

	static coalesce(them) {
		return FunPromise.resolve(them).coalesce();
	}
	/**
	 * `this.coalesce()` is the same as [[ FunPromise.coalesce | `FunPromise.coalesce(this)` ]].
	 */

	coalesce() {
		return this.reduceArray(async (ary) => {
			var _lastRejection;

			let lastRejection = null;

			while (!(0, _isEmpty2.default)(ary)) {
				try {
					const factory = ary.shift();

					if ((0, _isFunction2.default)(factory)) {
						return await factory();
					}
				} catch (e) {
					lastRejection = e;
				}
			}

			throw (_lastRejection = lastRejection) != null
				? _lastRejection
				: new Error("No values found to coalesce");
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

	static map(them, mapper) {
		var _context;

		return (0, _map2.default)((_context = FunPromise.resolve(them))).call(
			_context,
			mapper
		);
	}
	/**
	 * `this.map(mapper)` is the same as [[ FunPromise.map | `FunPromise.map(this, mapper)` ]].
	 */

	map(mapper) {
		return this.reduceArray((ary) =>
			_promise.default.all(
				(0, _map3.default)(ary, async (it) => await mapper(it))
			)
		);
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

	static mapSeq(them, mapper) {
		var _context2;

		return (0, _map2.default)((_context2 = FunPromise.resolve(them))).call(
			_context2,
			mapper
		);
	}
	/**
	 * `this.mapSeq(mapper)` is the same as [[ FunPromise.mapSeq | `FunPromise.mapSeq(this, mapper)` ]].
	 */

	mapSeq(mapper) {
		return this.reduceArray(async (ary) => {
			const result = [];

			while (!(0, _isEmpty2.default)(ary)) {
				result.push(await mapper(await ary.shift()));
			}

			return result;
		});
	}
	/**
	 * Given a [[`PromisableIterable`]], resolves each value provided and passes each value through the
	 * `mapper` function, collecting the results into a flattened array.
	 *
	 * The resolution order is not maintained -- that is, an element at index 0 might not resolve
	 * until after the element at index 1.
	 *
	 * If the payload is not an array, then it is coerced into an array using
	 * [`_.castArray` from Lodash](https://lodash.com/docs/4.17.15#castArray).
	 */

	static flatMap(them, mapper) {
		var _context3;

		return (0, _flatMap.default)((_context3 = FunPromise.resolve(them))).call(
			_context3,
			mapper
		);
	}
	/**
	 * `this.map(mapper)` is the same as [[ FunPromise.flatMap | `FunPromise.flatMap(this, mapper)` ]].
	 */

	flatMap(mapper) {
		return this.reduceArray(async (ary) => {
			const results = [];
			await _promise.default.all(
				(0, _map3.default)(ary, async (it) => {
					await _promise.default.all(
						(0, _map3.default)(
							(0, _toArray2.default)(await mapper(it)),
							async (itsItem) => results.push(await itsItem)
						)
					);
				})
			);
			return results;
		});
	}
	/**
	 * Given a [[`PromisableIterable`]], resolves each value provided and passes each value through the
	 * `mapper` function, collecting the results.
	 *
	 * The order of input elements is maintained, as is the resolution order -- that is, the element at
	 * index 1 will wait to be resolved by this method until until after the element at index 0 has
	 * resolved.
	 *
	 * If the payload is not an array, then it is coerced into an array using
	 * [`_.castArray` from Lodash](https://lodash.com/docs/4.17.15#castArray).
	 */

	static flatMapSeq(them, mapper) {
		return FunPromise.resolve(them).flatMapSeq(mapper);
	}
	/**
	 * `this.flatMapSeq(mapper)` is the same as [[ FunPromise.flatMapSeq | `FunPromise.flatMapSeq(this, mapper)` ]].
	 */

	flatMapSeq(mapper) {
		return this.reduceArray(async (ary) => {
			const result = [];

			while (!(0, _isEmpty2.default)(ary)) {
				const roundResult = await mapper(await ary.shift());
				await _promise.default.all(
					(0, _map3.default)((0, _toArray2.default)(roundResult), async (it) =>
						result.push(await it)
					)
				);
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

	static fold(them, initialValue, handler) {
		return FunPromise.resolve(them).fold(initialValue, handler);
	}
	/**
	 * `this.fold(initialValue, handler)` is the same as [[ FunPromise.fold | `FunPromise.fold(this, initialValue, handler)` ]].
	 */

	fold(initialValue, handler) {
		return this.reduceArray((ary) => {
			let memo = FunPromise.resolve(initialValue);
			return _promise.default
				.all(
					(0, _map3.default)(ary, async (it) => {
						const result = await it;
						memo = memo.then((newMemo) => handler(newMemo, result));
					})
				)
				.then(async () => await memo);
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

	static foldSeq(them, initialValue, handler) {
		return FunPromise.resolve(them).fold(initialValue, handler);
	}
	/**
	 * `this.fold(initialValue, handler)` is the same as [[ FunPromise.fold | `FunPromise.fold(this, initialValue, handler)` ]].
	 */

	foldSeq(initialValue, handler) {
		return this.reduceArray((ary) => {
			let memoPromise = FunPromise.resolve(initialValue);

			while (!(0, _isEmpty2.default)(ary)) {
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

	static filter(them, filter) {
		var _context4;

		return (0, _filter2.default)((_context4 = FunPromise.resolve(them))).call(
			_context4,
			filter
		);
	}
	/**
	 * `this.filter(test)` is the same as [[ FunPromise.filter | `FunPromise.filter(this, test)` ]].
	 */

	filter(test) {
		return this.processArray(async (ary) => {
			const testResults = await _promise.default.all(
				(0, _map3.default)(ary, test)
			);
			return (0, _filter3.default)(ary, (item, idx) => {
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

	static filterSeq(them, filter) {
		return FunPromise.resolve(them).filterSeq(filter);
	}
	/**
	 * `this.filterSeq(test)` is the same as [[ FunPromise.filterSeq | `FunPromise.filterSeq(this, test)` ]].
	 */

	filterSeq(test) {
		return this.processArray(async (ary) => {
			const result = [];

			while (!(0, _isEmpty2.default)(ary)) {
				const it = ary.shift();
				if (await test(it)) result.push(it);
			}

			return result;
		});
	}
	/**
	 * Classic `then`, but returning a `FunPromise`.
	 */

	then(onfulfilled, onrejected) {
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
	 *
	 * If you do not pass an argument, then this simply creates a promise
	 * that may either be the value on resolution or the error on rejection,
	 * similar to [[`finally`]] but the promise state is resolved instead of
	 * rejected.
	 */

	catchError(handler = _identity2.default) {
		return this.catch((reason) => {
			if ((0, _isNil2.default)(reason)) {
				throw new Error(`Promise was rejected without a reason`);
			} else if (isError(reason)) {
				handler(reason);
			} else {
				handler(
					new Error(
						`Promise was rejected; expected Error, but saw: ${(0,
						_toString2.default)(reason)} (${typeof reason})`
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

	tap(handler) {
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

	tapCatch(handler) {
		return this.catchError((e) =>
			FunPromise.try(() => handler(e)).finally(() => {
				throw e;
			})
		);
	}

	tapFinally(handler, errHandler) {
		return this.tap(handler).tapCatch(
			errHandler != null ? errHandler : handler
		);
	}
	/**
	 * Sets the argument as the resolution value for the promise.
	 */

	return(value) {
		return FunPromise.wrap(this.wrapped.then(() => value));
	}
	/**
	 * Converts a wrapped [[`Iterable`]] into an array.
	 *
	 * This method _mostly_ exists for the sake of type safety/sanity: it gets the value to [[ Element | `Element<T>[]` ]]
	 * from a lot of weird places.
	 */

	arrayify() {
		return FunPromise.wrap(
			this.wrapped.then((iterable) => (0, _toArray2.default)(iterable))
		);
	}
	/**
	 * Simplifies multiple layers of promise wrappers down to a single wrapper.
	 *
	 * This method exists solely for the sake of the type system: its behavior is actually implied in the `Promise/A+` spec.
	 * Also, note that a [[`FunPromise`]] is a
	 */

	simplify() {
		return this;
	}
	/**
	 * Given two [[`Promisable`]] values, returns a promise that resolves to a tuple/array where the first element
	 * is the result of the first argument, and the second element is the result of the second argument.
	 */

	static join(left, right) {
		return FunPromise.resolve(left).join(right);
	}
	/**
	 * Given [[`Promisable`]] argument, returns a promise that resolves to a tuple/array where the first element
	 * is the result of this promise, and the second element is the result of the argument.
	 */

	join(them) {
		const { wrapped } = this;
		return FunPromise.try(async () => [await wrapped, await them]);
	}
}

exports.default = FunPromise;
