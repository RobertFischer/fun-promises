"use strict";
/** @format */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fun_promise_1 = __importDefault(require("./fun-promise"));
const noop_1 = __importDefault(require("lodash/noop"));
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
     * Constructs a new promise and exposes its resolve
     * and reject functions.
     */
    constructor() {
        /**
         * The function used to resolve [[`promise`]].
         */
        this.resolver = null;
        /**
         * The function used to reject [[`promise`]].
         */
        this.rejector = null;
        this.promise = new fun_promise_1.default(new Promise((resolve, reject) => {
            this.resolver = resolve;
            this.rejector = reject;
        }));
    }
    /**
     * Resolves `promise` with the given value.
     */
    resolve(it) {
        const { resolver } = this;
        this.resolver = null;
        this.rejector = null;
        if (resolver)
            resolver(it);
        return this.promise;
    }
    /**
     * Rejects `promise` with the given cause.
     */
    reject(e) {
        const { rejector } = this;
        this.resolver = null;
        this.rejector = null;
        if (rejector)
            rejector(e);
        return this.promise;
    }
    /**
     * Whether or not the deferral is cancelled.
     */
    get isCancelled() {
        return this.resolver === null;
    }
    /**
     * Cancels the deferral.  If the deferral is not settled, its callbacks will
     * never be called. If the deferral is settled or cancelled, this is a noop.
     */
    cancel() {
        if (!this.isCancelled) {
            this.promise.catch(noop_1.default); // Suppress "UnhandledException" errors.
            this.reject(new Error(`Deferral was cancelled`));
            this.resolver = null;
            this.rejector = null;
        }
    }
}
exports.default = Deferral;
//# sourceMappingURL=deferral.js.map