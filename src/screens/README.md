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

Both screens handle common errors:

1. **Network errors**: Shows alert and allows retry
2. **Permission errors**: Shows access denied message
3. **Validation errors**: Shows specific validation messages
4. **Missing data**: Shows appropriate error states

---

## Future Enhancements

Potential improvements:

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
- Check the [Supabase documentation](https://supabase.com/docs)
- Review the [React Native documentation](https://reactnative.dev/docs/getting-started)
- Open an issue in the repository
