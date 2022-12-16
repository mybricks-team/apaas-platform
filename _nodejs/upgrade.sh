exePath=`ps aux | grep node | grep '/mybricks/index.js' | awk '{print $NF}'`
rawdir=`dirname $exePath`
rawConfigPath="$rawdir/config"
currentConfigPath="./config"
if [ -d "$rawConfigPath" ]; then
  cp -a $configPath './'
  echo "配置同步成功，即将执行升级操作"
elif [ -d "$currentConfigPath" ]
  echo "当前目录下已存在配置，即将执行升级操作"
else
  echo "升级失败，请手动复制原文件夹下的config文件夹到本目录下！"
  exit
fi
npm install --registry=https://registry.npm.taobao.org
npx pm2 kill
npx pm2 start index.js