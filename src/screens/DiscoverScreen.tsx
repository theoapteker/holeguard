import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { GameCard } from '../components/GameCard';
import { PlayerCard } from '../components/PlayerCard';
import { MapView } from '../components/MapView';
import { FilterChip } from '../components/FilterChip';
import { searchGames, searchPlayers } from '../services/searchService';
import type { GameWithCreator, ProfileWithStats, SkillLevelType, PositionType, GameStatusType } from '../types/database.types';

type TabType = 'games' | 'players';

interface GameFilters {
  status: GameStatusType[];
  skillLevels: SkillLevelType[];
  dateRange: 'all' | 'today' | 'week' | 'month';
  radius: number; // in km
}

interface PlayerFilters {
  positions: PositionType[];
  skillLevels: SkillLevelType[];
  radius: number; // in km
}

export const DiscoverScreen: React.FC = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('games');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // View mode for games
  const [showMap, setShowMap] = useState(false);

  // Data state
  const [games, setGames] = useState<GameWithCreator[]>([]);
  const [players, setPlayers] = useState<ProfileWithStats[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [gameFilters, setGameFilters] = useState<GameFilters>({
    status: ['open'],
    skillLevels: [],
    dateRange: 'all',
    radius: 25,
  });

  const [playerFilters, setPlayerFilters] = useState<PlayerFilters>({
    positions: [],
    skillLevels: [],
    radius: 25,
  });

  // User location (you would get this from a location service)
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch data when filters or search changes
  useEffect(() => {
    fetchData();
  }, [debouncedQuery, activeTab, gameFilters, playerFilters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'games') {
        const results = await searchGames({
          query: debouncedQuery,
          status: gameFilters.status,
          skillLevels: gameFilters.skillLevels,
          dateRange: gameFilters.dateRange,
          userLocation,
          radius: gameFilters.radius,
        });
        setGames(results);
      } else {
        const results = await searchPlayers({
          query: debouncedQuery,
          positions: playerFilters.positions,
          skillLevels: playerFilters.skillLevels,
          userLocation,
          radius: playerFilters.radius,
        });
        setPlayers(results);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter chip handlers for games
  const toggleGameStatus = (status: GameStatusType) => {
    setGameFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status],
    }));
  };

  const toggleGameSkillLevel = (level: SkillLevelType) => {
    setGameFilters(prev => ({
      ...prev,
      skillLevels: prev.skillLevels.includes(level)
        ? prev.skillLevels.filter(l => l !== level)
        : [...prev.skillLevels, level],
    }));
  };

  // Filter chip handlers for players
  const togglePlayerPosition = (position: PositionType) => {
    setPlayerFilters(prev => ({
      ...prev,
      positions: prev.positions.includes(position)
        ? prev.positions.filter(p => p !== position)
        : [...prev.positions, position],
    }));
  };

  const togglePlayerSkillLevel = (level: SkillLevelType) => {
    setPlayerFilters(prev => ({
      ...prev,
      skillLevels: prev.skillLevels.includes(level)
        ? prev.skillLevels.filter(l => l !== level)
        : [...prev.skillLevels, level],
    }));
  };

  const renderGameFilters = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filtersContainer}
      contentContainerStyle={styles.filtersContent}
    >
      {/* Status filters */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Status</Text>
        <View style={styles.chipRow}>
          {(['open', 'upcoming', 'full'] as const).map(status => (
            <FilterChip
              key={status}
              label={status.charAt(0).toUpperCase() + status.slice(1)}
              selected={gameFilters.status.includes(status)}
              onPress={() => toggleGameStatus(status)}
            />
          ))}
        </View>
      </View>

      {/* Skill level filters */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Skill Level</Text>
        <View style={styles.chipRow}>
          {(['beginner', 'intermediate', 'advanced', 'pro'] as const).map(level => (
            <FilterChip
              key={level}
              label={level.charAt(0).toUpperCase() + level.slice(1)}
              selected={gameFilters.skillLevels.includes(level)}
              onPress={() => toggleGameSkillLevel(level)}
            />
          ))}
        </View>
      </View>

      {/* Date range filters */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Date Range</Text>
        <View style={styles.chipRow}>
          {(['all', 'today', 'week', 'month'] as const).map(range => (
            <FilterChip
              key={range}
              label={range.charAt(0).toUpperCase() + range.slice(1)}
              selected={gameFilters.dateRange === range}
              onPress={() => setGameFilters(prev => ({ ...prev, dateRange: range }))}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderPlayerFilters = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filtersContainer}
      contentContainerStyle={styles.filtersContent}
    >
      {/* Position filters */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Position</Text>
        <View style={styles.chipRow}>
          {(['goalie', 'driver', 'wing', 'center'] as const).map(position => (
            <FilterChip
              key={position}
              label={position.charAt(0).toUpperCase() + position.slice(1)}
              selected={playerFilters.positions.includes(position)}
              onPress={() => togglePlayerPosition(position)}
            />
          ))}
        </View>
      </View>

      {/* Skill level filters */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Skill Level</Text>
        <View style={styles.chipRow}>
          {(['beginner', 'intermediate', 'advanced', 'pro'] as const).map(level => (
            <FilterChip
              key={level}
              label={level.charAt(0).toUpperCase() + level.slice(1)}
              selected={playerFilters.skillLevels.includes(level)}
              onPress={() => togglePlayerSkillLevel(level)}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderGamesList = () => {
    if (showMap) {
      return (
        <MapView
          games={games}
          userLocation={userLocation}
          onGameSelect={(gameId) => {
            // Navigate to game details
            console.log('Selected game:', gameId);
          }}
        />
      );
    }

    return (
      <FlatList
        data={games}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GameCard
            game={item}
            onPress={() => {
              // Navigate to game details
              console.log('Game pressed:', item.id);
            }}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No games found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your filters or search</Text>
            </View>
          ) : null
        }
      />
    );
  };

  const renderPlayersList = () => (
    <FlatList
      data={players}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <PlayerCard
          player={item}
          onPress={() => {
            // Navigate to player profile
            console.log('Player pressed:', item.id);
          }}
        />
      )}
      contentContainerStyle={styles.listContent}
      numColumns={2}
      columnWrapperStyle={styles.playerColumns}
      ListEmptyComponent={
        !loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No players found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your filters or search</Text>
          </View>
        ) : null
      }
    />
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search games or players..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'games' && styles.activeTab]}
          onPress={() => setActiveTab('games')}
        >
          <Text style={[styles.tabText, activeTab === 'games' && styles.activeTabText]}>
            Games
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'players' && styles.activeTab]}
          onPress={() => setActiveTab('players')}
        >
          <Text style={[styles.tabText, activeTab === 'players' && styles.activeTabText]}>
            Players
          </Text>
        </TouchableOpacity>
      </View>

      {/* Map Toggle (Games only) */}
      {activeTab === 'games' && (
        <View style={styles.viewToggleContainer}>
          <TouchableOpacity
            style={[styles.viewToggle, !showMap && styles.activeViewToggle]}
            onPress={() => setShowMap(false)}
          >
            <Text style={[styles.viewToggleText, !showMap && styles.activeViewToggleText]}>
              List
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewToggle, showMap && styles.activeViewToggle]}
            onPress={() => setShowMap(true)}
          >
            <Text style={[styles.viewToggleText, showMap && styles.activeViewToggleText]}>
              Map
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Filters */}
      {activeTab === 'games' ? renderGameFilters() : renderPlayerFilters()}

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
        </View>
      ) : (
        <View style={styles.contentContainer}>
          {activeTab === 'games' ? renderGamesList() : renderPlayersList()}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearIcon: {
    fontSize: 18,
    color: '#999',
    padding: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#0066cc',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#0066cc',
  },
  viewToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    gap: 8,
  },
  viewToggle: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  activeViewToggle: {
    backgroundColor: '#0066cc',
  },
  viewToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeViewToggleText: {
    color: '#fff',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filtersContent: {
    padding: 12,
    gap: 16,
  },
  filterGroup: {
    marginRight: 16,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  contentContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  playerColumns: {
    gap: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
});
