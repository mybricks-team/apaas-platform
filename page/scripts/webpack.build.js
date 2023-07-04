const fs = require("fs");
const path = require("path");

const webpack = require("webpack");

const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const ignoreWarningPlugin = require("./ignoreWarningPlugin");

const WebpackBar = require("webpackbar");
const TerserPlugin = require("terser-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const RemovePlugin = require('remove-files-webpack-plugin');

const ENVType = process.env._ENV_;

const outputPath = path.resolve(__dirname, `../../server/_assets`);

module.exports = {
  // mode: "development", //设置mode
  mode: "production", //设置mode
  entry: {
    workspace: path.resolve(__dirname, `../src/index.tsx`),
    registerApp: path.resolve(__dirname, `../src/registerApp/index.tsx`),
  },
  output: {
    path: outputPath,
    filename: "js/[name]-[contenthash].js",
    libraryTarget: "umd",
    library: "[name]",
  },
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx"],
  },
  externals: [
    {
      react: {
        commonjs: "react",
        commonjs2: "react",
        amd: "react",
        root: "React",
      },
      "react-dom": {
        commonjs: "react-dom",
        commonjs2: "react-dom",
        amd: "react-dom",
        root: "ReactDOM",
      },
      moment: "moment",
    },
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          // {
          //   loader: './config/test-loader'
          // },
          {
            loader: "ts-loader",
            options: {
              silent: true,
              transpileOnly: true,
              compilerOptions: {
                module: "es6",
                target: "es6",
              },
            },
          },
        ],
      },
      {
        test: /\.css$/,
        // exclude: /node_modules/,
        use: ["style-loader", "css-loader"],
      },
      // {
      //   test: /\.nmd(?=\.less)$/gi,
      //   use: ['style-loader', 'css-loader', 'less-loader']
      // },
      {
        test: /\.lazy.less$/i,
        use: [
          {
            loader: "style-loader",
            options: {
              injectType: "lazyStyleTag",
              insert: function insertIntoTarget(element, options) {
                (options.target || document.head).appendChild(element);
              },
            },
          },
          {
            loader: "css-loader",
            options: {
              modules: {
                localIdentName: "[local]-[hash:5]",
              },
            },
          },
          {
            loader: "less-loader",
            options: {
              lessOptions: {
                javascriptEnabled: true,
              },
            },
          },
        ],
      },
      {
        test: /^[^\.]+\.less$/i,
        use: [
          {
            loader: "style-loader",
            options: { injectType: "singletonStyleTag" },
          },
          {
            loader: "css-loader",
            options: {
              modules: {
                localIdentName: "[local]-[hash:5]",
              },
            },
          },
          {
            loader: "less-loader",
            options: {
              lessOptions: {
                javascriptEnabled: true,
              },
            },
          },
        ],
      },
      {
        test: /\.(gif|png|jpe?g|svg)$/i,
        use: [
          {
            loader: "url-loader",
            options: {
              // 100Kb
              limit: 1024 * 100,
              name: "img_[name]_[contenthash:4].[ext]",
            },
          },
        ],
      },
      {
        test: /\.d.ts$/i,
        use: [{ loader: "raw-loader" }],
      },
      {
        test: /\.(xml|txt|html|cjs|theme)$/i,
        use: [{ loader: "raw-loader" }],
      },
    ],
  },
  optimization: {
    concatenateModules: false, //name_name
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
      }),
    ],
  },
  plugins: [
    // new ExtraWatchWebpackPlugin({
    //   dirs: [path.resolve(globalConfg.tempPath, '../src/')],
    //   files: [path.resolve(globalConfg.tempPath, `../${configDocName}`)]
    // }),
    // new webpack.ProvidePlugin({
    //   'React': 'react'
    // }),
    new WebpackBar(),
    new ignoreWarningPlugin(), // All warnings will be ignored
    new RemovePlugin({
      before: {
        allowRootAndOutside: true,
        include: [
          path.resolve(__dirname, `../../server/_assets/js`)
        ]
      },
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, `../templates/workspace.html`),
      filename: "workspace.html",
      chunks: ['workspace'],
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, `../templates/registerApp.html`),
      filename: "registerApp.html",
      chunks: ['registerApp'],
      hot: true,
    }),
    // new FriendlyErrorsWebpackPlugin({
    //   compilationSuccessInfo: {
    //     messages: [`Stark is running,open : http://${getIPAdress()}:${globalConfg.port}`]
    //   },
    //   clearConsole: true,
    // }),
    //new BundleAnalyzerPlugin(),//包大小分析
  ],
};
