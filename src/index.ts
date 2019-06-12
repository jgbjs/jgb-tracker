import { JApp, JComponent, JPage } from 'jgb-weapp';
import { addGetDataProcessor, addNotify, privateAppOptions, privateOptions } from './collect';
import { addProcessConfigFn, config, IConfig } from './config';
import { safeGet } from './utils';

export default {
  /**
   * init tracker
   * @param opts.configUrl 请求埋点配置路径
   * @param opts.localConfig 本地配置
   */
  init(opts: { configUrl?: string; localConfig?: IConfig }) {
    if (opts.configUrl) {
      config.load(opts.configUrl);
    } else if (opts.localConfig) {
      config.load(opts.localConfig);
    } else {
      return this;
    }

    // 标志是否已经初始化
    const $FLAG: string = Symbol('flag') as any;

    JApp.mixin({
      onLaunch(options: any) {
        this[privateAppOptions] = options;
      }
    });

    JPage.mixin({
      onLoad(options: any) {
        this[$FLAG] = true;
        this[privateOptions] = options;
        config.injectPage(this);
      },
      onShow() {
        if (!this[$FLAG]) {
          return;
        }
        config.injectPage(this);
      }
    });

    JComponent.mixin({
      attached() {
        this[$FLAG] = true;
        config.injectComponent(this);
      },
      pageLifetimes: {
        show(this: any) {
          if (!this[$FLAG]) {
            return;
          }
          config.injectComponent(this);
        }
      }
    });

    return this;
  },

  addGetDataProcessor,
  addNotify,
  addProcessConfigFn
};

export { safeGet };

