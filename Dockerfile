FROM node:24-alpine AS build

# Crear carpeta de trabajo
WORKDIR /app

# Copiar dependencias e instalar
COPY package*.json ./
RUN npm ci

# Copiar todo el código fuente
COPY . .
RUN npx ng build --configuration production

FROM nginx:alpine
COPY --from=build /app/dist/sacom-free-account/browser /usr/share/nginx/html/mis-negocios/
COPY default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# docker build -t sacom-free-account-front .
# docker run -d --name sacom-free-account-front --network red-interna -p 4200:80 sacom-free-account-front
