# jgb-tracker

小程序自动化埋点（无埋点）解决方案，通过配置来替代手动埋点。

## 特性

- 支持本地文件或远程文件配置
- 支持组件及页面方法配置
- 内置通用数据 `$APP`、 `$DATA`、`$DATASET`、 `$EVENT`、 `$OPTIONS`等
- 支持自定义数据
- 支持数据表达式

### 内置通用数据定义

| 名称        | 描述                                   |      |
| ----------- | -------------------------------------- | ---- |
| \$APP       | getApp()的数据                         |      |
| \$DATASET   | 事件的 *dataset*                       |      |
| \$EVENT     | 事件的 *event*，即method的arguments[0] |      |
| \$OPTIONS   | 当前页面的 *options*                   |      |
| $DATA       | 当前页面或者组件的 *data*              |      |
| $APPOPTIONS | App.onLaunch的options                  |      |
| $ARGS       | method的arguments                      |      |



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
```

### 方法

#### init

初始化

* 加载远程配置

```ts
Tracker.init({
  configUrl: 'https://xxx'
});
```

* 加载本地配置

```ts
Tracker.init({
  localConfig: {
    path: 'pages/xx/xx',
    methods: [{
       // 页面中事件名称
       method: 'onTap',
       // 采集上报的事件名
       eventName: 'tapxxx',
       // 需要采集的数据
       data: {
         dataname: '$EVENT.type'
       }
    }]
  }
})
```

#### addNotify

回调通知

```ts
Tracker.addNotify(data => {
  console.log(data);
});
```

* 返回数据

返回的数据就是`methods`中的数据，其中`data`为采集到的数据

```json
{
  method,
  eventName,
  data
}
```

#### addGlobalContext

增加全局预设值(数据定义)

```ts
Tracker.addGlobalContext(() => {
  return {
    '$User':{
      id: 'xxxx'
    }
  }
})
```

#### addProcessConfigFn

添加返回数据处理，默认不处理。有些情况下数据结构需要做处理，符合配置需要的[数据结构](#数据结构)

```ts
Tracker.addProcessConfigFn((config) => {
  // do something then return config
  return config
})
```



### 数据结构

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

### 表达式

通常我们只需要配置预设值即可拿到所需数据，但一些其他情况我们需要支持表达式。

* 字符串

  ```json
  {
  	test: "'我是测试'"
  }
  ```

  

* 算数运算符( + , - , * , / ）

```json
{
  test: '$DATASET.item.index + 1'
}
```

* 三目运算

```json
{
  test: '$DATASET.item.index > 0 ? $DATASET.item.value : $DATASET.item.key'
}
```

* 关系运算符（ > ，< ，== ，!= ，>= ，<= ）

* 逻辑运算符 ( ! , && , || )

* 系统方法 （Number, String ….）