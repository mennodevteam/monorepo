FROM node:20.19-alpine As development

WORKDIR /api

COPY . .

RUN npm install -g pnpm@9 && pnpm install --prod

CMD ["node", "main.js"]