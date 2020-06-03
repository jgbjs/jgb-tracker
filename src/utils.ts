import get from "lodash/get";

export function normalizePath(url: string) {
  let [path, query = ""] = url.split("?");
  if (path.startsWith("/")) {
    path = path.slice(1);
  }

  return { path, query: normalizeQuery(query) };
}

export function normalizeQuery(query: string = "") {
  query.split("&").reduce((obj: any, sp) => {
    const [key, value] = sp.split("=");
    return Object.assign(obj, {
      [key]: value,
    });
  }, {});
}

export function getCurrentPage() {
  const pages = getCurrentPages();
  if (pages.length === 0) {
    return;
  }
  return pages[pages.length - 1];
}

export function hasCode(str: string) {
  let hash = 0;
  let chr: any;
  if (str.length === 0) {
    return hash;
  }
  for (let i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    // tslint:disable-next-line: no-bitwise
    hash = (hash << 5) - hash + chr;
    // tslint:disable-next-line: no-bitwise
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

/**
 * lodash.get
 * @param obj
 * @param path
 *  'a[0].b.c'
 *  'a.b.c'
 *  'a["b"][0].c'
 */
export function safeGet(obj: any, path: string) {
  return get(obj, path);
}

const p = Promise.resolve();

export function nextTick(cb: any) {
  if (wx.nextTick) {
    return wx.nextTick(cb);
  }
  p.then(cb);
}

export function matchUrl(url: string, regex: string | RegExp) {
  if (typeof regex === "string") {
    return url.includes(regex);
  }
  return regex.test(url);
}

export function sleep(ms = 100) {
  return new Promise((r) => setTimeout(r, ms));
}
