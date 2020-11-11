/** @format */
/**
 * Provides the type of elements within an [[`Iterable`]], which may be wrapped in one or more promises.
 * The element type is also unwrapped any promises.
 */
export declare type Element<T> = Unpromise<T> extends Iterable<infer U> ? Unpromise<U> : never;
/**
 * Provides the type of the resolution value after unwrapping all the [[`PromiseLike`]] and [[`Promisable`]] interfaces (if any).
 */
export declare type Unpromise<T> = T extends PromiseLike<infer U> ? Unpromise<U> : T extends Promisable<infer U> ? U extends T ? T : Unpromise<U> : T;
/**
 * Something which can be resolved: that is, either a value or a promise of a value.
 */
export declare type Promisable<T> = T | PromiseLike<T>;
/**
 * Guarantees that there is at most one [[`Promise`]] wrapper.
 */
export declare type SimplifiedPromise<T> = Promise<Unpromise<T>>;
/**
 * Guarantees that there is at most one [[`Promisable`]] wrapper.
 */
export declare type SimplifiedPromisable<T> = Promisable<Unpromise<T>>;
/**
 * An [[`Iterable`]] or a promise of an `Iterable`. Its elements are any mix of type `T` and/or `PromiseLike<T>`.
 * Used as a type for arguments.
 */
export declare type PromisableIterable<T> = Promisable<Iterable<Promisable<T>>>;
/**
 * Represents an `Iterable` that is not a promise but an actual value that is an `Iterable`,
 * although it may produce either values or promises of values or both.
 */
export declare type IterableOfPromisables<T> = Iterable<Promisable<T>>;
/**
 * The various states that a promise can be in.
 */
