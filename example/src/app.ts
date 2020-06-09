import Tracker, { safeGet } from "@jgbjs/tracker/index";
import { JApp } from "jgb-weapp";
import { IConfig } from "@jgbjs/tracker/config";

// @ts-ignore
wx.Tracker = Tracker;

const localConfig: IConfig = {
  tracks: [
    {
      path: "pages/index/index",
      exposure: [
        {
          eventName: "exposure-test",
          className: ".ex-view",
          requestUrl: `FrMoqrcm9LEASKORGzsMwb8UGEKp`,
          data: {
            value: `$DATA.value`,
            id: `$OPTIONS.id`,
            idx: `$EVENT.dataset.idx`,
          },
        },
      ],
      methods: [
        {
          eventName: "tap-menu",
          method: "onTabItemTap",
          data: {
            idx: "$EVENT.index",
            path: "$EVENT.pagePath",
          },
        },
      ],
    },
    {
      path: "pages/logs/index",
      methods: [
        {
          eventName: "tap-menu",
          method: "onTabItemTap",
          data: {
            idx: "$EVENT.index",
            path: "$EVENT.pagePath",
          },
        },
      ],
    },
  ],
};

Tracker.init({
  localConfig: localConfig,
  // configUrl: "https://img1.tuhu.org/mp/FrMoqrcm9LEASKORGzsMwb8UGEKp.json",
});
Tracker.addNotify((data) => {
  console.log("addNotify", data);
});

Tracker.addGlobalContext(() => ({
  $USER: {
    userId: "xxxx.xxxx",
  },
}));

JApp({
  global: {
    data: "test",
  },
  onLaunch() {},
});
