FROM node:20.14.0-slim
ENV NODE_ENV development
WORKDIR /usr/local/app/server

RUN npm install -g pnpm

COPY ./server/package.json ./
COPY ./server/pnpm-lock.yaml ./
COPY ./server/tsconfig.json ./

RUN pnpm fetch
RUN pnpm install -r --offline

CMD ["pnpm", "tsx", "watch", "--clear-screen=false", "src/bin.ts"]
