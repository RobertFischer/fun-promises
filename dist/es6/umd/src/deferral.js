/** @format */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./fun-promise", "lodash/noop"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const fun_promise_1 = require("./fun-promise");
    require("lodash/noop");
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
             * The promise whose state is determined by `resolve` and `reject`.
             */
            Object.defineProperty(this, "promise", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            /**
             * The function used to resolve [[`promise`]].
             */
            Object.defineProperty(this, "resolver", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: null
            });
            /**
             * The function used to reject [[`promise`]].
             */
            Object.defineProperty(this, "rejector", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: null
            });
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
});
//# sourceMappingURL=deferral.js.map