import throttle from 'lodash/throttle';
import { IConfigComponentItem, IConfigMethod, IConfigPageItem } from './config';
import { getCurrentPage, hasCode, safeGet } from './utils';

// tslint:disable-next-line: ban-types
export type IMapFunction = Map<string, Function>;

export interface ICollectData {
  eventName: string;
  data: any;
  [key: string]: any;
}

export type INotify = (collect: ICollectData) => any;

/** 私有page options，仅供jgb-tracker使用  */
export const privateOptions: string = Symbol('options') as any;
/** 私有app options，仅供jgb-tracker使用  */
export const privateAppOptions: string = Symbol('appOptions') as any;
/**
 * 处理 getData
 */
export type IDataProcessor = (
  /**
   * 获取数据的路径
   * @example '$APP.data'
   */
  path: string,
  /**
   * 事件method的参数
   */
  args: any[],
  /**
   * 当前作用域
   * @example App、Page、Component
   */
  ctx: any
) => [boolean, any] | undefined;

const getDataProcessors = [] as IDataProcessor[];
const notifyPool = [] as INotify[];

export class Collector {
  private collect = new Map<string, IMapFunction>();
  /** tracker触发频率 */
  static MS = 50;
  getData = getData;

  /**
   * 取消注册
   */
  unregister(path: string) {
    this.collect.delete(path);
  }

  registerMethodWithMap(map: IMapFunction, m: IConfigMethod) {
    const { method, data, eventName } = m;
    if (map.has(method)) {
      return;
    }
    const fn = throttle(
      (ctx: any, ...args: any[]) => {
        const reportData: any = Object.create(null);
        const keys = Object.keys(data);
        for (const key of keys) {
          const valuePath = data[key];
          reportData[key] = this.getData(valuePath, args, ctx);
        }

        const collectData = {
          ...m,
          data: reportData
        };
        this.notify(collectData);
      },
      Collector.MS,
      {
        trailing: false
      }
    );
    // 默认 50ms 触发一次
    map.set(method, fn);
  }
  /**
   * 注册方法
   * @param path
   * @param method
   * @param data
   */
  registerMethod(path: string, m: IConfigMethod) {
    let map = this.collect.get(path);
    if (!map) {
      map = new Map();
      this.collect.set(path, map);
    }
    this.registerMethodWithMap(map, m);
  }

  /**
   * 获取注册的方法
   * @param path
   * @param method
   */
  getMethod(path: string, method: string) {
    const map = this.collect.get(path);

    if (!map) {
      return;
    }
    return map.get(method);
  }

  /**
   * 触发方法
   * @param path
   * @param method
   * @param args
   */
  invokeMethod(path: string, method: string, args: any[]) {
    const fn = this.getMethod(path, method);
    if (!fn) {
      return;
    }
    // console.log('fn', fn);
    fn.apply(null, args);
  }

  notify(collectData: ICollectData) {
    for (const notify of notifyPool) {
      notify(collectData);
    }
  }
}

export const collector = new Collector();

/**
 * 增加处理获取数据的处理方法
 * 返回直接处理过的result
 * @param fn
 * @example
 * // 我们要获取登录信息， 预设标识$USER.xxx
 * addGetDataProcessor((path) => {
 *  if(path.startsWith('$USER.')){
 *    return [true, _.get({$USER:getUserInfo()},path)]
 *  }
 * })
 */
export function addGetDataProcessor(fn: IDataProcessor) {
  getDataProcessors.push(fn);
}

/**
 * 增加触发事件通知
 * @example
 * addNotify((data) => {
 *   sendEvent(data)
 * })
 */
export function addNotify(n: INotify) {
  notifyPool.push(n);
}

export function registerCollect(
  config: IConfigPageItem | IConfigComponentItem
) {
  const hash = hasCode(JSON.stringify(config));
  return { hash, collector };
}
/**
 * 获取对应的数据
 *  $APP.a => getApp().a
 *  $DATASET.b => e.currentTarget.dataset.b
 *  c => this.data.c
 * @param args 方法的参数
 * @param ctx page or component 实例
 * @param path 获取数据路径
 */
export function getData(path: string, args: any[], ctx: any) {
  // 优先处理注册的 数据的处理方法
  for (const fn of getDataProcessors) {
    const ret = fn(path, args, ctx);
    if (!ret) {
      continue;
    }
    const [isSuccess, result] = ret;
    if (isSuccess) {
      return result;
    }
  }
  const event = args[0];

  // 获取app实例的数据
  if (path.startsWith('$APP.')) {
    return safeGet(
      {
        $APP: getApp()
      },
      path
    );
  }
  // 获取wxml中data-*系列属性的值
  if (path.startsWith('$DATASET.')) {
    const dataset = safeGet(event, 'currentTarget.dataset');
    if (!dataset) {
      return;
    }
    return safeGet(
      {
        $DATASET: dataset
      },
      path
    );
  }
  // 事件
  if (path.startsWith('$EVENT.')) {
    return safeGet(
      {
        $EVENT: event
      },
      path
    );
  }

  // page options
  if (path.startsWith('$OPTIONS.')) {
    const curPage = getCurrentPage() as any;
    return safeGet(
      {
        $OPTIONS: ctx[privateOptions]
          ? ctx[privateOptions]
          : curPage
          ? curPage[privateOptions]
          : {}
      },
      path
    );
  }

  if (path.startsWith('$APPOPTIONS.')) {
    const app = getApp() as any;
    return safeGet(
      {
        $APPOPTIONS: app[privateAppOptions]
      },
      path
    );
  }
  // 获取data上数据
  return safeGet(ctx.data, path);
}
