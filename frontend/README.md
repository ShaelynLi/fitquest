# FitQuest Frontend

Mobile application built with React Native and Expo, providing gamified fitness and nutrition tracking.

**Note: This project currently supports iOS only. Android is not supported at this time.**

---

## Tech Stack

### Core Framework
- **React Native** 0.81.4 - Mobile framework
- **Expo** ~54.0.11 - React Native toolchain
- **React** 19.1.0 - UI library

### Navigation
- **@react-navigation/native** 7.1.17 - Navigation core
- **@react-navigation/native-stack** 7.3.26 - Stack navigation
- **@react-navigation/bottom-tabs** 7.4.7 - Bottom tab navigation
- **@react-navigation/material-top-tabs** 7.3.7 - Top tab navigation

### UI & Components
- **@expo/vector-icons** 15.0.2 - Icon library
- **react-native-svg** 15.12.1 - SVG support
- **react-native-gesture-handler** 2.28.0 - Gesture handling

### Maps & Location
- **expo-location** 19.0.7 - GPS and location services
- **react-native-maps** 1.20.1 - Map component

### Camera & Scanning
- **expo-camera** 17.0.8 - Camera access
- **expo-barcode-scanner** 13.0.1 - Barcode scanning

### Data Persistence
- **@react-native-async-storage/async-storage** 2.2.0 - Local storage

### Firebase
- **firebase** 12.1.0 - Firebase SDK (Auth, Firestore)

### Fonts
- **@expo-google-fonts/montserrat** 0.4.2 - Modern sans-serif
- **@expo-google-fonts/press-start-2p** 0.4.0 - Pixel art style

---

## Installation

### Prerequisites

1. **Node.js** 18+ and npm
2. **Expo CLI**: 
   ```bash
   npm install -g @expo/cli
   ```
3. **iOS Development**:
   - macOS with Xcode (required for simulator)
