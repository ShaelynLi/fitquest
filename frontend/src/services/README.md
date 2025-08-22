# Services

This directory contains service layer files including Firebase configuration and API services.

## Structure
```
services/
├── firebase/        # Firebase configuration and initialization
│   ├── firebaseConfig.js
│   ├── index.js
│   └── README.md
├── api/             # API service functions
├── auth/            # Authentication service functions
└── README.md        # This file
```

## Usage
```javascript
// Import Firebase services
import { auth, db } from '../services/firebase';

// Import API services
import { userService } from '../services/api/userService';
``` 