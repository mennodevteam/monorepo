FROM node:22-alpine AS deps

WORKDIR /workspace

ARG NPM_REGISTRY=https://repo.hmirror.ir/npm/
RUN npm config set registry "${NPM_REGISTRY}" \
  && yarn config set registry "${NPM_REGISTRY}"

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

FROM node:22-alpine AS builder

WORKDIR /workspace

COPY --from=deps /workspace/node_modules ./node_modules
COPY . .
RUN yarn nx run backend:build:production

FROM node:22-alpine AS prod-deps

WORKDIR /workspace

ARG NPM_REGISTRY=https://repo.hmirror.ir/npm/
RUN npm config set registry "${NPM_REGISTRY}" \
  && yarn config set registry "${NPM_REGISTRY}"

COPY --from=builder /workspace/dist/apps/backend/package.json ./package.json
COPY --from=builder /workspace/yarn.lock ./yarn.lock
RUN yarn install --production --frozen-lockfile && yarn cache clean

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /workspace/dist/apps/backend ./
COPY --from=prod-deps /workspace/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "main.js"]
