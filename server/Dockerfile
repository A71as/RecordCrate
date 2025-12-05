# Simple Dockerfile for RecordCrate API
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copy source
COPY src ./src

# Expose port
EXPOSE 4001

# Default envs (override in runtime)
ENV NODE_ENV=production

# Start the server
CMD ["npm", "start"]
