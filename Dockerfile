# Multi-stage build for Angular application
# Stage 1: Build the application
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies needed for build)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build the application for production
RUN npm run build

# Stage 2: Serve the application with nginx
FROM nginx:1.25-alpine AS production

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application from build stage
COPY --from=build /app/dist/music-tracks-app /usr/share/nginx/html

# Copy environment configuration script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port 80
EXPOSE 80

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# Use custom entrypoint for environment variable injection
ENTRYPOINT ["/docker-entrypoint.sh"]

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Labels for better image management
LABEL maintainer="Genesis Frontend Team"
LABEL version="1.0"
LABEL description="Music Tracks Frontend Application"
LABEL org.opencontainers.image.source="https://github.com/GenesisEducationKyiv/front-end-school-3-0-povezlo" 