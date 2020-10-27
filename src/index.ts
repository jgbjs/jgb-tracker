import { JApp, JComponent, JPage, jgb } from "jgb-weapp";
import {
  addGlobalContext,
  addNotify,
  privateAppOptions,
  privateOptions,
} from "./collect";
import { addProcessConfigFn, config, IConfig } from "./config";
import { safeGet } from "./utils";

// 标志是否已经加载config
let HAS_LOAD_CONFIG = false;
// 未加载config之前已经attached的component
const components = new Set();

function init() {
  jgb.intercept("request", "success", (_, __, opts) => {
    const url: string = opts.url;
    config.notifyRequest(url);
  });

  JApp.mixin({
    onLaunch(options: any) {
      this[privateAppOptions] = options;
    },
  });

  JPage.mixin({
    onLoad(options: any) {
      this[privateOptions] = options;
      config.injectPage(this);
    },
    onReady() {
      this.$registerObserver();
    },
    onUnload() {
      config.destory(this);
    },
    async $registerObserver() {
      config.registerIntersectionObserver(this);
    },
  });

  JComponent.mixin({
    attached: function () {
      if (!HAS_LOAD_CONFIG) {
        components.add(this);
      }
      config.injectComponent(this);
    },
    ready: function () {
      this.$registerObserver();
    },
    detached: function () {
      if (!HAS_LOAD_CONFIG) {
        components.delete(this);
      }
      config.destory(this);
    },
    methods: {
      $registerObserver: function () {
        return config.registerIntersectionObserver(this, false);
      },
    },
  });
}

init();

export default {
  /** 加载配置  */
  loadConfig(opts: { configUrl?: string; localConfig?: IConfig }) {
    return config.load((opts.configUrl || opts.localConfig) as any);
  },
  /**
   * init tracker
   * @param opts.configUrl 请求埋点配置路径
   * @param opts.localConfig 本地配置
   */
  init(opts: { configUrl?: string; localConfig?: IConfig }) {
    const configLoadPromise = this.loadConfig(opts);

    // 补全缺失的埋点
    configLoadPromise.then(() => {
      HAS_LOAD_CONFIG = true;
      const pages = getCurrentPages();
      if (pages.length === 0) {
        return;
      }
      pages.forEach((page) => {
        config.injectPage(page);
        config.registerIntersectionObserver(page);
      });

      components.forEach((component) => {
        config.injectComponent(component);
        config.registerIntersectionObserver(component, false);
      });
    });

    return this;
  },
  addGlobalContext,
  addNotify,
  addProcessConfigFn,
};

export { safeGet };
