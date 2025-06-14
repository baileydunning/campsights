# Build stage
FROM node:22 AS builder

WORKDIR /app

# Install and build client
COPY client/package*.json ./client/
WORKDIR /app/client
RUN npm install
COPY client/ .
RUN npm run build

# Install and build server
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ .
RUN npm run build

# Copy client build into server
RUN mkdir -p /app/server/client/dist
RUN cp -r /app/client/dist /app/server/client/

# Production image
FROM node:22

WORKDIR /app/server

COPY --from=builder /app/server ./

EXPOSE 3000

CMD ["npm", "run", "start:prod"]