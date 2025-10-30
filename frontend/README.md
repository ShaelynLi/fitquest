# FitQuest Frontend

Mobile application built with React Native and Expo, providing gamified fitness and nutrition tracking with Pokemon-themed rewards.

Platform Support: iOS Only  
This application currently supports iOS devices and simulators. Android is not supported at this time.

---

## Tech Stack

### Core Framework
- React Native 0.81.4 - Mobile framework
- Expo ~54.0.11 - React Native toolchain
- React 19.1.0 - UI library

### Navigation
- @react-navigation/native 7.1.17 - Navigation core
- @react-navigation/native-stack 7.3.26 - Stack navigation
- @react-navigation/bottom-tabs 7.4.7 - Bottom tab navigation
- @react-navigation/material-top-tabs 7.3.7 - Top tab navigation

### UI & Components
- @expo/vector-icons 15.0.2 - Icon library (Ionicons)
- react-native-svg 15.12.1 - SVG support for circular progress
- react-native-gesture-handler 2.28.0 - Gesture handling
- react-native-safe-area-context 5.6.0 - Safe area insets
- react-native-screens 4.16.0 - Native screen optimization

### Maps & Location
- expo-location 19.0.7 - GPS and location services
- react-native-maps 1.20.1 - Map component for route visualization

### Camera & Scanning
- expo-camera 17.0.8 - Camera access
- expo-barcode-scanner 13.0.1 - Barcode scanning for food items

### Data Persistence
- @react-native-async-storage/async-storage 2.2.0 - Local storage

### Firebase
- firebase 12.1.0 - Firebase SDK (Authentication, Firestore)

### Utilities
- @react-native-community/datetimepicker 8.4.4 - Date/time picker
- expo-notifications 0.32.12 - Push notifications
- react-native-dotenv 3.4.11 - Environment variable management

### Fonts
- @expo-google-fonts/montserrat 0.4.2 - Modern sans-serif for UI
- @expo-google-fonts/press-start-2p 0.4.0 - Pixel art style for headings

---

## Installation

### Prerequisites

- macOS (required for iOS development)
- Node.js 18+ and npm
- Xcode 14+ (for iOS simulator)
- Expo CLI: `npm install -g @expo/cli`
- Expo Go app (for testing on physical devices)

### Setup Steps

1. Navigate to frontend directory
   ```bash
   cd frontend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Configure environment variables
   
   Create `frontend/.env`:
   ```env
   # Backend API URL
   BACKEND_URL=http://localhost:8000
   
   # For physical device testing, use your machine's local IP:
   # BACKEND_URL=http://192.168.1.10:8000
   ```

4. Start development server
   ```bash
   npm start
   ```

5. Run on device
   ```bash
   # iOS Simulator (macOS only)
   npx expo start --ios
   
   # Or press 'i' in the terminal after running npm start
   
   # Physical iOS device: Scan QR code with Expo Go app
   ```

---

## Project Architecture

### Directory Structure

```
frontend/src/
├── App.js                          # Root navigation and app entry
├── theme.js                        # Aura Health design system
│
├── components/                     # Reusable UI components
│   ├── index.js                   # Component exports
│   ├── food/                      # Food-related components
│   │   └── BarcodeScanner.js      # Barcode scanning functionality
│   ├── gamification/              # Gamification components
│   │   └── BlindBoxModal.js       # Blind box opening animation
│   ├── run/                       # Run tracking components
│   │   ├── PreRunScreen.js        # Pre-run setup and weekly stats
│   │   ├── ActiveRunScreen.js     # Live GPS tracking screen
│   │   └── RunSummaryScreen.js    # Post-run summary and route
│   └── ui/                        # General UI components
│       └── PetComponent.js        # Pokemon pet display and animation
│
├── screens/                       # Main application screens
│   ├── WelcomeScreen.js           # Initial welcome screen
│   ├── LoginScreen.js             # User login
│   ├── RegisterScreen.js          # New user registration
│   ├── EmailVerificationScreen.js # Email verification prompt
│   ├── OnboardingScreen.js        # User profile setup
│   ├── HomeScreen.js              # Container for nested tabs
│   ├── PlusScreen.js              # Quick actions
│   ├── ProfileScreen.js           # User profile and settings
│   ├── EditProfileScreen.js       # Edit user information
│   ├── ChangePasswordScreen.js    # Password change
│   ├── SettingsScreen.js          # App settings
│   ├── NotificationsScreen.js     # Notification preferences
│   ├── FoodSearchScreen.js        # Food search and barcode scan
│   ├── PetCollectionScreen.js     # Pokemon collection view
│   ├── SummaryScreen.js           # Activity summary with calendar
│   └── HistoryScreen.js           # Workout history
│
├── tabs/                          # Nested tab components (Home screen)
│   ├── index.js                   # Tab exports
│   ├── OverviewTab.js             # Pet dashboard and daily stats
│   ├── FoodTab.js                 # Meal logging interface
│   └── RunTab.js                  # GPS run tracking interface
│
├── context/                       # React Context providers
│   ├── index.js                   # Context exports
│   ├── AuthContext.js             # Authentication and user state
│   ├── RunContext.js              # Run tracking and GPS state
│   ├── DailyStatsContext.js       # Daily activity statistics
│   ├── DailyFoodContext.js        # Daily nutrition tracking
│   └── GamificationContext.js     # Pet collection and blind boxes
│
├── services/                      # API and external services
│   ├── index.js                   # Service exports
│   └── api.js                     # Backend API integration
│
├── config/                        # Configuration files
│   ├── index.js                   # Config exports
│   └── firebaseConfig.js          # Firebase client setup
│
├── constants/                     # Application constants
│   ├── index.js                   # Constants exports
│   └── screens.js                 # Screen name constants
│
├── data/                          # Static data
│   └── pets.js                    # Pokemon collection data
│
└── utils/                         # Utility functions
    └── mockData.js                # Mock food data (fallback)
