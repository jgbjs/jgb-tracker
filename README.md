# jgb-tracker

小程序自动化埋点（无埋点）解决方案，通过配置来替代手动埋点。

## 特性

- 支持本地文件或远程文件配置
- 支持组件及页面方法配置
- 内置通用数据 `$APP`、 `$DATA`、`$DATASET`、 `$EVENT`、 `$OPTIONS`等
- 支持自定义数据

### 内置通用数据定义

| 名称        | 描述                      |      |
| ----------- | ------------------------- | ---- |
| \$APP       | getApp()的数据            |      |
| \$DATASET   | 事件的 *dataset*          |      |
| \$EVENT     | 事件的 *event*            |      |
| \$OPTIONS   | 当前页面的 *options*      |      |
| $DATA       | 当前页面或者组件的 *data* |      |
| $APPOPTIONS | App.onLaunch的options     |      |

## 安装

```sh
npm i --save @jgbjs/tracker # yarn add @jgbjs/tracker
```

## 使用

```js
// app.js
import Tracker, { safeGet } from '@jgbjs/tracker';

// 初始化
Tracker.init({
  configUrl: 'https://xxx'
});

// 触发埋点事件 回调通知
Tracker.addNotify(data => {
  console.log(data);
});

// 追加自定义数据匹配
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
```

### Tracker 数据结构

```js
const json = {
  tracks: [
    {
      // 页面路径
      path: 'pages/xx/xx',
      // 需要采集的方法
      methods: [
        {
          // 页面中事件名称
          method: 'onTap',
          // 采集上报的事件名
          eventName: 'tapxxx',
          // 需要采集的数据
          data: {
            dataname: '$EVENT.type'
          }
        }
      ],
      // 组件(组件中的组件也在这里配置)，数据结构与页面一致
      components: [
        {
          // 组件路径
          path: 'components/xx/xx',
          // 需要采集的方法
          methods: [
            {
              // 组件中事件名称
              method: 'onTap',
              // 采集上报的事件名
              eventName: 'tapxxx',
              // 需要采集的数据
              data: {
                dataname: '$EVENT.type'
              }
            }
          ]
        }
      ]
    },
    // 当然我们也可以全局配置某个组件的埋点，（不支持配置组件中套组件）
    {
      path: 'components/inner/index',
      methods: [
        {
          eventName: 'onTap2',
          data: {
            inner: 'inner'
          },
          method: 'onTap'
        }
      ]
    }
  ]
};
```
