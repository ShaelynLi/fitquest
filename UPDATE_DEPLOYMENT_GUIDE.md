# FitQuest Update Deployment Guide

## Daily Update & Deployment Workflow

### Scenario 1: Backend Code Changes Only

```bash
# 1. Ensure local code is up-to-date
git pull --rebase

# 2. Navigate to backend directory
cd backend

# 3. One-click deployment script (Recommended)
./deploy.sh

# Or manual deployment:
# gcloud builds submit --tag gcr.io/$GOOGLE_CLOUD_PROJECT/fitquest-api
# gcloud run deploy fitquest-api \
#   --image gcr.io/$GOOGLE_CLOUD_PROJECT/fitquest-api \
#   --platform managed \
#   --region australia-southeast1 \
#   --allow-unauthenticated \
#   --min-instances=0 --max-instances=3
```

### Scenario 2: Frontend Code Changes

```bash
# 1. Ensure local code is up-to-date
git pull --rebase

# 2. Frontend doesn't need special deployment
# React Native app will get updates directly from your dev machine or Expo server
# Just restart the development server:
cd frontend
npm start
```

### Scenario 3: Firebase Hosting Configuration Changes

```bash
# 1. Ensure local code is up-to-date
git pull --rebase

# 2. Deploy Firebase Hosting
firebase deploy --only hosting
```

### Scenario 4: Both Backend and Hosting Configuration Changes

```bash
# 1. Ensure local code is up-to-date
git pull --rebase

# 2. Deploy backend
cd backend
./deploy.sh

# 3. Deploy hosting
cd ..
firebase deploy --only hosting
```

## Quick Deployment Scripts (Recommended)

### Using the Existing deploy.sh Script

```bash
# Navigate to backend directory
cd backend

# Execute deployment script
./deploy.sh
```

This script will automatically:
- Build Docker image
- Push to Google Container Registry
- Deploy to Cloud Run
- Set environment variables

## Important Notes

### Environment Variables Update

If you modified environment variables (like API keys), update the Cloud Run service:

```bash
# Use the fix script to update environment variables
cd backend
./fix-cloud-run-env.sh
```

### Dependencies Update

If you modified `requirements.txt` or `requirements-prod.txt`:

```bash
# Rebuild and deploy
cd backend
./deploy.sh
```

### Database Schema Updates

If you modified Firestore data structure, ensure:
1. New code is backward compatible
2. Or update database first, then deploy code

## Pre-Deployment Testing

### Local Docker Testing (Highly Recommended)

```bash
cd backend
./test-docker.sh
```

### API Testing

```bash
# Test health check
curl https://comp90018-t8-g2.web.app/api/health

# Test auth API
curl https://comp90018-t8-g2.web.app/api/auth/health
```

## Mobile App Updates

### React Native/Expo App

- **Development Phase**: Restart `npm start`, no redeployment needed
- **Production Phase**: Need to rebuild app and publish to App Store/Google Play

## Complete Team Collaboration Workflow

### Developer A Made Changes:

```bash
# 1. After development completion
git add .
git commit -m "feat: add new feature"
git push

# 2. Deploy to production
cd backend
./deploy.sh
```

### Developer B Wants Latest Code:

```bash
# 1. Pull latest code
git pull --rebase

# 2. If there are new npm dependencies
cd frontend && npm install

# 3. If there are new Python dependencies
cd backend && pip install -r requirements.txt

# 4. Restart development server
cd frontend && npm start
```

## Quick Command Reference

```bash
# Get latest code and deploy backend
git pull --rebase && cd backend && ./deploy.sh

# Get latest code and restart frontend
git pull --rebase && cd frontend && npm start

# Check deployment status
curl https://comp90018-t8-g2.web.app/api/health

# View Cloud Run service details
gcloud run services describe fitquest-api --region australia-southeast1

# View real-time logs
gcloud logs tail --service=fitquest-api
```

## Troubleshooting

### Deployment Failed

```bash
# Check Docker build
cd backend
docker build -t fitquest-api:local .

# Check local run
./test-docker.sh

# Check Cloud Run status
gcloud run services describe fitquest-api --region australia-southeast1
```

### API Not Responding

```bash
# Check service status
curl -v https://comp90018-t8-g2.web.app/api/health

# Check environment variables
cd backend
./fix-cloud-run-env.sh
```

## Version Management Recommendations

### Use Semantic Versioning

```bash
# Feature updates
git commit -m "feat: add user avatar upload feature"

# Bug fixes  
git commit -m "fix: resolve login page crash issue"

# Documentation updates
git commit -m "docs: update deployment guide"
```

### Use Branch Management

```bash
# Develop new feature
git checkout -b feature/user-avatar
# ... development ...
git push -u origin feature/user-avatar

# Merge to main branch
git checkout main
git merge feature/user-avatar
git push
```

---

## Summary

**Most commonly used command combinations:**

```bash
# Before starting work each day
git pull --rebase

# After completing development and going live
git add . && git commit -m "describe changes" && git push
cd backend && ./deploy.sh

# Restart frontend development server
cd frontend && npm start
```

This gives you a complete update and deployment workflow!
