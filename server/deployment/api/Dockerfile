FROM oven/bun

WORKDIR /app

COPY package*.json .

RUN bun install

COPY . .

EXPOSE 9000

CMD ["bun", "dev"]
