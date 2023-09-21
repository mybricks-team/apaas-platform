FROM node:16.20

RUN yum install -y make gcc libx11-devel.x86_64 libxkbfile-devel.x86_64 libsecret-devel nginx lsof wget unzip

WORKDIR /usr/src/app

COPY . .

EXPOSE 4100

WORKDIR /usr/src/app/server
USER root
CMD ["sh", "-c", "cd ./ && chmod +x deploy.sh && ./deploy.sh"]