```

### Navigation Structure

3-Tab Bottom Navigation:
- Home: Main dashboard with nested top tabs
  - Overview: Pokemon companion, daily stats, activity summary
  - Food: Meal logging with calorie/macro tracking
  - Run: GPS workout tracking and weekly statistics
- Plus: Quick actions (Log Food, Start Run)
- Profile: User settings, edit profile, change password, notifications

Modal Screens (Stack):
- Food Search
- Pokemon Collection
- Summary (Activity Timeline)
- History

### State Management

Context Providers:
1. AuthContext: User authentication, login/logout, token refresh
2. RunContext: GPS tracking, run metrics, route points
3. DailyStatsContext: Today's workout statistics
4. DailyFoodContext: Today's meal and nutrition data
5. GamificationContext: Pokemon collection, blind boxes, companion

### Design System

Aura Health Theme (theme.js):
- Colors: Aurora gradient palette (pink, blue, purple) with light grey backgrounds
- Typography: Dual-font system
  - Headings: Press Start 2P (pixel art)
  - Body: Montserrat (clean sans-serif)
- Spacing: Consistent 4px base scale
- Components: Card-based layout with subtle shadows

---

## Environment Configuration

### Development

Local Backend:
```env
BACKEND_URL=http://localhost:8000
```

Physical Device Testing:
```env
# Replace with your machine's local IP
BACKEND_URL=http://192.168.1.10:8000
```

### Production

Update `src/services/api.js` with production backend URL:
```javascript
const API_BASE_URL = 'https://your-production-api.web.app';
```

---

## Development Workflow

### Start Development Server
```bash
cd frontend
npm start
```

### Run on iOS Simulator
```bash
npx expo start --ios
# Or press 'i' after npm start
```

### Run on Physical Device
1. Install Expo Go from App Store
2. Scan QR code from terminal
3. Ensure device is on same WiFi network

### Clear Cache
```bash
npx expo start --clear
```

---

## Building for Production

### Using EAS Build (Recommended)

1. Install EAS CLI
   ```bash
   npm install -g eas-cli
   ```

2. Configure EAS
   ```bash
   eas build:configure
   ```

3. Build for iOS
   ```bash
   eas build --platform ios
   ```

4. Submit to App Store
   ```bash
   eas submit --platform ios
   ```

---

## Troubleshooting

### Common Issues

1. **Metro bundler errors**
   ```bash
   # Clear cache and restart
   npx expo start --clear
   ```

2. **Module not found errors**
   ```bash
   # Reinstall dependencies
   rm -rf node_modules
   npm install
   ```

3. **iOS Simulator not opening**
   ```bash
   # Ensure Xcode is installed
   xcode-select --install
   
   # Reset simulator
   xcrun simctl erase all
   ```

4. **Backend connection issues**
   - Check `BACKEND_URL` in `.env`
   - Verify backend is running: `curl http://localhost:8000/health`
   - For physical device, use local IP instead of localhost

5. **Firebase errors**
   - Check `src/config/firebaseConfig.js` credentials
   - Verify Firebase project is properly configured

---

## Testing Checklist

- [ ] User registration and email verification
- [ ] Login and logout
- [ ] GPS tracking on run
- [ ] Food search and barcode scanning
- [ ] Meal logging with nutrition data
- [ ] Blind box earning and opening
- [ ] Pokemon collection display
- [ ] Profile editing
- [ ] Password change
- [ ] Summary calendar view

---

## Performance Optimization

- **AsyncStorage**: Local caching for offline support
- **Lazy Loading**: Screens load on demand
- **Image Optimization**: Pokemon sprites optimized for mobile
- **GPS Throttling**: Location updates every 1 second during runs
- **Context Memoization**: Prevent unnecessary re-renders

---

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnavigation.org/)
- [Firebase for React Native](https://rnfirebase.io/)
- [React Navigation](https://reactnavigation.org/)

---

## Support

For issues:
1. Check console logs in Metro bundler
2. Verify backend connection: Check network tab in Expo Dev Tools
3. Test API endpoints: Use `http://localhost:8000/docs`
4. Check Firebase Console for auth/database errors
5. Review Context state with React DevTools

---

## License

This project is part of COMP90018 - Mobile Computing Systems Programming at the University of Melbourne.
