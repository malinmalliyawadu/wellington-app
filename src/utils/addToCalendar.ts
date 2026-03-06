import * as Calendar from 'expo-calendar';
import { Platform, Alert } from 'react-native';
import { nzDate } from './nzDate';

interface AddToCalendarParams {
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime?: string; // HH:mm
  location?: string;
  notes?: string;
}

async function getDefaultCalendarId(): Promise<string | null> {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

  if (Platform.OS === 'ios') {
    const defaultCalendar = await Calendar.getDefaultCalendarAsync();
    if (defaultCalendar) return defaultCalendar.id;
  }

  // Fallback: find a writable calendar
  const writable = calendars.find(
    (c) => c.allowsModifications && c.source?.type !== 'birthdays',
  );
  return writable?.id ?? null;
}

function buildDate(dateStr: string, timeStr: string): Date {
  return nzDate(dateStr, timeStr);
}

export async function addToCalendar(params: AddToCalendarParams): Promise<boolean> {
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Calendar access is needed to add events. You can enable it in Settings.',
      );
      return false;
    }

    const calendarId = await getDefaultCalendarId();
    if (!calendarId) {
      Alert.alert('No Calendar', 'Could not find a writable calendar on this device.');
      return false;
    }

    const startDate = buildDate(params.date, params.startTime);
    if (isNaN(startDate.getTime())) {
      Alert.alert('Invalid Date', 'This event has an invalid date or time.');
      return false;
    }

    const endDate = params.endTime
      ? buildDate(params.date, params.endTime)
      : new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // default 2 hours

    await Calendar.createEventAsync(calendarId, {
      title: params.title,
      startDate,
      endDate,
      location: params.location,
      notes: params.notes,
      timeZone: 'Pacific/Auckland',
    });

    return true;
  } catch (error) {
    console.error('addToCalendar error:', error);
    Alert.alert('Error', 'Failed to add event to calendar. Please try again.');
    return false;
  }
}
