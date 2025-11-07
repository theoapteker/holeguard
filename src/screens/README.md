# ProfileSetupScreen

A comprehensive profile setup screen that appears after first signup to collect user information.

## Features

### Required Fields
- **Username**: Unique identifier, 3-30 characters, alphanumeric + underscore only
- **Full Name**: User's display name
- **Position**: Water polo position (Goalie, Center, Driver, Wing)
- **Skill Level**: Player's skill level (Beginner, Intermediate, Advanced, Pro)
- **Location**: User's location (city, state, or region)

### Optional Fields
- **Bio**: Short biography (max 200 characters)
- **Avatar**: Profile picture uploaded to Supabase Storage

### UI Components
- **Progress Indicator**: Shows "Step 1 of 1" with visual progress bar
- **Avatar Upload**:
  - Tap to select image from library
  - Shows preview of selected image
  - Requests media library permissions
  - Uploads to Supabase Storage bucket 'avatars'
  - Displays loading indicator during upload
- **Position Picker**: Native dropdown/picker component
- **Skill Level Buttons**: Interactive button group with visual feedback
- **Text Inputs**: Clean, bordered inputs with hints and character counters
- **Action Buttons**:
  - "Complete Profile" - Validates and saves profile
  - "Skip for now" - Allows users to complete profile later (with confirmation)

## Form Validation

The screen includes comprehensive validation:
- Username: Required, 3-30 chars, alphanumeric + underscore format
- Full Name: Required
- Position: Required selection
- Skill Level: Required selection
- Location: Required
- Bio: Optional, max 200 characters
- All validation errors shown via native alerts

## Technical Implementation

### Avatar Upload Flow
1. User selects image from library (with permission request)
2. Image is displayed as preview
3. On submit, image is:
   - Converted to blob
   - Uploaded to Supabase Storage bucket 'avatars'
   - Stored with filename: `{userId}-{timestamp}.{ext}`
   - Public URL is generated and saved to profile

### Profile Save Flow
1. Form validation runs
2. Avatar uploads (if selected)
3. Profile data inserted into `profiles` table
4. Success alert shown
5. `onComplete` callback invoked to navigate to main app

### Error Handling
- Duplicate username (23505 error code) - specific message
- Upload failures - allows continuation without avatar
- Generic errors - user-friendly messages
- All errors logged to console for debugging

## Usage

```tsx
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';

function YourNavigator() {
  const handleProfileComplete = () => {
    // Navigate to main app
    navigation.navigate('Main');
  };

  return (
    <ProfileSetupScreen onComplete={handleProfileComplete} />
  );
}
```

## Supabase Setup Required

### Storage Bucket
Create a storage bucket named `avatars` with the following settings:
- Public bucket (for public URLs)
- File size limit: 5MB recommended
- Allowed MIME types: image/jpeg, image/png, image/webp

### RLS Policies
The bucket should have policies allowing:
- Authenticated users to upload their own avatars
- Public read access for avatar URLs

Example policy:
```sql
-- Allow authenticated users to upload avatars
CREATE POLICY "Users can upload their own avatar"
# Player Profile Screens

This directory contains the player profile viewing and editing screens for the WaterPolo Connect app.

## Screens

### PlayerProfileScreen.tsx

A comprehensive player profile screen that displays:

**Header Section:**
- Large circular avatar (with fallback to initials)
- Username and full name
- Position badge (Goalie, Driver, Wing, Center)
- Skill level badge (Beginner, Intermediate, Advanced, Pro)
- Location
- "Edit Profile" button (only visible when viewing own profile)

**Bio Section:**
- Player's bio text (if provided)

**Tab Navigation:**
- "Stats" tab: Shows aggregated statistics
- "Games" tab: Shows recent games played

**Stats Tab Content:**
- Total games played
- Total goals
- Total assists
- Total blocks
- Average goals per game
- Average assists per game
- Displayed in a responsive grid of stat cards

**Games Tab Content:**
- List of last 5 games played
- Each game shows:
  - Game title and date
  - Location
  - Personal stats (goals, assists, blocks, steals)

**Features:**
- Pull-to-refresh functionality
- Loading skeleton while fetching data
- Error states
- Responsive design
- Auto-detects if viewing own profile vs another player's profile

**Props:**
```typescript
interface PlayerProfileScreenProps {
  route?: {
    params?: {
      playerId?: string; // If not provided, shows current user's profile
    };
  };
  navigation?: any;
}
```

**Usage Example:**
```typescript
// View own profile
<PlayerProfileScreen />

