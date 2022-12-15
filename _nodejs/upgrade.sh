configPath="./config"
if [ ! -d "$configPath" ]; then
  echo "执行升级之前，请求复制原文件夹下的config文件夹到本目录下！"
  exit
fi
npm install --registry=https://registry.npm.taobao.org
npx pm2 kill
npx pm2 start index.js