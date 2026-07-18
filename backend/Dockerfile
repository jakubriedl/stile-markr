# syntax=docker/dockerfile:1.7

FROM node:24.14.1-bookworm-slim AS build
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm install --frozen-lockfile --filter @markr/backend...

COPY backend ./backend

RUN pnpm --filter @markr/backend --prod deploy --legacy /prod/backend

FROM oven/bun:1.3.11-slim AS runtime
WORKDIR /app

COPY --from=build /prod/backend /app

RUN mkdir -p /data && chown bun:bun /data

ENV NODE_ENV=production \
  DATABASE_PATH=/data/markr.sqlite \
  PORT=4567 \
  HOST=0.0.0.0

USER bun
EXPOSE 4567
VOLUME ["/data"]

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=5 \
  CMD ["bun", "-e", "const r=await fetch('http://127.0.0.1:4567/health'); if(!r.ok) process.exit(1)"]

CMD ["bun", "src/server.ts"]
