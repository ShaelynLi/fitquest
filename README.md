# FitQuest - Gamified Health Companion

A React Native mobile app with FastAPI backend combining fitness tracking and nutrition logging with a pixel-art pet collection game.

**Platform Support: iOS Only**  
This application currently supports iOS devices and simulators only. Android is not supported at this time.

---

## Features

### 🏃 Workout Tracking
- **Real-time GPS Tracking**: Track your runs with precise GPS location data
- **Live Metrics**: Distance, pace, duration, and calories burned in real-time
- **Route Visualization**: View your running route on an interactive map
- **Workout History**: Access all your past workouts with detailed statistics
- **Multiple Units**: Support for both metric (km) and imperial (miles) systems

### 🍎 Nutrition Logging
- **Food Database Search**: Access to FatSecret's comprehensive food database with millions of items
- **Barcode Scanning**: Quickly add foods by scanning product barcodes
- **Meal Categorization**: Organize foods by breakfast, lunch, dinner, and snacks
- **Macro Tracking**: Monitor calories, protein, carbohydrates, and fats
- **Daily Summaries**: View your daily nutrition totals and progress toward goals
- **Custom Foods**: Add your own food items with custom nutrition values

### 🎮 Gamification System
- **Virtual Pet Companions**: Collect and raise pixel-art pets
- **XP and Leveling**: Earn experience points by logging meals and completing workouts
- **Pet Evolution**: Pets evolve through stages (Egg → Young → Adult → Ultimate) based on your level
- **Interactive Animations**: Engage with your pet through tap interactions
- **Pet Collection**: Discover and collect multiple unique pet species
- **Achievement System**: Unlock badges for reaching fitness milestones

### 👤 User Management
- **Email Authentication**: Secure registration and login with email verification
- **Profile Management**: Track personal metrics (height, weight, age, activity level)
- **Goal Setting**: Set and track fitness goals (weight loss, muscle gain, maintenance)
- **Personalized Dashboard**: View all your stats and pet progress in one place

### 📊 Data Visualization
- **Daily Stats Cards**: Quick overview of today's activities
- **Weekly/Monthly Trends**: Track your progress over time
- **Nutrition Charts**: Visual breakdown of macronutrients
- **Progress Indicators**: Clear visualization of goal achievement

---

## Quick Start

### Prerequisites

- **macOS** (required for iOS development)
- Node.js 18+ and npm
- Python 3.9+
- **Xcode** (for iOS simulator)
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

# Run on iOS device/simulator
npx expo start --ios       # iOS simulator (macOS only)
# Or scan QR code with Expo Go app on physical iOS device
```

---

## Running the Full Application

### Terminal 1: Start Backend
```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
uvicorn app.main:app --reload
```

### Terminal 2: Start Frontend
```bash
cd frontend
npm start
```

### Open App
- **iOS Simulator**: Press `i` or `npx expo start --ios` (macOS only)
- **Physical iOS Device**: Scan QR code with Expo Go app

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

1. **Start Backend**: Terminal 1 - Run backend server
2. **Start Frontend**: Terminal 2 - Run `npm start`
3. **Open App**: Launch on simulator or scan QR code
4. **Register Account**: Create new user
5. **Verify Email**: Check inbox for verification
6. **Login**: Access main app
7. **Test Features**:
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
```

---

## Documentation

- [Backend README](backend/README.md) - Backend setup and structure
- [Frontend README](frontend/README.md) - Frontend setup and structure
- [Product Requirements](docs/product_requirement.md) - Feature specifications
- [Pet Evolution System](docs/pet_evolution_system.md) - Gamification mechanics
- [Deployment Guide](backend/DEPLOYMENT.md) - Cloud Run deployment

---

## Tech Stack

**Frontend**: React Native, Expo, React Navigation, Firebase SDK  
**Backend**: FastAPI, Firebase Admin SDK, Firestore  
**Services**: Firebase Auth, Cloud Firestore, FatSecret API  
**Deployment**: Google Cloud Run, Docker

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
