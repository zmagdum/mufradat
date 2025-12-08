/**
 * Achievement Badge Component
 * Displays earned achievements and badges
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt?: string;
  progress?: number;
  target?: number;
}

interface AchievementBadgeProps {
  achievement: Achievement;
  onPress?: () => void;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  onPress,
}) => {
  const isEarned = !!achievement.earnedAt;
  const progress = achievement.progress || 0;
  const target = achievement.target || 100;
  const progressPercent = Math.min((progress / target) * 100, 100);

  return (
    <TouchableOpacity
      style={[styles.container, !isEarned && styles.lockedContainer]}
      onPress={onPress}
      disabled={!isEarned}
    >
      <View style={[styles.iconContainer, !isEarned && styles.lockedIcon]}>
        <Text style={styles.icon}>{achievement.icon}</Text>
      </View>
      <View style={styles.contentContainer}>
        <Text style={[styles.title, !isEarned && styles.lockedText]}>
          {achievement.title}
        </Text>
        <Text style={[styles.description, !isEarned && styles.lockedText]}>
          {achievement.description}
        </Text>
        {!isEarned && achievement.target && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressPercent}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {progress}/{target}
            </Text>
          </View>
        )}
        {isEarned && achievement.earnedAt && (
          <Text style={styles.earnedDate}>
            Earned: {new Date(achievement.earnedAt).toLocaleDateString()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

export const AchievementsList: React.FC<{ achievements: Achievement[] }> = ({
  achievements,
}) => {
  const earned = achievements.filter((a) => a.earnedAt);
  const locked = achievements.filter((a) => !a.earnedAt);

  return (
    <View style={styles.listContainer}>
      {earned.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Earned ({earned.length})</Text>
          {earned.map((achievement) => (
            <AchievementBadge key={achievement.id} achievement={achievement} />
          ))}
        </>
      )}
      {locked.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Locked ({locked.length})</Text>
          {locked.map((achievement) => (
            <AchievementBadge key={achievement.id} achievement={achievement} />
          ))}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  lockedContainer: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f39c12',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  lockedIcon: {
    backgroundColor: '#bdc3c7',
  },
  icon: {
    fontSize: 32,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  lockedText: {
    color: '#95a5a6',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#ecf0f1',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#7f8c8d',
    minWidth: 40,
  },
  earnedDate: {
    fontSize: 12,
    color: '#27ae60',
    fontStyle: 'italic',
  },
  listContainer: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
    marginTop: 10,
  },
});

