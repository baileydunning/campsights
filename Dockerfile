FROM node:22 AS builder

WORKDIR /app

COPY package*.json ./
COPY lerna.json ./
COPY packages/client/package*.json ./packages/client/
COPY packages/server/package*.json ./packages/server/
RUN npm install

COPY packages/client ./packages/client
WORKDIR /app/packages/client
RUN npm run build

WORKDIR /app
COPY packages/server ./packages/server
WORKDIR /app/packages/server
RUN npm run build

RUN mkdir -p /app/packages/server/client/dist
RUN cp -r /app/packages/client/dist /app/packages/server/client/

FROM node:22

WORKDIR /app/packages/server

COPY packages/server/package*.json ./

RUN npm install --production

COPY --from=builder /app/packages/server ./

EXPOSE 4000

CMD ["npm", "run", "start:prod"]