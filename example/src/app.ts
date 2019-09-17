import Tracker, { safeGet } from '@jgbjs/tracker/index';
import { JApp } from 'jgb-weapp';

// @ts-ignore
wx.Tracker = Tracker;

Tracker.init({
  configUrl: 'https://img1.tuhu.org/mp/FjxM2UkrmkvTalL8v23j2CavUkwn.json'
  // localConfig: {
  //   tracks: [
  //     {
  //       path: 'pages/index/index',
  //       components: [
  //         {
  //           path: 'components/inner/index',
  //           methods: [
  //             {
  //               method: 'onTap',
  //               eventName: 'onTap',
  //               data: {
  //                 data: 'inner'
  //               }
  //             }
  //           ]
  //         }
  //       ],
  //       methods: [
  //         {
  //           method: 'onGetEvent',
  //           eventName: 'onGetEvent',
  //           data: {
  //             event: '$EVENT.detail'
  //           }
  //         },
  //         {
  //           eventName: 'onGetDataset',
  //           method: 'onGetDataset',
  //           data: {
  //             dataset: '$DATASET.test'
  //           }
  //         },
  //         {
  //           eventName: 'onGetApp',
  //           method: 'onGetApp',
  //           data: {
  //             global: '$APP.global.data'
  //           }
  //         },
  //         {
  //           eventName: 'onGetUser',
  //           method: 'onGetUser',
  //           data: {
  //             userId: '$USER.userId',
  //             detail: '$EVENT.detail'
  //           }
  //         }
  //       ]
  //     },
  //     {
  //       path: 'components/inner/index',
  //       methods: [
  //         {
  //           eventName: 'onTap2',
  //           data: {
  //             inner: 'inner'
  //           },
  //           method: 'onTap'
  //         }
  //       ]
  //     }
  //   ]
  // }
});
Tracker.addNotify(data => {
  console.log(data);
});

Tracker.addGlobalContext(() => ({
  $USER: {
    userId: 'xxxx.xxxx'
  }
}));

JApp({
  global: {
    data: 'test'
  },
  onLaunch() {}
});
