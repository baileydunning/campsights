# Build stage
FROM node:22 AS builder

WORKDIR /app

# Copy root configs and install all dependencies (Lerna/Workspaces)
COPY package*.json ./
COPY lerna.json ./
COPY packages/client/package*.json ./packages/client/
COPY packages/server/package*.json ./packages/server/
RUN npm install

# Copy and build client
COPY packages/client ./packages/client
WORKDIR /app/packages/client
RUN npm run build

# Copy and build server
WORKDIR /app
COPY packages/server ./packages/server
WORKDIR /app/packages/server
RUN npm run build

# Copy client build into server
RUN mkdir -p /app/packages/server/client/dist
RUN cp -r /app/packages/client/dist /app/packages/server/client/

# Production image
FROM node:22

WORKDIR /app/packages/server

# Copy package.json and package-lock.json for server
COPY packages/server/package*.json ./

# Install only production dependencies for server
RUN npm install --production

# Copy built server code
COPY --from=builder /app/packages/server ./

EXPOSE 3000

CMD ["npm", "run", "start:prod"]