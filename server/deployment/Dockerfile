FROM node:20.14.0-slim
ENV NODE_ENV development
WORKDIR /usr/local/app

COPY ./lib ./lib

WORKDIR /usr/local/app/server

RUN npm install -g pnpm

COPY ./server/package.json ./
COPY ./server/tsconfig.json ./

WORKDIR /usr/local/app
COPY ./pnpm-lock.yaml ./
COPY ./pnpm-workspace.yaml ./
RUN pnpm install -r

WORKDIR /usr/local/app/server

CMD ["pnpm", "tsx", "watch", "--clear-screen=false", "src/bin.ts"]
