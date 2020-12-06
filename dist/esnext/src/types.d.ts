/**
 * @format
 *
 * These are where we put all the type aliases, interfaces, and enumerations that are shared
 * between multiple things, or may be useful to use without us.
 *
 * @packageDocumentation
 */
/**
 * Provides the type of elements within an `Iterable`, which may be wrapped in one or more promises.
 * The element type is also unwrapped any promises.
 */
export declare type Item<T> = Unpromise<T> extends Array<infer U> ? U : Unpromise<T> extends Iterable<infer U> ? U : never;
/**
 * Provides the type of the resolution value after unwrapping all the `PromiseLike` and [[`Promisable`]] interfaces (if any).
 */
export declare type Unpromise<T> = T extends PromiseLike<infer U> ? Unpromise<U> : T extends Promisable<infer U> ? U extends T ? T : Unpromise<U> : T;
/**
 * Something which can be resolved: that is, either a value or a promise of a value.
 */
export declare type Promisable<T> = T | PromiseLike<T>;
/**
 * Guarantees that there is only one `Promise` wrapper.
 */
export declare type SimplifiedPromise<T> = Promise<Unpromise<T>>;
/**
 * Guarantees that there is only one `PromiseLike` wrapper.
 */
export declare type SimplifiedPromiseLike<T> = PromiseLike<Unpromise<T>>;
/**
 * Guarantees that there is at most one `PromiseLike` wrapper.
 */
export declare type SimplifiedPromisable<T> = Promisable<Unpromise<T>>;
/**
 * An `Iterable` or a promise of an `Iterable`. Its elements are any mix of type `T` and/or `PromiseLike<T>`.
 * Used as a type for arguments.
 */
export declare type PromisableIterable<T> = Promisable<IterableOfPromisables<T>>;
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
    Rejected = "rejected",
    /**
     * The promise has been cancelled, which will prevent its
     * callbacks from firing.
     */
    Cancelled = "cancelled"
}
//# sourceMappingURL=types.d.ts.map