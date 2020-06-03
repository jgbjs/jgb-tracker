import { jgb, JComponent, JPage } from "jgb-weapp";
import { cacheManage } from "./cache";
import { Collector, registerCollect } from "./collect";
import {
  getCurrentPage,
  normalizePath,
  hasCode,
  matchUrl,
  sleep,
} from "./utils";

type IProcessFn = (config: any) => IConfig | Promise<IConfig>;
const $TRACKER = Symbol("TRACKER");
let processFn: IProcessFn = (conf: any) => conf;

export interface IConfigElement {
  /** 需要上报的事件名  */
  eventName: string;
  /**
   * 元素选择器
   */
  element: string;
  /**
   * 需要采集的数据
   */
  data: {
    [key: string]: string;
  };
}

export interface IConfigMethod {
  /** 需要上报的事件名  */
  eventName: string;
  /**
   * 方法名
   */
  method: string;
  /**
   * 条件判断
   */
  condition?: string;
  /**
   * 需要采集的数据
   */
  data: {
    [key: string]: string;
  };
}

/**
 * 曝光
 */
export interface IExposureItem extends Omit<IConfigMethod, "method"> {
  /** selector  */
  className: string;
  /** 需要监听的url */
  requestUrl?: string;
  /**
   * 元素与可视区相交比
   * 取值：0~1
   * @default 0.5
   */
  ratio?: number;
  /**
   * 最大相交区域高度/宽
   * @default 100px
   */
  maxIntersection?: number;
  /**
   * 停留在可视区内时间
   * @default 1000ms
   */
  stay?: number;
  /**
   * 是否只触发一次
   * @default false
   */
  once?: boolean;
}

export interface IConfigPageItem {
  /**
   * 页面路径
   */
  path: string;
  /**
   * 组件配置
   */
  components?: IConfigComponentItem[];
  /**
   * track的元素
   */
  elements?: IConfigElement[];
  /**
   * track的方法
   */
  methods?: IConfigMethod[];
  /**
   * track 曝光
   */
  exposure?: IExposureItem[];
}

export interface IConfigComponentItem {
  /**
   * 组件路径：is
   */
  path: string;
  /**
   * track的元素
   */
  elements?: IConfigElement[];
  /**
   * track的方法
   */
  methods?: IConfigMethod[];
  /**
   * track 曝光
   */
  exposure?: IExposureItem[];
}

export interface IConfig {
  /**
   * 需要跟踪的配置
   */
  tracks: Array<IConfigPageItem | IConfigComponentItem>;
}

interface ICacheData {
  minHeight: number;
  minWidth: number;
  timeout: number;
  inView?: boolean;
}

const OBSERVE_KEY = Symbol("observe");
// const OBSERVE_QUEUE_DATA = Symbol("ob_queue_data");

export class TrackerConfig {
  private config?: IConfig;
  private loadPromise: Promise<any> | undefined;
  private ctxMap = new Map<any, string[]>();

  private async innerLoad(urlorConfig: any) {
    // localConfig
    if (typeof urlorConfig === "object") {
      this.config = urlorConfig;
      return;
    }

    // url
    const url = urlorConfig;
    const requestTask = async () => {
      const result = await jgb.request({
        url,
        priority: 0,
      });

      const c = result.data;
      this.config = await this.process(c);
      cacheManage.setCache(this.config);
    };

    const localCacheTask = async () => {
      const cache = await cacheManage.getCache();
      if (cache) {
        this.config = cache;
      }
    };

    const rq = requestTask().catch();
    await Promise.all([rq, localCacheTask()]);
  }
  /**
   * 加载配置
   * @param url
   */
  load(url: string): Promise<any>;
  // tslint:disable-next-line: unified-signatures
  load(c: IConfig): Promise<any>;
  async load(urlorConfig: any) {
    this.loadPromise = this.innerLoad(urlorConfig);
    await this.loadPromise;
  }

  /**
   * 处理加载后的配置
   * @param config
   */
  async process(c: any) {
    return await processFn(c);
  }

  /**
   * 根据path获取对应配置
   * @param url
   */
  async getConfig(
    url: string
  ): Promise<IConfigPageItem | IConfigComponentItem | undefined> {
    if (this.loadPromise) {
      await this.loadPromise;
    }

    if (!this.config || !this.config.tracks) {
      return;
    }

    const c = this.config;
    const { path } = normalizePath(url);

    return c.tracks.find((t) => t.path === path);
  }

  /**
   * 判断是否已经注册过tracker
   */
  isSameTracker(ctx: any, route: string, hash: number, collector: Collector) {
    // 标志已经过tacker
    if (ctx[$TRACKER]) {
      // 配置相同
      if (ctx[$TRACKER] === hash) {
        return true;
      }
      collector.unregister(route);
    }
    ctx[$TRACKER] = hash;
    return false;
  }

