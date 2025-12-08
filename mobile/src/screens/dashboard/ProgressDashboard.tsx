/**
 * Progress Dashboard Screen
 * Displays user statistics, achievements, and learning progress
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { ProgressChart, BarChart, LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

interface DashboardStats {
  totalWordsLearned: number;
  wordsDueForReview: number;
  currentStreak: number;
  longestStreak: number;
  masteryLevelDistribution: {
    beginner: number;
    learning: number;
    familiar: number;
    proficient: number;
    mastered: number;
  };
  last7DaysProgress: Array<{
    date: string;
    newWords: number;
    reviewedWords: number;
  }>;
  accuracyRate: number;
  totalStudyTime: number; // in minutes
}

export const ProgressDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    // TODO: Load from API or offline storage
    const mockStats: DashboardStats = {
      totalWordsLearned: 245,
      wordsDueForReview: 32,
      currentStreak: 12,
      longestStreak: 45,
      masteryLevelDistribution: {
        beginner: 45,
        learning: 68,
        familiar: 72,
        proficient: 42,
        mastered: 18,
      },
      last7DaysProgress: [
        { date: '11/09', newWords: 12, reviewedWords: 35 },
        { date: '11/10', newWords: 8, reviewedWords: 42 },
        { date: '11/11', newWords: 15, reviewedWords: 38 },
        { date: '11/12', newWords: 10, reviewedWords: 45 },
        { date: '11/13', newWords: 14, reviewedWords: 40 },
        { date: '11/14', newWords: 11, reviewedWords: 48 },
        { date: '11/15', newWords: 13, reviewedWords: 52 },
      ],
      accuracyRate: 87,
      totalStudyTime: 342,
    };
    setStats(mockStats);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  if (!stats) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const masteryData = {
    labels: ['Beginner', 'Learning', 'Familiar', 'Proficient', 'Mastered'],
    data: [
      stats.masteryLevelDistribution.beginner / stats.totalWordsLearned,
      stats.masteryLevelDistribution.learning / stats.totalWordsLearned,
      stats.masteryLevelDistribution.familiar / stats.totalWordsLearned,
      stats.masteryLevelDistribution.proficient / stats.totalWordsLearned,
      stats.masteryLevelDistribution.mastered / stats.totalWordsLearned,
    ],
  };

  const weeklyData = {
    labels: stats.last7DaysProgress.map((d) => d.date),
    datasets: [
      {
        data: stats.last7DaysProgress.map((d) => d.reviewedWords),
        color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header Stats */}
      <View style={styles.headerStats}>
        <StatCard
          title="Words Learned"
          value={stats.totalWordsLearned}
          icon="📚"
          color="#3498db"
        />
        <StatCard
          title="Due Today"
          value={stats.wordsDueForReview}
          icon="📝"
          color="#e74c3c"
        />
        <StatCard
          title="Current Streak"
          value={`${stats.currentStreak} days`}
          icon="🔥"
          color="#f39c12"
        />
        <StatCard
          title="Accuracy"
          value={`${stats.accuracyRate}%`}
          icon="🎯"
          color="#2ecc71"
        />
      </View>

      {/* Weekly Progress Chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>7-Day Progress</Text>
        <LineChart
          data={weeklyData}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: '#3498db',
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>

      {/* Mastery Distribution */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Mastery Level Distribution</Text>
        <ProgressChart
          data={masteryData}
          width={screenWidth - 40}
          height={220}
          strokeWidth={16}
          radius={32}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            color: (opacity = 1, index?: number) => {
              const colors = [
                'rgba(231, 76, 60, ',
                'rgba(241, 196, 15, ',
                'rgba(52, 152, 219, ',
                'rgba(155, 89, 182, ',
                'rgba(46, 204, 113, ',
              ];
              return `${colors[index || 0]}${opacity})`;
            },
          }}
          hideLegend={false}
          style={styles.chart}
        />
      </View>

      {/* Study Time Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Study Time This Month</Text>
        <Text style={styles.summaryValue}>{Math.floor(stats.totalStudyTime / 60)}h {stats.totalStudyTime % 60}m</Text>
        <Text style={styles.summarySubtext}>
          Average: {Math.round(stats.totalStudyTime / 30)} min/day
        </Text>
      </View>
    </ScrollView>
  );
};

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: string;
  color: string;
}> = ({ title, value, icon, color }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Text style={styles.statIcon}>{icon}</Text>
    <View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerStats: {
    padding: 15,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statTitle: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  chartContainer: {
    backgroundColor: '#fff',
    margin: 15,
    marginTop: 0,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 10,
  },
  summaryValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 5,
  },
  summarySubtext: {
    fontSize: 14,
    color: '#95a5a6',
  },
});

