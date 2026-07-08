## syntax=docker/dockerfile:1.7
FROM node:24-alpine AS deps

WORKDIR /workspace

RUN npm install -g pnpm@9 --registry=https://repo.hmirror.ir/npm
RUN pnpm config set registry https://repo.hmirror.ir/npm
RUN pnpm config set store-dir /root/.pnpm-store
ENV CYPRESS_INSTALL_BINARY=0

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.pnpm-store \
    pnpm install --frozen-lockfile

FROM node:24-alpine AS builder

WORKDIR /workspace

RUN npm install -g pnpm@9 --registry=https://repo.hmirror.ir/npm

COPY --from=deps /workspace/node_modules ./node_modules
COPY . .
ENV NX_DAEMON=false
RUN pnpm nx run customer:build:production --parallel=1

FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4300

# Runtime env (set in orchestrator / Liara / K8s):
#   REDIS_URI              — optional HTML + sitemap cache
#   SSR_API_URL            — internal backend URL for SSR prefetch / sitemap / manifest
#   API_URL                — alias of SSR_API_URL if SSR_API_URL is unset
#                            (browser still uses https://api.menno.pro from the build)
#   SSR_LOG                — set to 0 to disable; verbose for extra http/hydrate logs
#   SSR_HTML_CACHE_TTL_SECONDS
#   SITEMAP_CACHE_TTL_SECONDS
#   SSR_SHOP_USERNAME      — optional dev/fallback shop on localhost

COPY --from=builder /workspace/dist/apps/customer ./

EXPOSE 4300

CMD ["node", "server/server.mjs"]
