# GameDetailScreen Documentation

## Overview

The `GameDetailScreen` is a comprehensive React Native screen component that displays detailed information about a water polo game. It provides users with all the necessary information to view, join, manage, and interact with games.

## Features

### Display Information
- **Game Title** - The name of the game
- **Game Status Badge** - Visual indicator (open, full, completed, cancelled)
- **Skill Level Badge** - Required skill level for the game
- **Date & Time** - Prominently displayed game schedule
- **Host Information** - Avatar, name, username, and skill level
- **Description** - Full game description and details
- **Location** - Pool name and full address
- **Interactive Map** - Map preview showing exact pool location
- **Player List** - All confirmed participants with avatars
- **Capacity Indicator** - Visual progress bar (e.g., "8/12 players")

### Actions
The screen provides different actions based on user role and game state:

#### For Regular Users (Non-Host)
- **Join Game Button** - Join the game if not full
- **Leave Game Button** - Leave if already joined
- **Share Button** - Share game details

#### For Game Host
- **Start Game Button** - Mark game as started (only shows when game time is within 2 hours)
- **Cancel Game Button** - Cancel the game
- **Share Button** - Share game details

#### Universal Features
- **Get Directions Button** - Opens device maps app with pool location
- **Player Avatar Tap** - Navigate to player profile
- **Real-time Updates** - Automatic refresh when players join/leave

### State Handling

The screen intelligently handles different game states:

1. **Open Game** - Normal join/leave functionality
2. **Full Game** - Disables join button, shows "FULL" indicator
3. **Game Started** - Shows completion banner, disables actions
4. **Game Cancelled** - Shows cancellation banner, disables actions
5. **Loading** - Shows loading spinner
6. **Error** - Shows error message if game not found

## File Structure

```
src/
├── screens/
│   └── GameDetailScreen.tsx       # Main screen component
├── hooks/
│   └── useGameDetails.ts          # Custom hook for game logic
├── services/
│   └── gameService.ts             # API service layer
├── components/
│   ├── PlayerAvatar.tsx           # Avatar component
│   ├── PlayerCard.tsx             # Player list item
│   ├── SkillBadge.tsx            # Skill level badge
│   ├── StatusBadge.tsx           # Game status badge
│   └── index.ts                   # Component exports
├── types/
│   ├── database.types.ts          # Database schema types
│   ├── game.types.ts              # Game-specific types
│   └── navigation.types.ts        # Navigation types
└── utils/
    └── formatters.ts              # Formatting utilities
```

## Architecture

### Component Structure

```
GameDetailScreen
├── Loading State
│   └── ActivityIndicator
├── Error State
│   └── Error Message
└── Game Content
    ├── Status Banner (conditional)
    ├── Title Section
    │   ├── Title
    │   └── Badges (Skill + Status)
    ├── Date & Time Section (Prominent)
    ├── Host Section
    │   └── Host Card (tappable)
    ├── Description Section
    ├── Location Section
    │   ├── Location Name
    │   ├── Address
    │   ├── Map Preview
    │   └── Directions Button
    ├── Players Section
    │   ├── Capacity Bar
    │   └── Player List (tappable cards)
    └── Actions Section
        ├── Primary Action (Join/Leave/Start/Cancel)
        └── Share Button
```

### Data Flow

1. **Screen Initialization**
   - Receives `gameId` from navigation params
   - Fetches current user ID (from auth context)
   - Calls `useGameDetails` hook

2. **Data Fetching** (via `useGameDetails` hook)
   - Fetches game details via `GameService.getGameWithDetails()`
   - Sets up real-time subscription via `GameService.subscribeToGameUpdates()`
   - Computes derived state (isHost, isFull, etc.)

3. **User Actions**
   - User taps action button
   - Hook method called (joinGame, leaveGame, etc.)
   - Service layer makes API call
   - Confirmation alert shown
   - Data refetched to update UI

4. **Real-time Updates**
   - Supabase subscription listens for changes
   - Callback triggers data refetch
   - UI updates automatically

## Usage

### Basic Navigation

```typescript
import { useNavigation } from '@react-navigation/native';

// Navigate to game detail
navigation.navigate('GameDetail', { gameId: 'game-uuid-123' });
```

### Integration Example

```typescript
// In your navigation stack
import GameDetailScreen from './src/screens/GameDetailScreen';

<Stack.Screen
  name="GameDetail"
  component={GameDetailScreen}
  options={{ title: 'Game Details' }}
/>
```

## Configuration

### Dependencies

The screen requires the following packages:

```json
{
  "dependencies": {
    "react": "^18.x",
    "react-native": "^0.72.x",
    "react-navigation": "^6.x",
    "@react-navigation/native": "^6.x",
    "@react-navigation/stack": "^6.x",
    "react-native-maps": "^1.x"
  }
}
```

### Map Configuration

