## syntax=docker/dockerfile:1.7
FROM node:22-alpine AS deps

WORKDIR /workspace

RUN yarn config set registry https://repo.hmirror.ir/npm
ENV CYPRESS_INSTALL_BINARY=0

COPY package.json yarn.lock ./
RUN sed -i 's#https://registry.yarnpkg.com/#https://repo.hmirror.ir/npm/#g' yarn.lock
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
    yarn install --registry https://repo.hmirror.ir/npm --network-concurrency 1 --mutex network

FROM node:22-alpine AS builder

WORKDIR /workspace

COPY --from=deps /workspace/node_modules ./node_modules
COPY . .
RUN yarn nx run customer:build:production

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4300

# Runtime env (set in orchestrator / Liara / K8s):
#   REDIS_URI              — optional HTML + sitemap cache
#   SSR_API_URL            — internal backend URL for SSR prefetch / sitemap / manifest
#   API_URL                — alias of SSR_API_URL if SSR_API_URL is unset
#                            (browser still uses https://api.menno.pro from the build)
#   SSR_HTML_CACHE_TTL_SECONDS
#   SITEMAP_CACHE_TTL_SECONDS
#   SSR_SHOP_USERNAME      — optional dev/fallback shop on localhost

COPY --from=builder /workspace/dist/apps/customer ./

EXPOSE 4300

CMD ["node", "server/server.mjs"]
