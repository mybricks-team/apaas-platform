#!/usr/bin/env bash
set -e
cd page
npm i --registry https://registry.npmmirror.com
npm run build
cd ../server
npm i --registry https://registry.npmmirror.com
# npm run build:be