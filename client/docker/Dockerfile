FROM node:20-alpine

WORKDIR /usr/local/app/client

COPY ./client/package.json ./client/pnpm-lock.yaml ./

RUN npm install -g pnpm

RUN pnpm install

COPY . .

EXPOSE 5173

CMD ["pnpm", "dev", "--host"]
