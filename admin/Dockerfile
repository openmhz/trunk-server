# build environment
FROM node:19-alpine3.16 as build
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
ARG REACT_APP_BACKEND_SERVER
ARG REACT_APP_ADMIN_SERVER
ARG REACT_APP_ACCOUNT_SERVER
ARG REACT_APP_FRONTEND_SERVER
ARG REACT_APP_SITE_NAME
ARG REACT_APP_ADMIN_EMAIL
ARG NODE_ENV
COPY package.json package-lock.json ./
# npm ci, not npm install: it installs exactly what package-lock.json
# records and fails if the lock and package.json disagree. npm install would
# re-resolve every range on each build, so two builds of the same commit could
# ship different dependency trees.
RUN npm ci --include=dev
COPY . ./
RUN npm run build

# production environment
FROM node:19-alpine3.16
RUN mkdir -p /app/public
COPY ./package.json ./package-lock.json /tmp/
RUN cd /tmp && npm ci
RUN cp -a /tmp/node_modules /app
RUN npm install -g nodemon
WORKDIR /app
COPY server /app
COPY --from=build /app/build /app/public
CMD ["node", "index.js"]