// View another player's profile
<PlayerProfileScreen route={{ params: { playerId: 'user-uuid' } }} />
```

---

### EditProfileScreen.tsx

A form-based screen for editing the user's own profile.

**Features:**
- Avatar upload with image picker
- Remove avatar option
- Form validation with real-time error messages
- All profile fields are editable:
  - Username (required, 3-30 chars, alphanumeric + underscore)
  - Full name (required)
  - Position (optional, select from: Goalie, Driver, Wing, Center)
  - Skill level (optional, select from: Beginner, Intermediate, Advanced, Pro)
  - Location (optional)
  - Bio (optional, max 500 characters with counter)
- Save and Cancel buttons
- Loading states during save
- Discard changes confirmation
- Unique username validation
- Success/error alerts

**Form Validation Rules:**
- Username: 3-30 characters, alphanumeric and underscore only, required
- Full name: At least 2 characters, required
- Bio: Maximum 500 characters
- Checks for duplicate username on save

**Avatar Upload:**
The screen includes a placeholder implementation for avatar upload. To enable full functionality:

1. Install dependencies:
```bash
npx expo install expo-image-picker
```

2. Uncomment the implementation code in `handleAvatarUpload()` function
3. Create a Supabase Storage bucket named "avatars" with public access
4. Configure storage policies in Supabase dashboard

**Props:**
```typescript
interface EditProfileScreenProps {
  route?: {
    params?: {
      profile?: Profile; // Optional, will fetch if not provided
    };
  };
  navigation?: any;
}
```

**Usage Example:**
```typescript
<EditProfileScreen />
```

---

## Data Flow

Both screens use Supabase for data fetching and updates:

```typescript
// Fetch profile
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();

// Fetch stats with game details
const { data } = await supabase
  .from('player_stats')
  .select(`
    *,
    game:games(*)
  `)
  .eq('player_id', userId)
  .order('created_at', { ascending: false });

// Update profile
const { data } = await supabase
  .from('profiles')
  .update(updateData)
  .eq('id', userId)
  .select()
  .single();
```

---

## Setup Instructions

### 1. Install Dependencies

```bash
# Required dependencies
npm install @supabase/supabase-js

# Optional but recommended (for avatar upload)
npx expo install expo-image-picker

# For React Navigation integration
npm install @react-navigation/native @react-navigation/stack
npx expo install react-native-screens react-native-safe-area-context
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get your credentials from: https://app.supabase.com/project/_/settings/api

### 3. Configure Supabase Storage (Optional, for Avatar Upload)

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named "avatars"
3. Set the bucket to public
4. Add the following storage policy:

```sql
-- Allow users to upload their own avatars
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public access to avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public to view avatars
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

### 4. Add to Navigation

Example with React Navigation:

```typescript
import { createStackNavigator } from '@react-navigation/stack';
import PlayerProfileScreen from './src/screens/PlayerProfileScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';

const Stack = createStackNavigator();

function ProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="PlayerProfile"
        component={PlayerProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Edit Profile' }}
      />
    </Stack.Navigator>
  );
}
```

---

## TypeScript Types

All types are imported from `../types/database.types.ts`:

```typescript
import type {
  Profile,
  ProfileUpdate,
  PlayerStats,
  Game,
  PositionType,
  SkillLevelType,
} from '../types/database.types';
```

# DiscoverScreen

The DiscoverScreen is a comprehensive search and discovery interface for finding games and players in the WaterPolo Connect app.

## Features

### 1. **Search Bar**
- Debounced search input (500ms delay)
- Searches across game titles, locations, and pool addresses
- Searches across player names and usernames
- Clear button for quick reset

### 2. **Dual Tabs**
- **Games Tab**: Browse and filter water polo games
- **Players Tab**: Discover players in your area

### 3. **Games Tab Features**

#### Filters
- **Status**: Open, Upcoming, Full, Completed
- **Skill Level**: Beginner, Intermediate, Advanced, Pro
- **Date Range**: All, Today, This Week, This Month
- **Location Radius**: Configurable distance filter (default: 25km)

#### View Modes
- **List View**: Scrollable list of game cards
- **Map View**: Visual map showing game locations (placeholder implementation)

#### Game Cards Display
- Game title and description
- Location and distance (if user location available)
- Date and time (formatted as "Today", "Tomorrow", or date)
- Skill level required
- Current participants / max players
- Creator information (avatar and name)
- Status badge (color-coded)

### 4. **Players Tab Features**

#### Filters
- **Position**: Goalie, Driver, Wing, Center
- **Skill Level**: Beginner, Intermediate, Advanced, Pro
- **Location**: Distance-based filtering (coming soon)

#### Player Cards Display
- Avatar (or initials placeholder)
- Full name and username
- Position badge with emoji
- Skill level badge (color-coded)
- Key statistics:
  - Total games played
  - Total goals scored
  - Average goals per game
- Distance from user (if location available)

### 5. **Map View**
- Placeholder implementation with integration instructions
- Shows games with GPS coordinates
- User location marker
- Game pin markers
- Tap-to-select functionality

## Components Used

- **GameCard**: Displays game information in a card format
- **PlayerCard**: Displays player profile in a card format
- **FilterChip**: Reusable filter chip component
- **MapView**: Map visualization component (placeholder)

## Services

### searchService.ts
Provides search and filter functionality:

#### Functions
- `searchGames(params)`: Search games with filters
- `searchPlayers(params)`: Search players with filters
- `getNearbyGames(lat, lon, radius)`: Get games near a location
- `getUpcomingGames()`: Get games in the next 7 days
- `getFeaturedPlayers()`: Get top players
- `calculateDistance(lat1, lon1, lat2, lon2)`: Haversine distance calculation

#### Search Parameters

**Games:**
```typescript
{
  query?: string;                    // Search text
  status?: GameStatusType[];         // Filter by status
  skillLevels?: SkillLevelType[];    // Filter by skill level
  dateRange?: 'all' | 'today' | 'week' | 'month';
  userLocation?: { latitude, longitude };
  radius?: number;                   // Distance in km
}
```

**Players:**
```typescript
{
  query?: string;                    // Search text
  positions?: PositionType[];        // Filter by position
  skillLevels?: SkillLevelType[];    // Filter by skill level
  userLocation?: { latitude, longitude };
  radius?: number;                   // Distance in km
}
```

## Data Flow

1. User enters search query or selects filters
2. Query is debounced (500ms)
3. `searchGames` or `searchPlayers` is called with parameters
4. Supabase query is built with filters
5. Results are fetched and processed
6. Distance is calculated if user location is available
7. Results are displayed in list or map view

## Supabase Queries

### Games Query
```typescript
supabase
  .from('games')
  .select(`
    *,
    creator:profiles!games_created_by_fkey(*),
    participants:game_participants(
      *,
      player:profiles(*)
    )
  `)
  // ... filters
  .order('date_time', { ascending: true })
```

### Players Query
```typescript
supabase
  .from('profiles')
  .select(`
    *,
    stats:player_stats(
      goals,
      assists,
      blocks,
      steals
    )
  `)
  // ... filters
```

## Setup Instructions

### 1. Environment Variables
Create a `.env` file with:
```env
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
```

For React Native (Expo), use:
```env
EXPO_PUBLIC_SUPABASE_URL=your-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

For React Web, use:
```env
REACT_APP_SUPABASE_URL=your-project-url
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Install Dependencies
```bash
npm install @supabase/supabase-js
```

For React Native with maps:
```bash
npm install react-native-maps
```

### 3. Import and Use
```typescript
import { DiscoverScreen } from './src/screens/DiscoverScreen';

