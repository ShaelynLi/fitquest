# FitQuest - Gamified Health Companion

A React Native mobile app with FastAPI backend that combines fitness tracking and nutrition logging with a pixel-art pet collection game.

## Architecture

- **Frontend**: React Native with Expo (iOS/Android)
- **Backend**: FastAPI with Firebase Authentication & Firestore
- **Database**: Google Firestore
- **Authentication**: Firebase Auth with custom backend validation

## 📋 Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- Firebase project with Authentication and Firestore enabled
- Expo CLI (`npm install -g @expo/cli`)

## Quick Start

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment:**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install "fastapi" "uvicorn[standard]" "python-dotenv" "firebase-admin" "httpx" "pydantic[email]"
   ```

4. **Configure Firebase:**
   - Create `backend/config/` directory
   - Add your Firebase service account JSON as `backend/config/firebase_service_account.json`
   - Create `backend/config/.env` with:
     ```env
     FIREBASE_API_KEY=your_web_api_key
     FIREBASE_PROJECT_ID=your_project_id
     CORS_ORIGINS=*
     ```

5. **Start the server:**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

   The API will be available at `http://localhost:8000`
   - API docs: `http://localhost:8000/docs`
   - Health check: `http://localhost:8000/`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   Create `frontend/.env` with:
   ```env
   BACKEND_URL=http://localhost:8000
   ```
   
   For physical device testing, use your machine's IP:
   ```env
   BACKEND_URL=http://192.168.1.10:8000
   ```

4. **Start the development server:**
   ```bash
   npm start
   # or
   npx expo start
   ```

5. **Run on device/simulator:**
   - **iOS Simulator**: `npx expo start --ios`
   - **Android Emulator**: `npx expo start --android`
   - **Physical Device**: Scan QR code with Expo Go app

## 🔧 Development

### Backend API Endpoints

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user info
- `POST /workouts/start` - Start workout session
- `POST /workouts/add-points` - Add GPS points to workout
- `POST /workouts/finish` - Finish workout session
- `GET /workouts/` - List user workouts
- `GET /meals/` - List user meals
- `POST /meals/` - Create meal
- `PATCH /meals/{id}` - Update meal
- `DELETE /meals/{id}` - Delete meal

### Frontend Structure

```
frontend/src/
├── App.js                 # Main app with navigation
├── context/
│   └── AuthContext.js     # Authentication state management
├── screens/
│   ├── LoginScreen.js     # Login form
│   ├── RegisterScreen.js  # Registration form
│   ├── HomeScreen.js      # Dashboard (placeholder)
│   ├── RunScreen.js       # Running tracker (placeholder)
│   ├── QuestsScreen.js    # Quest system (placeholder)
│   ├── CollectionScreen.js # Pet collection (placeholder)
│   └── ProfileScreen.js   # User profile (placeholder)
└── services/
    ├── api.js             # Backend API client
    └── firebase/          # Firebase configuration
```

## 🎮 Features (Planned)

- **Authentication**: Email/password registration and login
- **Running Tracker**: GPS-based run tracking with distance, pace, and calories
- **Nutrition Logging**: Meal tracking with macro calculations
- **Pet Collection**: Pixel-art pet system with evolution mechanics
- **Quest System**: Daily/weekly challenges for earning gems
- **Achievements**: Milestone badges and progress tracking

## 🐛 Troubleshooting

### Backend Issues

- **Firebase credentials error**: Ensure `firebase_service_account.json` is in `backend/config/`
- **Port already in use**: Change port with `--port 8001`
- **CORS errors**: Check `CORS_ORIGINS` in `.env` includes your frontend URL

### Frontend Issues

- **Metro bundler errors**: Clear cache with `npx expo start --clear`
- **Network errors**: Verify `BACKEND_URL` in `.env` matches running backend
- **Expo Go connection**: Ensure device and computer are on same network

### Common Commands

```bash
# Backend
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload

# Frontend
cd frontend
npm start
npx expo start --clear  # Clear cache
```

## 📱 Testing

1. Start backend server
2. Start frontend development server
3. Open app on device/simulator
4. Register a new account or login
5. Navigate through the 5-tab interface

## Environment Variables

### Backend (`backend/config/.env`)
```env
FIREBASE_API_KEY=your_firebase_web_api_key
FIREBASE_PROJECT_ID=your_firebase_project_id
CORS_ORIGINS=*
```

### Frontend (`frontend/.env`)
```env
BACKEND_URL=http://localhost:8000
```

## License

This project is part of COMP90018 - Mobile Computing Systems Programming.
