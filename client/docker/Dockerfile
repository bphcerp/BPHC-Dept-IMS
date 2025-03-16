FROM node:20-alpine
WORKDIR /usr/local/app

COPY ./lib ./lib

RUN npm install -g pnpm

WORKDIR /usr/local/app/client

COPY ./client/package.json ./
COPY ./server/tsconfig*.json ./

WORKDIR /usr/local/app
COPY ./pnpm-lock.yaml ./
COPY ./pnpm-workspace.yaml ./
RUN pnpm install -r

WORKDIR /usr/local/app/client
COPY . .

EXPOSE 5173

CMD ["pnpm", "dev", "--host"]
