# FitQuest Backend API

FastAPI-based RESTful API providing authentication, workout tracking, nutrition logging, and gamification features for the FitQuest mobile app.

---

## Tech Stack

- **FastAPI** 0.116.1 - Web framework
- **Uvicorn** 0.35.0 - ASGI server
- **Firebase Admin SDK** 7.1.0 - Authentication & Firestore
- **HTTPX** 0.28.1 - HTTP client
- **Pydantic** - Data validation
- **Python** 3.9+

---

## Setup Instructions

### 1. Create Virtual Environment

```bash
cd backend
python -m venv venv

# Activate
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

Main packages:
- `fastapi` - Web framework
- `uvicorn[standard]` - ASGI server
- `firebase-admin` - Firebase SDK
- `httpx` - Async HTTP client
- `python-dotenv` - Environment management

### 3. Firebase Configuration

**Get Service Account Key:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Project Settings → Service Accounts
3. Generate New Private Key
4. Download JSON file

**Place Service Account File:**
```bash
mkdir -p config
mv ~/Downloads/your-firebase-key.json config/firebase_service_account.json
```

**Get Firebase Web API Key:**
1. Firebase Console → Project Settings → General
2. Copy Web API Key

### 4. Environment Variables

Create `config/.env`:

```env
# Firebase (Required)
FIREBASE_API_KEY=your_firebase_web_api_key
FIREBASE_PROJECT_ID=your_firebase_project_id

# CORS
CORS_ORIGINS=*  # Development only

# FatSecret API (Optional - for food search)
FATSECRET_CLIENT_ID=your_client_id
FATSECRET_CLIENT_SECRET=your_client_secret

# App Settings
ENVIRONMENT=development
DEBUG=true
PORT=8000
```

### 5. Start Server

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Server runs at `http://localhost:8000`

**Available endpoints:**
- API root: http://localhost:8000/
- Interactive docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

---

## Project Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI app entry, CORS, route registration
│   │
│   ├── api/                    # API route modules
│   │   ├── auth.py            # Authentication (register, login, verify)
│   │   ├── users.py           # User management
│   │   ├── workout.py         # Workout tracking
│   │   └── foods.py           # Food search and nutrition logging
│   │
│   ├── core/                   # Core configuration
│   │   ├── settings.py        # App settings, env variable loading
│   │   └── firebase.py        # Firebase Admin SDK initialization
│   │
│   ├── schemas/                # Pydantic data models
│   │   ├── users.py           # User-related models
│   │   ├── workout.py         # Workout-related models
│   │   └── foods.py           # Food-related models
│   │
│   ├── services/               # External service integrations
│   │   └── fatsecret.py       # FatSecret API client
│   │
│   ├── dependencies/           # FastAPI dependencies
│   │   └── auth.py            # Authentication dependency (JWT verification)
│   │
│   └── utils/                  # Utility functions
│       └── workout_helpers.py  # Workout data processing
│
├── config/                     # Configuration files (not in git)
│   ├── .env                   # Environment variables
│   └── firebase_service_account.json  # Firebase credentials
│
├── Dockerfile                  # Docker image configuration
├── deploy.sh                   # Cloud Run deployment script
├── test-docker.sh             # Local Docker testing
├── requirements.txt           # Python dependencies
├── requirements-prod.txt      # Production dependencies
├── DEPLOYMENT.md              # Deployment guide
└── README.md                  # This file
```

---

## Development

### Running the Server

**Development mode with auto-reload:**
```bash
uvicorn app.main:app --reload
```

**Specify host and port:**
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Without reload (production-like):**
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

## Docker

### Build Image

```bash
docker build -t fitquest-api .
```

### Run Container

```bash
docker run -p 8080:8080 \
  -e FIREBASE_API_KEY=your_key \
  -e FIREBASE_PROJECT_ID=your_project \
  fitquest-api
```

### Test Locally

```bash
./test-docker.sh
```

---

## Deployment

### Google Cloud Run

**Prerequisites:**
- Install [gcloud CLI](https://cloud.google.com/sdk/docs/install)
- GCP project with billing enabled
- Enable Cloud Run and Container Registry APIs

**Deploy:**
```bash
# Configure project
export PROJECT_ID="your-gcp-project-id"
gcloud config set project $PROJECT_ID

# Update deploy.sh with your PROJECT_ID

# Deploy
./deploy.sh
```

**Set environment variables in Cloud Run:**
```bash
gcloud run services update fitquest-api \
  --region us-central1 \
  --set-env-vars FIREBASE_API_KEY=your_key \
  --set-env-vars FIREBASE_PROJECT_ID=your_project \
  --set-env-vars CORS_ORIGINS=https://your-app.web.app
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed guide.

---

## Troubleshooting

### Firebase initialization fails

**Error**: `Could not automatically determine credentials`

**Fix**:
```bash
# Verify file exists
ls -la config/firebase_service_account.json

# Check file permissions
chmod 600 config/firebase_service_account.json

# Validate JSON format
python -m json.tool < config/firebase_service_account.json
```

### CORS errors from frontend

**Fix**:
1. Check `CORS_ORIGINS` in `.env`
2. Ensure it includes frontend URL
3. Restart server

### Port already in use

**Fix**:
```bash
# Use different port
uvicorn app.main:app --port 8001 --reload

# Or kill process using port 8000
lsof -ti:8000 | xargs kill  # macOS/Linux
```

### FatSecret API not configured

This is a warning, not an error. Food search will be unavailable without FatSecret credentials. To enable:
1. Sign up at [FatSecret Platform](https://platform.fatsecret.com/)
2. Get API credentials
3. Add to `.env`

---

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Firebase Admin Python SDK](https://firebase.google.com/docs/admin/setup)
- [Cloud Firestore Docs](https://firebase.google.com/docs/firestore)
- [FatSecret API Docs](https://platform.fatsecret.com/api/)
- [Google Cloud Run Docs](https://cloud.google.com/run/docs)

---

## Support

For issues:
1. Check server logs in terminal
2. Test Firebase connection: `curl http://localhost:8000/auth/firebase-health`
3. Verify environment variables in `config/.env`
4. Check API docs: `http://localhost:8000/docs`
