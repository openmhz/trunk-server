# build environment
FROM node:13.12.0-alpine as build
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
ARG REACT_APP_BACKEND_SERVER
ARG REACT_APP_SITE_NAME
ARG REACT_APP_FRONTEND_SERVER
ARG NODE_ENV
COPY package.json ./
RUN npm install
RUN npm install react-scripts@3.4.1 -g --silent
COPY . ./
RUN npm run build

# production environment
FROM node:13.12.0-alpine
RUN mkdir -p /app/public
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/build /app/public
CMD serve -s public -l 3000
