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
