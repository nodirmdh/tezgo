FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
WORKDIR /app/backend
RUN npm install --omit=dev

FROM node:20-alpine AS runtime
WORKDIR /app/backend
ENV NODE_ENV=production
COPY --from=deps /app/backend/node_modules ./node_modules
COPY backend/ ./
EXPOSE 3002
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD wget -qO- http://localhost:3002/health || exit 1
CMD ["node", "src/index.js"]
