FROM nginx:1.27-alpine AS runner

WORKDIR /usr/share/nginx/html

COPY apps/landing/index.html ./index.html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
