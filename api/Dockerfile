# API REST + Socket.io (Node 20). Na Cloud corre no Azure App Service (Web App for Containers).
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

# Só as dependências de produção; a camada fica em cache enquanto o package.json não mudar
COPY package*.json ./
RUN npm ci --omit=dev

COPY openapi.yaml ./
COPY src ./src

# Pasta das imagens quando não há Blob Storage (desenvolvimento)
RUN mkdir -p uploads && chown node:node uploads
USER node

EXPOSE 3000
CMD ["node", "src/server.js"]
