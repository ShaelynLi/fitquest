# Firebase Configuration

This directory contains the Firebase configuration and initialization files for the React Native/Expo application.

## 📁 Files Overview

```
firebase/
├── firebaseConfig.js  # Firebase configuration with environment variables
├── index.js          # Firebase initialization and service exports
└── README.md         # This documentation file
```

## 🔧 Configuration Files

### `firebaseConfig.js`
Contains the Firebase project configuration using environment variables for security.

**Features:**
- Uses `react-native-dotenv` for environment variable management
- Imports Firebase configuration from `.env` file
- Initializes Firebase app and analytics
- Secure configuration handling

**Usage:**
```javascript
// Import environment variables
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  // ... other config
} from '@env';

// Use in Firebase configuration
const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  // ... other settings
};
```

### `index.js`
Main Firebase initialization file that exports configured services.

**Exports:**
- `auth` - Firebase Authentication service
- `db` - Firestore Database service
- `app` - Default Firebase app instance

**Usage:**
```javascript
// Import Firebase services in your components
import { auth, db } from '../firebase';

// Use authentication
const user = auth.currentUser;

// Use database
const docRef = doc(db, 'collection', 'document');
```

## 🔐 Environment Variables

The Firebase configuration uses the following environment variables from `.env`:

| Variable | Description | Example |
|----------|-------------|---------|
| `FIREBASE_API_KEY` | Firebase API key | `AIzaSy...` |
| `FIREBASE_AUTH_DOMAIN` | Authentication domain | `project.firebaseapp.com` |
| `FIREBASE_PROJECT_ID` | Project identifier | `comp90018-t8-g2` |
| `FIREBASE_STORAGE_BUCKET` | Storage bucket URL | `project.appspot.com` |
| `FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID | `123456789` |
| `FIREBASE_APP_ID` | Application ID | `1:123456789:web:abc123` |
| `FIREBASE_MEASUREMENT_ID` | Analytics measurement ID | `G-XXXXXXXXXX` |

## 🚀 Setup Instructions

### 1. Environment Variables
Create a `.env` file in the frontend root directory:

```env
FIREBASE_API_KEY=your_api_key_here
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 2. Babel Configuration
Ensure `babel.config.js` includes the dotenv plugin:

```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
      }]
    ]
  };
};
```

### 3. Import in Components
```javascript
// Import Firebase services
import { auth, db } from '../firebase';

// Use in your component
function MyComponent() {
  useEffect(() => {
    // Check authentication state
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        console.log('User is signed in:', user.email);
      }
    });

    return unsubscribe;
  }, []);

  return <View>...</View>;
}
```

## 🔒 Security Best Practices

### Environment Variables
- ✅ Never commit `.env` files to version control
- ✅ Use `.env.example` for documentation
- ✅ Keep API keys secure and private
- ✅ Rotate keys regularly

### Firebase Security Rules
- ✅ Configure proper Firestore security rules
- ✅ Set up Storage security rules
- ✅ Enable appropriate authentication providers
- ✅ Implement proper data validation

## 📊 Available Services

### Authentication (`auth`)
```javascript
import { auth } from '../firebase';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut 
} from 'firebase/auth';

// Sign in
const userCredential = await signInWithEmailAndPassword(auth, email, password);

// Sign up
const userCredential = await createUserWithEmailAndPassword(auth, email, password);

// Sign out
await signOut(auth);
```

### Firestore Database (`db`)
```javascript
import { db } from '../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  getDocs 
} from 'firebase/firestore';

// Read document
const docRef = doc(db, 'users', userId);
const docSnap = await getDoc(docRef);

// Write document
await setDoc(doc(db, 'users', userId), {
  name: 'John Doe',
  email: 'john@example.com'
});

// Query collection
const q = query(collection(db, 'posts'));
const querySnapshot = await getDocs(q);
```

### Storage (if needed)
```javascript
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Upload file
const storageRef = ref(storage, 'users/' + userId + '/avatar.jpg');
const snapshot = await uploadBytes(storageRef, file);

// Get download URL
const downloadURL = await getDownloadURL(storageRef);
```

## 🐛 Troubleshooting

### Common Issues

1. **Environment variables not loading**
   ```bash
   # Check .env file exists
   ls -la .env
   
   # Restart development server
   npx expo start --clear
   ```

2. **Firebase initialization errors**
   ```javascript
   // Check configuration
   console.log('Firebase config:', firebaseConfig);
   
   // Verify environment variables
   console.log('API Key:', FIREBASE_API_KEY);
   ```

3. **Import errors**
   ```javascript
   // Ensure correct import path
   import { auth, db } from './firebase';  // Relative path
   ```

## 📚 Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [React Native Firebase](https://rnfirebase.io/)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Environment Variables in Expo](https://docs.expo.dev/guides/environment-variables/)

## 🔄 Updates

When updating Firebase configuration:
1. Update environment variables in `.env`
2. Test configuration in development
3. Update security rules if needed
4. Monitor Firebase Console for any issues 