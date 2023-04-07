pwd
targetBase="../fangzhou-apaas-platform"

echo "开始编译前端资源"
cd page
npm install
npm run build
cd ../
echo "前端资源编译完毕"

echo "开始传输"
# transfer server
if [ -d "$targetBase/server" ]
then
  cp -r ./server/_assets $targetBase/server/
  cp -r ./server/src $targetBase/server
  cp  ./server/application_fangzhou.json $targetBase/server/application.json
  cp  ./server/env.js $targetBase/server/env.js
  cp  ./server/index.js $targetBase/server/index.js
  cp  ./server/installApplication.js $targetBase/server/installApplication.js
  cp  ./server/nest-cli.json $targetBase/server/nest-cli.json
  cp  ./server/package.json $targetBase/server/package.json
  cp  ./server/tsconfig.json $targetBase/server/tsconfig.json
else
  echo "文件夹不存在：$targetBase/server"
fi

# transfer server-runtime
if [ -d "$targetBase/server-runtime" ]
then
  cp -r ./server-runtime/src $targetBase/server-runtime
  cp  ./server-runtime/env.js $targetBase/server-runtime/env.js
  cp  ./server-runtime/index_flow.js $targetBase/server-runtime/index_flow.js
  cp  ./server-runtime/nest-cli.json $targetBase/server-runtime/nest-cli.json
  cp  ./server-runtime/package.json $targetBase/server-runtime/package.json
  cp  ./server-runtime/tsconfig.json $targetBase/server-runtime/tsconfig.json
else
  echo "文件夹不存在：$targetBase/server-runtime"
fi

echo "传输完毕"

echo "开始上传"
cd $targetBase
git add .
git commit -m "update"
git push
echo "上传完毕"