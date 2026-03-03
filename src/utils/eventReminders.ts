import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Event } from '../types';
import { nzDate } from './nzDate';

const REMINDER_KEY_PREFIX = 'event_reminder_';

export async function scheduleEventReminder(event: Event): Promise<void> {
  // Calculate trigger time: 1 hour before the event start
  const eventDate = nzDate(event.date, event.startTime);
  const triggerDate = new Date(eventDate.getTime() - 60 * 60 * 1000); // 1 hour before

  // Don't schedule if the reminder time is in the past
  if (triggerDate.getTime() <= Date.now()) return;

  const scheduledId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Event Reminder',
      body: `${event.title} starts in 1 hour!`,
      data: { eventId: event.id },
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });

  await AsyncStorage.setItem(REMINDER_KEY_PREFIX + event.id, scheduledId);
}

export async function cancelEventReminder(eventId: string): Promise<void> {
  const scheduledId = await AsyncStorage.getItem(REMINDER_KEY_PREFIX + eventId);
  if (scheduledId) {
    await Notifications.cancelScheduledNotificationAsync(scheduledId);
    await AsyncStorage.removeItem(REMINDER_KEY_PREFIX + eventId);
  }
}
