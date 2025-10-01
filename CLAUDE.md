Done. I have updated the `CLAUDE.md` file to reflect the new, streamlined 3-tab navigation structure.

The changes have been made to the `Architecture` and `Code Architecture` sections to provide a clear and accurate guide for the AI.

Here is the updated `CLAUDE.md` file:

-----

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FitQuest is a gamified fitness MVP combining a running tracker, food logger, and user management with a collectible pet system. The goal is to build a complete, functional mobile app that motivates users by allowing them to unlock "blind boxes" containing unique pets through their health activities.

## Architecture

### Frontend (React Native + Expo)

  - **Framework**: React Native with Expo SDK 53
  - **Navigation**: 3-tab bottom navigation: **Home**, **Plus** (quick actions), **Profile**. The Home screen contains a nested top tab navigator for core features (**Overview**, **Food**, **Run**).
  - **Authentication**: Firebase Auth with AuthContext state management
  - **Styling**: A clean, modern, data-driven UI ("Aura Health" system) with fun, illustrative pet designs. See the full **UI/UX Design System** section for detailed guidance.
  - **Key Features**: Real-time GPS tracking, meal logging, blind box reward system.

### Backend (FastAPI + Firebase)

  - **Framework**: FastAPI with automatic API docs
  - **Database**: Firestore for user data, workouts, meals, and pet collection
  - **Authentication**: Firebase Admin SDK token validation
  - **API Modules**: `/auth`, `/workouts`, `/meals`, `/pets` endpoints

## UI/UX Design System: "Aura Health"

This section defines the visual and interaction design for the FitQuest app.

### Philosophy: Sophisticated Data + Collectible Fun

The FitQuest UI combines a clean, modern, data-driven interface with the fun and anticipation of a collectible toy system (like Pop Mart). The modern UI acts as a sophisticated "gallery" or "display case" for the beautifully designed, illustrative pets.

  - **Modern Shell:** The app's structure (cards, navigation, charts, forms) should feel premium, clean, and airy.
  - **Illustrative Content:** The creative elements (pets, collection series icons, badges) should have a high-quality, illustrative art style, making them feel like true collectibles.

### Core Principles

  * **Clarity First:** Data must be presented in a way that is instantly understandable.
  * **Airy & Uncluttered:** Use generous whitespace to create a calm, focused user experience that lets the pet artwork stand out.
  * **Sophisticated Elegance:** The design should feel premium, achieved through refined typography, soft shadows, and clean lines.

### Layout & Spacing

  * **Foundation:** The UI is built on a **card-based architecture**.
  * **Background:** Use a very light, neutral grey for the main screen background (e.g., `#F5F5F7` in light mode, `#121212` in dark mode).
  * **Cards:** All content modules are placed within cards.
  * **Spacing:**
      * **Inter-Card Margin:** Maintain a generous margin between cards (16-24px).
      * **Intra-Card Padding:** Use significant padding inside each card (16-20px).

### Color Palette

  * **Base Palette (Light Mode):**
      * **Background:** Light Grey (`#F5F5F7`)
      * **Cards:** Pure White (`#FFFFFF`)
      * **Primary Text:** Near Black / Dark Grey (`#1A1A1A`)
      * **Secondary Text / Labels:** Medium Grey (`#8E8E93`)
  * **Accent & Gradient Palette ("Aurora"):**
      * For modern UI elements like charts, graphs, and progress bars.
      * **Description:** Gradients should be soft, blurred, and mesh-like.
      * **Key Colors:** Vibrant Blue (`#007AFF`), Soft Violet (`#AF52DE`), Bright Teal (`#5AC8FA`), Warm Red/Pink (`#FF2D55`), Energetic Green (`#34C759`).

### Typography System (Dual-Font)

  * **Font 1: Headings (Serif Font)**
      * **Use Case:** For major screen titles (e.g., "My Collection," "Workout Summary") to provide an elegant, editorial feel.
      * **Font:** A sophisticated Serif font (e.g., Lora, Merriweather; or system fonts like `New York` on iOS).
  * **Font 2: UI & Data (Sans-Serif Font)**
      * **Use Case:** For ALL other text: card titles, data points, numbers, labels, buttons, and body text.
      * **Font:** A highly legible, modern Sans-Serif font (e.g., Inter, SF Pro, Roboto).
      * **Hierarchy:** Use various weights (Bold for numbers, Regular for labels) to create a clear data hierarchy.

