"use strict";
/** @format */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Deferral = exports.FunPromise = void 0;
__exportStar(require("./src/types"), exports);
var fun_promise_1 = require("./src/fun-promise");
Object.defineProperty(exports, "FunPromise", { enumerable: true, get: function () { return __importDefault(fun_promise_1).default; } });
var deferral_1 = require("./src/deferral");
Object.defineProperty(exports, "Deferral", { enumerable: true, get: function () { return __importDefault(deferral_1).default; } });
