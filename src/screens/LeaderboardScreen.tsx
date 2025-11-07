import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { LeaderboardRow } from '../components/LeaderboardRow';
import { FilterButton } from '../components/FilterButton';
import { fetchLeaderboard } from '../services/statsService';
import { LeaderboardEntry, LeaderboardCategory } from '../types/stats.types';
import { DateRangeFilter, formatDateRange } from '../utils/dateFilters';

interface LeaderboardScreenProps {
  currentUserId: string;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  currentUserId,
}) => {
  const [activeTab, setActiveTab] = useState<LeaderboardCategory>('goals');
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>('month');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);

  const loadLeaderboard = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await fetchLeaderboard(activeTab, dateFilter, 100);
      setLeaderboardData(data);

      // Find current user's rank
      const userEntry = data.find((entry) => entry.player.id === currentUserId);
      setCurrentUserRank(userEntry ? userEntry.rank : null);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [activeTab, dateFilter]);

  const onRefresh = useCallback(() => {
    loadLeaderboard(true);
  }, [activeTab, dateFilter]);

  const getCategoryLabel = (category: LeaderboardCategory): string => {
    switch (category) {
      case 'goals':
        return 'Goals';
      case 'assists':
        return 'Assists';
      case 'blocks':
        return 'Blocks';
      case 'games':
        return 'Games Played';
      default:
        return 'Goals';
    }
  };

  const renderTab = (category: LeaderboardCategory) => {
    const isActive = activeTab === category;
    return (
      <TouchableOpacity
        key={category}
        style={[styles.tab, isActive && styles.activeTab]}
        onPress={() => setActiveTab(category)}
      >
        <Text style={[styles.tabText, isActive && styles.activeTabText]}>
          {getCategoryLabel(category)}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <Text style={styles.headerSubtitle}>
          {formatDateRange(dateFilter)}
        </Text>
      </View>

      {/* Date Range Filters */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterButton
            filter="week"
            label="Week"
            active={dateFilter === 'week'}
            onPress={() => setDateFilter('week')}
          />
          <FilterButton
            filter="month"
            label="Month"
            active={dateFilter === 'month'}
            onPress={() => setDateFilter('month')}
          />
          <FilterButton
            filter="year"
            label="Year"
            active={dateFilter === 'year'}
            onPress={() => setDateFilter('year')}
          />
          <FilterButton
            filter="all"
            label="All Time"
            active={dateFilter === 'all'}
            onPress={() => setDateFilter('all')}
          />
        </ScrollView>
      </View>

      {/* Category Tabs */}
      <View style={styles.tabsContainer}>
        {renderTab('goals')}
        {renderTab('assists')}
        {renderTab('blocks')}
        {renderTab('games')}
      </View>

      {/* Current User Rank Badge */}
      {currentUserRank && (
        <View style={styles.rankBadge}>
          <Text style={styles.rankBadgeText}>
            Your Rank: #{currentUserRank}
          </Text>
        </View>
      )}

      {/* Leaderboard List */}
      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {leaderboardData.length > 0 ? (
          <View style={styles.listContent}>
            {leaderboardData.map((entry) => (
              <LeaderboardRow
                key={entry.player.id}
                entry={entry}
                isCurrentUser={entry.player.id === currentUserId}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No leaderboard data available for this period
            </Text>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 16,
    paddingTop: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  rankBadge: {
    backgroundColor: '#3b82f6',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rankBadgeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 32,
  },
});
