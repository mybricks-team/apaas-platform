# Mybricks 私有化部署版安装介绍

## 前置环境配置

1. 容器必须安装有 `MySQL 5.7`、`Node` V14 以上（推荐v14.21.0）（备注，如果安装的是 MySQL8.x，注意密码加密方式设置为：Legacy Password Encryption，切记不要设置为 Strong Password Encryption）

## 开始安装
### Linux

1. 拿到安装的 `zip` 包，
2. 在zip包的同级目录，新建一个自己的配置文件，并命名为 `PlatformConfig.json`
```
{
  "database": {
    "host": "",
    "user": "",
    "password": "",
    "port": ,
    "databaseName": ""
  },
  "platformConfig": {
    "logo": "cdn地址",
    "title": "前端 | 工作台",
    "favicon": "cdn地址"
  },
  "adminUser": {
    "email": "这里是初始化的管理员邮箱",
    "password": "这里是初始化的管理员密码"
  },
  "installApps": [
    {
      "type": "oss",
      "version": "1.0.82",
      "namespace": "mybricks-app-pcspa"
    },
    {
      "type": "npm",
      "path": "mybricks-hainiu-login@0.0.4"
    }
  ],
  "platformDomain": "这里是部署后的平台域名"
}
```
目录如下：
![](./assets/install_path.png)

3. 将其 `解压` 到文件夹，并`进入 server 文件夹`(确保服务器 `unzip` 命令可用，如果不可用，可提前安装好)
4. `使用管理权限` 执行如下安装命令即可，至此`服务器端的操作结束`，安装完毕后会`自动退出安装服务并拉起搭建服务`

```shell
cd server
sudo bash ./deploy.sh
```

4. 安装过程中查看服务器端的输出日志，出现如下字样了，即可打开浏览器，输入反向代理后的地址,例如：https://mybricks.world

### Windows

1. 拿到安装的 `zip` 包，
2. 在zip包的同级目录，新建一个自己的配置文件，并命名为 `PlatformConfig.json`
```
{
  "database": {
    "host": "",
    "user": "",
    "password": "",
    "port": 3306,
    "databaseName": ""
  },
  "platformConfig": {
    "logo": "cdn地址",
    "title": "前端 | 工作台",
    "favicon": "cdn地址"
  },
  "adminUser": {
    "email": "这里是初始化的管理员邮箱",
    "password": "这里是初始化的管理员密码"
  },
  "installApps": [
    {
      "type": "npm",
      "path": "mybricks-app-pcspa-for-manatee@1.0.20"
    },
    {
      "type": "npm",
      "path": "mybricks-hainiu-login@0.0.3"
    }
  ],
  "platformDomain": "这里是部署后的平台域名"
}
```
3. 将其 `解压` 到文件夹，并`进入 server 文件夹`
4. 双击运行 `deploy.bat` 文件进行平台安装
5. 使用 `管理员权限运行` start.bat 进行服务启动
6. 安装过程中查看服务器端的输出日志，出现如下字样了，即可打开浏览器，输入反向代理后的地址,例如：https://mybricks.world


## 安装后配置
安装完毕后，可以使用安装时配置的管理员账号登录进行平台的初始化配置：

登录：部署的域名/adminLogin.html
输入管理员账号密码
进入到管理页面，然后点击 `设置` 中的 `全局设置`，配置个性化数据：站点Logo、页面标题、页面ICON等

### 配置应用白名单
使用管理员账号登录，然后在应用白名单中配置面向普通用户开启的白名单，例如：pc-page


### 备注 1：用户在浏览器中输入的安装配置讲解

```
Connection Host：MySQL安装的IP地址
Connection Port：MySQL安装端口
username：链接MySQL的用户名
password：链接MySQL的密码
DateBase名称：MySQL的DB名称，后续表即将安装至此
```

### 备注 2：安装过程中的服务器端关键日志展示

```shell
# ...日志
【install】未安装，正在执行安装操作
【install】本地 localhost://3000 服务已开启，请打开浏览器，输入反向代理的地址，进行后续数据库配置
# 此时可以，打开发浏览器，输入反向代理后的地址,例如：https://mybricks.world
【install】: 数据库连接成功
【install】: 数据表初始化成功
【install】: 配置持久化成功
# ...
【install】: 应用安装成功
【install】: 停止安装服务成功
【install】: 线上服务启动成功
【install】: 安装服务已退出
```