// In your navigation
<Stack.Screen name="Discover" component={DiscoverScreen} />
```

## Styling

The screen uses a clean card-based layout with:
- Safe area handling for notched devices
- Responsive scroll view
- Consistent spacing and padding
- Primary color: #0066CC
- Clean white cards with subtle shadows
- Proper keyboard handling
- Touch feedback on interactive elements

All styles use the shared theme from `/src/theme/colors.ts`.
The screen uses a clean, modern design with:
- Primary color: `#0066cc` (blue)
- Background: `#f5f5f5` (light gray)
- Cards: White with subtle shadows
- Status colors:
  - Open: Green (`#4caf50`)
  - Full: Orange (`#ff9800`)
  - Completed: Gray (`#9e9e9e`)
  - Cancelled: Red (`#f44336`)
- Skill level colors:
  - Beginner: Green
  - Intermediate: Blue
  - Advanced: Purple
  - Pro: Orange

## Future Enhancements

1. **Map Integration**
   - Integrate `react-native-maps` or `react-leaflet`
   - Interactive map pins
   - Clustering for dense areas
   - Route directions to game location

2. **Advanced Filters**
   - Save filter presets
   - Multi-select with AND/OR logic
   - Price range (if games have fees)
   - Equipment requirements

3. **Location Services**
   - Get user's current location
   - Location permission handling
   - Background location updates

4. **Social Features**
   - Follow/unfollow players
   - Save favorite games
   - Share games with friends

5. **Performance**
   - Infinite scroll pagination
   - Virtual list rendering
   - Image caching
   - Offline mode

6. **Accessibility**
   - Screen reader support
   - Keyboard navigation
   - High contrast mode
   - Larger text options

## Testing

Test scenarios:
- [ ] Search debouncing works correctly
- [ ] Filters can be applied and cleared
- [ ] Distance calculation is accurate
- [ ] Empty states display properly
- [ ] Loading states show during fetch
- [ ] Tab switching maintains filter state
- [ ] Map view shows correct pins
- [ ] Card taps navigate to details

## Troubleshooting

### No games showing
- Check Supabase connection
- Verify environment variables
- Check date filters (default shows only future games)
- Verify games exist in database

### Distance not showing
- Ensure games have latitude/longitude set
- Provide user location to the component
- Check location permissions

### Map not working
- Implement proper map library integration
- See MapView.tsx for integration examples
- Configure map provider API keys
# Game Stats Screens

This directory contains screens for entering and managing player statistics after water polo games.

## Components

### GameStatsScreen

A comprehensive screen that allows game hosts to enter stats for all participants after a game is completed.

**Features:**
- Game info header (title, date, location)
- Form for each confirmed participant with:
  - Player name/avatar display
  - Goals input (number stepper)
  - Assists input (number stepper)
  - Blocks input (number stepper)
  - Steals input (number stepper)
- Quick stats buttons:
  - "Hat Trick" - Sets goals to 3
  - "Clean Sheet" - For goalies
- Submit Stats button
- Skip for Now button
- Host-only access (validates creator)
- Pre-filled with existing stats or 0s
- Input validation (0-50 range)
- Batch save all participant stats
- Auto-marks game as completed

**Usage:**

