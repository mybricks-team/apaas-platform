## Mybricks 私有化部署版安装介绍

### 前置环境配置

1. 容器必须安装有 `MySQL 5.7`、`Node` V14 以上（V14.16以下）（备注，如果安装的是 MySQL8.x，注意密码加密方式设置为：Legacy Password Encryption，切记不要设置为 Strong Password Encryption）
2. nginx 对`3000`端口反向代理，目的是在外部能够访问服务，以下为示例配置

```
location / {
    set $req_id $msec$rdm_number;
    proxy_set_header X-Trace-Id $req_id;
    proxy_pass          http://127.0.0.1:3000;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_redirect      off;
    proxy_set_header    Host                $host;
    proxy_set_header    X-Real-IP           $remote_addr;
    proxy_set_header    X-Forwarded-For     $proxy_add_x_forwarded_for;
    proxy_set_header    X-Request-Id        $pid-$msec-$remote_addr-$request_length;
    proxy_set_header    X-Forwarded-Proto   $scheme;
}
```

### 开始安装

1. 拿到安装的 `zip` 包，
2. 将其 `解压` 到文件夹，并`进入解压后的文件夹`
3. `使用管理用权限` 执行如下安装命令即可，至此`服务器端的操作结束`，安装完毕后会`自动退出安装服务并拉起搭建服务`

```shell
sudo sh ./deploy.sh
```

4. 安装过程中查看服务器端的输出日志，出现如下字样了，即可打开浏览器，输入反向代理后的地址,例如：https://mybricks.world

```shell
【install】本地 localhost://3000 服务已开启，请打开浏览器，输入反向代理的地址，进行后续数据库配置
```

#### 备注 1：用户在浏览器中输入的安装配置讲解

```
Connection Host：MySQL安装的IP地址
Connection Port：MySQL安装端口
username：链接MySQL的用户名
password：链接MySQL的密码
DateBase名称：MySQL的DB名称，后续表即将安装至此
```

#### 备注 2：安装过程中的服务器端关键日志展示

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
