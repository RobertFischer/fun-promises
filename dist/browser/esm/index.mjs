import"core-js/modules/es.array.iterator";import"core-js/modules/es.promise";import"core-js/modules/es.promise.finally";import"core-js/modules/web.dom-collections.iterator";import _filterInstanceProperty from"@babel/runtime-corejs3/core-js/instance/filter";import _mapInstanceProperty from"@babel/runtime-corejs3/core-js/instance/map";import _Promise from"@babel/runtime-corejs3/core-js/promise";import _Symbol$toStringTag2 from"@babel/runtime-corejs3/core-js/symbol/to-string-tag";import _toString from"lodash/toString";import _filter from"lodash/filter";import _map from"lodash/map";import _isFunction from"lodash/isFunction";import _isEmpty from"lodash/isEmpty";import _isNil from"lodash/isNil";import _pull from"lodash/pull";import _forEach from"lodash/forEach";import _once from"lodash/once";import _identity from"lodash/identity";import _toArray from"lodash/toArray";import _castArray from"lodash/castArray";import _clone from"lodash/clone";import _defer from"lodash/defer";import _isError from"lodash/isError";let _Symbol$toStringTag;function isError(a){return _isError(a)}export var PromiseState;(function(a){a.Pending="pending",a.Resolving="resolving",a.Resolved="resolved",a.Rejecting="rejecting",a.Rejected="rejected"})(PromiseState||(PromiseState={}));export class Deferral{get state(){return this.stateValue}get isSettling(){switch(this.stateValue){case PromiseState.Resolving:return!0;case PromiseState.Rejecting:return!0;default:return!1;}}get isResolved(){return this.stateValue===PromiseState.Resolved}get isRejected(){return this.stateValue===PromiseState.Rejected}resolve(a){const{resolver:b}=this;if(b)try{const{rejector:c}=this;this.stateValue=PromiseState.Resolving,_defer(()=>{try{b(a),this.stateValue=PromiseState.Resolved}catch(a){c?(this.rejector=c,this.reject(a)):console.warn(`Uncaught exception during resolution`,a)}})}catch(a){this.reject(a)}finally{this.resolver=null,this.rejector=null}return this.promise}reject(a){const{rejector:b}=this;if(b)try{this.stateValue=PromiseState.Rejecting,_defer(()=>{try{b(a)}finally{this.stateValue=PromiseState.Rejected}})}finally{this.resolver=null,this.rejector=null}return this.promise}constructor(){this.promise=void 0,this.stateValue=PromiseState.Pending,this.resolver=null,this.rejector=null,this.promise=FunPromise.new((a,b)=>{this.resolver=a,this.rejector=b})}}_Symbol$toStringTag=_Symbol$toStringTag2;export default class FunPromise{constructor(a){this.wrapped=void 0,this[_Symbol$toStringTag]=void 0,this.wrapped=a,this[_Symbol$toStringTag2]=a[_Symbol$toStringTag2]}static wrap(a){return a instanceof FunPromise?a:a instanceof _Promise?new FunPromise(a):new FunPromise(new _Promise(b=>b(a)))}static resolve(a){return a instanceof _Promise||a instanceof FunPromise?FunPromise.wrap(a):FunPromise.new(b=>b(a))}static new(a){return FunPromise.wrap(new _Promise(a))}processArray(a){return FunPromise.wrap(this.arrayify().wrapped.then(async b=>{const c=_clone(_castArray(b)),d=a(c);return _Promise.all(_toArray(d))}))}reduceArray(a){const b=this.arrayify().wrapped.then(a);return FunPromise.wrap(b)}static try(a){return FunPromise.new(b=>b(a()))}static all(a){return FunPromise.resolve(a).all()}all(){return this.processArray(_identity)}static race(a,b){return FunPromise.resolve(a).race(b)}race(a){return this.reduceArray(b=>new _Promise(async(c,d)=>{const e=_once(c);_forEach(b,c=>FunPromise.resolve(c).tapFinally(()=>{_pull(b,c)}).then(e,c=>{_isNil(a)||a(c),_isEmpty(b)&&d(c)}))}))}static coalesce(a){return FunPromise.resolve(a).coalesce()}coalesce(){return this.reduceArray(async a=>{var b;let c=null;for(;!_isEmpty(a);)try{const b=a.shift();if(_isFunction(b))return await b()}catch(a){c=a}throw null==(b=c)?new Error("No values found to coalesce"):b})}static map(a,b){var c;return _mapInstanceProperty(c=FunPromise.resolve(a)).call(c,b)}map(a){return this.reduceArray(b=>_Promise.all(_map(b,a)))}static mapSeq(a,b){var c;return _mapInstanceProperty(c=FunPromise.resolve(a)).call(c,b)}mapSeq(a){return this.reduceArray(async b=>{const c=[];for(c.length=b.length;!_isEmpty(b);)c.push(a(await b.shift()));return c})}static fold(a,b,c){return FunPromise.resolve(a).fold(b,c)}fold(a,b){return this.reduceArray(c=>{let d=FunPromise.resolve(a);return _Promise.all(_map(c,async a=>{const c=await a;d=d.then(a=>b(a,c))})).then(async()=>await d)})}static foldSeq(a,b,c){return FunPromise.resolve(a).fold(b,c)}foldSeq(a,b){return this.reduceArray(c=>{let d=FunPromise.resolve(a);for(;!_isEmpty(c);){const a=c.shift();d=d.then(async c=>b(c,await a))}return d})}static filter(a,b){var c;return _filterInstanceProperty(c=FunPromise.resolve(a)).call(c,b)}filter(a){return this.processArray(async b=>{const c=await _Promise.all(_map(b,a));return _filter(b,(a,b)=>(a,c[b]))})}static filterSeq(a,b){return FunPromise.resolve(a).filterSeq(b)}filterSeq(a){return this.processArray(async b=>{const c=[];for(;!_isEmpty(b);){const d=b.shift();(await a(d))&&c.push(d)}return c})}then(a,b){return FunPromise.wrap(this.wrapped.then(a,b))}catch(a){return FunPromise.wrap(this.wrapped.catch(a))}finally(a){return FunPromise.wrap(this.wrapped.finally(a))}catchError(a){return this.catch(b=>{if(_isNil(b))throw new Error(`Promise was rejected without a reason`);else isError(b)?a(b):a(new Error(`Promise was rejected; expected Error, but saw: ${_toString(b)} (${typeof b})`))})}tap(a){return this.then(async b=>(await a(b),b))}tapCatch(a){return this.catchError(b=>FunPromise.try(()=>a(b)).finally(()=>{throw b}))}tapFinally(a,b){return this.tap(a).tapCatch(null==b?a:b)}return(a){return FunPromise.wrap(this.wrapped.then(()=>a))}arrayify(){return FunPromise.wrap(this.wrapped.then(a=>_toArray(a)))}simplify(){return this}result(){return this.catchError(_identity)}}