```typescript
import { GameStatsScreen } from './screens/GameStatsScreen';

// In your navigation/component:
<GameStatsScreen
  gameId="uuid-of-game"
  currentUserId="uuid-of-current-user"
  supabaseUrl="https://your-project.supabase.co"
  supabaseAnonKey="your-anon-key"
  onStatsSubmitted={() => {
    // Navigate back or show success
    navigation.goBack();
  }}
  onSkip={() => {
    // User skipped stats entry
    navigation.goBack();
  }}
  onBack={() => {
    // Handle back navigation
    navigation.goBack();
  }}
/>
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `gameId` | `string` | Yes | UUID of the game |
| `currentUserId` | `string` | Yes | UUID of the current user |
| `supabaseUrl` | `string` | Yes | Supabase project URL |
| `supabaseAnonKey` | `string` | Yes | Supabase anonymous key |
| `onStatsSubmitted` | `() => void` | No | Callback when stats are successfully submitted |
| `onSkip` | `() => void` | No | Callback when user skips stats entry |
| `onBack` | `() => void` | No | Callback for back navigation |

**Database Operations:**

1. Fetches game with participants and creator
2. Validates current user is the game host
3. Fetches existing stats (if any)
4. Upserts stats to `player_stats` table
5. Updates game status to `completed`

**Authorization:**

Only the game creator (host) can access this screen. Non-hosts will see an access denied message.

---

### QuickStatsScreen

A simplified modal screen that allows individual players to enter their own stats after participating in a completed game.

**Features:**
- Modal presentation
- Game info display
- Personal stats entry form
- Quick "Hat Trick" button
- Goalie badge (if player is a goalie)
- Stats summary (total points, defensive actions)
- Save and Skip buttons
- Participant validation
- Pre-filled with existing stats or 0s
- Input validation (0-50 range)

**Usage:**

```typescript
import { QuickStatsScreen } from './screens/QuickStatsScreen';

// In your component:
const [showQuickStats, setShowQuickStats] = useState(false);

<QuickStatsScreen
  visible={showQuickStats}
  gameId="uuid-of-game"
  currentUserId="uuid-of-current-user"
  supabaseUrl="https://your-project.supabase.co"
  supabaseAnonKey="your-anon-key"
  onClose={() => setShowQuickStats(false)}
  onStatsSubmitted={() => {
    // Stats saved successfully
    setShowQuickStats(false);
    // Optionally refresh data
  }}
/>
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `visible` | `boolean` | Yes | Controls modal visibility |
| `gameId` | `string` | Yes | UUID of the game |
| `currentUserId` | `string` | Yes | UUID of the current user |
| `supabaseUrl` | `string` | Yes | Supabase project URL |
| `supabaseAnonKey` | `string` | Yes | Supabase anonymous key |
| `onClose` | `() => void` | Yes | Callback to close the modal |
| `onStatsSubmitted` | `() => void` | No | Callback when stats are successfully submitted |

**Database Operations:**

1. Fetches game details
2. Fetches current user profile
3. Validates user is a confirmed participant
4. Fetches existing stats (if any)
5. Upserts stats to `player_stats` table

**Authorization:**

Only confirmed participants can enter stats. Non-participants will see an error message.

---

## Supporting Components

### NumberStepper

A reusable number input component with increment/decrement buttons and direct text input.

**Features:**
- Plus/minus buttons
- Direct text input
- Min/max value constraints
- Customizable step size
- Optional label
- Disabled state for buttons at limits

**Usage:**

```typescript
import { NumberStepper } from '../components/NumberStepper';

<NumberStepper
  label="Goals"
  value={goals}
  onChange={(newValue) => setGoals(newValue)}
  min={0}
  max={50}
  step={1}
/>
```

**Props:**

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `value` | `number` | Yes | - | Current value |
| `onChange` | `(value: number) => void` | Yes | - | Callback when value changes |
| `min` | `number` | No | `0` | Minimum value |
| `max` | `number` | No | `99` | Maximum value |
| `step` | `number` | No | `1` | Increment/decrement step |
| `label` | `string` | No | - | Label text |

---

## Integration Guide

### 1. Setup Supabase Client

The screens require Supabase credentials. You can either:

**Option A: Pass credentials as props** (as shown above)

**Option B: Use a global Supabase context**

Create a Supabase context:

```typescript
// src/contexts/SupabaseContext.tsx
import { createContext, useContext } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const SupabaseContext = createContext<SupabaseClient<Database>>(supabase);

export const useSupabase = () => useContext(SupabaseContext);

export const SupabaseProvider: React.FC = ({ children }) => {
  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
};
```

Then modify the screens to use the context instead of props.

### 2. Navigation Setup

