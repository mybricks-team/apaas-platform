#!/usr/bin/env bash
set -e
echo '正在安装依赖'
npm i --registry=https://registry.npm.taobao.org
echo '依赖安装完毕'
echo '正在启动部署服务'
cd _deployment
node install.js
echo '部署完毕'
cd ../
echo '正在安装应用'
node installApplication.js
echo '应用安装完毕'
echo '正在启动应用'
npx pm2 start ecosystem.config.js
echo '应用完毕'
exit 0