/**
 * Notifications Service
 * Manages push notifications and reminders
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Failed to get push notification permissions');
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3498db',
    });
  }

  return true;
};

/**
 * Get push notification token
 */
export const getPushToken = async (): Promise<string | null> => {
  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
};

/**
 * Schedule daily review reminder
 */
export const scheduleReviewReminder = async (
  hour: number = 9,
  minute: number = 0
): Promise<string> => {
  // Cancel any existing reminders first
  await Notifications.cancelAllScheduledNotificationsAsync();

  const trigger = {
    hour,
    minute,
    repeats: true,
  };

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time to Review! 📚',
      body: 'You have words waiting for review. Keep your streak going!',
      data: { type: 'daily_review' },
      sound: true,
    },
    trigger,
  });

  return id;
};

/**
 * Schedule specific word review notification
 */
export const scheduleWordReviewNotification = async (
  wordId: string,
  arabicText: string,
  reviewDate: Date
): Promise<string> => {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Word Review Due 📝',
      body: `Time to review: ${arabicText}`,
      data: { type: 'word_review', wordId },
      sound: true,
    },
    trigger: {
      date: reviewDate,
    },
  });

  return id;
};

/**
 * Schedule streak reminder
 */
export const scheduleStreakReminder = async (
  streakCount: number
): Promise<string> => {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `🔥 ${streakCount} Day Streak!`,
      body: "Don't break your streak! Study for a few minutes today.",
      data: { type: 'streak_reminder' },
      sound: true,
    },
    trigger: {
      seconds: 3600 * 20, // 20 hours from now
    },
  });

  return id;
};

/**
 * Send achievement earned notification
 */
export const sendAchievementNotification = async (
  achievementTitle: string,
  achievementIcon: string
): Promise<void> => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${achievementIcon} Achievement Unlocked!`,
      body: achievementTitle,
      data: { type: 'achievement' },
      sound: true,
    },
    trigger: null, // Send immediately
  });
};

/**
 * Cancel all notifications
 */
export const cancelAllNotifications = async (): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

/**
 * Get all scheduled notifications
 */
export const getScheduledNotifications = async () => {
  return await Notifications.getAllScheduledNotificationsAsync();
};

/**
 * Add notification response listener
 */
export const addNotificationResponseListener = (
  callback: (response: Notifications.NotificationResponse) => void
) => {
  return Notifications.addNotificationResponseReceivedListener(callback);
};

