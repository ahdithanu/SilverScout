# ==============================================================================
# Multi-Stage Production Dockerfile for Silver Scout Platform
# Stage 1: Build React/Vite Client
# Stage 2: Minimal, Hardened Production Runtime with Persistent Volume Storage
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Builder
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy application source
COPY . .

# Compile Vite client bundle
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production Runner
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV DATA_DIR=/app/data

# Create persistent storage directory and set permissions for non-root user
RUN mkdir -p /app/data/exports /app/data/ledger && \
    chown -R node:node /app

# Install production dependencies only + tsx runtime
COPY package*.json ./
RUN npm ci --only=production && \
    npm install -g tsx

# Copy compiled frontend from builder
COPY --from=builder --chown=node:node /app/dist ./dist

# Copy server and backend utility modules
COPY --chown=node:node server ./server
COPY --chown=node:node src/types.ts ./src/types.ts
COPY --chown=node:node src/utils ./src/utils
COPY --chown=node:node src/services ./src/services

# Declare persistent data storage volume
VOLUME ["/app/data"]

# Switch to unprivileged non-root user for enterprise container security
USER node

EXPOSE 3001

# Container Healthcheck verifying API healthiness
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

# Launch full-stack platform server (serves APIs and Vite frontend)
CMD ["tsx", "server/index.ts"]
