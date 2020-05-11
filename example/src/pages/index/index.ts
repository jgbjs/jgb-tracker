import { jgb, JPage } from "jgb-weapp";
JPage({
  data: {
    value: 0,
    arr: Array(10)
      .fill(0)
      .map((v, idx) => ({
        idx,
        height: ~~(Math.random() * (300 + v) + 100),
      })),
  },
  onLoad() {},
  onGetEvent(e: EventTarget) {},
  onGetDataset() {},
  onGetApp() {},
  onGetUser() {},
  onClickAdd() {
    this.setData({
      value: this.data.value + 1,
    });
  },
  onToIndex() {
    jgb.navigateTo({
      url: "/pages/index/index?id=2",
    });
  },
});
