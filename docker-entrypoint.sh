#!/bin/sh

# Docker entrypoint script for Angular application
# This script handles environment variable injection at runtime

set -e

echo "🐳 Starting Angular application container..."

# Default values
BACKEND_URL=${BACKEND_URL:-"http://localhost:8000"}
API_URL=${API_URL:-"${BACKEND_URL}/api"}
GRAPHQL_URL=${GRAPHQL_URL:-"${BACKEND_URL}/graphql"}

echo "📊 Environment configuration:"
echo "  BACKEND_URL: $BACKEND_URL"
echo "  API_URL: $API_URL" 
echo "  GRAPHQL_URL: $GRAPHQL_URL"

# Create runtime environment configuration
echo "🔧 Generating runtime environment configuration..."

# Create environment config file that Angular can load
cat > /usr/share/nginx/html/assets/config/environment.json << EOF
{
  "production": true,
  "apiUrl": "$API_URL",
  "graphqlUrl": "$GRAPHQL_URL",
  "backendUrl": "$BACKEND_URL"
}
EOF

# Create config directory if it doesn't exist
mkdir -p /usr/share/nginx/html/assets/config

echo "✅ Environment configuration created"

# Replace environment variables in nginx config
echo "🔧 Configuring nginx..."

# Use envsubst to replace variables in nginx config
envsubst '${BACKEND_URL}' < /etc/nginx/nginx.conf > /tmp/nginx.conf && mv /tmp/nginx.conf /etc/nginx/nginx.conf

echo "✅ Nginx configuration updated"

# Validate nginx configuration
echo "🔍 Validating nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration is invalid"
    exit 1
fi

# Install curl for health checks if not present
if ! command -v curl &> /dev/null; then
    echo "📦 Installing curl for health checks..."
    apk add --no-cache curl
fi

# Set proper permissions
echo "🔐 Setting permissions..."
chown -R nginx:nginx /usr/share/nginx/html
chmod -R 755 /usr/share/nginx/html

echo "🚀 Starting nginx server..."

# Execute the main command
exec "$@" 