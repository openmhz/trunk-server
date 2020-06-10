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

#ADD sweep.sh $HOME/sweep.sh
#RUN chmod +x $HOME/sweep.sh

#ADD mycrontab $HOME/mycrontab
#RUN crontab $HOME/mycrontab
#RUN update-rc.d cron defaults

# Add crontab file in the cron directory
#ADD mycrontab /etc/cron.d/sweep-cron

#RUN touch /var/log/cron.log

# Give execution rights on the cron job
#RUN chmod 0644 /etc/cron.d/sweep-cron

# Run the command on container startup
#CMD env > $HOME/env.txt && cron
#CMD cron && node index.js
CMD node index.js