  injectMethods(
    ctx: any,
    methods: IConfigMethod[],
    collector: Collector,
    route: any
  ) {
    for (const m of methods) {
      this.injectMethod(ctx, m, collector, route);
    }
  }

  injectMethod(ctx: any, m: IConfigMethod, collector: Collector, route: any) {
    const method = m.method;
    const oldMethod = ctx[method];

    collector.registerMethod(route, m);

    const fn = function (this: any, ...args: any[]) {
      if (typeof oldMethod === "function") {
        oldMethod.apply(this, args);
      }

      collector.invokeMethod(route, method, [this, ...args]);
    };

    ctx[method] = fn;
  }

  /**
   * 给页面或组件注入 监听曝光度事件
   */
  injectIntersectionObserver(
    ctx: any,
    exposure: IExposureItem[] = [],
    collector: Collector
  ) {
    if (exposure.length === 0) {
      return;
    }

    this.destoryObserver(ctx);

    // ctx[OBSERVE_QUEUE_DATA] = [];
    // @ts-ignore
    ctx[OBSERVE_KEY] = exposure
      .map((item) => {
        return this.createIntersectionObserver(ctx, item, (ob, e) => {
          const once = item.once ?? false;
          if (once) {
            ob.disconnect();
          }

          const { data, eventName } = item;
          const keys = Object.keys(data);
          const reportData: any = Object.create(null);
          for (const key of keys) {
            const valuePath = data[key];
            reportData[key] = collector.getData(valuePath, [e], ctx);
          }

          // ctx[OBSERVE_QUEUE_DATA].push(reportData);
          collector.notify({
            type: "EXPOSURE",
            eventName: eventName,
            data: reportData,
          });
        });
      })
      .filter((ob) => ob);
  }

  private createIntersectionObserver(
    ctx: JComponent,
    e: IExposureItem,
    notify: (ob: wxNS.IntersectionObserver, e?: Record<string, any>) => void
  ) {
    const { className } = e;
    const ratio = Math.min(1, Math.max(0, e.ratio ?? 0.5));
    if (ratio === 0) return;
    const maxIntersection = e.maxIntersection ?? 100;
    const stay = e.stay ?? 1000;
    const ob = ctx.createIntersectionObserver({
      thresholds: [0, ratio, 1],
      observeAll: true,
    });

    const elementsLenPromise = new Promise<number>((resolve) =>
      ctx
        .createSelectorQuery()
        .selectAll(className)
        .boundingClientRect((rects: any) => resolve(rects.length))
        .exec()
    );

    const hasManyDomPromise = elementsLenPromise.then((len) => len > 1);

    const cache = new Map<string, ICacheData>();

    const getOrSet = (key: string, set: () => ICacheData) =>
      cache.has(key) ? cache.get(key) : set();

    ob.relativeToViewport().observe(className, async (res) => {
      if (!res) return;
      const hasManyDom = await hasManyDomPromise;
      const { boundingClientRect, intersectionRect } = res;
      const id: string = this.getHashId(res, hasManyDom);
      if (!id) {
        console.warn(
          "[曝光配置]",
          `当前选择器 [${className}] 查询到多个匹配元素，需要为每个元素设置id 或者 dataset`
        );
        return;
      }

      const result = getOrSet(id, () => {
        const minHeight = Math.min(
          maxIntersection,
          boundingClientRect.height * ratio
        );
        const minWidth = Math.min(
          maxIntersection,
          boundingClientRect.width * ratio
        );
        return {
          minHeight,
          minWidth,
          timeout: -1,
        };
      });
      if (!result) return;
      const { minWidth, minHeight } = result;

      if (
        res.intersectionRatio > 0 &&
        (intersectionRect.height >= minHeight ||
          intersectionRect.width >= minWidth)
      ) {
        if (result.inView) {
          return;
        }
        // 满足计算等待时间
        const timeout = setTimeout(() => {
          notify(ob, res);
        }, stay);
        result.timeout = timeout;
        result.inView = true;
      } else {
        clearTimeout(result.timeout);
        result.inView = false;
      }
      cache.set(id, result);
    });
    return ob;
  }

  /**
   * 根据 Observe 回调计算出 hashId
   */
  private getHashId(res: any, hasManyDom: boolean): string {
    if (!hasManyDom) {
      return "id";
    }

    if (res.id) {
      return res.id;
    }

    if (res.dataset && Object.keys(res.dataset).length) {
      return `${hasCode(JSON.stringify(res.dataset))}`;
    }

    return "";
  }

