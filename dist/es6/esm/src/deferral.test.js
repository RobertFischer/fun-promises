/** @format */
import { __awaiter } from "tslib";
import FunPromise from "./fun-promise";
import Deferral from "./deferral";
import "./types";
import "lodash";
describe("Deferral", () => {
    it("can be constructed", () => {
        const deferral = new Deferral();
        expect(deferral).not.toBeNil();
    });
    describe("promise", () => {
        it("is a FunPromise", () => {
            const deferral = new Deferral();
            expect(deferral.promise).toBeInstanceOf(FunPromise);
        });
    });
    describe("resolve", () => {
        it("basically works", () => __awaiter(void 0, void 0, void 0, function* () {
            const deferral = new Deferral();
            deferral.resolve(true);
            yield expect(deferral.resolve(true)).resolves.toBe(true);
        }));
        it("does not change resolved value if called multiple times", () => __awaiter(void 0, void 0, void 0, function* () {
            const deferral = new Deferral();
            yield expect(deferral.resolve(true)).resolves.toBe(true);
            yield expect(deferral.resolve(false)).resolves.toBe(true);
        }));
    });
    describe("reject", () => {
        it("basically works", () => __awaiter(void 0, void 0, void 0, function* () {
            const deferral = new Deferral();
            yield expect(deferral.reject(new Error("BOOM!"))).rejects.toHaveProperty("message", "BOOM!");
        }));
        it("does not change reason if called multiple times", () => __awaiter(void 0, void 0, void 0, function* () {
            const deferral = new Deferral();
            yield expect(deferral.reject(new Error("BOOM!"))).rejects.toHaveProperty("message", "BOOM!");
            yield expect(deferral.reject(new Error("BANG!"))).rejects.toHaveProperty("message", "BOOM!");
        }));
    });
    describe("cancellation", () => {
        it("is initially not cancelled", () => {
            expect(new Deferral()).toHaveProperty("isCancelled", false);
        });
        it("is cancelled after calling 'cancel'", () => {
            const deferral = new Deferral();
            deferral.cancel();
            expect(deferral).toHaveProperty("isCancelled", true);
        });
        it("is safe to call 'cancel' multiple times", () => {
            const deferral = new Deferral();
            deferral.cancel();
            deferral.cancel();
            expect(deferral).toHaveProperty("isCancelled", true);
        });
        it("prevents resolve from doing anything", () => {
            let sawThen = false;
            const deferral = new Deferral();
            deferral.promise.then(() => {
                sawThen = true;
            });
            deferral.cancel();
            deferral.resolve(true);
            expect(sawThen).toBe(false);
        });
        it("rejects with a known message", () => __awaiter(void 0, void 0, void 0, function* () {
            const deferral = new Deferral();
            deferral.cancel();
            yield expect(deferral.promise).rejects.toHaveProperty("message", "Deferral was cancelled");
        }));
    });
});
//# sourceMappingURL=deferral.test.js.map