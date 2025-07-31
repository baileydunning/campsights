FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY lerna.json ./
COPY packages/client/package*.json ./packages/client/
COPY packages/server/package*.json ./packages/server/

RUN npm ci

COPY packages/client ./packages/client
COPY packages/server ./packages/server

RUN npx lerna run build --concurrency 2

RUN mkdir -p ./client/dist && cp -r /app/packages/client/dist ./client/

FROM node:22-alpine AS runner

WORKDIR /app

COPY package*.json ./
COPY packages/server/package*.json ./packages/server/
RUN npm ci --omit=dev

COPY --from=builder /app/packages/server/dist ./packages/server/dist
COPY --from=builder /app/packages/server/client ./packages/server/client

WORKDIR /app/packages/server

EXPOSE 4000

CMD ["node", "--max-old-space-size=512", "dist/index.js"]