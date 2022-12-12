const fs = require('fs')
const path = require('path');

const webpack = require('webpack')

const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const ignoreWarningPlugin = require('./ignoreWarningPlugin')
const myBricksAlias = require('../../nocode-engine/for-topl/scripts/mybricks-designer-alias')

const WebpackBar = require('webpackbar');
const HtmlWebpackPlugin = require("html-webpack-plugin");

const ENVType = process.env._ENV_
const NODE_ENV = process.env.NODE_ENV;

const outputPath = path.resolve(__dirname, `../_nodejs/_assets`)

module.exports = {
  mode: 'development',//设置mode
  entry: {
    index: path.resolve(__dirname, `../src-fe/home/index.tsx`),
    workspace: path.resolve(__dirname, `../src-fe/workspace/index.tsx`),
    'app-pc-page': path.resolve(__dirname, `../src-fe/app-pc-page/index.tsx`),
    'app-timer-service': path.resolve(__dirname, `../src-fe/app-timer-service/index.tsx`),
    preview: path.resolve(__dirname, `../src-fe/preview.tsx`),
  },
  output: {
    path: outputPath,
    filename: './js/[name].js',
    // publicPath: './',
    libraryTarget: 'umd',
    library: '[name]'
  },
  resolve: {
    alias: Object.assign({
        // 'react': require('path').resolve(__dirname, '../../node_modules/react'),
        // 'react-dom': require('path').resolve(__dirname, '../../node_modules/react-dom'),
      },
      myBricksAlias,
      // {
      //   '@mybricks/rxui': path.resolve(__dirname, '../../../../mybricks/rxui/index.js'),
      // }
    ),
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
  externals: [{
    //'lodash': {commonjs: "lodash", commonjs2: "lodash", amd: "lodash", root: "_"},
    'react': {
      commonjs: "react",
      commonjs2: "react",
      amd: "react",
      root: "React"
    },
    'react-dom': {
      commonjs: "react-dom",
      commonjs2: "react-dom",
      amd: "react-dom",
      root: "ReactDOM"
    },
    //'babel-standalone': 'babel-standalone',
    moment: 'moment',
  }],
  devtool: 'cheap-source-map',//devtool: 'cheap-source-map',
  // resolve: {
  //     alias: {
  //         '@es/spa-designer': require('path').resolve(__dirname, '../'),
  //     }
  // },
  devServer: {
    static: {
      directory: outputPath,
    },
    port: 8000,
    host: '0.0.0.0',
    // compress: true,
    // hot: true,
    client: {
      logging: 'warn',
      // overlay: true,
      // progress: true,
    },
    // open:true,
    proxy: []
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        //include: [pathSrc, testSrc],
        use: [
          // {
          //   loader: './config/test-loader'
          // },
          {
            loader: 'ts-loader',
            options: {
              silent: true,
              transpileOnly: true,
              compilerOptions: {
                module: 'es6',
                target: 'es6'
              }
            }
          }
        ]
      },
      {
        test: /\.css$/,
        // exclude: /node_modules/,
        use: ['style-loader', 'css-loader']
      },
      // {
      //   test: /\.nmd(?=\.less)$/gi,
      //   use: ['style-loader', 'css-loader', 'less-loader']
      // },
      {
        test: /\.lazy.less$/i,
        use: [
          {
            loader: 'style-loader',
            options: {
              injectType: "lazyStyleTag",
              insert: function insertIntoTarget(element, options) {
                (options.target || document.head).appendChild(element)
              },
            },
          },
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[local]-[hash:5]'
              }
            }
          },
          {
            loader: 'less-loader',
            options: {
              lessOptions: {
                javascriptEnabled: true,
              }
            }
          }
        ]
      },
      {
        test: /^[^\.]+\.less$/i,
        use: [
          {
            loader: 'style-loader',
            options: {injectType: "singletonStyleTag"},
          },
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[local]-[hash:5]'
              }
            }
          },
          {
            loader: 'less-loader',
            options: {
              lessOptions: {
                javascriptEnabled: true,
              }
            },
          }
        ]
      },
      {
        test: /\.(gif|png|jpe?g|svg)$/i,
        use: [
          {
            loader: 'url-loader',
            options: {
              // 100Kb
              limit: 1024 * 100,
              name: 'img_[name]_[contenthash:4].[ext]'
            }
          }
        ]
      },
      {
        test: /\.d.ts$/i,
        use: [
          {loader: 'raw-loader'}
        ]
      },
      {
        test: /\.(xml|txt|html|cjs|theme)$/i,
        use: [
          {loader: 'raw-loader'}
        ]
      }
    ]
  },
  optimization: {
    concatenateModules: false//name_name
  },
  plugins: [
    new WebpackBar(),
    new ignoreWarningPlugin(),   // All warnings will be ignored
    new webpack.DefinePlugin({
      ENV: NODE_ENV === "production" ? JSON.stringify("") : JSON.stringify("DEV")
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, `../src-fe/templates/app-timer-service.html`),
      filename: "app-timer-service.html",
      chunks: ['app-timer-service'],
      hot: true,
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, `../src-fe/templates/app-pc-page.html`),
      filename: "app-pc-page.html",
      chunks: ['app-pc-page'],
      hot: true,
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, `../src-fe/templates/docs.html`),
      filename: "docs.html",
      chunks: ['docs'],
      hot: true,
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, `../src-fe/templates/index.html`),
      filename: "index.html",
      chunks: ['index'],
      hot: true,
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, `../src-fe/templates/preview.html`),
      filename: "preview.html",
      chunks: ['preview'],
      hot: true,
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, `../src-fe/templates/workspace.html`),
      filename: "workspace.html",
      chunks: ['workspace'],
      hot: true,
    }),
    //new VueLoaderPlugin(),
    //new BundleAnalyzerPlugin()
    // new FriendlyErrorsWebpackPlugin({
    //   compilationSuccessInfo: {
    //     messages: [`Stark is running,open : http://${getIPAdress()}:${globalConfg.port}`]
    //   },
    //   clearConsole: true,
    // }),
    //new BundleAnalyzerPlugin(),//包大小分析
  ]

}