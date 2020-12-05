/**
 * @format
 */

/**
 * Re-exports everything from [`src/types`|https://robertfischer.github.io/fun-promises/modules/_src_types_.html],
 * [`src/fun-promise`|https://robertfischer.github.io/fun-promises/modules/_src_fun_promise_.html], and
 * [`src/deferral`|https://robertfischer.github.io/fun-promises/modules/_src_deferral_.html].
 *
 * The default export is the [FunPromise class|https://robertfischer.github.io/fun-promises/classes/_src_fun_promise_.funpromise.html].
 *
 * @packageDocumentation
 */

export * from "./src/types";
export * from "./src/deferral";
export * from "./src/fun-promise";

import FunPromise from "./src/fun-promise";
export default FunPromise;
