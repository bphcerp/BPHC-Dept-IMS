FROM node:22.21-alpine

RUN npm install -g pnpm

WORKDIR /usr/local/app

COPY ./client/package.json ./client/
COPY ./client/tsconfig*.json ./client/

COPY ./lib/package.json ./lib/
COPY ./pnpm-lock.yaml ./
COPY ./pnpm-workspace.yaml ./

RUN pnpm install -r

EXPOSE 5173

CMD ["pnpm", "--filter", "client", "dev", "--host"]
