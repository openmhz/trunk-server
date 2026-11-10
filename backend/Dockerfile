# docker build -t smartnet-player .
# do a `git pull` in smartnet-player to update

FROM node:22-bookworm

# RUN echo deb https://www.deb-multimedia.org bullseye main non-free \
# 	>>/etc/apt/sources.list && apt-get update -oAcquire::AllowInsecureRepositories=true &&\
# 	apt-get install -y --force-yes deb-multimedia-keyring && \

RUN apt-get update && \
	apt-get install -y ffmpeg cron python3 build-essential g++

ENV HOME=/home/app


RUN mkdir -p /home/app
# npm ci installs exactly what package-lock.json lists, so rebuilds don't pick up newer versions.
COPY package.json package-lock.json /tmp/
RUN cd /tmp && npm --unsafe-perm install -g node-gyp && npm --unsafe-perm ci
RUN mkdir -p /home/app/upload && cp -a /tmp/node_modules /home/app

WORKDIR $HOME/
COPY . $HOME/
RUN npm install -g nodemon
# Run the command on container startup
CMD node index.js
