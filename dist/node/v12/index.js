"use strict";
/**
 * /* @format
 *
 * @format
 */
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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Re-exports everything from [`src/types`|_src_types_.html], [`src/fun-promise`|_src_fun-promise_.html], and [`src/deferral`|_src_deferral_.html].
 *
 * @packageDocumentation
 */
__exportStar(require("./src/types"), exports);
__exportStar(require("./src/deferral"), exports);
__exportStar(require("./src/fun-promise"), exports);
