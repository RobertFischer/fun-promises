/** @format */

import FunPromise from "./fun-promise";
import { PromiseState, Promisable } from "./types";
import _defer from "lodash/defer";

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
	 * Whether `promise` has resolved or rejected.
	 */
	get isSettled() {
		switch (this.stateValue) {
			case PromiseState.Resolved:
				return true;
			case PromiseState.Rejected:
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
				_defer(() => {
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
				_defer(() => {
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
		this.promise = new FunPromise(
			new Promise((resolve, reject) => {
				this.resolver = resolve;
				this.rejector = reject;
			})
		);
	}

	/**
	 * Whether or not the deferral is cancelled.
	 */
	get isCancelled() {
		return (
			!this.isSettled() && this.resolver === null && this.resolver === null
		);
	}

	/**
	 * Cancels the deferral.  If the deferral is not settled, its callbacks will
	 * never be called. If the deferral is settled or cancelled, this is a noop.
	 */
	cancel() {
		if (this.isSettled()) return;
		this.stateValue = PromiseState.Cancelled;
		this.resolver = null;
		this.rejector = null;
		this.promise.catch(_.noop); // Suppress "UnhandledException" errors.
	}
}
