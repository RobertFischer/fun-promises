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
});
//# sourceMappingURL=deferral.test.js.map