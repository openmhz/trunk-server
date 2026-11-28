# Built from the repo root:  docker build -f backend/Dockerfile .
# Dependencies come from the root package-lock.json (npm workspaces).
FROM node:22-bookworm

RUN apt-get update && \
	apt-get install -y ffmpeg python3 build-essential g++ && \
	rm -rf /var/lib/apt/lists/*

# ~/.aws is mounted here for S3 credentials; uploads are written here too.
ENV HOME=/home/app
RUN mkdir -p /home/app/upload

WORKDIR /app
# npm ci installs exactly what package-lock.json lists. Every workspace's
# package.json is needed for npm to read the lockfile, but only the backend's
# dependencies are installed.
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
COPY account/package.json account/
COPY admin/package.json admin/
RUN npm ci --workspace backend --omit=dev --no-audit --no-fund

COPY backend/ backend/
WORKDIR /app/backend
# The test overlay (test-compose.yml) runs the app under nodemon.
RUN npm install -g nodemon
CMD ["node", "index.js"]
