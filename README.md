# FitQuest - Gamified Health Companion

> **Make fitness fun, one pixel pet at a time.**  
> FitQuest is a gamified health companion that turns workouts and meals into a collectible adventure — keeping users motivated through play, not pressure.

A React Native mobile app powered by a FastAPI backend, blending precise fitness tracking, smart nutrition logging, and an original pixel-art pet collection system.

**Platforms**: iOS & Android (via Expo Go)  
**Tech Stack**: React Native + FastAPI + Firebase + Cloud Run

---

### Personal Fork for Portfolio

As full-stack developer and product co-lead of [FitQuest](https://github.com/1uoyuuu/COMP90018-T8-G2), I owned end-to-end delivery of core features including:
- GPS workout tracking with real-time metrics
- Email authentication & profile management
- Complete frontend UX (onboarding, home, logs)
- Gamification engine: rarity-based blind boxes, animated pet reveals
- Cloud architecture (Firebase Auth/Firestore + Cloud Run)
- Initial Product Requirements Document (PRD)

> **个人作品集说明**  
> FitQuest 游戏化健康 App 的全栈开发者兼产品联合负责人。主导核心功能的端到端实现，包括运动追踪、用户认证、完整用户界面（注册引导、主页、运动/饮食记录页）及虚拟宠物收集系统。设计云架构（Firebase + Cloud Run），撰写初始产品需求文档（PRD），并打造游戏化引擎：从稀有度盲盒机制到宠物开箱动画体验，全程融合行为洞察与交互设计。

## Deployment

### Development Environment (Daily Use)

Local development setup:
- Backend: Mac server (`uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`)
- Frontend: Expo Go on iOS
- Database: Firebase (Cloud Firestore + Authentication)

### Production Environment

Cloud deployment:
- Backend: Google Cloud Run (australia-southeast1)
- URL: https://fitquest-api-404135822508.australia-southeast1.run.app
- Status: Deployed September 19, 2025
- Cost: ~$0/month (scaled to zero)

See [backend/DEPLOYMENT.md](backend/DEPLOYMENT.md) for deployment details.

---

## Features

### Workout Tracking
- Real-time GPS tracking with precise location data
- Live metrics: distance, pace, duration, and calories burned
- Route visualization on interactive map
- Complete workout history with detailed statistics
- Weekly statistics tracking (total runs, distance, time)
- Automatic data sync to Firebase

### Nutrition Logging
- FatSecret food database integration with millions of items
- Barcode scanning for quick food entry
- Meal categorization (breakfast, lunch, dinner, snacks)
- Macro tracking: calories, protein, carbohydrates, and fats
- Daily nutrition summaries and progress tracking
- Custom food entry support

### Gamification System
- Collectible pixel-art pets with animated sprites (inspired by classic monster-collection games)
- Blind box reward system based on running distance goals
- Customizable distance targets per reward
- Active companion display on home screen
- Interactive pet animations
- Collection tracking with rarity-based organization

### User Management
- Email authentication with verification
- Profile management (name, gender, birthday, weight, height)
- Password change functionality
- Fitness goal setting (weight loss, muscle gain, maintenance)
- Notification preferences
- Comprehensive dashboard view

### Data Visualization
- Daily stats overview cards
- Activity timeline with calendar view
- Weekly running statistics
- Nutrition progress charts
- Blind box progress indicator
- Lifetime distance tracking

---

## Quick Start

For reviewers: Production API is already deployed at the URL above. This guide covers local development setup.

### Prerequisites

- macOS (required to run iOS simulator; Android works on Windows/Linux/macOS)
- Node.js 18+ and npm
- Python 3.9+
- Xcode (for iOS simulator)
- Firebase project with Authentication and Firestore enabled
- Expo CLI: `npm install -g @expo/cli`

### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure Firebase
# 1. Place firebase_service_account.json in backend/config/
# 2. Create backend/config/.env with:
#    FIREBASE_API_KEY=your_key
#    FIREBASE_PROJECT_ID=your_project
#    CORS_ORIGINS=*
#    FATSECRET_CLIENT_ID=your_id (optional)
#    FATSECRET_CLIENT_SECRET=your_secret (optional)

# Start server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend will run at `http://localhost:8000`
- API docs: `http://localhost:8000/docs`

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Configure environment
# Create frontend/.env with:
#   BACKEND_URL=http://localhost:8000
# For physical device, use your machine's IP:
#   BACKEND_URL=http://192.168.1.10:8000

# Start dev server
npm start

# Launch the app:
# - On iOS simulator (macOS): press 'i' or run `npx expo start --ios`
# - On Android emulator: press 'a' or run `npx expo start --android` (if configured)
# - On any physical device (iOS or Android): scan the QR code with Expo Go
```

---

## Running the Full Application

### Terminal 1: Start Backend
```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Terminal 2: Start Frontend
```bash
cd frontend
npm start
```

### Open App
- **iOS Simulator**: Press `i` or run `npx expo start --ios` (macOS only)
- **Android Emulator**: Press `a` or run `npx expo start --android` (requires Android SDK setup)
- **Physical Device (iOS or Android)**: Scan the QR code displayed in the terminal using the **Expo Go** app

---

## Project Structure

```
COMP90018-T8-G2/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── api/         # API routes
│   │   ├── core/        # Configuration
│   │   ├── schemas/     # Data models
│   │   └── services/    # External services
│   └── config/          # Environment files
│
├── frontend/            # React Native app
│   ├── src/
│   │   ├── screens/    # App screens
│   │   ├── components/ # UI components
│   │   ├── context/    # State management
│   │   └── services/   # API client
│   └── assets/         # Images, fonts
│
└── docs/               # Documentation
```

---

## Environment Variables

### Backend (`backend/config/.env`)
```env
FIREBASE_API_KEY=your_firebase_web_api_key
FIREBASE_PROJECT_ID=your_firebase_project_id
CORS_ORIGINS=*
FATSECRET_CLIENT_ID=your_client_id
FATSECRET_CLIENT_SECRET=your_client_secret
```

### Frontend (`frontend/.env`)
```env
BACKEND_URL=http://localhost:8000
```

---

## Testing the Application

1. Start Backend: Terminal 1 - Run backend server
2. Start Frontend: Terminal 2 - Run `npm start`
3. Open App: Launch on simulator or scan QR code
4. Register Account: Create new user
5. Verify Email: Check inbox for verification
6. Login: Access main app
7. Test Features:
   - Record a workout (GPS tracking)
   - Log food (search or barcode scan)
   - View pet and stats
   - Check summary screen

---

## Deployment

### Backend (Google Cloud Run)
```bash
cd backend
./deploy.sh
```
See `backend/DEPLOYMENT.md` for details.

### Frontend (EAS Build)
```bash
cd frontend
eas build --platform ios
eas submit --platform ios

# Currently building for iOS only via EAS
# Android EAS build is possible but not yet submitted to Play Store
```

---

## Documentation

- [Backend README](backend/README.md) - Backend setup, API documentation, and structure
- [Frontend README](frontend/README.md) - Frontend setup, dependencies, and architecture
- [Deployment Guide](backend/DEPLOYMENT.md) - Cloud Run deployment, monitoring, and troubleshooting

---

## Tech Stack

Frontend: React Native, Expo, React Navigation, Firebase SDK  
Backend: FastAPI, Firebase Admin SDK, Firestore  
Services: Firebase Auth, Cloud Firestore, FatSecret API  
Deployment: Google Cloud Run, Docker

---

## License

This project is part of COMP90018 - Mobile Computing Systems Programming at the University of Melbourne.

---

## Support

For issues:
1. Verify environment variables in `backend/config/.env` and `frontend/.env`
2. Check backend is running: `curl http://localhost:8000/health`
3. Review API docs: `http://localhost:8000/docs`
4. Check console logs in both backend and frontend terminals
5. Ensure iOS simulator/device is properly set up

---

## Testing Production API

Production environment is accessible without local setup:

```bash
# Health check
curl https://fitquest-api-404135822508.australia-southeast1.run.app/health

# API documentation
open https://fitquest-api-404135822508.australia-southeast1.run.app/docs
```

## Additional Documentation

- [backend/README.md](backend/README.md) - Backend setup and API documentation
- [frontend/README.md](frontend/README.md) - Frontend architecture and setup
- [backend/DEPLOYMENT.md](backend/DEPLOYMENT.md) - Cloud deployment guide
