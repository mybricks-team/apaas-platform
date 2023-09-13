FROM node:14.16
MAINTAINER Leo
WORKDIR /usr/src/app

COPY . .

RUN npm i --registry=https://registry.npm.taobao.org \
    && cd server \
    && npm i --registry=https://registry.npm.taobao.org \
    && node installApplication.js \
    && cd ../server-runtime \
    && npm i --registry=https://registry.npm.taobao.org

EXPOSE 3100
WORKDIR /usr/src/app/server
CMD ["sh", "-c", "NODE_ENV=production npx pm2 start index.js --no-daemon"]
