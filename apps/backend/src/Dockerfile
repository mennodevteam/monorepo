FROM node:20.19-alpine As development

WORKDIR /api

COPY . .

RUN yarn --prod

CMD ["node", "main.js"]