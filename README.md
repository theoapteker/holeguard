# WaterPolo Connect

A React Native app for connecting water polo players, organizing games, and tracking stats.

## Navigation Structure

The app uses React Navigation with the following structure:

### Root Navigator (`AppNavigator.tsx`)
- Switches between Auth and Main navigators based on authentication state
- Includes loading state while checking authentication

### Auth Navigator (`AuthNavigator.tsx`)
Stack navigator with the following screens:
- **Welcome** - Initial landing screen with "Get Started" and "Log In" buttons
- **Login** - User login form
- **SignUp** - User registration form

### Main Navigator (`MainNavigator.tsx`)
Bottom tab navigator with the following screens:
- **Home** - Game feed showing upcoming and recent games
- **Discover** - Search and discover games, players, and locations
- **Add Game** - Create new water polo games
- **Stats** - Personal statistics and game history
- **Profile** - User profile and settings

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on your platform:
```bash
npm run ios      # iOS
npm run android  # Android
npm run web      # Web
```

## Project Structure

```
src/
├── navigation/
│   ├── AppNavigator.tsx      # Root navigator
│   ├── AuthNavigator.tsx     # Authentication flow
│   ├── MainNavigator.tsx     # Main app tabs
│   └── types.ts              # TypeScript navigation types
└── screens/
    ├── auth/
    │   ├── WelcomeScreen.tsx
    │   ├── LoginScreen.tsx
    │   └── SignUpScreen.tsx
    └── main/
        ├── HomeScreen.tsx
        ├── DiscoverScreen.tsx
        ├── AddGameScreen.tsx
        ├── StatsScreen.tsx
        └── ProfileScreen.tsx
```

## Features

- Type-safe navigation with TypeScript
- Smooth transitions between screens
- Bottom tab navigation with custom icons
- Authentication flow handling
- Splash screen support

## Tech Stack

- React Native + Expo
- React Navigation
- TypeScript
- @expo/vector-icons
