/** @format */
/// <reference types="typescript/lib/lib.es5" />
import FunPromise from "./fun-promise";
import { PromiseState } from "./types";
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
     * Whether `promise` has resolved or rejected.
     */
    get isSettled(): boolean;
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
    /**
     * Whether or not the deferral is cancelled.
     */
    get isCancelled(): boolean;
    /**
     * Cancels the deferral.  If the deferral is not settled, its callbacks will
     * never be called. If the deferral is settled or cancelled, this is a noop.
     */
    cancel(): void;
}
//# sourceMappingURL=deferral.d.ts.map