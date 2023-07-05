#!/usr/bin/env bash
set -e

npm i --registry=https://registry.npm.taobao.org
cd _deployment
node install.js