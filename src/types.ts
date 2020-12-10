/**
 * @format
 *
 * These are where we put all the type aliases, interfaces, and enumerations that are shared
 * between multiple things, or may be useful to use without us.
 *
 * @packageDocumentation
 */

/// <reference lib="es2020.promise" />

/**
 * Provides the type of elements within an `Iterable`, which may be wrapped in one or more promises.
 * The element type is also unwrapped any promises.
 */
export type Item<T> = Unpromise<T> extends Array<infer U>
	? U
	: Unpromise<T> extends Iterable<infer U>
	? U
	: never;

/**
 * Provides the type of the resolution value after unwrapping all the `PromiseLike` and [[`Promisable`]] interfaces (if any).
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
 * Guarantees that there is only one `Promise` wrapper.
 */
export type SimplifiedPromise<T> = Promise<Unpromise<T>>;

/**
 * Guarantees that there is only one `PromiseLike` wrapper.
 */
export type SimplifiedPromiseLike<T> = PromiseLike<Unpromise<T>>;

/**
 * Guarantees that there is at most one `PromiseLike` wrapper.
 */
export type SimplifiedPromisable<T> = Promisable<Unpromise<T>>;

/**
 * An `Iterable` or a promise of an `Iterable`. Its elements are any mix of type `T` and/or `PromiseLike<T>`.
 * Used as a type for arguments.
 */
export type PromisableIterable<T> = Promisable<IterableOfPromisables<T>>;

/**
 * Represents an `Iterable` that is not a promise but an actual value that is an `Iterable`,
 * although it may produce either values or promises of values or both.
 */
export type IterableOfPromisables<T> = Iterable<Promisable<T>>;

/**
 * Represents a `PromiseSettledResult` value for a fulfilled promise.
 */
export class Fulfillment<T> implements PromiseFulfilledResult<T> {
	constructor(public readonly value: T) {}

	get status(): "fulfilled" {
		return "fulfilled";
	}
}

/**
 * Represents a `PromiseSettledResult` value for a rejected promise.
 */
export class Rejection implements PromiseRejectedResult {
	constructor(public readonly reason: unknown) {}

	get status(): "rejected" {
		return "rejected";
	}
}

/**
 * Equivalent to a `PromiseSettledResult`, but specific to our classes.
 */
export type Settlement<T> = Fulfillment<T> | Rejection;
