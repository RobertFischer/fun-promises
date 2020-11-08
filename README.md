<!-- @format -->

# fun-promises

## A library for making Promises more friendly, fluent, and fun(ctional).

### What This Is Not

This is _not_ an implementation of [Promises/A+](https://promisesaplus.com/). It
is not a polyfill or a [ponyfill](https://github.com/sindresorhus/ponyfill). In
fact, it assumes that you have `Promise` available as a global, either through a
polyfill or natively.

### What This Is

This is a library that extends the native `Promise` implementation with a number
of useful utilities, so that your code is faster and easier. It is inspired by
libraries like [`bluebird`](http://bluebirdjs.com/) and
[`rsvp.js`](https://github.com/tildeio/rsvp.js/blob/master/README.md), except
without the overhead of providing its own `Promise` implementation. Native
promises have been competitive in performance since Node 10
([even `bluebird` says so](https://www.npmjs.com/package/bluebird#note)) but
there's a lot of functionality which native `Promises` don't supply. Fun
Promises gives you that better API without the overhead.

### Some Highlights

For more details on these APIs, see
[GitHub Pages](https://robertfischer.github.io/fun-promises/).

#### `try`

Wrap your execution in a promise, so that even its invocation
[won't release Zalgo](https://blog.izs.me/2013/08/designing-apis-for-asynchrony).

```typescript
FunPromise.try(() => doSomething(explosivelyFailingParamCalculation()));
```

#### `catchError`

Like `catch`, but ensures that the argument is an `Error`. (You can throw
anything in JavaScript!)

```typescript
sketchyCall().catchError((e) =>
	console.warn(`Failed to make sketchyCall: ${e.message}`, e)
);
```

#### `tap`

This lets you take a look at a resolved value without risking changing it. This
is extremely useful for debugging log messages.

```typescript
someExpensiveOperation()
	.tap((value) => debug("Value from someExpensiveOperation", value))
	.then(/* ... */);
```

#### `race`

Fire off a bunch of promises and return whichever one resolves first. (The
results of any later-resolving promises are discarded.)

```typescript
getRelatedShows().race((someShow) => renderSuggestedShow(someShow));
```

#### `coalesce`

Given a bunch of functions that return either values or promises of values,
execute them sequentially and return the first one what resolves.

```typescript
FunPromise.coalesce([
	lookupUserInMemoryCache,
	lookupUserInRedisCache,
	lookupUserInDB,
]).then((data) => renderUserData(data));
```

That code is equivalent to:

```typescript
FunPromise.resolve([
	lookupUserInMemoryCache,
	lookupUserInRedisCache,
	lookupUserInDB,
])
	.coalesce()
	.then((data) => renderUserData);
```

### Documentation

The full documentation (including this content) is available at
[GitHub Pages](https://robertfischer.github.io/fun-promises/).

### Contributing

#### Design Philosophy
