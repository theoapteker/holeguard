import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { SummaryCard } from '../components/SummaryCard';
import { FilterButton } from '../components/FilterButton';
import { GameStatsCard } from '../components/GameStatsCard';
import { LeaderboardRow } from '../components/LeaderboardRow';
import {
  fetchPlayerStatsSummary,
  fetchRecentGames,
  fetchGoalsOverTime,
  fetchPositionBreakdown,
  fetchTopScorersPreview,
} from '../services/statsService';
import {
  PlayerStatsSummary,
  GameWithStats,
  GoalsOverTime,
  PositionStats,
  LeaderboardEntry,
} from '../types/stats.types';
import { DateRangeFilter, formatDateRange } from '../utils/dateFilters';

interface StatsScreenProps {
  playerId: string;
  navigation?: any;
}

export const StatsScreen: React.FC<StatsScreenProps> = ({
  playerId,
  navigation,
}) => {
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>('month');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [summary, setSummary] = useState<PlayerStatsSummary | null>(null);
  const [recentGames, setRecentGames] = useState<GameWithStats[]>([]);
  const [goalsOverTime, setGoalsOverTime] = useState<GoalsOverTime[]>([]);
  const [positionStats, setPositionStats] = useState<PositionStats[]>([]);
  const [topScorers, setTopScorers] = useState<LeaderboardEntry[]>([]);

  const loadData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [summaryData, gamesData, goalsData, positionData, scorersData] =
        await Promise.all([
          fetchPlayerStatsSummary(playerId, dateFilter),
          fetchRecentGames(playerId, 10),
          fetchGoalsOverTime(playerId, dateFilter),
          fetchPositionBreakdown(playerId, dateFilter),
          fetchTopScorersPreview(dateFilter),
        ]);

      setSummary(summaryData);
      setRecentGames(gamesData);
      setGoalsOverTime(goalsData);
      setPositionStats(positionData);
      setTopScorers(scorersData);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateFilter]);

  const onRefresh = useCallback(() => {
    loadData(true);
  }, [dateFilter]);

  const handleFilterChange = (filter: DateRangeFilter) => {
    setDateFilter(filter);
  };

  const navigateToLeaderboard = () => {
    navigation?.navigate('Leaderboard');
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // Chart configuration
  const screenWidth = Dimensions.get('window').width;
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#3b82f6',
    },
  };

  // Prepare chart data
  const lineChartData = {
    labels: goalsOverTime.length > 0
      ? goalsOverTime.map((d) => d.date)
      : ['No data'],
    datasets: [
      {
        data: goalsOverTime.length > 0
          ? goalsOverTime.map((d) => d.goals)
          : [0],
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  // Prepare pie chart data for positions
  const positionColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
  const pieChartData = positionStats.map((stat, index) => ({
    name: stat.position,
    population: stat.gamesPlayed,
    color: positionColors[index % positionColors.length],
    legendFontColor: '#6b7280',
    legendFontSize: 14,
  }));

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Stats</Text>
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
            onPress={() => handleFilterChange('week')}
          />
          <FilterButton
            filter="month"
            label="Month"
            active={dateFilter === 'month'}
            onPress={() => handleFilterChange('month')}
          />
          <FilterButton
            filter="year"
            label="Year"
            active={dateFilter === 'year'}
            onPress={() => handleFilterChange('year')}
          />
          <FilterButton
            filter="all"
            label="All Time"
            active={dateFilter === 'all'}
            onPress={() => handleFilterChange('all')}
          />
        </ScrollView>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryGrid}>
        <SummaryCard
          title="Total Games"
          value={summary?.totalGames || 0}
          color="#3b82f6"
        />
        <SummaryCard
          title="Total Goals"
          value={summary?.totalGoals || 0}
          color="#10b981"
        />
        <SummaryCard
          title="Total Assists"
          value={summary?.totalAssists || 0}
          color="#f59e0b"
        />
        <SummaryCard
          title="Total Blocks"
          value={summary?.totalBlocks || 0}
          color="#ef4444"
        />
      </View>

      {/* Performance Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Goals Per Game</Text>
        {goalsOverTime.length > 0 ? (
          <View style={styles.chartContainer}>
            <LineChart
              data={lineChartData}
              width={screenWidth - 32}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No game data available for this period
            </Text>
          </View>
        )}
      </View>

      {/* Position Breakdown */}
      {positionStats.length > 0 && positionStats[0].gamesPlayed > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Position Breakdown</Text>
          <View style={styles.chartContainer}>
            <PieChart
              data={pieChartData}
              width={screenWidth - 32}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        </View>
      )}

      {/* Recent Performance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Games</Text>
        {recentGames.length > 0 ? (
          <View style={styles.gamesContainer}>
            {recentGames.map((game) => (
              <GameStatsCard key={game.id} game={game} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No games played yet
            </Text>
          </View>
        )}
      </View>

      {/* Leaderboard Preview */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top Scorers This Month</Text>
          {navigation && (
            <TouchableOpacity onPress={navigateToLeaderboard}>
              <Text style={styles.viewAllButton}>View All</Text>
            </TouchableOpacity>
          )}
        </View>
        {topScorers.length > 0 ? (
          <View style={styles.leaderboardContainer}>
            {topScorers.map((entry) => (
              <LeaderboardRow
                key={entry.player.id}
                entry={entry}
                isCurrentUser={entry.player.id === playerId}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No leaderboard data available
            </Text>
          </View>
        )}
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
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
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 6,
    backgroundColor: '#f9fafb',
  },
  section: {
    padding: 16,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  viewAllButton: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  gamesContainer: {
    marginTop: 8,
  },
  leaderboardContainer: {
    marginTop: 8,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
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
