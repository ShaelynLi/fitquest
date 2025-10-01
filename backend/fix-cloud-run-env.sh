#!/bin/bash

# Fix Cloud Run Environment Variables
# This script updates the Cloud Run service with correct Firebase API key

echo "🔧 Updating Cloud Run environment variables..."

# Configuration
SERVICE_NAME="fitquest-api"
REGION="australia-southeast1"

# Firebase Configuration from .env file
FIREBASE_API_KEY="AIzaSyDy9GtiRkUoyWW1ekBdsalzepUbq4cU3bI"
FIREBASE_PROJECT_ID="comp90018-t8-g2"

echo "Service: $SERVICE_NAME"
echo "Region: $REGION"
echo "Firebase Project: $FIREBASE_PROJECT_ID"

# Update the Cloud Run service with environment variables
gcloud run services update $SERVICE_NAME \
  --region $REGION \
  --set-env-vars="FIREBASE_API_KEY=$FIREBASE_API_KEY,FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID,ENVIRONMENT=production,CORS_ORIGINS=*" \
  --quiet

if [ $? -eq 0 ]; then
    echo "✅ Cloud Run service updated successfully!"
    echo "🔍 Testing the API..."
    
    # Wait a moment for deployment
    sleep 5
    
    # Test the API
    echo "Testing /api/health endpoint:"
    curl -s https://comp90018-t8-g2.web.app/api/health | jq '.' || echo "Health check failed"
    
    echo ""
    echo "Testing /api/auth/login endpoint:"
    curl -s -X POST https://comp90018-t8-g2.web.app/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{"email":"test@example.com","password":"testpass"}' | jq '.' || echo "Login test failed"
    
else
    echo "❌ Failed to update Cloud Run service"
    exit 1
fi

echo ""
echo "🎉 Environment variables updated! Please test the mobile app now."
