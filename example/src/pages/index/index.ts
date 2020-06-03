import { jgb, JPage } from "jgb-weapp";
JPage({
  data: {
    value: 0,
    arr: [],
  },
  onLoad() {
    this.loadData();
  },
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
  onReachBottom() {
    this.loadData();
  },
  loadData() {
    jgb.request({
      url: `https://img1.tuhu.org/mp/FrMoqrcm9LEASKORGzsMwb8UGEKp.json`,
      success: () => {
        const len = this.data.arr.length;
        const data = Array(10)
          .fill(0)
          .map((v, idx) => ({
            idx: idx + len,
            height: ~~(Math.random() * (300 + v) + 100),
          }));
        this.setData({
          arr: [...this.data.arr, ...data],
        });
      },
    });
  },
});
