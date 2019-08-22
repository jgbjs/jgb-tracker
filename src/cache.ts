import { jgb } from 'jgb-weapp';

export class CacheManage {
  cacheKey = 'jgb-tracker-config';

  setCache(data: any) {
    jgb.setStorage({
      data,
      key: this.cacheKey
    });
  }

  getCache() {
    return jgb.getStorage({
      key: this.cacheKey
    }).catch();
  }
}

export const cacheManage = new CacheManage();
