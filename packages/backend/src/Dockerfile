FROM node:16.14.2-alpine As development

WORKDIR /api

COPY . .

RUN yarn --prod

CMD ["node", "main.js"]