export declare enum PromiseState {
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
    Rejected = "rejected"
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
export declare class Deferral<T> {
    /**
     * The promise whose state is determined by `resolve` and `reject`.
     */
    readonly promise: FunPromise<T>;
    /**
     * The state of `promise`.
     */
    private stateValue;
    /**
     * The function used to resolve [[`promise`]].
     */
    private resolver;
    /**
     * The function used to reject [[`promise`]].
     */
    private rejector;
    /**
     * Provides the state of `promise`.
     */
    get state(): PromiseState;
    /**
     * Whether `promise` is in the process of resolving or rejecting.
     */
    get isSettling(): boolean;
    /**
     * Whether `promise` has resolved.
     */
    get isResolved(): boolean;
    /**
     * Whether `promise` was rejected.
     */
    get isRejected(): boolean;
    /**
     * Resolves `promise` with the given value.
     */
    resolve(it: any): FunPromise<T>;
    /**
     * Rejects `promise` with the given cause.
     */
    reject(e: Error): FunPromise<T>;
    /**
     * Constructs a new promise and exposes its resolve
     * and reject functions.
     */
    constructor();
}
/**
 * The class that you should use instead of [[`Promise`]].  It implements the `Promise` API, so it should be a drop-in replacement.
 */
export default class FunPromise<T> implements SimplifiedPromise<T> {
    protected readonly wrapped: Promise<T>;
    /**
     * Classic `[Symbol.toStringTag]` for compliance with [[`Promise<T>`]].
     */
    readonly [Symbol.toStringTag]: any;
    /**
     * Constructor, which takes as an argument the promise to wrap.  See [[`FunPromise.new`]],
     * [[`FunPromise.wrap`]], and [[`FunPromise.resolve`]] for the public ways to construct
     * a `FunPromise`.
     *
     * This constructor is likely to change in the future, although any breaking change will
     * cause a major version bump.
     */
    protected constructor(wrapped: Promise<T>);
    /**
     * Wraps an existing [[`Promise`]] or [[`PromiseLike`]]. It's a noop if you
     * pass in a `FunPromise`.
     */
    static wrap<T>(promise: FunPromise<T> | Promise<T> | PromiseLike<T>): FunPromise<T>;
    /**
     * Creates a `FunPromise` which resolves to the value of the argument, resolving the
     * value if it is a [[`PromiseLike`]].
     */
    static resolve<T>(it: Promisable<T>): FunPromise<T>;
    /**
     * Constructor-like factory function that delegates directly to the [[`Promise`]] constructor.  See
     * [the MDN documentation on the `Promise` constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/Promise)
     * for more information.
     */
    static new<T>(executor: any): FunPromise<T>;
    /**
     * Processes the resolved value of this promise as an array, returning an array result.  If the resolved value of this
     * promise is not an array, then it is coerced into an array using
     * [`_.castArray` from Lodash](https://lodash.com/docs/4.17.15#castArray).
     */
    protected processArray<U = Element<T>>(handler: (values: Element<T>[]) => PromisableIterable<U>): FunPromise<U[]>;
    /**
     * Processes the resolved value of this promise as an array, returning a single value as a result.
     * If the resolved value of this promise is not an array, then it is coerced into an array using
     * [`_.castArray` from Lodash](https://lodash.com/docs/4.17.15#castArray).
     */
    protected reduceArray<U = Element<T>>(handler: (values: Element<T>[]) => Promisable<U>): FunPromise<U>;
    /**
     * Executes the provided function in a [[`FunPromise`]]. Useful to avoid [releasing Zalgo](https://blog.izs.me/2013/08/designing-apis-for-asynchrony)
     * when the means of creating the promise might explode.
     */
    static try<T>(fn: () => Promisable<T>): FunPromise<T>;
    /**
     * Classic [[`Promise.all`]], but returning a [[`FunPromise`]].
     */
    static all<T>(them: PromisableIterable<T>): FunPromise<(Unpromise<T> | Unpromise<T>)[]>;
    /**
     * `this.all()` is the same as [[ FunPromise.all | `FunPromise.all(this)` ]].  If the payload
     * is not an array, then it is coerced into an array using
     * [`_.castArray` from Lodash](https://lodash.com/docs/4.17.15#castArray).
     */
    all(): FunPromise<Element<T>[]>;
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
    static race<T>(them: PromisableIterable<T>, errorHandler?: (e: unknown) => void): FunPromise<Unpromise<T> | Unpromise<T>>;
    /**
     * `this.race(errorHandler?)` is the same as [[ FunPromise.race | `FunPromise.race(this, errorHandler?)` ]].
     */
    race(errorHandler?: (e: unknown) => void): FunPromise<Element<T>>;
    /**
     * Given a [[`PromisableIterable`]] whose resolved elements are nullary functions,
     * this executes the functions in order until one resolves to a non-[nil|https://lodash.com/docs/4.17.15#isNil]
     * value.  If they all reject, then this rejects with the last rejection. If the
     * collection is empty, it rejects with an [[`Error`]] stating so.
     *
     * If the payload is not an array, then it is coerced into an array using
     * [`_.castArray` from Lodash](https://lodash.com/docs/4.17.15#castArray).
     */
    static coalesce<T>(them: PromisableIterable<() => Promisable<T>>): FunPromise<any>;
    /**
     * `this.coalesce()` is the same as [[ FunPromise.coalesce | `FunPromise.coalesce(this)` ]].
     */
    coalesce(): FunPromise<any>;
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
    static map<T>(them: PromisableIterable<T>, mapper: any): FunPromise<Unpromise<T>[]>;
    /**
     * `this.map(mapper)` is the same as [[ FunPromise.map | `FunPromise.map(this, mapper)` ]].
     */
    map<U = Element<T>>(mapper: (it: Element<T>) => Promisable<U>): FunPromise<U[]>;
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
    static mapSeq<T>(them: PromisableIterable<T>, mapper: any): FunPromise<Unpromise<T>[]>;
    /**
     * `this.mapSeq(mapper)` is the same as [[ FunPromise.mapSeq | `FunPromise.mapSeq(this, mapper)` ]].
     */
    mapSeq<U = Element<T>>(mapper: (it: Element<T>) => Promisable<U>): FunPromise<U[]>;
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
    static fold<T, MEMO = Element<T>>(them: PromisableIterable<T>, initialValue: Promisable<MEMO>, handler: any): FunPromise<MEMO>;
    /**
     * `this.fold(initialValue, handler)` is the same as [[ FunPromise.fold | `FunPromise.fold(this, initialValue, handler)` ]].
     */
    fold<MEMO = Element<T>>(initialValue: Promisable<MEMO>, handler: (memo: MEMO, nextItem: Element<T>) => Promisable<MEMO>): FunPromise<MEMO>;
    /**
     * Given a [[`PromisableIterable`]] and an initial value, `foldSeq` resolves each value provided and passes
     * each value through the `handler` function along with the current state of the `memo`.  The return from
     * `handler` becomes the `memo` input of the next round. When there are no more elements, returns the
     * final `memo` that was returned.
     *
     * This implementation maintains the particular order for the inputs to be processed through 'handler':
     * the fulfillment of the promise is processed in the order of the iterable.
     */
    static foldSeq<T, MEMO = Element<T>>(them: PromisableIterable<T>, initialValue: Promisable<MEMO>, handler: any): FunPromise<MEMO>;
    /**
     * `this.fold(initialValue, handler)` is the same as [[ FunPromise.fold | `FunPromise.fold(this, initialValue, handler)` ]].
     */
    foldSeq<MEMO = Element<T>>(initialValue: Promisable<MEMO>, handler: (memo: MEMO, nextItem: Element<T>) => Promisable<MEMO>): FunPromise<MEMO>;
    /**
     * Given a [[`PromisableIterable`]], resolves each value provided and passes each value through the
     * `test` function, retaining only those for which the test returned `true`.
     *
     * The order of input elements is maintained, but not the resolution order.
     *
     * If the payload is not an array, then it is coerced into an array using
     * [`_.castArray` from Lodash](https://lodash.com/docs/4.17.15#castArray).
     */
    static filter<T>(them: PromisableIterable<T>, filter: any): FunPromise<(Unpromise<T> | Unpromise<T>)[]>;
    /**
     * `this.filter(test)` is the same as [[ FunPromise.filter | `FunPromise.filter(this, test)` ]].
     */
    filter(test: (it: Element<T>) => Promisable<boolean>): FunPromise<Element<T>[]>;
    /**
     * Given a [[`PromisableIterable`]], resolves each value provided and passes each value through the
     * `test` function, retaining only those for which the test returned `true`.
     *
     * The order of input elements and the resultion order are maintained.
     *
     * If the payload is not an array, then it is coerced into an array using
     * [`_.castArray` from Lodash](https://lodash.com/docs/4.17.15#castArray).
     */
    static filterSeq<T>(them: PromisableIterable<T>, filter: any): FunPromise<(Unpromise<T> | Unpromise<T>)[]>;
    /**
     * `this.filterSeq(test)` is the same as [[ FunPromise.filterSeq | `FunPromise.filterSeq(this, test)` ]].
     */
    filterSeq(test: (it: Element<T>) => Promisable<boolean>): FunPromise<Element<T>[]>;
    /**
     * Classic `then`, but returning a `FunPromise`.
     */
    then(onfulfilled: any, onrejected?: any): any;
    /**
     * Classic `catch`, but returning a `FunPromise`.
     */
    catch(handler: any): any;
    /**
     * Classic `finally`, but returning a `FunPromise`.
     */
    finally(handler: any): any;
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
    catchError<U = never>(handler?: (reason: Error) => U extends never ? void : U): FunPromise<T | U>;
    /**
     * Allows you to "tap" into a chain and work with the result at that point in the chain without modifying the value.
     *
     * Note that if the handler provided throws an exception, that _will_ be propagated as the cause for rejecting, so
     * it's not _impossible_ for `tap` to change the state of the promise.
     */
    tap(handler: (result: T) => Promisable<void>): FunPromise<T>;
    /**
     * Allows you to "tap" into the error handling of a chain and work with the rejection reason at that point in the chain without
     * changing the rejected state.  It leverages [[`FunPromise.catchError`]] to make your typing much nicer.
     *
     * Note that if the handler provided throws an exception, that _will_ be propagated as the cause for rejecting, so
     * it's not _impossible_ for `tapCatch` to change the state of the promise.
     */
    tapCatch(handler: (result: Error) => Promisable<void>): FunPromise<T>;
    /**
     * Allows you to "tap" into the chain and work with either the rejection reason or the resolved value.
     * It leverages [[`FunPromise.catchError`]] to make your typing much nicer.
     *
     * Note that if the handler provided throws an exception, that _will_ be propagated as the cause for rejecting, so
     * it's not _impossible_ for `tapFinally` to change the state of the promise.
     */
    tapFinally(handler: (result: T | Error) => Promisable<void>): FunPromise<T>;
    tapFinally(handler: (result: T) => Promisable<void>, errHandler: (result: Error) => Promisable<void>): FunPromise<T>;
    /**
     * Sets the argument as the resolution value for the promise.
     */
    return<U>(value: Promisable<U>): FunPromise<U>;
    /**
     * Converts a wrapped [[`Iterable`]] into an array.
     *
     * This method _mostly_ exists for the sake of type safety/sanity: it gets the value to [[ Element | `Element<T>[]` ]]
     * from a lot of weird places.
     */
    arrayify(): FunPromise<Element<T>[]>;
    /**
     * Simplifies multiple layers of promise wrappers down to a single wrapper.
     *
     * This method exists solely for the sake of the type system: its behavior is actually implied in the `Promise/A+` spec.
     */
    simplify(): FunPromise<Unpromise<T>>;
}
//# sourceMappingURL=index.d.ts.map