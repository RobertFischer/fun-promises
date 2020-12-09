"use strict";
/** @format */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const fun_promise_1 = require("./fun-promise");
const deferral_1 = require("./deferral");
require("./types");
require("lodash");
describe("Deferral", () => {
    it("can be constructed", () => {
        const deferral = new deferral_1.default();
        expect(deferral).not.toBeNil();
    });
    describe("promise", () => {
        it("is a FunPromise", () => {
            const deferral = new deferral_1.default();
            expect(deferral.promise).toBeInstanceOf(fun_promise_1.default);
        });
    });
    describe("resolve", () => {
        it("basically works", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            const deferral = new deferral_1.default();
            deferral.resolve(true);
            yield expect(deferral.resolve(true)).resolves.toBe(true);
        }));
        it("does not change resolved value if called multiple times", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            const deferral = new deferral_1.default();
            yield expect(deferral.resolve(true)).resolves.toBe(true);
            yield expect(deferral.resolve(false)).resolves.toBe(true);
        }));
    });
    describe("reject", () => {
        it("basically works", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            const deferral = new deferral_1.default();
            yield expect(deferral.reject(new Error("BOOM!"))).rejects.toHaveProperty("message", "BOOM!");
        }));
        it("does not change reason if called multiple times", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            const deferral = new deferral_1.default();
            yield expect(deferral.reject(new Error("BOOM!"))).rejects.toHaveProperty("message", "BOOM!");
            yield expect(deferral.reject(new Error("BANG!"))).rejects.toHaveProperty("message", "BOOM!");
        }));
    });
});
//# sourceMappingURL=deferral.test.js.map