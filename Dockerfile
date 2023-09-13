FROM node:16.20
MAINTAINER Leo
WORKDIR /usr/src/app

COPY . .

EXPOSE 3100
WORKDIR /usr/src/app/server
CMD ["sh", "-c", "cd ./ && chmod +x deploy.sh && ./deploy.sh"]
