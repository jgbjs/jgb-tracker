import { UNDEFINED } from './constant';

export interface ISandBox {
  [k: string]: any;
}

export const DEFAULT_CONTEXT: ISandBox = {
  Function,
  Array,
  Boolean,
  clearInterval,
  clearTimeout,
  console,
  Date,
  decodeURI,
  decodeURIComponent,
  encodeURI,
  encodeURIComponent,
  Error,
  escape,
  eval,
  Infinity,
  isFinite,
  isNaN,
  JSON,
  Math,
  NaN,
  Number,
  ['null']: null,
  [UNDEFINED]: void 0,
  Object,
  parseFloat,
  parseInt,
  RangeError,
  RegExp,
  setInterval,
  setTimeout,
  String,
  unescape
};

export class Context {
  constructor(externalContext: ISandBox = {}) {
    const ctx = { ...DEFAULT_CONTEXT, ...externalContext };
    this.addContext(ctx);
  }
  addContext(ctx: ISandBox = {}) {
    for (const attr in ctx) {
      if (ctx.hasOwnProperty(attr)) {
        // @ts-ignore
        this[attr] = ctx[attr];
      }
    }
  }
}
