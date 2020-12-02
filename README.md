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
[GitHub Pages](https://robertfischer.github.io/fun-promises/). (If you're on
GitHub Pages, then check out the "Globals" column at the top right corner.) You
also may want to check out
[the BDD spec](http://robertfischer.github.io/fun-promises/test-results.txt),
which gives an overview of how we expect these things to work.

#### `Deferral` class

This is an inside-out promise: it gives you access to the `resolve` and `reject`
methods of the promise so that you can perform operations on them later, as well
as having accessor to query the state of `promise`.

#### `try`

Wrap your execution in a promise, so that even its invocation
[won't release Zalgo](https://blog.izs.me/2013/08/designing-apis-for-asynchrony),
or as a convinent way to build a `FunPromise` off of an `async` function.

```typescript
FunPromise.try(() => doSomething(explosivelyFailingParamCalculation()));
FunPromise.try(async () => {
	/* do stuff */ await something; /* do more stuff */
});
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

#### Types

There are types that represent unwrapped promises (`Unpromise`), things that may
be promises or values (`Promisable`), and a few others that are a lot more
esoteric.

_NOTE_: Compiling these types requires TypeScript 4.1 or greater due to
conditional recursive types being unavailable in 3.x and buggy in 4.0.x. As of
this writing, that means explicitly installing `typescript@^4.1.1-rc`, but
[you can double-check the npm versions page yourself](https://www.npmjs.com/package/typescript?activeTab=versions).

### Distributions

By default, your packager should automatically grab the appropriate distribution
through the `package.json` configuration within this library. If you're curious
or if you have a weird use case, then each distribution has a few different
flavors of the codebase to choose from. These all live under the `./dist`
directory.

#### ESNext

Within `./dist/esnext` is the result of the Typescript compilation with the
["ESNext" `module` setting](https://www.typescriptlang.org/tsconfig#module) and
the ["ESNext" `target` setting](https://www.typescriptlang.org/tsconfig#target).
Note that it is subject to change as new ECMAScript standards are put out and
Typescript's JavaScript generation continues to catch up to them, and mostly
exists for developers to see code that results from compilation.

#### ES6

Within `./dist/es6` are the folders `amd`, `umd`, `cjs` (CommonJS), and `esm`
(ECMAScript Modules). These contain the result of the Typescript compilation
with the corresponding
[`module` setting](https://www.typescriptlang.org/tsconfig#module) and the
["ES6" `target` setting](https://www.typescriptlang.org/tsconfig#target).

The only single-file distribution is the `es6/amd` distribution.

#### Node

Within `./dist/node` are the folders `v10`, `v12`, `v14`, each of which
containing the Typescript compilation based on
[the recommended `tsconfig.json` configs](https://github.com/tsconfig/bases#node-10-tsconfigjson).
for those environments. All the versions are the exact same code as of this
writing, so we default Node to using `node/v14`.

#### React Native

Within `./dist/rn` is the result of the Typescript compilation based on
[the recommended `tsconfig.json` config for React Native](https://github.com/tsconfig/bases#react-native-tsconfigjson).
This is also referred to under the `reactNative` key in `package.json`, which
[you should configure in your `metro.config.js` to prefer](https://facebook.github.io/metro/docs/configuration/#resolvermainfields).

#### Browser

The file at `./dist/browser/index.js` is the result of transpiling the result of
the `ESNext` code above using [Parcel](http://parceljs.org/). The result is a
single minified file, appropriate for use in a CDN. It exposes the module under
the global `FunPromise` namespace.

### Documentation

The full documentation (including this content) is available on
[GitHub Pages](https://robertfischer.github.io/fun-promises/).

#### Specifications

Our test specs are
[published here](https://robertfischer.github.io/fun-promises/test-results.txt).

### Contributing [ TODO ]

#### Design Philosophy [ TODO ]
