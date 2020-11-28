"use strict";
/** @format */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Deferral = exports.FunPromise = void 0;
const tslib_1 = require("tslib");
tslib_1.__exportStar(require("./src/types"), exports);
var fun_promise_1 = require("./src/fun-promise");
Object.defineProperty(exports, "FunPromise", { enumerable: true, get: function () { return fun_promise_1.default; } });
var deferral_1 = require("./src/deferral");
Object.defineProperty(exports, "Deferral", { enumerable: true, get: function () { return deferral_1.default; } });
//# sourceMappingURL=index.js.map