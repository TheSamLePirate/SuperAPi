# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build argument for API URL
ARG VITE_API_URL=https://code.samlepirate.org
ENV VITE_API_URL=$VITE_API_URL

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

RUN npm install -g serve

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist

# Expose port 8080
EXPOSE 8080

CMD ["serve", "-s", "dist", "-l", "tcp://0.0.0.0:8080"]
