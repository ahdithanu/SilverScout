# Production Dockerfile for Silver Scout Auto-Scaling Backend
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["node", "--loader", "tsx", "server/index.ts"]
