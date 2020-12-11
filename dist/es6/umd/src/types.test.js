/** @format */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./types", "lodash"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const types_1 = require("./types");
    const lodash_1 = require("lodash");
    describe("Fulfillment", () => {
        lodash_1.default.forEach([true, { foo: true }], (arg) => {
            describe(`when passed the ${typeof arg} argument '${JSON.stringify(arg)}'`, () => {
                const fulfillment = new types_1.Fulfillment(arg);
                it("exposes the argument on the 'value' property", () => {
                    expect(fulfillment).toHaveProperty("value", arg);
                });
                it("has a 'status' property of 'fulfilled'", () => {
                    expect(fulfillment).toHaveProperty("status", "fulfilled");
                });
            });
        });
    });
    describe("Rejection", () => {
        lodash_1.default.forEach(["BOOM!", new Error("BOOM!")], (arg) => {
            describe(`when passed the ${typeof arg} argument: '${arg}'`, () => {
                const rejection = new types_1.Rejection(arg);
                it("returns the argument in the 'reason' property", () => {
                    expect(rejection).toHaveProperty("reason", arg);
                });
                it("has a 'status' property whose value is 'rejected'", () => {
                    expect(rejection).toHaveProperty("status", "rejected");
                });
            });
        });
    });
});
//# sourceMappingURL=types.test.js.map