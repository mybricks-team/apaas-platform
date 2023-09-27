FROM centos:7

RUN echo "centos6.10安装成功"

# 更新包管理器和安装必要的工具
# RUN yum -y update

# CMD echo "yum更新成功"

RUN yum -y install epel-release && \
    yum -y install which wget unzip gcc-c++ make 

# # CMD echo "基础依赖安装成功"

# 安装Node.js
RUN curl --silent --location https://rpm.nodesource.com/setup_16.x | bash - && \
    yum -y install nodejs

# CMD echo "nodejs安装成功"

# 安装Nginx
RUN yum -y install nginx

# # CMD echo "nginx安装成功"

# 安装Unzip
RUN yum -y install unzip

# # CMD echo "unzip安装成功"

# 清理缓存
RUN yum -y clean all

# # CMD echo "清理缓存成功"

# # 将Nginx默认配置备份
# # RUN mv /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak

# # 添加自定义的Nginx配置
# # ADD nginx.conf /etc/nginx/

WORKDIR /home/apaas

COPY . .

WORKDIR /home/apaas

RUN mv  /home/apaas/server/_localstorage /home/apaas/server/localstorage

WORKDIR /home/apaas/server

RUN /bin/bash -c 'npm i --registry https://registry.npm.taobao.org --legacy-peer-deps'

WORKDIR /home/apaas/server/_deployment

RUN /bin/bash -c 'node ./install_docker.js'

# CMD echo "应用安装成功"

EXPOSE 4100

WORKDIR /home/apaas/server

USER root

# CMD echo "安装完毕"
CMD ["bash", "start_docker.sh"]
# CMD ["bash", "-c", "NODE_ENV=production npx pm2 start ecosystem.config.js --no-daemon"]
# CMD ["/usr/sbin/init"]