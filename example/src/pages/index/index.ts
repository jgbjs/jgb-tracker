import { jgb, JPage } from 'jgb-weapp';
JPage({
  onLoad() {},
  onGetEvent(e: EventTarget) {},
  onGetDataset() {},
  onGetApp() {},
  onGetUser() {},
  onToIndex() {
    jgb.navigateTo({
      url: '/pages/index/index?id=2'
    });
  }
});
