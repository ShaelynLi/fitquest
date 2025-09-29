# Frontend Architecture

This document outlines the clean, organized frontend architecture for the FitQuest app.

## Directory Structure

```
src/
├── App.js                          # Root navigation and app entry
├── theme.js                        # Aura Health design system
│
├── components/                     # Reusable UI components
│   ├── index.js                   # Component exports
│   ├── food/                      # Food-related components
│   │   └── BarcodeScanner.js      # Barcode scanning functionality
│   ├── run/                       # Run tracking components
│   │   ├── PreRunScreen.js        # Pre-run setup screen
│   │   ├── ActiveRunScreen.js     # Live GPS tracking screen
│   │   └── RunSummaryScreen.js    # Post-run summary screen
│   └── ui/                        # General UI components
│       └── PetComponent.js        # Pet interaction component
│
├── screens/                       # Main application screens
│   ├── HomeScreen.js              # Container for nested tabs
│   ├── PlusScreen.js              # Quick actions screen
│   ├── ProfileScreen.js           # User profile and settings
│   ├── FoodSearchScreen.js        # Food search and selection
│   ├── PokedexScreen.js           # Pet collection screen
│   ├── LoginScreen.js             # Authentication screen
│   └── RegisterScreen.js          # User registration screen
│
├── tabs/                          # Nested tab components (Home screen)
│   ├── index.js                   # Tab exports
│   ├── OverviewTab.js             # Pet dashboard and daily stats
│   ├── FoodTab.js                 # Meal logging interface
│   └── RunTab.js                  # GPS run tracking interface
│
├── context/                       # React Context providers
│   ├── index.js                   # Context exports
│   ├── AuthContext.js             # Authentication state management
│   └── RunContext.js              # Run tracking state management
│
├── services/                      # API and external services
│   ├── index.js                   # Service exports
│   └── api.js                     # Backend API integration
│
├── config/                        # Configuration files
│   ├── index.js                   # Config exports
│   └── firebaseConfig.js          # Firebase setup
│
├── constants/                     # Application constants
│   ├── index.js                   # Constants exports
│   └── screens.js                 # Screen name constants
│
├── utils/                         # Utility functions and helpers
│   └── mockData.js                # Mock data for development
│
└── hooks/                         # Custom React hooks (empty, ready for future use)
```

## Architecture Principles

### 1. **Separation of Concerns**
- **Components**: Reusable UI elements grouped by domain (food, run, ui)
- **Screens**: Main application views with specific navigation responsibilities
- **Tabs**: Nested navigation components within the Home screen
- **Context**: Global state management for authentication and run tracking
- **Services**: External API integrations and data fetching

### 2. **Clean Import Structure**
- Each directory has an `index.js` for centralized exports
- Components can be imported cleanly: `import { PetComponent } from '../components'`
- Services use consistent naming: `import { api } from '../services'`

### 3. **Component Organization**
- **Domain-based grouping**: food/, run/, ui/ subdirectories
- **Feature-specific**: Each major feature has its own component group
- **Reusability**: Common UI components in ui/ directory

### 4. **Navigation Architecture**
- **3-tab bottom navigation**: Home, Plus, Profile
- **Nested top tabs in Home**: Overview, Food, Run
- **Modal screens**: Pokedex, FoodSearch as stack screens

### 5. **State Management**
- **AuthContext**: User authentication and session management
- **RunContext**: GPS tracking, run sessions, and metrics
- **Local state**: Component-specific state for UI interactions

## File Naming Conventions

- **PascalCase**: All component files (e.g., `PetComponent.js`)
- **camelCase**: Service and utility files (e.g., `api.js`, `mockData.js`)
- **lowercase**: Configuration files (e.g., `firebaseConfig.js`)

## Import/Export Patterns

### Clean Imports
```javascript
// Components
import { PetComponent, BarcodeScanner } from '../components';

// Tabs
import { OverviewTab, FoodTab, RunTab } from '../tabs';

// Context
import { useAuth, useRun } from '../context';

// Services
import { api } from '../services';
```

### Centralized Exports
Each directory maintains an `index.js` file for clean exports:
```javascript
// components/index.js
export { default as PetComponent } from './ui/PetComponent';
export { default as BarcodeScanner } from './food/BarcodeScanner';
```

## Design System Integration

All components use the **Aura Health Design System** defined in `theme.js`:
- **Colors**: Aurora gradient palette with light grey backgrounds
- **Typography**: Dual-font system (Serif headings, Sans-serif UI)
- **Spacing**: Consistent spacing scale with generous margins
- **Components**: Card-based architecture with subtle shadows

## Future Scalability

The architecture is designed for easy scaling:
- **hooks/**: Ready for custom React hooks
- **components/auth/**: Prepared for authentication components
- **Domain-based organization**: Easy to add new feature domains
- **Centralized exports**: Simple to add new components and services

This clean architecture ensures maintainability, scalability, and developer experience while following React Native best practices.