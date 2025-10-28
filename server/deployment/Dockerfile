FROM node:22.21-slim

ENV NODE_ENV=development
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH="/usr/bin/chromium"

RUN npm install -g pnpm

RUN apt update && apt install -y --no-install-recommends \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    libu2f-udev \
    libxshmfence1 \
    libglu1-mesa \
    chromium \
    fonts-noto \
    fonts-noto-color-emoji \
    fonts-dejavu \
    fonts-freefont-ttf \
    libreoffice \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/local/app

COPY ./patches ./patches

WORKDIR /usr/local/app/lib

COPY ./lib/package.json ./
COPY ./lib/tsconfig.json ./

WORKDIR /usr/local/app/server

COPY ./server/package.json ./
COPY ./server/tsconfig.json ./

WORKDIR /usr/local/app

COPY ./package.json ./
COPY ./pnpm-lock.yaml ./
COPY ./pnpm-workspace.yaml ./

RUN pnpm install -r

WORKDIR /usr/local/app/server

CMD ["pnpm", "--filter", "server", "run", "dev"]