4. **Physical Device Testing**:
   - iOS: [Expo Go](https://apps.apple.com/app/expo-go/id982107779)

### Setup Steps

#### 1. Navigate to Frontend Directory
```bash
cd frontend
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Configure Firebase

Edit `src/config/firebaseConfig.js`:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

#### 4. Configure Backend API

Create `.env` file:

```env
# Backend API base URL
BACKEND_URL=http://localhost:8000

# For physical device testing (replace with your machine's IP)
# BACKEND_URL=http://192.168.1.10:8000

# Production
# BACKEND_URL=https://your-api-url.com
```

**Find your machine's IP:**
```bash
# macOS/Linux
ifconfig | grep "inet "

# Windows
ipconfig
```

#### 5. Start Development Server

```bash
npm start
# or
npx expo start --go
```

#### 6. Run on Device

**Option 1: iOS Simulator** (macOS only)
```bash
npx expo start --ios
```

**Option 2: Physical iOS Device**
1. Install Expo Go app on iPhone
2. Scan QR code from terminal
3. Ensure iPhone and computer on same WiFi

---

## Project Structure

```
frontend/
├── src/
│   ├── App.js                   # App entry, navigation setup
│   │
│   ├── screens/                 # Application screens
│   │   ├── WelcomeScreen.js
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js
│   │   ├── OnboardingScreen.js
│   │   ├── EmailVerificationScreen.js
│   │   ├── HomeScreen.js
│   │   ├── ProfileScreen.js
│   │   ├── HistoryScreen.js
│   │   ├── SummaryScreen.js
│   │   ├── PlusScreen.js
│   │   ├── FoodSearchScreen.js
│   │   └── PetCollectionScreen.js
│   │
│   ├── tabs/                    # Bottom tab content
│   │   ├── FoodTab.js
│   │   ├── RunTab.js
│   │   └── OverviewTab.js
│   │
│   ├── components/              # Reusable components
│   │   ├── food/
│   │   │   └── BarcodeScanner.js
│   │   ├── run/
│   │   │   ├── PreRunScreen.js
│   │   │   ├── ActiveRunScreen.js
│   │   │   └── RunSummaryScreen.js
│   │   ├── gamification/
│   │   │   └── BlindBoxModal.js
│   │   └── ui/
│   │       └── PetComponent.js
│   │
│   ├── context/                 # React Context state management
│   │   ├── AuthContext.js       # Authentication state
│   │   ├── GamificationContext.js  # Game data
│   │   ├── DailyStatsContext.js    # Daily statistics
│   │   ├── DailyFoodContext.js     # Food data
│   │   └── RunContext.js           # Run tracking state
│   │
│   ├── services/                # External services
│   │   └── api.js              # Backend API client
│   │
│   ├── config/                  # Configuration
│   │   └── firebaseConfig.js   # Firebase setup
│   │
│   ├── constants/               # Constants
│   │   └── screens.js          # Screen name constants
│   │
│   ├── data/                    # Static data
│   │   └── pets.js             # Pet definitions
│   │
│   ├── utils/                   # Utility functions
│   │   └── mockData.js         # Mock data
│   │
│   └── theme.js                 # App theme and global styles
│
├── assets/                      # Static assets
│   ├── icon.png
│   ├── splash-icon.png
│   ├── adaptive-icon.png
│   └── favicon.png
│
├── ios/                         # iOS native code
├── app.json                     # Expo configuration
├── package.json                 # Dependencies and scripts
├── babel.config.js              # Babel configuration
└── index.js                     # App registration
```

---

## Key Features

### Authentication System
- Email/password registration and login
- Email verification flow
- Persistent login (AsyncStorage)
- Automatic token refresh

**Files**: `src/context/AuthContext.js`, `src/screens/Login*.js`

### GPS Workout Tracking
- Real-time GPS location tracking
- Distance, pace, time calculation
- Route visualization (maps)
- Calories estimation

**Files**: `src/tabs/RunTab.js`, `src/components/run/`, `src/context/RunContext.js`

### Nutrition Logging
- Food search (FatSecret API)
- Barcode scanning
- Custom food entry
- Meal categorization (breakfast/lunch/dinner/snacks)
- Daily nutrition summary

**Files**: `src/tabs/FoodTab.js`, `src/screens/FoodSearchScreen.js`, `src/components/food/BarcodeScanner.js`

### Gamification System
- Pixel art pet collection
- XP system and pet leveling
- Pet evolution (level-based)
- Interactive animations

**Files**: `src/context/GamificationContext.js`, `src/components/ui/PetComponent.js`, `src/screens/PetCollectionScreen.js`

---

## Building for Production

### Using EAS Build

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure
eas build:configure

# Build iOS
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

---

## Troubleshooting

### Metro Bundler Errors

**Problem**: "Unable to resolve module"

**Fix**:
```bash
npx expo start --clear
rm -rf node_modules && npm install
```

### Network Connection Errors

**Check**:
1. Backend running? `curl http://localhost:8000/health`
2. Correct `BACKEND_URL` in `.env`?
3. Same WiFi network?

**Fix**:
```bash
# Use tunnel mode
npx expo start --tunnel
```

### iOS Simulator Issues

**Problem**: "Could not find iPhone simulator"

**Fix**:
1. Open Xcode
2. Preferences → Locations
3. Select Command Line Tools
4. Restart terminal

### iOS Permission Errors

**Location/Camera permission denied**

**Fix**: Always request permissions:
```javascript
const { status } = await Location.requestForegroundPermissionsAsync();
if (status !== 'granted') {
  Alert.alert('Permission Denied', 'Please enable location services');
}
```

**Note**: Ensure proper permission configurations in `Info.plist` for iOS

---

## Resources

- [React Native Docs](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)
- [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/)
- [Firebase JavaScript SDK](https://firebase.google.com/docs/web/setup)

---

## Support

For issues:
1. Check [Troubleshooting](#troubleshooting) section
2. Review Expo Metro Bundler logs
3. Verify backend API connection
4. Ensure all permissions granted
5. Check `.env` configuration
