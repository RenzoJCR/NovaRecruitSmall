# =====================================================
# ETAPA 1: Compilación de React con Vite
# =====================================================
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

# Rutas relativas que Nginx redirigirá al backend
ARG VITE_API_URL=/api
ARG VITE_WS_URL=/ws

ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_WS_URL=${VITE_WS_URL}

RUN npm run build


# =====================================================
# ETAPA 2: Servidor web Nginx
# =====================================================
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]