#!/usr/bin/env bash
set -e
cd page
npm i --registry https://registry.npm.taobao.org
npm run build
cd ../server
npm i --registry https://registry.npm.taobao.org
# npm run build:be