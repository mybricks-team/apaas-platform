FROM node:16.20

RUN yum install -y nginx lsof wget unzip

WORKDIR /usr/src/app

COPY . .

EXPOSE 4100

WORKDIR /usr/src/app/server
USER root
CMD ["sh", "-c", "cd ./ && chmod +x deploy.sh && ./deploy.sh"]
