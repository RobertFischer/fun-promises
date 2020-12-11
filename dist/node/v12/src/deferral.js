"use strict";
/** @format */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fun_promise_1 = __importDefault(require("./fun-promise"));
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
        this.resolver(it);
        return this.promise;
    }
    /**
     * Rejects `promise` with the given cause.
     */
    reject(e) {
        this.rejector(e);
        return this.promise;
    }
}
exports.default = Deferral;
//# sourceMappingURL=deferral.js.map