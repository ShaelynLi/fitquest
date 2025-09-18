# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FitQuest is a gamified fitness MVP combining running tracker, food logger, pixel pet collection, and user management. The goal is to build a complete, functional mobile app that motivates users through pet companionship tied to health activities.

## Architecture

### Frontend (React Native + Expo)
- **Framework**: React Native with Expo SDK 53
- **Navigation**: 5-tab bottom navigation: Home (pet dashboard), Run (GPS tracker), Plus (quick actions), Food (nutrition logger), Profile (user management)
- **Authentication**: Firebase Auth with AuthContext state management
- **Styling**: Pixel-art aesthetic with PressStart2P font + modern UI elements
- **Key Features**: Real-time GPS tracking, meal logging, pet progression system

### Backend (FastAPI + Firebase)
- **Framework**: FastAPI with automatic API docs
- **Database**: Firestore for user data, workouts, meals, pet progress
- **Authentication**: Firebase Admin SDK token validation
- **API Modules**: `/auth`, `/workouts`, `/meals` endpoints

## Development Commands

### Quick Start (Full MVP)
```bash
# Terminal 1 - Backend
cd backend
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 - Frontend
cd frontend
npm start
# Then press 'i' for iOS simulator or 'a' for Android
```

### Backend Commands
```bash
cd backend
python3 -m venv .venv                    # One-time setup
source .venv/bin/activate                # Every session
pip install "fastapi" "uvicorn[standard]" "python-dotenv" "firebase-admin" "httpx" "pydantic[email]"
uvicorn app.main:app --reload            # Start development server
```

### Frontend Commands
```bash
cd frontend
npm install                              # One-time setup
npm start                               # Start Expo dev server
npx expo start --ios                    # Launch iOS simulator
npx expo start --android                # Launch Android emulator
npx expo start --clear                  # Clear cache if issues
```

### Testing & Quality
**Currently no test framework configured.** To implement:
- Frontend: `npm install --save-dev jest @testing-library/react-native`
- Backend: `pip install pytest pytest-asyncio`
- Add test scripts to package.json and run with `npm test`

## MVP Features Implementation Guide

### 1. Running Tracker (GPS-based)
**Files**: `frontend/src/screens/RunScreen.js`, `backend/app/api/workout.py`
- Real-time GPS tracking with distance, pace, duration
- Post-run summary with route visualization
- Workout data stored in Firestore
- XP rewards for pet progression

### 2. Food Logger
**Files**: `frontend/src/screens/FoodScreen.js`, `backend/app/api/meals.py`
- Meal logging with calorie/macro tracking
- Search and barcode scanning for foods
- Daily nutrition goals and progress
- XP rewards for consistent logging

### 3. Pixel Pet Collection
**Files**: `frontend/src/components/PetComponent.js`, `frontend/src/screens/HomeScreen.js`
- Pet companions that level up from user activities
- Evolution system based on fitness milestones
- Collection gallery ("Pet Dex") with unlock requirements
- Pixel-art animations and interactions

### 4. User Management
**Files**: `frontend/src/context/AuthContext.js`, `backend/app/api/auth.py`
- Firebase authentication (email/password)
- User profiles with fitness goals and preferences
- Progress tracking and achievement system
- Account settings and data management

## Code Architecture

### Frontend Structure (React Native)
```
frontend/src/
├── App.js                 # Navigation setup + auth routing
├── context/AuthContext.js # User authentication state
├── screens/              # Main feature screens
│   ├── HomeScreen.js     # Pet dashboard + daily stats
│   ├── RunScreen.js      # GPS tracking interface
│   ├── FoodScreen.js     # Meal logging interface
│   └── ProfileScreen.js  # User management
├── components/           # Reusable UI components
│   └── PetComponent.js   # Pet rendering + animations
├── services/api.js       # Backend API integration
└── theme.js             # Design system constants
```

### Backend Structure (FastAPI)
```
backend/app/
├── main.py              # FastAPI app + CORS + route registration
├── api/                 # Feature-specific endpoints
│   ├── auth.py         # User registration/login
│   ├── workout.py      # GPS run tracking
│   └── meals.py        # Food logging
├── schemas/            # Data validation models
├── core/               # Settings + Firebase config
└── dependencies/       # Auth middleware
```

### Theme System (Consistent UI)
Always use `theme.js` constants instead of hardcoded values:
```js
import { colors, spacing, typography } from '../theme';

// Use theme values
backgroundColor: colors.surface,
padding: spacing.md,
fontFamily: typography.heading,
```

## Configuration Setup

### Required Environment Files

**Frontend** (`frontend/.env`):
```env
BACKEND_URL=http://localhost:8000
```

**Backend** (`backend/config/.env`):
```env
FIREBASE_API_KEY=your_firebase_web_api_key
FIREBASE_PROJECT_ID=your_firebase_project_id
CORS_ORIGINS=*
```

### Firebase Setup (Required)
1. Create Firebase project with Authentication + Firestore
2. Download service account JSON → `backend/config/firebase_service_account.json`
3. Enable email/password authentication in Firebase console

## MVP Development Workflow

### Adding New Features
1. **Define data schemas** in `backend/app/schemas/`
2. **Create API endpoints** in `backend/app/api/`
3. **Register routes** in `main.py`
4. **Build frontend screens** using theme system
5. **Integrate with API** via `services/api.js`
6. **Test end-to-end** functionality

### Pet Progression System
- Running activities → XP points → Pet leveling
- Food logging consistency → Evolution unlocks
- Achievement milestones → New pet species
- Store progress in Firestore user documents

### Common Development Issues

**"Network request failed"**: Check `BACKEND_URL` matches running server
**"Firebase admin error"**: Verify service account JSON placement
**"Metro bundler stuck"**: Run `npx expo start --clear`
**"Virtual env not found"**: Run `source backend/.venv/bin/activate`

## API Documentation

When backend is running, visit:
- **API Docs**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/`

Key endpoints for MVP:
- `POST /auth/register` - User signup
- `POST /auth/login` - User signin
- `POST /workouts/start` - Begin GPS tracking
- `POST /workouts/finish` - Complete run + save data
- `GET /meals/` - Get user's meal history
- `POST /meals/` - Log new meal

## Success Metrics for MVP

The MVP is complete when users can:
1. **Register/login** and set fitness goals
2. **Track GPS runs** with real-time metrics
3. **Log meals** with calorie/macro data
4. **Watch pets level up** from activities
5. **View collection progress** and unlock new pets
6. **See daily/weekly progress** on dashboard

Focus on core functionality over polish - a working end-to-end experience that demonstrates the gamification concept.