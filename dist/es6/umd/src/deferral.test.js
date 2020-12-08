/** @format */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "tslib", "./fun-promise", "./deferral", "./types", "lodash"], factory);
    }
})(function (require, exports) {
    "use strict";
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
        describe("cancellation", () => {
            it("is initially not cancelled", () => {
                expect(new deferral_1.default()).toHaveProperty("isCancelled", false);
            });
            it("is cancelled after calling 'cancel'", () => {
                const deferral = new deferral_1.default();
                deferral.cancel();
                expect(deferral).toHaveProperty("isCancelled", true);
            });
            it("is safe to call 'cancel' multiple times", () => {
                const deferral = new deferral_1.default();
                deferral.cancel();
                deferral.cancel();
                expect(deferral).toHaveProperty("isCancelled", true);
            });
            it("prevents resolve from doing anything", () => {
                let sawThen = false;
                const deferral = new deferral_1.default();
                deferral.promise.then(() => {
                    sawThen = true;
                });
                deferral.cancel();
                deferral.resolve(true);
                expect(sawThen).toBe(false);
            });
            it("rejects with a known message", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
                const deferral = new deferral_1.default();
                deferral.cancel();
                yield expect(deferral.promise).rejects.toHaveProperty("message", "Deferral was cancelled");
            }));
        });
    });
});
//# sourceMappingURL=deferral.test.js.map