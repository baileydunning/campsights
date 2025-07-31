FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json lerna.json ./
COPY packages/client/package.json ./packages/client/
COPY packages/server/package.json ./packages/server/

RUN npm ci

COPY packages/client ./packages/client
COPY packages/server ./packages/server

RUN npx lerna run build --concurrency 2

FROM node:22-alpine AS runner

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/server/package.json ./packages/server/

RUN npm ci --omit=dev

COPY --from=builder /app/packages/server/dist ./packages/server/dist
COPY --from=builder /app/packages/client/dist ./packages/client/dist
COPY packages/server/openapi.yaml ./packages/server/openapi.yaml

WORKDIR /app

EXPOSE 4000

CMD ["node", "--max-old-space-size=512", "packages/server/dist/index.js"]