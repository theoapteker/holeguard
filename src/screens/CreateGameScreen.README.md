# CreateGameScreen Component

A comprehensive React Native Expo screen for creating new water polo pickup games.

## Features

✅ **Complete Form with Validation**
- Game title (required, max 255 chars)
- Description (optional, multiline)
- Location/pool name (required)
- Pool address (required)
- GPS coordinates (optional)
- Date picker (must be future date)
- Time picker
- Max players (1-30, default 12)
- Skill level requirement selector

✅ **Location Features**
- "Use My Location" button with expo-location integration
- Automatic address reverse geocoding
- GPS coordinate capture
- Permission handling

✅ **User Experience**
- Scrollable form with clean section headers
- Loading states during creation and location fetch
- Comprehensive form validation
- Error messages for invalid inputs
- Success confirmation
- Automatic navigation back to home feed

✅ **Backend Integration**
- Saves game to Supabase `games` table
- Auto-joins host to the game via `game_participants` table
- Authenticated user as `created_by`
- Proper error handling

## Required Dependencies

Install the following packages in your Expo project:

```bash
# Core dependencies
npx expo install expo-location
npm install @supabase/supabase-js

# Date/Time picker
npm install @react-native-community/datetimepicker
npx expo install @react-native-community/datetimepicker

# Navigation (if not already installed)
npm install @react-navigation/native @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context
```

## Environment Setup

Create a `.env` file in your project root:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase Configuration

Ensure your Supabase project has:

1. **Authentication enabled** - Users must be logged in to create games
2. **Database schema** - Run the migration from `/supabase/migrations/20250107000000_initial_schema.sql`
3. **RLS policies** - Enabled for `games` and `game_participants` tables

## Usage

### Basic Implementation

```typescript
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CreateGameScreen from './src/screens/CreateGameScreen';

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="CreateGame"
          component={CreateGameScreen}
          options={{ title: 'Create New Game' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

### Navigation

Navigate to the screen from anywhere in your app:

```typescript
navigation.navigate('CreateGame');
```

The screen will automatically navigate back (`navigation.goBack()`) after successful game creation.

## Form Validation Rules

| Field | Validation |
|-------|-----------|
| Title | Required, 1-255 characters |
| Description | Optional, no limit |
| Location | Required |
| Pool Address | Required |
| Date & Time | Must be in the future |
| Max Players | Required, 1-30 integer |
| Skill Level | Optional, one of: null, beginner, intermediate, advanced, pro |
| Coordinates | Optional, valid GPS coordinates |

## Location Permissions

The app will request location permissions when user taps "Use My Location":

### iOS Configuration (`app.json`)

```json
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow WaterPolo Connect to use your location to help you find nearby games."
        }
      ]
    ]
  }
}
```

### Android Configuration (`app.json`)

```json
{
  "expo": {
    "android": {
      "permissions": [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION"
      ]
    }
  }
}
```

## Database Operations

### Game Creation

```typescript
const gameData: GameInsert = {
  created_by: user.id,
  title: "Tuesday Night Pickup",
  description: "Casual game...",
  location: "Downtown Pool",
  pool_address: "123 Main St",
  latitude: 37.7749,
  longitude: -122.4194,
  date_time: "2025-11-15T18:00:00Z",
  max_players: 12,
  skill_level_required: 'intermediate',
  status: 'open',
};

const { data, error } = await supabase
  .from('games')
  .insert(gameData)
  .select()
  .single();
```

### Auto-Join Host

```typescript
const participantData: GameParticipantInsert = {
  game_id: newGame.id,
  player_id: user.id,
  status: 'confirmed',
};

await supabase
  .from('game_participants')
  .insert(participantData);
```

## Customization

### Styling

All styles are defined in the `styles` StyleSheet at the bottom of the component. Customize colors, spacing, and typography to match your app's design system.

### Skill Levels

Modify the `SKILL_LEVELS` array to change labels:

```typescript
const SKILL_LEVELS = [
  { label: 'Any Skill Level', value: null },
  { label: 'Beginner+', value: 'beginner' },
  { label: 'Intermediate+', value: 'intermediate' },
  { label: 'Advanced+', value: 'advanced' },
  { label: 'Pro Only', value: 'pro' },
];
```

### Default Values

Change default form values:

```typescript
const [selectedDate, setSelectedDate] = useState(new Date(Date.now() + 86400000)); // Tomorrow
const [maxPlayers, setMaxPlayers] = useState('12'); // Default 12
const [skillLevel, setSkillLevel] = useState<SkillLevelType | null>(null); // Any skill
```

## Error Handling

The screen handles several error scenarios:

- **Not authenticated**: Alert prompts user to log in
- **Validation errors**: Red borders and error messages below fields
- **Location permission denied**: Alert with explanation
- **Location fetch failed**: Alert with fallback to manual entry
- **Game creation failed**: Alert with retry option
- **Auto-join failed**: Success alert with manual join instructions

## TypeScript Types

The component uses types from `src/types/database.types.ts`:

- `GameInsert` - For creating games
- `GameParticipantInsert` - For joining games
- `SkillLevelType` - Skill level enum
- `Database` - Supabase database schema

## Testing Checklist

- [ ] Form validation prevents submission with empty required fields
- [ ] Date/time must be in the future
- [ ] Max players enforces 1-30 range
- [ ] Location permission request works on iOS and Android
- [ ] GPS coordinates are captured correctly
- [ ] Address reverse geocoding populates fields
- [ ] Game is created in Supabase
- [ ] Host is automatically added to game_participants
- [ ] Success message displays
- [ ] Navigation back to home works
- [ ] Loading states display during async operations
- [ ] Error alerts display for failures

## Troubleshooting

### "Supabase client initialization failed"

Ensure environment variables are set correctly:
```typescript
console.log(process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
```

### "Location permission denied"

Check `app.json` includes location permissions configuration.

### "DateTimePicker not found"

Reinstall the package:
```bash
npx expo install @react-native-community/datetimepicker
```

### "Database insert failed"

Check:
1. User is authenticated
2. RLS policies allow the operation
3. Database schema matches TypeScript types
4. Required fields are provided

## Future Enhancements

Potential improvements:

- [ ] Map view for selecting location visually
- [ ] Integration with Google Places API for address autocomplete
- [ ] Photo upload for game venue
- [ ] Recurring game templates
- [ ] Draft save functionality
- [ ] Share game invitation via deep link
- [ ] Copy from previous game feature

## Support

For issues or questions:
- Check Supabase logs for database errors
- Review Expo console for runtime errors
- Verify all dependencies are installed
- Ensure database migration has been run
