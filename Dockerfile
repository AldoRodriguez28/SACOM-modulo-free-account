# Stage 1: Compilar la aplicación de Angular con subruta
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration=production --base-href /mis-negocios/

# Stage 2: Servidor Web Nginx
FROM nginx:alpine
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/
COPY --from=build /app/dist/sacom-free-account/browser /usr/share/nginx/html/mis-negocios
EXPOSE 82
CMD ["nginx", "-g", "daemon off;"]
