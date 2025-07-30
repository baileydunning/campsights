FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY lerna.json ./
COPY packages/client/package*.json ./packages/client/
COPY packages/server/package*.json ./packages/server/
RUN npm install

COPY packages/client ./packages/client
COPY packages/server ./packages/server

WORKDIR /app/packages/client
RUN npm run build

WORKDIR /app/packages/server
RUN npm run build

RUN mkdir -p ./client/dist && cp -r /app/packages/client/dist ./client/

FROM node:22-alpine AS runner

WORKDIR /app

COPY package*.json ./
COPY packages/server/package*.json ./packages/server/
RUN npm install --omit=dev

COPY --from=builder /app/packages/server ./packages/server

WORKDIR /app/packages/server

EXPOSE 4000

CMD ["npm", "run", "start:prod"]