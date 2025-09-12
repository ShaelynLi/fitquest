## FitQuest: Detailed Screen Descriptions
### 1. Onboarding Flow

This is the user's first impression, designed to be quick, engaging, and purposeful.

* **Splash Screen**: A dynamic FitQuest logo with a running pixel-art character followed by a small companion pet. The tagline reads: "Your health adventure begins."
* **Login/Sign-up**: A clean interface with email/password fields and prominent "Sign in with Apple/Google" options for frictionless entry.
* **Initial Setup**: A two-step process to personalize the app.
    1.  **Personal Info**: Collects user goals, height, weight, age, and activity level to establish baseline calorie and macronutrient targets. It also asks for permission to connect to Apple Health or Google Fit for data syncing.
    2.  **Choose Your Companion**: The user is presented with three distinct pixel-art eggs (e.g., Vitality, Serenity, Luck). A tap on an egg shows a brief animation, helping the user make their first rewarding choice in the game.

---

### 2. Core Application Screens

These screens are the heart of the daily user experience, accessible via a new 5-tab bottom navigation bar.

#### 2.1 Home / Dashboard
The central hub, providing a complete overview of the user's day.

* **Header**: Displays the user's name and profile picture on the left. On the right are icons for **Gems**, Notifications, and Settings.
* **Pet Display Area**: The top half of the screen features the user's active pet in a customizable pixel-art environment. The pet is animated and interactive. Overlaid on this are the pet's **Name**, **Level**, and **XP Bar**.
* **Daily Stats Modules**: The bottom half features two main modules:
    * **Fitness Module**: Shows "Today's Run" with a progress bar for the active **Egg Hatching** goal (e.g., "3.5 / 5.0 km"). Below this are key stats from the day's workout summary (e.g., total duration, calories burned).
    * **Nutrition Module**: Shows "Today's Diet" with a primary display of **Calories** and a secondary breakdown of **Macronutrients** (Protein, Carbs, Fats) against their daily goals. A small note indicates the XP gained from logging meals.
* **Floating Action Button (+)**: A large floating button in the bottom-right. Tapping it expands into quick actions: **"Log Run,"** **"Log Meal,"** and **"Log Weight."**

#### 2.2 Running Screens
A focused, three-part experience for tracking runs.

* **Pre-Run Screen**: A map view with GPS signal strength, options to set a goal (distance, time, or "just run"), and a large, inviting "START" button.
* **Live Run Screen**: A high-contrast, distraction-free display showing large-font metrics: **Distance** is primary, with **Duration**, **Pace**, and **Calories Burned** as secondary stats. Controls for Pause/Resume and a long-press "End" are at the bottom.
* **Post-Run Summary**: A celebration of the user's effort. It shows the run route on a map, a detailed stat breakdown, and rewarding game animations. The **egg hatching bar fills up**, and any unlocked **Achievements** or **Quest** progress is prominently displayed.

#### 2.3 Diet Logging
A streamlined process for tracking nutrition.

* **Main Screen**: A chronological view of the day's meals (Breakfast, Lunch, Dinner, Snacks). A header provides a running total of calories and macros. Each meal section has an **"+ Add Food"** button.
* **Add Food Flow**: Tapping "Add Food" opens a screen with a search bar at the top, a **Barcode Scan** icon, and lists for "Recent" and "Custom" foods below, making logging fast and intuitive. After adding, a confirmation toast appears: "Meal Logged! Your pet gained +50 XP!"

#### 2.4 Quests Tab
The central hub for motivation and rewards.

* **Layout**: Organized with tabs for **Daily**, **Weekly**, and **Special Event** quests.
* **Content**: Each quest card clearly states the objective (e.g., "Run 10km this week," "Log your breakfast 3 days in a row") and the **Gem reward**. Completed quests have a "Claim Reward" button. This is the primary way users earn Gems.

#### 2.5 Collection (Pet Dex) & Profile
* **Collection Screen**: A grid-view "Pet Dex" showing all discoverable pets. Collected pets are in full color, while uncollected ones are shown as silhouettes, encouraging completion. Tapping a pet opens its detail page with lore, stats, and evolution requirements (e.g., "Reach Lv. 15 and complete a 10km run").
* **Profile Screen**: The user's personal space.
    * **Header**: User avatar, name, and lifetime stats (Total Distance, Total Workouts).
    * **Achievements**: A gallery of all earned milestone badges.
    * **Settings**: Account management, notification preferences, and health app connections.

---

## FitQuest: Product Requirements Document (PRD) (Improved)

### 1. Vision & Core Philosophy
FitQuest is a gamified health companion that transforms fitness and nutrition goals into a delightful and rewarding adventure. By combining a clean, minimalist UI with a captivating **pixel-art pet collection game**, we motivate users through a powerful sense of progression, accomplishment, and daily engagement.

### 2. Core Gamification Loop
The app is built on a dual-reward system to drive long-term retention:
* **Progression Loop (XP)**: Daily healthy actions directly fuel game progress.
    * **Log Meals** → Earn **XP** → **Level Up** your pet.
    * **Complete Runs** → Make progress on **Hatching Eggs**.
    * Leveling up and completing fitness milestones unlocks **Evolutions**.
* **Reward Loop (Gems)**: Targeted challenges provide a premium currency.
    * **Complete Quests** (Daily, Weekly) → Earn **Gems**.
    * Spend **Gems** → Purchase **cosmetic items** for your pet's environment or special, rare eggs.

### 3. Key Features & Functionality

#### 3.1 Fitness & Nutrition Tracking
* **Running**: Real-time GPS tracking of runs, capturing key metrics like distance, pace, duration, and calories. All runs are saved to a user's history and contribute to game progression.
* **Diet Tracking**: A streamlined interface for logging meals with a focus on core metrics: calories and macronutrients (Protein, Carbs, Fats). Features include a comprehensive food database, barcode scanning, and support for custom diet plans like carb cycling.

#### 3.2 Gamification System
* **Pet Companions**: Users hatch, raise, level up, and evolve a variety of unique pixel-art pets. Each pet has distinct evolution requirements tied to fitness milestones.
* **The Pet Dex**: A collection book that catalogs all discovered pets, driving a "gotta catch 'em all" motivation.
* **Quest System**: A dedicated tab presents daily and weekly challenges. Completing these quests is the primary method for earning the **Gem** currency.
* **Achievements**: Milestone badges are awarded for significant accomplishments (e.g., first 10km run, 30-day logging streak) and are displayed on the user's profile.
* **Economy**: A dual-currency system:
    * **XP**: Earned from logging meals; used for leveling up pets.
    * **Gems**: Earned from quests; used for cosmetic and premium in-game items.

#### 3.3 User Interface & Experience
* **Design Language**: A unique blend of a clean, modern UI for data and navigation, with charming pixel art for all gamified elements (pets, eggs, items).
* **Navigation**: A persistent 5-tab bottom navigation bar for instant access to core features:
    1.  **Home**: The central dashboard.
    2.  **Run**: Direct access to start a run.
    3.  **Quests**: The daily motivation and reward center.
    4.  **Collection**: The Pet Dex and pet management.
    5.  **Profile**: Stats, achievements, and settings.
* **Onboarding**: A frictionless setup process that personalizes fitness goals and immediately introduces the core game loop by having the user select their first egg.