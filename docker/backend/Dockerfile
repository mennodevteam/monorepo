## syntax=docker/dockerfile:1.7
FROM node:24-alpine AS deps

WORKDIR /workspace

# تنظیم میرور داخلی برای pnpm
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
RUN pnpm nx run backend:build:production

FROM node:24-alpine AS prod-deps

WORKDIR /workspace

# تنظیم مجدد میرور در این استیج برای نصب وابستگی‌های Production
RUN npm install -g pnpm@9 --registry=https://repo.hmirror.ir/npm
RUN pnpm config set registry https://repo.hmirror.ir/npm
RUN pnpm config set store-dir /root/.pnpm-store
ENV CYPRESS_INSTALL_BINARY=0

# استفاده از package.json ریشه برای جلوگیری از جا ماندن وابستگی‌های runtime مثل pg
COPY --from=builder /workspace/package.json ./package.json
COPY --from=builder /workspace/pnpm-lock.yaml ./pnpm-lock.yaml
RUN --mount=type=cache,target=/root/.pnpm-store \
    pnpm install --prod --frozen-lockfile

FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /workspace/dist/apps/backend ./
COPY --from=prod-deps /workspace/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "main.js"]