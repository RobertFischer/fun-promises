/** @format */

/**
 * Provides the type of elements within an [[`Iterable`]], which may be wrapped in one or more promises.
 * The element type is also unwrapped any promises.
 */
export type Element<T> = Unpromise<T> extends Iterable<infer U>
	? Unpromise<U>
	: never;

/**
 * Provides the type of the resolution value after unwrapping all the [[`PromiseLike`]] and [[`Promisable`]] interfaces (if any).
 */
export type Unpromise<T> = T extends PromiseLike<infer U>
	? Unpromise<U>
	: T extends Promisable<infer U>
	? U extends T
		? T
		: Unpromise<U>
	: T;

/**
 * Something which can be resolved: that is, either a value or a promise of a value.
 */
export type Promisable<T> = T | PromiseLike<T>;

/**
 * Guarantees that there is at most one [[`Promise`]] wrapper.
 */
export type SimplifiedPromise<T> = Promise<Unpromise<T>>;

/**
 * Guarantees that there is at most one [[`PromiseLike`]] wrapper.
 */
export type SimplifiedPromiseLike<T> = PromiseLike<Unpromise<T>>;

/**
 * Guarantees that there is at most one [[`Promisable`]] wrapper.
 */
export type SimplifiedPromisable<T> = Promisable<Unpromise<T>>;

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
