import Tracker, { safeGet } from '@jgbjs/tracker/index';
import { JApp } from 'jgb-weapp';

Tracker.init({
  configUrl: 'https://img1.tuhu.org/mp/FgkkWNeIlgl1HXf8dlk2_6Bms-zA.json',
  // configUrl: 'https://img1.tuhu.org/mp/Ft0UUW95MeADNxe1AnmCUTSVOMY3.json'
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
Tracker.addGetDataProcessor((path, args, ctx) => {
  if (path.startsWith('$USER')) {
    return [
      true,
      safeGet(
        {
          userId: 'xxxx.xxxx'
        },
        path.replace('$USER.', '')
      )
    ];
  }
});

JApp({
  global: {
    data: 'test'
  },
  onLaunch() {}
});