#### Using React Navigation:

```typescript
// In your navigator:
import { GameStatsScreen, QuickStatsScreen } from './screens';

<Stack.Screen
  name="GameStats"
  component={GameStatsScreen}
  options={{ title: 'Enter Game Stats' }}
/>
```

Navigate to the screen:

```typescript
navigation.navigate('GameStats', {
  gameId: game.id,
  currentUserId: user.id,
  supabaseUrl: SUPABASE_URL,
  supabaseAnonKey: SUPABASE_ANON_KEY,
});
```

#### Using Expo Router:

```typescript
// app/game-stats/[id].tsx
import { useLocalSearchParams } from 'expo-router';
import { GameStatsScreen } from '../../src/screens';

export default function GameStatsPage() {
  const { id } = useLocalSearchParams();

  return (
    <GameStatsScreen
      gameId={id as string}
      currentUserId={user.id}
      // ... other props
    />
  );
}
```

### 3. Trigger Conditions

#### GameStatsScreen
- Trigger when host marks game as completed
- Trigger from game details screen (host only)
- Trigger from completed games list

#### QuickStatsScreen
- Trigger as modal after joining a completed game
- Trigger from user's game history
- Trigger from notifications

### 4. Example Flow

```typescript
// Example: After completing a game
const handleCompleteGame = async () => {
  // 1. Update game status
  await supabase
    .from('games')
    .update({ status: 'completed' })
    .eq('id', gameId);

  // 2. Navigate to stats entry
  if (isHost) {
    navigation.navigate('GameStats', { gameId });
  } else {
    setShowQuickStats(true);
  }
};
```

---

## Validation Rules

Both screens enforce the following validation:

1. **Non-negative values**: All stats must be ≥ 0
2. **Maximum value**: All stats must be ≤ 50 (configurable via `MAX_STAT_VALUE`)
3. **Participant check**: Only confirmed participants can enter stats
4. **Host check** (GameStatsScreen): Only game creator can access

---

## Database Schema

The screens interact with the following tables:

### player_stats
```sql
CREATE TABLE player_stats (
  id UUID PRIMARY KEY,
  player_id UUID REFERENCES profiles(id),
  game_id UUID REFERENCES games(id),
  goals INTEGER DEFAULT 0 CHECK (goals >= 0),
  assists INTEGER DEFAULT 0 CHECK (assists >= 0),
  blocks INTEGER DEFAULT 0 CHECK (blocks >= 0),
  steals INTEGER DEFAULT 0 CHECK (steals >= 0),
  created_at TIMESTAMPTZ,
  UNIQUE(player_id, game_id)
);
```

### Row Level Security (RLS)

- **SELECT**: Anyone can view stats
- **INSERT**: Game creators can insert stats for participants
- **UPDATE**: Game creators can update stats; Players can update their own stats
- **DELETE**: Game creators can delete stats

---

## Styling

The screens use React Native's StyleSheet API with a consistent design system:

**Color Palette:**
- Primary: `#007AFF` (iOS blue)
- Background: `#F5F7FA` (light gray)
- Surface: `#FFFFFF` (white)
- Text Primary: `#1F2937` (dark gray)
- Text Secondary: `#6B7280` (medium gray)
- Error: `#EF4444` (red)
- Border: `#E8ECF1` (light border)

**Position Badge Colors:**
- Goalie: `#FF6B6B`
- Driver: `#4ECDC4`
- Wing: `#45B7D1`
- Center: `#FFA07A`

**Skill Level Badge Colors:**
- Beginner: `#95E1D3`
- Intermediate: `#F38181`
- Advanced: `#AA96DA`
- Pro: `#FCBAD3`
Both screens use a consistent design system:

- **Primary color**: `#3B82F6` (Blue 500)
- **Background**: `#F9FAFB` (Gray 50)
- **Card background**: `#FFFFFF` (White)
- **Text primary**: `#111827` (Gray 900)
- **Text secondary**: `#6B7280` (Gray 500)
- **Border**: `#E5E7EB` (Gray 200)

