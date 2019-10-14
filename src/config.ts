import { jgb } from 'jgb-weapp';
import { cacheManage } from './cache';
import { Collector, registerCollect } from './collect';
import { getCurrentPage, normalizePath } from './utils';

type IProcessFn = (config: any) => IConfig | Promise<IConfig>;
const $TRACKER = Symbol('TRACKER');
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
}

export interface IConfig {
  /**
   * 需要跟踪的配置
   */
  tracks: Array<IConfigPageItem | IConfigComponentItem>;
}

export class TrackerConfig {
  private config?: IConfig;
  private loadPromise: Promise<any> | undefined;
  private async innerLoad(urlorConfig: any) {
    if (typeof urlorConfig === 'string') {
      const url = urlorConfig;
      const requestTask = async () => {
        const result = await jgb.request({
          url,
          // tslint:disable-next-line: object-literal-sort-keys
          priority: 0
        });

        const c = result.data;
        this.config = await this.process(c);
        cacheManage.setCache(this.config);
      };

      const localCacheTask = async () => {
        const cache = await cacheManage.getCache();
        if (cache && cache.data) {
          this.config = cache.data as IConfig;
        }
      };

      const rq = requestTask();
      await Promise.all([rq, localCacheTask()]);
    } else {
      this.config = urlorConfig;
    }
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
  async getConfig(url: string): Promise<IConfigPageItem | undefined> {
    if (this.loadPromise) {
      await this.loadPromise;
    }

    if (!this.config || !this.config.tracks) {
      return;
    }
    const c = this.config;
    const { path } = normalizePath(url);

    return c.tracks.find(t => t.path === path);
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

  injectMethods(ctx: any, methods: any[], collector: Collector, route: any) {
    for (const m of methods) {
      this.injectMethod(ctx, m, collector, route);
    }
  }

  injectMethod(ctx: any, m: IConfigMethod, collector: Collector, route: any) {
    const method = m.method;
    const oldMethod = ctx[method];

    collector.registerMethod(route, m);

    const fn = function(this: any, ...args: any[]) {
      if (typeof oldMethod === 'function') {
        oldMethod.apply(this, args);
      }

      collector.invokeMethod(route, method, [this, ...args]);
    };

    ctx[method] = fn;
  }

  /**
   * 给当前页面实例注入tracker
   * @param ctx
   * @param route
   */
  async injectPage(ctx: any) {
    const route = ctx.route || ctx.__route__;
    const c = await this.getConfig(route);
    if (!c) {
      return;
    }

    const { hash, collector } = registerCollect(c);
    if (this.isSameTracker(ctx, route, hash, collector)) {
      return;
    }

    this.injectMethods(ctx, c.methods || [], collector, route);
  }

  /**
   * 给当前组件实例注入tracker
   * @param ctx
   */
  async injectComponent(ctx: any) {
    const instance = getCurrentPage() as any;
    if (!instance) {
      return;
    }

    const route: string = instance.route || instance.__route__;
    const is = ctx.is;

    let c = await this.getConfig(route);

    // 优先使用page中component的配置
    if (c && Array.isArray(c.components)) {
      const { hash, collector } = registerCollect(c);
      if (this.isSameTracker(ctx, route, hash, collector)) {
        return;
      }

      for (const component of c.components) {
        if (component.path === is) {
          (component.methods || []).forEach(m => {
            const path = `${route}#${is}`;
            this.injectMethod(ctx, m, collector, path);
          });
        }
      }
    } else {
      c = await this.getConfig(is);

      if (!c) {
        return;
      }

      const path = is;
      const { hash, collector } = registerCollect(c as IConfigComponentItem);
      if (this.isSameTracker(ctx, route, hash, collector)) {
        return;
      }

      this.injectMethods(ctx, c.methods || [], collector, path);
    }
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
