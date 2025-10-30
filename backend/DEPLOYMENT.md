# FitQuest API - Cloud Run Deployment Guide

This guide explains how to deploy the FitQuest API to Google Cloud Run with Firebase Hosting as a reverse proxy.

## Current Status

Production service deployed and operational:
- Service: `fitquest-api` 
- Region: `australia-southeast1`
- URL: https://fitquest-api-404135822508.australia-southeast1.run.app
- Deployed: September 19, 2025
- Cost: ~$0/month (scaled to zero)

Quick test:
```bash
curl https://fitquest-api-404135822508.australia-southeast1.run.app/health
```

## Architecture

```
Frontend (Firebase Hosting) → Cloud Run (Python API) → Firebase (Auth + Firestore)
```

## Prerequisites

1. Google Cloud Platform Account
   - Create a GCP project
   - Enable billing
   - Install [gcloud CLI](https://cloud.google.com/sdk/docs/install)

2. Docker
   - Install Docker Desktop
   - Ensure Docker is running

3. Firebase Project
   - Same Firebase project used for local development
   - Authentication and Firestore already configured

## Deployment Steps

### Step 1: Configure GCP Project

```bash
# Set your project ID
export PROJECT_ID="your-gcp-project-id"
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
```

### Step 2: Update Deployment Script

Edit `deploy.sh` and update:
```bash
PROJECT_ID="your-actual-gcp-project-id"
```

### Step 3: Set Environment Variables

For production deployment, you'll need to set these in Cloud Run:

```bash
ENVIRONMENT=production
DEBUG=false
FIREBASE_API_KEY=your_firebase_web_api_key
FIREBASE_PROJECT_ID=your_firebase_project_id
CORS_ORIGINS=https://your-app.web.app,https://your-app.firebaseapp.com
```

### Step 4: Deploy to Cloud Run

```bash
cd backend
./deploy.sh
```

This script will:
- Build the Docker image
- Push to Google Container Registry
- Deploy to Cloud Run
- Configure service settings

### Step 5: Configure Firebase Service Account

For production, set up service account authentication:

1. In GCP Console, go to IAM & Admin > Service Accounts
2. Create a new service account with Firebase Admin SDK permissions
3. Generate a JSON key
4. In Cloud Run console, set environment variable:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
   ```

## Local Testing

Test the Docker build locally:

```bash
cd backend
docker build -t fitquest-api .
docker run -p 8080:8080 fitquest-api
```

This will build and run the container locally on port 8080.

## Configuration

### Environment Variables

| Variable | Description | Local | Production |
|----------|-------------|-------|------------|
| `ENVIRONMENT` | App environment | `development` | `production` |
| `DEBUG` | Debug mode | `true` | `false` |
| `PORT` | Server port | `8000` | `8080` |
| `FIREBASE_API_KEY` | Firebase Web API key | From `.env` | Cloud Run env var |
| `FIREBASE_PROJECT_ID` | Firebase project ID | From `.env` | Cloud Run env var |
| `CORS_ORIGINS` | Allowed origins | `*` | Specific domains |

### CORS Configuration

Update `main.py` with your actual domains:

```python
production_origins = [
    "https://your-app.web.app",
    "https://your-app.firebaseapp.com",
    "https://your-custom-domain.com",
]
```

## Firebase Hosting Setup

Create `firebase.json` in your project root:

```json
{
  "hosting": {
    "public": "frontend/dist",
    "rewrites": [
      {
        "source": "/api/**",
        "run": {
          "serviceId": "fitquest-api",
          "region": "us-central1"
        }
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

## Monitoring

### Health Checks

- Basic health: `https://your-service-url/health`
- API status: `https://your-service-url/`
- API docs: `https://your-service-url/docs`

### Cloud Run Console

Monitor your service at:
`https://console.cloud.google.com/run`

Key metrics to watch:
- Request count
- Request latency
- Error rate
- Memory usage
- CPU utilization

## Security

### Production Checklist

- [ ] Set `DEBUG=false` in production
- [ ] Configure specific CORS origins (not `*`)
- [ ] Use service account for Firebase authentication
- [ ] Enable Cloud Run security features
- [ ] Set up proper IAM roles
- [ ] Configure VPC if needed

### Environment Variables Security

Never commit sensitive data:
- Firebase service account JSON
- API keys
- Database credentials

Use Cloud Run environment variables or Secret Manager.

## Troubleshooting

### Common Issues

1. Build Fails
   ```bash
   # Check Dockerfile syntax
   docker build -t test .
   ```

2. Service Won't Start
   ```bash
   # Check logs
   gcloud run services logs read fitquest-api --region us-central1
   ```

3. CORS Errors
   - Verify CORS_ORIGINS environment variable
   - Check frontend domain configuration

4. Firebase Auth Issues
   - Verify service account permissions
   - Check GOOGLE_APPLICATION_CREDENTIALS path

### Useful Commands

```bash
# View service details
gcloud run services describe fitquest-api --region us-central1

# Update environment variables
gcloud run services update fitquest-api \
  --region us-central1 \
  --set-env-vars KEY=VALUE

# View logs
gcloud run services logs read fitquest-api --region us-central1 --limit 50

# Delete service
gcloud run services delete fitquest-api --region us-central1
```

## Scaling

Cloud Run automatically scales based on traffic:

- Min instances: 0 (scales to zero when not in use)
- Max instances: 10 (adjust based on expected traffic)
- Concurrency: 80 requests per instance
- Memory: 512Mi (increase if needed)
- CPU: 1 vCPU (increase for compute-heavy operations)

## Cost Optimization

- Use minimum resources for development
- Scale to zero when not in use
- Monitor usage in GCP Console
- Set up billing alerts

## CI/CD Integration

For automated deployments, integrate with:
- GitHub Actions
- Cloud Build
- GitLab CI/CD

Example GitHub Action:
```yaml
name: Deploy to Cloud Run
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: google-github-actions/setup-gcloud@v0
      - run: |
          cd backend
          ./deploy.sh
```

## Support

For issues:
1. Check Cloud Run logs
2. Verify environment variables
3. Test locally with Docker
4. Check Firebase configuration
5. Review CORS settings
