#!/usr/bin/env bash
set -e
cd server
# npm run start:prod
npx pm2 start index.js