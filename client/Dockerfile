# Frontend Dockerfile for React + Vite

# Build stage
FROM node:20-alpine AS builder

WORKDIR /workspace

# Preserve the repository layout because the client depends on file:../contract
COPY contract ./contract
COPY client ./client

WORKDIR /workspace/contract
RUN npm ci && npm run build

WORKDIR /workspace/client
RUN npm ci
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Copy built files from builder stage
COPY --from=builder /workspace/client/dist /usr/share/nginx/html

# Copy nginx configuration from client folder
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
