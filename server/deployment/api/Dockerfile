FROM node:20-slim AS base

ENV PATH="/pnpm:$PATH"
RUN corepack enable

COPY . /app

WORKDIR /app

FROM base AS deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod=false --frozen-lockfile

FROM base
COPY --from=deps /app/node_modules /app/node_modules
EXPOSE 9000

CMD ["pnpm", "dev"]
