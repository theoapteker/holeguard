import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Game } from '../types';
import { gameService } from '../services/gameService';
import GameCard from '../components/GameCard';

export default function HomeScreen() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load games on mount
  useEffect(() => {
    loadGames();
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    const subscription = gameService.subscribeToGames((payload) => {
      console.log('Real-time update:', payload);

      if (payload.eventType === 'INSERT') {
        // Add new game to the list
        loadGames();
      } else if (payload.eventType === 'UPDATE') {
        // Update existing game
        setGames((prevGames) =>
          prevGames.map((game) =>
            game.id === payload.new.id ? { ...game, ...payload.new } : game
          )
        );
      } else if (payload.eventType === 'DELETE') {
        // Remove deleted game
        setGames((prevGames) =>
          prevGames.filter((game) => game.id !== payload.old.id)
        );
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadGames = async () => {
    try {
      const fetchedGames = await gameService.fetchGames();
      setGames(fetchedGames);
    } catch (error) {
      console.error('Error loading games:', error);
      Alert.alert('Error', 'Failed to load games. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadGames();
    setRefreshing(false);
  }, []);

  const handleJoinGame = async (gameId: string) => {
    try {
      // TODO: Get actual user ID from auth context
      const userId = 'temp-user-id';

      await gameService.joinGame(gameId, userId);
      Alert.alert('Success', 'You have joined the game!');

      // Refresh games to show updated player count
      await loadGames();
    } catch (error: any) {
      console.error('Error joining game:', error);
      Alert.alert('Error', error.message || 'Failed to join game. Please try again.');
    }
  };

  const handleFilter = () => {
    // Placeholder for filter functionality
    Alert.alert('Filters', 'Filter functionality coming soon!');
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text style={styles.appName}>HoleGuard</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton} onPress={handleFilter}>
            <Text style={styles.filterIcon}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.notificationIcon}>🔔</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🏊‍♂️</Text>
      <Text style={styles.emptyTitle}>No games nearby</Text>
      <Text style={styles.emptySubtitle}>Be the first to create one!</Text>
      <TouchableOpacity style={styles.createButton}>
        <Text style={styles.createButtonText}>CREATE GAME</Text>
      </TouchableOpacity>
    </View>
  );

  const renderGameItem = ({ item }: { item: Game }) => (
    <GameCard game={item} onJoin={handleJoinGame} />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading games...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {renderHeader()}
      <FlatList
        data={games}
        renderItem={renderGameItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          games.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  filterIcon: {
    fontSize: 20,
  },
  notificationIcon: {
    fontSize: 20,
  },
  listContent: {
    paddingVertical: 16,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
