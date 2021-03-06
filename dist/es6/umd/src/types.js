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
    exports.Rejection = exports.Fulfillment = void 0;
    /**
     * Represents a `PromiseSettledResult` value for a fulfilled promise.
     */
    class Fulfillment {
        constructor(value) {
            Object.defineProperty(this, "value", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: value
            });
        }
        get status() {
            return "fulfilled";
        }
    }
    exports.Fulfillment = Fulfillment;
    /**
     * Represents a `PromiseSettledResult` value for a rejected promise.
     */
    class Rejection {
        constructor(reason) {
            Object.defineProperty(this, "reason", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: reason
            });
        }
        get status() {
            return "rejected";
        }
    }
    exports.Rejection = Rejection;
});
//# sourceMappingURL=types.js.map