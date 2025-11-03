FROM node:22.21-alpine

RUN npm install -g pnpm

WORKDIR /usr/local/app/lib

COPY ./lib/package.json ./
COPY ./lib/tsconfig.json ./

WORKDIR /usr/local/app/client

COPY ./client/package.json ./
COPY ./client/tsconfig*.json ./
COPY ./client/vite.config.ts ./

WORKDIR /usr/local/app/server

COPY ./server/package.json ./
COPY ./server/tsconfig*.json ./

WORKDIR /usr/local/app

COPY ./package.json ./
COPY ./pnpm-lock.yaml ./
COPY ./pnpm-workspace.yaml ./
COPY ./patches ./patches

RUN pnpm install -r

WORKDIR /usr/local/app/client

EXPOSE 5173

CMD ["pnpm", "--filter", "client", "dev", "--host"]