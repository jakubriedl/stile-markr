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
  pnpm install --frozen-lockfile --filter @markr/frontend...

COPY backend ./backend
COPY frontend ./frontend

RUN pnpm --filter @markr/frontend generate-routes \
  && pnpm --filter @markr/frontend build

FROM oven/bun:1.3.11-slim AS runtime
WORKDIR /app

COPY --from=build /app/frontend/.output ./.output

ENV NODE_ENV=production \
  PORT=3000 \
  HOST=0.0.0.0 \
  BACKEND_URL=http://backend:4567

USER bun
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 \
  CMD ["bun", "-e", "const r=await fetch('http://127.0.0.1:3000/'); if(!r.ok) process.exit(1)"]

CMD ["bun", ".output/server/index.mjs"]
