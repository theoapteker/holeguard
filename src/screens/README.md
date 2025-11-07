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

---

## Support

For issues or questions:
- Check the main project README
- Review Supabase documentation: https://supabase.com/docs
- Check React Native documentation: https://reactnative.dev/docs