You can customize the styles by modifying the `StyleSheet` objects in each component.

---

## Error Handling

Both screens implement comprehensive error handling:

- Network errors are caught and displayed to the user
- Form validation errors are shown inline
- Supabase errors are logged to console and shown as alerts
- Loading states prevent duplicate submissions
- Unique constraint violations are handled gracefully

---

## Testing Checklist

- [ ] View own profile
- [ ] View another player's profile
- [ ] Edit profile with valid data
- [ ] Test username validation (3-30 chars, alphanumeric + underscore)
- [ ] Test full name validation (required, min 2 chars)
- [ ] Test bio character limit (500 chars)
- [ ] Test duplicate username error
- [ ] Select position and skill level
- [ ] Clear position and skill level
- [ ] Upload avatar (if implemented)
- [ ] Remove avatar
- [ ] Cancel edit with unsaved changes
- [ ] Pull to refresh on profile screen
- [ ] Switch between Stats and Games tabs
- [ ] View empty states (no stats, no games)
- [ ] Check loading skeletons

---

## Future Enhancements

Potential improvements for future versions:

1. **Social Features:**
   - Follow/unfollow players
   - Direct messaging
   - Share profile

2. **Advanced Stats:**
   - Charts and graphs
   - Performance trends over time
   - Comparison with other players

3. **Achievements:**
   - Badges and trophies
   - Milestones (100 goals, 50 games, etc.)

4. **Privacy:**
   - Private profiles
   - Block users
   - Privacy settings

5. **Export:**
   - Export stats as PDF
   - Share stats on social media
Both screens handle common errors:

1. **Network errors**: Shows alert and allows retry
2. **Permission errors**: Shows access denied message
3. **Validation errors**: Shows specific validation messages
4. **Missing data**: Shows appropriate error states

---

## Future Enhancements

Potential improvements:
- [ ] GPS location picker instead of text input
- [ ] Multi-step wizard for complex profiles
- [ ] Social media links
- [ ] Profile preview before submission
- [ ] Image cropping/editing
- [ ] Compress images before upload
- [ ] Offline support with queue

1. **Offline support**: Cache stats locally and sync when online
2. **Stats suggestions**: Use historical data to suggest typical stats
3. **Photo upload**: Add game photos while entering stats
4. **MVP selection**: Allow host to select game MVP
5. **Team stats**: Track team-level statistics
6. **Comparison view**: Compare stats with previous games
7. **Leaderboards**: Show top performers across games
8. **Export stats**: Export to PDF or share via social media

---

## Dependencies

Required packages:

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-native": "^0.73.0",
    "@supabase/supabase-js": "^2.39.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-native": "^0.73.0",
    "typescript": "^5.3.0"
  }
}
```

---

## Testing

### Unit Tests

```typescript
// Example test for NumberStepper
import { render, fireEvent } from '@testing-library/react-native';
import { NumberStepper } from '../NumberStepper';

test('increments value when plus button is pressed', () => {
  const onChange = jest.fn();
  const { getByText } = render(
    <NumberStepper value={0} onChange={onChange} />
  );

  fireEvent.press(getByText('+'));
  expect(onChange).toHaveBeenCalledWith(1);
});
```

### Integration Tests

```typescript
// Example test for GameStatsScreen
test('loads game data and displays participants', async () => {
  const { getByText } = render(
    <GameStatsScreen
      gameId="test-game-id"
      currentUserId="test-user-id"
      supabaseUrl={SUPABASE_URL}
      supabaseAnonKey={SUPABASE_ANON_KEY}
    />
  );

  await waitFor(() => {
    expect(getByText('Enter Stats for 10 Players')).toBeTruthy();
  });
});
```

---

## Support

For issues or questions:
- Check the main project README
- Review Supabase documentation: https://supabase.com/docs
- Check React Native documentation: https://reactnative.dev/docs
- Check the [Supabase documentation](https://supabase.com/docs)
- Review the [React Native documentation](https://reactnative.dev/docs/getting-started)
- Open an issue in the repository
