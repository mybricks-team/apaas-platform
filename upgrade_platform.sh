tmpFolderBase="$PWD/_temp_"

echo "开始执行安装操作..."
cd $tmpFolderBase
echo "开始解压"
unzip mybricks-apaas.zip -d ./
cd ./mybricks-apaas
echo "开始执行覆盖操作"
if [[ -d "./mybricks-platform" ]];
then
  files=$(ls "$tmpFolderBase/mybricks-apaas/server")
  for filename in $files
  do
    cp -r "./mybricks-platform/$filename" ../../server
  done
fi
if [[ -d "./mybricks-runtime" ]];
then
  files=$(ls "$tmpFolderBase/mybricks-apaas/server-runtime")
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


