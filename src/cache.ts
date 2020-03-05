import { jgb } from 'jgb-weapp';
import { IConfig } from './config';

export class CacheManage {
  cacheKey = 'jgb-tracker-config';

  setCache(data: IConfig) {
    jgb.setStorage({
      data,
      key: this.cacheKey
    });
  }

  getCache(): Promise<IConfig | undefined> {
    return jgb
      .getStorage({
        key: this.cacheKey
      })
      .then((res) => res.data)
      .catch(() => void 0);
  }
}

export const cacheManage = new CacheManage();
