tmpFolderBase="$PWD/_temp_"

echo "开始准备环境"
if [[ ! -d "$tmpFolderBase" ]];
then
  mkdir "_temp_"
else
  rm -rf "_temp_"
  mkdir "_temp_"
fi
cd $tmpFolderBase
echo "{}" > package.json
echo "环境准备完毕"

echo "开始执行安装操作..."

echo "开始拉取代码"
if [ "$1" = "" ]; 
then
npm i --registry=https://registry.npm.taobao.org mybricks-apaas-platform@latest  --production
else
npm i --registry=https://registry.npm.taobao.org "mybricks-apaas-platform@$1"  --production
fi
tmpPlatformFolder=$tmpFolderBase/node_modules/mybricks-apaas-platform
cd "./node_modules/mybricks-apaas-platform"
echo "开始解压"
unzip mybricks-apaas.zip -d ../../
rm -rf ./node_modules
cd $tmpFolderBase/mybricks-apaas
echo "开始执行覆盖操作"
if [[ -d "./mybricks-platform" ]];
then
  files=$(ls "$tmpFolderBase/mybricks-apaas/mybricks-platform")
  for filename in $files
  do
    cp -r "./mybricks-platform/$filename" ../../server
  done
fi
if [[ -d "./mybricks-runtime" ]];
then
  files=$(ls "$tmpFolderBase/mybricks-apaas/mybricks-runtime")
  for filename in $files
  do
    cp -r "./mybricks-runtime/$filename" ../../server-runtime
  done
fi

echo "覆盖完毕"

echo "开始执行安装依赖操作"
cd $tmpFolderBase
cd "../server"
npm i --registry=https://registry.npm.taobao.org 
cd "../server-runtime"
npm i --registry=https://registry.npm.taobao.org 
echo "依赖安装完毕"

# echo "开始重启服务"
# npx pm2 reload index
# npx pm2 reload index_flow
# echo "服务重启成功"


