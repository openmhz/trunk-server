# build environment
FROM node:13.12.0-alpine as build
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
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
