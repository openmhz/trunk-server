# Built from the repo root:  docker build -f account/Dockerfile .
# Dependencies come from the root package-lock.json (npm workspaces).

# ---- build the React client
FROM node:19-alpine3.16 AS build
# REACT_APP_* values are compiled into the bundle.
ARG REACT_APP_BACKEND_SERVER
ARG REACT_APP_ADMIN_SERVER
ARG REACT_APP_ACCOUNT_SERVER
ARG REACT_APP_FRONTEND_SERVER
ARG REACT_APP_SITE_NAME
ARG REACT_APP_ADMIN_EMAIL
ARG NODE_ENV
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
COPY account/package.json account/
COPY admin/package.json admin/
# --include=dev: the build tools are devDependencies, and NODE_ENV may be
# "production" here, which would otherwise skip them.
RUN npm ci --workspace account --include=dev --no-audit --no-fund
COPY account/ account/
RUN npm run build --workspace account

# ---- run the Express server, which also serves the built client
FROM node:19-alpine3.16
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
COPY account/package.json account/
COPY admin/package.json admin/
RUN npm ci --workspace account --omit=dev --no-audit --no-fund
# The test overlay (test-compose.yml) runs the app under nodemon.
RUN npm install -g nodemon
COPY account/server/ account/
COPY --from=build /app/account/build account/public
WORKDIR /app/account
CMD ["node", "index.js"]