### Component Styling

  * **Cards:**
      * **Corner Radius:** Significant corner radius (16-20px) for a soft, modern feel.
      * **Shadows:** A very subtle, diffuse drop shadow to lift cards off the background.
  * **Buttons & Tabs:**
      * Use pill-shaped containers for selected tabs or primary buttons.
  * **Icons:**
      * **Style:** Pet and collection-related icons should be illustrative, matching the pet art style. Navigational and standard UI icons should be minimalist, clean, line-art style.

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

(Backend and Frontend commands remain the same)

## MVP Features Implementation Guide

### 1\. Running Tracker (GPS-based)

**Files**: `frontend/src/screens/home/RunTab.js`, `backend/app/api/workout.py`

  - Real-time GPS tracking with distance, pace, duration.
  - Post-run summary that rewards the user with a **Blind Box**.
  - Workout data stored in Firestore.

### 2\. Food Logger

**Files**: `frontend/src/screens/home/FoodTab.js`, `backend/app/api/meals.py`

  - Meal logging with calorie/macro tracking.
  - Daily nutrition goals and progress.
  - Rewards a **Blind Box** for consistent logging (e.g., logging for 3 consecutive days).

### 3\. Collectible Pet System (Blind Box)

**Files**: `frontend/src/components/PetComponent.js`, `frontend/src/screens/home/OverviewTab.js`, `frontend/src/screens/CollectionScreen.js`

  - Users earn "Blind Box" items by completing fitness activities.
  - An "open box" animation reveals a randomly awarded pet.
  - Pets are organized into themed series for collection (e.g., "Forest Friends Series 1," "Cosmic Critters Series").
  - A collection gallery ("Pet Dex") displays all discovered and undiscovered pets, showing series progress.
  - **Future Feature:** Some pets will be evolvable. The data model should support this.

### 4\. User Management

**Files**: `frontend/src/context/AuthContext.js`, `backend/app/api/auth.py`

  - Firebase authentication (email/password).
  - User profiles with fitness goals and pet collection stats.
  - Account settings and data management.

## Code Architecture

### Frontend Structure (React Native)

```
frontend/src/
├── App.js                 # Root navigation setup (Bottom Tabs) + auth routing
├── context/AuthContext.js # User authentication state
├── screens/              # Main screens for the bottom tab navigator
│   ├── HomeScreen.js     # Container for the nested top tab navigator
│   ├── PlusScreen.js     # A modal or screen for quick actions
│   └── ProfileScreen.js  # User management & collection gallery
├── components/           # Reusable UI components
│   └── PetComponent.js   # Pet rendering + animations
├── tabs/                 # Screens/components for the nested top tabs on Home
│   ├── OverviewTab.js    # Pet dashboard + daily stats summary
│   ├── FoodTab.js        # Meal logging interface
│   └── RunTab.js         # GPS tracking interface
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

All constants in `theme.js` must align with the principles defined in the **UI/UX Design System**.

```js
import { colors, spacing, typography } from '../theme';

// Use theme values
backgroundColor: colors.surface,
padding: spacing.md,
fontFamily: typography.heading, // For Serif font
fontFamily: typography.body,    // For Sans-Serif font
```

(Configuration, API Docs etc. remain the same)

## MVP Development Workflow

### Adding New Features

1.  **Define data schemas** in `backend/app/schemas/` (e.g., Pet, CollectionSeries, BlindBox).
2.  **Create API endpoints** in `backend/app/api/` (e.g., `POST /pets/open-blind-box`).
3.  **Register routes** in `main.py`.
4.  **Build frontend screens** within the new navigation structure, using the UI/UX Design System.
5.  **Integrate with API** via `services/api.js`.
6.  **Test end-to-end** functionality.

### Pet Collection & Reward System

  - Define triggers in the backend for awarding blind boxes (e.g., complete a run over 1km, log meals for X days).
  - When a user opens a box, the backend randomly assigns a pet based on pre-defined probabilities for each series (common, rare, etc.).
  - The user's pet collection is stored in their Firestore document.
  - Pet data model should include fields like: `petId`, `name`, `series`, `rarity`, `is_evolvable`, `evolution_stage`.

## Success Metrics for MVP

The MVP is complete when users can:

1.  **Register/login** and set fitness goals.
2.  **Track GPS runs** with real-time metrics.
3.  **Log meals** with calorie/macro data.
4.  **Earn and open blind boxes** by completing activities.
5.  **View their pet collection**, track series progress, and see which pets are yet to be discovered.
6.  **See daily/weekly progress** on their dashboard.