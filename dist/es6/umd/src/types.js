/**
 * @format
 *
 * These are where we put all the type aliases, interfaces, and enumerations that are shared
 * between multiple things, or may be useful to use without us.
 *
 * @packageDocumentation
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PromiseState = void 0;
    /**
     * The various states that a promise can be in.
     */
    var PromiseState;
    (function (PromiseState) {
        /**
         * The promise is neither resolved nor rejected.
         */
        PromiseState["Pending"] = "pending";
        /**
         * The promise has begun resolving, but is not yet fully resolved.
         */
        PromiseState["Resolving"] = "resolving";
        /**
         * The promise has resolved to a value.
         */
        PromiseState["Resolved"] = "resolved";
        /**
         * The promise has begun rejecting, but is not yet fully rejected.
         */
        PromiseState["Rejecting"] = "rejecting";
        /**
         * The promise has rejected with a cause.
         */
        PromiseState["Rejected"] = "rejected";
        /**
         * The promise has been cancelled, which will prevent its
         * callbacks from firing.
         */
        PromiseState["Cancelled"] = "cancelled";
    })(PromiseState = exports.PromiseState || (exports.PromiseState = {}));
});
//# sourceMappingURL=types.js.map