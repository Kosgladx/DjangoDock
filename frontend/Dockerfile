# Estágio 1: Build da aplicação React + TypeScript + Vite
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

# Estágio 2: Servidor Nginx + Reverse Proxy para Produção
FROM nginx:1.27-alpine

# Remove configuração padrão do Nginx
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copia configuração customizada de Reverse Proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos estáticos compilados do React
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