#### iOS (Info.plist)
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to show nearby pools</string>
```

#### Android (AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<application>
  <meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="YOUR_GOOGLE_MAPS_API_KEY"/>
</application>
```

## Customization

### Styling

All styles are defined in the `styles` object at the bottom of `GameDetailScreen.tsx`. Key style constants:

```typescript
// Colors
Primary: '#2196F3'      // Blue
Success: '#4CAF50'      // Green
Warning: '#FF9800'      // Orange
Danger: '#F44336'       // Red
Text: '#212121'         // Dark gray
TextSecondary: '#666'   // Medium gray
Background: '#F5F5F5'   // Light gray
```

### Behavior

Modify time threshold for "Start Game" button:

```typescript
// In GameDetailScreen.tsx
const isGameTimeNear = gameDateTime
  ? gameDateTime.getTime() - Date.now() < 2 * 60 * 60 * 1000 // 2 hours
  : false;
```

## API Integration

### Current State

The screen uses **mock data** for development. All API calls are stubbed with TODO comments indicating where real Supabase calls should be implemented.

### Integration Steps

1. **Set up Supabase client**
   ```typescript
   // src/services/supabase.ts
   import { createClient } from '@supabase/supabase-js';

   export const supabase = createClient(
     process.env.SUPABASE_URL,
     process.env.SUPABASE_ANON_KEY
   );
   ```

2. **Implement GameService methods**
   - Replace mock implementations in `src/services/gameService.ts`
   - Use Supabase client for queries
   - Set up real-time subscriptions

3. **Add authentication context**
   - Create auth provider
   - Get current user ID
   - Pass to `useGameDetails` hook

### Example Supabase Query

```typescript
// Get game with details
const { data, error } = await supabase
  .from('games')
  .select(`
    *,
    creator:profiles!games_created_by_fkey(*),
    participants:game_participants(
      *,
      player:profiles(*)
    )
  `)
  .eq('id', gameId)
  .single();
```

## Testing

### Manual Testing Checklist

- [ ] Screen loads with game details
- [ ] Map displays correct location
- [ ] Host information displays correctly
- [ ] Player list shows all participants
- [ ] Capacity bar updates correctly
- [ ] Join button works (adds user to participants)
- [ ] Leave button works (removes user from participants)
- [ ] Cancel button works (marks game as cancelled)
- [ ] Start button appears when game time is near
- [ ] Share button opens share sheet
- [ ] Directions button opens maps app
- [ ] Player avatar tap navigates to profile
- [ ] Full game shows disabled join button
- [ ] Cancelled game shows banner
- [ ] Completed game shows banner

### Test Scenarios

1. **User joins game**
   - Navigate to open game
   - Tap "Join Game"
   - Verify confirmation alert
   - Verify user appears in player list
   - Verify capacity counter increases

2. **Game reaches capacity**
   - Join game until it's full
   - Verify status changes to "full"
   - Verify join button is disabled
   - Verify "FULL" indicator appears

3. **Host cancels game**
   - Navigate to game as host
   - Tap "Cancel Game"
   - Confirm cancellation
   - Verify status banner appears
   - Verify action buttons are disabled

## Troubleshooting

### Common Issues

**Maps not displaying**
- Verify Google Maps API key is configured
- Check platform-specific configuration (iOS/Android)
- Ensure latitude/longitude values are valid

**Navigation not working**
- Verify navigation types are properly defined
- Check that navigation stack includes PlayerProfile screen
- Ensure proper navigation prop types

**Real-time updates not working**
- Verify Supabase subscriptions are set up
- Check that cleanup function is called on unmount
- Ensure proper filtering in subscription

**Join/Leave actions failing**
- Verify user is authenticated
- Check RLS policies in Supabase
- Ensure game_participants table constraints are met

## Future Enhancements

Potential improvements for the screen:

1. **Enhanced Features**
   - Add comments/chat section
   - Show weather forecast for game day
   - Display driving distance from user location
   - Add calendar integration
   - Show game history/previous participants

2. **Performance**
   - Implement optimistic updates
   - Add image caching for avatars
   - Lazy load map component
   - Implement pull-to-refresh

3. **UX Improvements**
   - Add skeleton loading states
   - Implement haptic feedback
   - Add animations for state changes
   - Show participant join/leave notifications

4. **Accessibility**
   - Add screen reader labels
   - Improve color contrast
   - Add keyboard navigation
   - Support dynamic font sizing

## Related Components

- **GameListScreen** - Lists all available games
- **GameCreateScreen** - Create a new game
- **GameEditScreen** - Edit game details (host only)
- **PlayerProfileScreen** - View player details
- **NotificationsScreen** - Game-related notifications

## Support

For issues or questions:
- Check the main project README
- Review Supabase documentation
- Check React Navigation documentation
- Review react-native-maps documentation

---

**Version**: 1.0.0
**Last Updated**: 2025-11-07
**Author**: Claude Code