  /**
   * 获取页面collect
   * @param {Boolean} force
   */
  async getPageCollect(ctx: any, force = false) {
    const route = ctx.route || ctx.__route__;
    const c = await this.getConfig(route);
    if (!c) {
      return;
    }

    const result = registerCollect(c);
    const { hash, collector } = result;
    if (!force && this.isSameTracker(ctx, route, hash, collector)) {
      return;
    }
    return { collector, route, config: c };
  }

  /**
   * 给当前页面实例注入tracker
   * @param ctx
   * @param route
   */
  async injectPage(ctx: any) {
    const result = await this.getPageCollect(ctx);
    if (!result) return;

    const { collector, route, config } = result;

    this.injectMethods(ctx, config.methods || [], collector, route);
  }

  async getComponentCollector(ctx: any, force = false) {
    const instance = getCurrentPage() as any;
    if (!instance) {
      return;
    }

    const route: string = instance.route || instance.__route__;
    const is = ctx.is;

    let c = await this.getConfig(route);

    // 优先使用page中component的配置
    if (c && Array.isArray((c as IConfigPageItem).components)) {
      const { hash, collector } = registerCollect(c);
      if (!force && this.isSameTracker(ctx, route, hash, collector)) {
        return;
      }
      return { config: c, route, is, collector, isPageComponent: true };
    } else {
      c = await this.getConfig(is);

      if (!c) {
        return;
      }

      const { hash, collector } = registerCollect(c);
      if (!force && this.isSameTracker(ctx, route, hash, collector)) {
        return;
      }
      return { config: c, route, is, collector, isPageComponent: false };
    }
  }
  /**
   * 给当前组件实例注入tracker
   * @param ctx
   */
  async injectComponent(ctx: any) {
    const result = await this.getComponentCollector(ctx);
    if (!result) return;
    const { config, route, is, collector } = result;
    if (result.isPageComponent) {
      const components = (config as IConfigPageItem).components || [];
      for (const component of components) {
        if (component.path === is) {
          (component.methods || []).forEach((m) => {
            const path = `${route}#${is}`;
            this.injectMethod(ctx, m, collector, path);
          });
        }
      }
    } else {
      this.injectMethods(ctx, config.methods || [], collector, is);
    }
  }

  /**
   * 为当前页面、组件实例注册observer
   * @param {Boolean} isPage ctx否是页面
   */
  async registerIntersectionObserver(ctx: any, isPage = true) {
    if (isPage) {
      const result = await this.getPageCollect(ctx, true);
      if (!result) return;

      const { collector, config } = result;
      this.injectIntersectionObserver(ctx, config.exposure, collector);
      this.waitForRequest(ctx, config);
    } else {
      const result = await this.getComponentCollector(ctx, true);
      if (!result) return;
      const { collector, config } = result;

      this.injectIntersectionObserver(ctx, config.exposure, collector);
      this.waitForRequest(ctx, config);
    }
  }

  async notifyRequest(url: string) {
    if (this.ctxMap.size === 0) return;
    await sleep(100);
    for (const [ctx, requestUrl] of this.ctxMap) {
      const isMatch = await requestUrl.some((rurl) => matchUrl(url, rurl));
      if (isMatch) {
        ctx?.$registerObserver();
      }
    }
  }

  private waitForRequest(ctx: any, config?: IConfigComponentItem) {
    if (!config?.exposure) return;
    const requestUrl = config.exposure
      .filter((item) => item.requestUrl)
      .map((item) => item.requestUrl || "");
    if (requestUrl.length) {
      this.ctxMap.set(ctx, requestUrl);
    }
  }

  /**
   * 销毁一些注入数据
   */
  destory(ctx: any) {
    this.destoryObserver(ctx);
    this.destoryNotify(ctx);
  }

  private destoryObserver(ctx: any) {
    const intersectionObserver = ctx[
      OBSERVE_KEY
    ] as wxNS.IntersectionObserver[];
    ctx[OBSERVE_KEY] = null;
    // 清空Observer
    if (intersectionObserver) {
      let len = intersectionObserver.length;
      while (len) {
        intersectionObserver[len - 1]?.disconnect();
        --len;
      }
      intersectionObserver.length = 0;
    }
  }

  private destoryNotify(ctx: any) {
    this.ctxMap.delete(ctx);
  }
}

/**
 * 添加处理请求到config数据的方法
 * @returns IConfig
 * @example
 * addProcessConfigFn(config => config)
 */
export function addProcessConfigFn(fn: IProcessFn) {
  processFn = fn;
}

export const config = new TrackerConfig();
