# Fangzhou Paas Application Template

方舟APaaS应用开发模板

## 入门

```
目录:
pages: 前端所有界面
server：服务端代码
```

启动命令：
```
1. 安装依赖
npm i
2. 前端构建（watch）
npm run watch:fe
3. 启动后端服务
npm run start:dev
```
浏览器打开：
localhost:8080/index

## 高级
### 自定义页面：
在 `webpack.config.override.js` 中 `entry` 中 写上页面的那么以及对应的地址，例如：
```
entry: {
  home: `${path.join(baseFolder, 'pages/home/index.tsx')}`,
},
```
服务端渲染时：@Render 指明渲染模板名即可
```
@Get('/index')
@Render('home')
async home() {
  return {
    msg: '这是服务端传来的消息'
  }
}
```

### 给页面插入外部依赖
在 `webpack.config.override.js` 中 `injectStyle` 或 `injectScript`写明依赖即可
```
injectStyle: [
  '<link rel="stylesheet" type="text/css" href="https://f2.eckwai.com/kos/nlav12333/fangzhou/pkg/global.f5c35c8eb11b875f.css" />'
],
injectScript: [
  '<script src="//f2.eckwai.com/kos/nlav12333/fangzhou/pkg/reactcolor.aa20182e9d34e7ef.js"></script>'
],
```

### 覆盖webpack配置：
直接在 `webpack.config.override.js` 写明覆盖配置即可（覆盖工具为webpack-merge），例如：
```
externals: {
  axios: 'axios',
  dayjs: 'dayjs'
},
```

### 自定义模板
在 `webpack.config.override.js` 中 `template`即可（此时injectScript和injectCss会失效）

```
template: `
  <html lang="zh-CN" class="no-js">
    <head>
      <link rel="stylesheet" href="https://alifd.alicdn.com/npm/@alilc/lowcode-engine@latest/dist/css/engine-core.css" />
      <link rel="stylesheet" href="https://g.alicdn.com/code/lib/alifd__next/1.23.24/next.min.css">
      <link rel="stylesheet" href="https://alifd.alicdn.com/npm/@alifd/theme-lowcode-light/0.2.0/next.min.css">
      <link rel="stylesheet" href="https://alifd.alicdn.com/npm/@alilc/lowcode-engine-ext@latest/dist/css/engine-ext.css" />
      <script crossorigin="anonymous" src="//f2.eckwai.com/udata/pkg/eshop/fangzhou/pub/pkg/react@17.0.2/umd/react.production.min.js"></script>
      <script crossorigin="anonymous" src="//f2.eckwai.com/udata/pkg/eshop/fangzhou/pub/pkg/react-dom@17.0.2/umd/react-dom.production.min.js"></script>
      <script crossorigin="anonymous" src="https://g.alicdn.com/code/lib/prop-types/15.7.2/prop-types.js"></script>
      <script crossorigin="anonymous" src="https://g.alicdn.com/code/lib/moment.js/2.29.1/moment-with-locales.min.js"></script>
      <script crossorigin="anonymous" src="https://g.alicdn.com/code/lib/alifd__next/1.23.24/next.min.js"></script>
      <script crossorigin="anonymous" src="https://g.alicdn.com/platform/c/lodash/4.6.1/lodash.min.js"></script>
      <script crossorigin="anonymous" src="https://alifd.alicdn.com/npm/@alilc/lowcode-engine@latest/dist/js/engine-core.js"></script>
      <script crossorigin="anonymous" src="https://alifd.alicdn.com/npm/@alilc/lowcode-engine-ext@latest/dist/js/engine-ext.js"></script>
      <!-- CSS_MARKUP -->
    </head>
    <body>
      <!-- JS_MARKUP -->
    </body>
  </html>
`
```