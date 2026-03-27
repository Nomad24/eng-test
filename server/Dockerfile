# Backend Dockerfile for NestJS + TypeScript

# Build stage
FROM node:20-alpine AS builder

WORKDIR /workspace

# Preserve the repository layout because the server depends on file:../contract
COPY contract ./contract
COPY server ./server

WORKDIR /workspace/contract
RUN npm ci && npm run build

WORKDIR /workspace/server
RUN npm ci

# Build server
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /workspace

# Copy the built local package so npm can install file:../contract in production mode
COPY --from=builder /workspace/contract ./contract
COPY --from=builder /workspace/server/package*.json ./server/

WORKDIR /workspace/server
RUN npm ci --omit=dev && npm cache clean --force

# Copy built files from builder stage
COPY --from=builder /workspace/server/dist ./dist

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main.js"]
