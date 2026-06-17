FROM node:16.14.2-alpine As development

WORKDIR /api

COPY package.json .
COPY dist/apps/backend src

RUN npm install -g pnpm@9 && pnpm install --prod

CMD ["node", "src/main.js"]