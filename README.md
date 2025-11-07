# WaterPolo Connect

A mobile application for water polo enthusiasts to find games, track stats, and build their community.

## Features

- User authentication (Sign up, Sign in)
- Clean, modern UI with water polo theme
- Form validation and error handling
- Supabase backend integration

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- A Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd holeguard
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` and add your Supabase credentials:
   - Go to your Supabase project settings
   - Copy the Project URL and anon/public key
   - Paste them into the `.env` file

### Running the App

Start the development server:
```bash
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan the QR code with Expo Go app on your physical device

## Project Structure

```
holeguard/
├── src/
│   ├── screens/
│   │   └── auth/
│   │       ├── WelcomeScreen.tsx
│   │       ├── SignUpScreen.tsx
│   │       ├── LoginScreen.tsx
│   │       └── index.ts
│   ├── lib/
│   │   └── supabase.ts
│   └── styles/
│       └── theme.ts
├── App.tsx
├── app.json
├── package.json
└── tsconfig.json
```

## Authentication Screens

### WelcomeScreen
- App branding and logo
- Call-to-action buttons
- Navigation to Sign Up or Login

### SignUpScreen
- Full name input
- Username input
- Email input
- Password input with show/hide toggle
- Form validation
- Supabase integration for user registration

### LoginScreen
- Email input
- Password input with show/hide toggle
- Forgot password link
- Form validation
- Supabase integration for authentication

## Technologies Used

- React Native
- Expo
- TypeScript
- React Navigation
- Supabase
- React Native Safe Area Context

## Theme

The app uses a water polo-inspired color scheme with blues and teals:
- Primary: #1e88e5 (Blue)
- Secondary: #26c6da (Teal)
- Clean, modern UI with proper spacing and shadows

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
