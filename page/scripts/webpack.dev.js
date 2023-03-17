const fs = require('fs')
const path = require('path');

const webpack = require('webpack')

const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const ignoreWarningPlugin = require('./ignoreWarningPlugin')
// const myBricksAlias = require('../../nocode-engine/for-spa/scripts/mybricks-designer-alias')

const WebpackBar = require('webpackbar');
const HtmlWebpackPlugin = require("html-webpack-plugin");

const ENVType = process.env._ENV_
const NODE_ENV = process.env.NODE_ENV;

const outputPath = path.resolve(__dirname, `../_nodejs/_assets`)

module.exports = {
  mode: 'development',//设置mode
  entry: {
    workspace: path.resolve(__dirname, `../src/index.tsx`),
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
      //myBricksAlias,
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
    allowedHosts: "all",
    // compress: true,
    // hot: true,
    client: {
      logging: 'warn',
      // overlay: true,
      // progress: true,
    },
    bonjour: {
      type: 'http',
    },
    // open:true,
    proxy: [
      {
        context: ['/runtime'],
        target: 'http://localhost:3101',
        secure: false,
        changeOrigin: true,
      },
      {
        // context: ['*'],
        context: ['/'],
        target: 'http://localhost:3100',
        secure: false,
        changeOrigin: true,
      },
    ]
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
            options: { injectType: "singletonStyleTag" },
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
          { loader: 'raw-loader' }
        ]
      },
      {
        test: /\.(xml|txt|html|cjs|theme)$/i,
        use: [
          { loader: 'raw-loader' }
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
    // new webpack.DefinePlugin({
    //   ENV: NODE_ENV === "production" ? JSON.stringify("") : JSON.stringify("DEV")
    // }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, `../templates/workspace.html`),
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