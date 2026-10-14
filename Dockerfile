# Multi-Stage Dockerfile for Unified Full-Stack OrbitWatch Deployment
FROM node:20-alpine AS builder

WORKDIR /app

# Copy all files
COPY . .

# Install dependencies and build client & server
RUN cd client && npm install && npm run build
RUN cd server && npm install && npm run build
RUN npm install

# Production Runtime Stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy root node_modules and built packages
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/package.json ./server/package.json
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/db ./db
COPY --from=builder /app/scripts/snapshots ./scripts/snapshots

EXPOSE 5000

CMD ["node", "server/dist/index.js"]
