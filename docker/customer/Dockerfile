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

FROM nginx:1.27-alpine AS runner

WORKDIR /usr/share/nginx/html

COPY --from=builder /workspace/dist/apps/customer ./
COPY docker/spa-default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
