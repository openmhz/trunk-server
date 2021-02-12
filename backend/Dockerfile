# docker build -t smartnet-player .
# do a `git pull` in smartnet-player to update

FROM node:10

#RUN useradd --user-group --create-home --shell /bin/false app &&\
#  npm install --global npm@3.7.5
RUN echo deb http://www.deb-multimedia.org stretch main non-free \
	>>/etc/apt/sources.list && apt-get update &&\
	apt-get install -y --force-yes deb-multimedia-keyring && \
	apt-get update && \
	apt-get install -y ffmpeg cron python build-essential g++

ENV HOME=/home/app


RUN mkdir -p /home/app
COPY package.json /tmp
RUN cd /tmp && npm --unsafe-perm install -g node-gyp && npm --unsafe-perm install
RUN mkdir -p /home/app/upload && cp -a /tmp/node_modules /home/app

WORKDIR $HOME/
COPY . $HOME/

# Run the command on container startup
CMD node index.js
