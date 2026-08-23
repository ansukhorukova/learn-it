FROM node:20-alpine

WORKDIR /app

# Install deps at build time so the image has a node_modules layer.
# At runtime docker-compose bind-mounts ./backend:/app plus an anonymous
# volume on /app/node_modules, so the container keeps this image's
# node_modules while source files are the live host copy (hot reload).
COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 4000

CMD ["npm", "run", "dev"]
