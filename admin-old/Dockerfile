# docker build -t trunk-server-frontend .
# do a `git pull` in trunk-server-frontend to update

FROM node:10


ENV HOME=/home/app

RUN mkdir -p /home/app
COPY ./package.json /tmp
RUN cd /tmp && npm install
RUN cp -a /tmp/node_modules /home/app

# add `/usr/src/app/node_modules/.bin` to $PATH
ENV PATH /usr/app/node_modules/.bin:$PATH

WORKDIR $HOME
COPY . $HOME/
RUN npm run build

CMD ["npm", "run", "start"]
