FROM node:22-alpine AS build
RUN apk update && apk upgrade --no-cache
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx ng build --configuration=production

FROM nginx:alpine AS runtime
COPY --from=build /app/dist/orden-cajas/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
