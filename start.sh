#!/usr/bin/env bash
set -e
cd server
npx pm2 start ecosystem.config.js
cd ../server-runtime
npx pm2 start ecosystem.config.js