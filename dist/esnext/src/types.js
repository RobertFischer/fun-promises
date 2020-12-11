/**
 * @format
 *
 * These are where we put all the type aliases, interfaces, and enumerations that are shared
 * between multiple things, or may be useful to use without us.
 *
 * @packageDocumentation
 */
/**
 * Represents a `PromiseSettledResult` value for a fulfilled promise.
 */
export class Fulfillment {
    value;
    constructor(value) {
        this.value = value;
    }
    get status() {
        return "fulfilled";
    }
}
/**
 * Represents a `PromiseSettledResult` value for a rejected promise.
 */
export class Rejection {
    reason;
    constructor(reason) {
        this.reason = reason;
    }
    get status() {
        return "rejected";
    }
}
//# sourceMappingURL=types.js.map