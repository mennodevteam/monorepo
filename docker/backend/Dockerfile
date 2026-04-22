## syntax=docker/dockerfile:1.7
FROM node:22-alpine AS deps

WORKDIR /workspace

# تنظیم میرور داخلی برای Yarn (Yarn v1)
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
RUN yarn nx run backend:build:production

FROM node:22-alpine AS prod-deps

WORKDIR /workspace

# تنظیم مجدد میرور در این استیج برای نصب وابستگی‌های Production (Yarn v1)
RUN yarn config set registry https://repo.hmirror.ir/npm
ENV CYPRESS_INSTALL_BINARY=0

# استفاده از package.json ریشه برای جلوگیری از جا ماندن وابستگی‌های runtime مثل pg
COPY --from=builder /workspace/package.json ./package.json
COPY --from=builder /workspace/yarn.lock ./yarn.lock
RUN sed -i 's#https://registry.yarnpkg.com/#https://repo.hmirror.ir/npm/#g' yarn.lock
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
    yarn install --production --registry https://repo.hmirror.ir/npm --network-concurrency 1 --mutex network && yarn cache clean

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /workspace/dist/apps/backend ./
COPY --from=prod-deps /workspace/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "main.js"]