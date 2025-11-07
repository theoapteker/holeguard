# WaterPolo Connect

A React Native mobile application for the water polo community. Connect with players, find pools, join events, and stay engaged with the water polo community.

## Features

- **Find Pools**: Discover water polo facilities near you with an interactive map
- **Events**: Browse and join water polo events, training sessions, matches, and tournaments
- **Community**: Connect with other water polo players and teams
- **Profile Management**: Create and manage your player profile
- **Real-time Updates**: Stay informed about events and community activities

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation (Stack & Bottom Tabs)
- **Backend**: Supabase
- **Maps**: React Native Maps with Expo Location
- **UI Components**: React Native core components with custom styling

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your mobile device (for testing)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd holeguard
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env
```

Then update the `.env` file with your actual credentials:

```env
SUPABASE_URL=your_actual_supabase_url
SUPABASE_ANON_KEY=your_actual_supabase_anon_key
GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key
```

#### Setting up Supabase

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Get your project URL and anon key from Project Settings > API
4. Update the `.env` file with these credentials

#### Setting up Google Maps (for Android)

1. Create a project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable the Maps SDK for Android
3. Create an API key
4. Add the API key to `.env` and `app.json`

### 4. Update app.json

Replace the placeholder values in `app.json`:

- `extra.eas.projectId`: Your EAS project ID (if using EAS)
- `android.config.googleMaps.apiKey`: Your Google Maps API key

### 5. Run the App

#### Start the development server:

```bash
npm start
```

#### Run on specific platforms:

```bash
# iOS (requires macOS)
npm run ios

# Android
npm run android

# Web
npm run web
```

#### Using Expo Go:

1. Install Expo Go on your mobile device
2. Scan the QR code displayed in the terminal
3. The app will load on your device

## Project Structure

```
holeguard/
├── src/
│   ├── components/       # Reusable UI components
│   │   └── LoadingSpinner.tsx
│   ├── navigation/       # Navigation configuration
│   │   ├── MainTabNavigator.tsx
│   │   └── RootNavigator.tsx
│   ├── screens/          # Screen components
│   │   ├── AuthScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── MapScreen.tsx
│   │   ├── EventsScreen.tsx
│   │   ├── CommunityScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── EventDetailsScreen.tsx
│   │   ├── PoolDetailsScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   └── CreateEventScreen.tsx
│   ├── services/         # API and service integrations
│   │   ├── supabase.ts
│   │   └── location.ts
│   ├── types/            # TypeScript type definitions
│   │   ├── index.ts
│   │   └── navigation.ts
│   └── utils/            # Utility functions
│       └── dateFormat.ts
├── assets/               # Images, icons, and other static assets
│   ├── images/
│   └── icons/
├── App.tsx               # Root component
├── app.json              # Expo configuration
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run in web browser
- `npm test` - Run tests (when configured)

## Features to Implement

The app is currently a starter template. Here are suggested features to implement:

### Authentication
- [ ] Email/password authentication with Supabase
- [ ] Social authentication (Google, Facebook)
- [ ] Password reset functionality
- [ ] User session management

### Database Schema (Supabase)
- [ ] Users table
- [ ] Pools table
- [ ] Events table
- [ ] Teams table
- [ ] Posts/Feed table
- [ ] Relationships and joins

### Core Features
- [ ] User profile creation and editing
- [ ] Pool search and filtering
- [ ] Event creation and management
- [ ] Event RSVP functionality
- [ ] Community feed with posts
- [ ] Real-time notifications
- [ ] Image upload for profiles and posts
- [ ] In-app messaging

## Environment Variables

Required environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Your Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |
| `GOOGLE_MAPS_API_KEY` | Google Maps API key for Android | Yes (Android) |

## Troubleshooting

### Common Issues

**Metro bundler issues:**
```bash
npm start -- --clear
```

**iOS build issues:**
```bash
cd ios && pod install && cd ..
```

**Android build issues:**
- Ensure Android Studio and required SDKs are installed
- Check that `ANDROID_HOME` environment variable is set

**Location permissions not working:**
- Check app permissions in device settings
- Ensure location services are enabled on device

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Create an issue in the GitHub repository
- Contact the development team

## Acknowledgments

- Expo team for the amazing framework
- React Navigation for navigation solutions
- Supabase for backend infrastructure
- The water polo community
