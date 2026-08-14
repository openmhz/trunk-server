# build environment
FROM node:19-alpine3.16 as build
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
ARG REACT_APP_BACKEND_SERVER
ARG REACT_APP_SITE_NAME
ARG REACT_APP_FRONTEND_SERVER
# Where the player sends signed-out visitors to sign in. Create React App
# inlines REACT_APP_* at build time, so this has to be a build arg, not just a
# runtime environment variable.
ARG REACT_APP_ACCOUNT_SERVER
ARG REACT_APP_GOOGLE_ANALYTICS
ARG NODE_ENV
COPY package.json ./
RUN npm install --include=dev
COPY . ./
RUN npm run build

# production environment
FROM node:19-alpine3.16
RUN mkdir -p /app/public
COPY ./package.json /tmp
RUN cd /tmp && npm install
RUN cp -a /tmp/node_modules /app
RUN npm install -g nodemon
WORKDIR /app
COPY server /app
COPY --from=build /app/build /app/public
RUN sed 's/<meta name="temp" conent="replace"\/>/<%- TWITTER_META%>/g' /app/public/index.html > /app/index.ejs
CMD ["node", "index.js"]