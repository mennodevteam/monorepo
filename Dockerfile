FROM node:16.14.2-alpine As development

WORKDIR /api

COPY package.json .
COPY dist/apps/backend src

RUN yarn --prod

CMD ["node", "src/main.js"]