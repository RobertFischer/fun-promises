/** @format */
import { Fulfillment, Rejection } from "./types";
import _ from "lodash";
describe("Fulfillment", () => {
    _.forEach([true, { foo: true }], (arg) => {
        describe(`when passed the ${typeof arg} argument '${JSON.stringify(arg)}'`, () => {
            const fulfillment = new Fulfillment(arg);
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
    _.forEach(["BOOM!", new Error("BOOM!")], (arg) => {
        describe(`when passed the ${typeof arg} argument: '${arg}'`, () => {
            const rejection = new Rejection(arg);
            it("returns the argument in the 'reason' property", () => {
                expect(rejection).toHaveProperty("reason", arg);
            });
            it("has a 'status' property whose value is 'rejected'", () => {
                expect(rejection).toHaveProperty("status", "rejected");
            });
        });
    });
});
//# sourceMappingURL=types.test.js.map