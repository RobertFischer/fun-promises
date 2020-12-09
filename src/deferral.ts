/** @format */

import FunPromise from "./fun-promise";
import _noop from "lodash/noop";
import type { Promisable } from "./types";

/**
 * A class that is an "inside-out" [[`FunPromise`]]: the `resolve` and `reject` functions
 * from the callback are exposed as properties, and are therefore able to be called by
 * caller's code.
 *
 * Note that after the first call to either `resolve` or `reject`, the underlying promise
 * is settled. Any subsequent call to either `resolve` or `reject` is guaranteed to be
 * a no-op.
 */
export default class Deferral<T> {
	/**
	 * The promise whose state is determined by `resolve` and `reject`.
	 */
	readonly promise: FunPromise<T>;

	/**
	 * The function used to resolve [[`promise`]].
	 */
	private resolver: (it: Promisable<T>) => Promisable<void> | null = null;

	/**
	 * The function used to reject [[`promise`]].
	 */
	private rejector: (err: unknown) => Promisable<void> | null = null;

	/**
	 * Resolves `promise` with the given value.
	 */
	resolve(it) {
		this.resolver(it);
		return this.promise;
	}

	/**
	 * Rejects `promise` with the given cause.
	 */
	reject(e: Error) {
		this.rejector(e);
		return this.promise;
	}

	/**
	 * Constructs a new promise and exposes its resolve
	 * and reject functions.
	 */
	constructor() {
		this.promise = new FunPromise(
			new Promise((resolve, reject) => {
				this.resolver = resolve;
				this.rejector = reject;
			})
		);
	}
}
