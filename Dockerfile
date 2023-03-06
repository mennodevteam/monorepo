FROM node:16.14.2-alpine As development

WORKDIR /api

COPY package.json .
COPY dist/packages/backend src

RUN yarn

CMD ["node", "src/main.js"]