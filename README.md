# jgb-tracker

小程序自动化埋点（无埋点）解决方案，通过配置来替代手动埋点。

## 特性

- 支持本地文件或远程文件配置
- 支持组件及页面方法配置
- 内置通用数据 `$APP`、 `$DATA`、`$DATASET`、 `$EVENT`、 `$OPTIONS`等
- 支持自定义数据
- 支持数据表达式
- 支持条件筛选
- 支持曝光度

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

```js
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
      // 曝光度配置
      exposure: [
        {
          // 需要监听的元素class, 其他参数和method保持一致
          className: ".exposure-view",
          // 采集上报的事件名
          eventName: "exposure-xxx",        
          // 需要采集的数据
          data: {
            value: `$DATA.value`,
            idx: `$EVENT.dataset.idx`
          },
        },
      ],
      // 需要采集的方法
      methods: [
        {
          // 页面中事件名称
          method: 'onTap',
          // 采集上报的事件名
          eventName: 'tapxxx',
          // 支持条件表达式，只有当 Boolean(返回值) 为true时才会触发埋点
          condition: '$DATA.clickTime > 2',
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



### 曝光度

`v1.2.0`起支持

使用 `createIntersectionObserver` 作为元素记录曝光度的技术方案。

#### 参数

* className

元素选择器

* eventName

上报事件名称

* data

配置上报数据

* requestUrl (v1.2.1起)

由于大部分场景都是请求接口数据，再监听节点`createIntersectionObserver` 。所以提供这个配置，当请求的成功时，请求的`url`会和 `requestUrl`匹配, 如果匹配则重新监听节点。例：

> requestUrl: /api/v1
>
> url: https://xxxx/api/v1/xxx

#### 定义

如何定义曝光度？

目前使用方案：

* 监听元素与可视区域的相交比> `0.5` 或者 满足相交区域的宽高大于`100px`
* 符合上述条件，且停留时长 `1s` 就算曝光一次

#### 注意

当异步渲染数据时，我们需要补偿查询（因为仅在页面组件初次渲染时调用 `createIntersectionObserver` 查询节点, 此时是没有节点!!!）, 所以需要在适当的时候使用 `this.$registerObserver` 补偿查询。

> 目前没有找到比较好的方案，去监听节点变更，作补偿查询。

```ts
import { JComponent , jgb } from 'jgb-weapp'

JComponent({
  method: {
    getData() {
      jgb.request({
        url: `xxxx`
      }).then(res => {
        // setData
        this.$registerObserver()
      })
    }
  }
})
```



### 表达式

通常我们只需要配置预设值即可拿到所需数据，但一些其他情况我们需要支持表达式。

* 字符串

```js
 {
  test: "'我是测试'"
 }
```

* 算数运算符( + , - , * , / ）

```js
{
  test: '$DATASET.item.index + 1'
}
```

* 三目运算

```js
{
  test: '$DATASET.item.index > 0 ? $DATASET.item.value : $DATASET.item.key'
}
```

* 关系运算符（ > ，< ，== ，!= ，>= ，<= ）

* 逻辑运算符 ( ! , && , || )

* 系统方法 （Number, String ….）
