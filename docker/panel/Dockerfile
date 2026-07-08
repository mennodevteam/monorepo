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
RUN pnpm nx run panel:build:production

FROM nginx:1.27-alpine AS runner

WORKDIR /usr/share/nginx/html

COPY --from=builder /workspace/dist/apps/panel ./

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
