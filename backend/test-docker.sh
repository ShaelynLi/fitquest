#!/bin/bash

# Test Docker build and run locally

set -e

echo "🐳 Testing Docker build locally..."

# Build the image
echo "📦 Building Docker image..."
docker build -t fitquest-api-local .

# Run the container
echo "🚀 Starting container on port 8080..."
docker run -p 8080:8080 \
  -e ENVIRONMENT=development \
  -e DEBUG=true \
  -e FIREBASE_API_KEY="${FIREBASE_API_KEY}" \
  -e FIREBASE_PROJECT_ID="${FIREBASE_PROJECT_ID}" \
  -e CORS_ORIGINS="http://localhost:3000,http://localhost:19006" \
  --name fitquest-test \
  --rm \
  fitquest-api-local

echo "✅ Container is running!"
echo "🔗 Test URL: http://localhost:8080"
echo "🏥 Health check: http://localhost:8080/health"
echo "📚 API docs: http://localhost:8080/docs"
