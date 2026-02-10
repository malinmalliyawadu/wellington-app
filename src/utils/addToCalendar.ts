import * as Calendar from 'expo-calendar';
import { Platform, Alert } from 'react-native';

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
  // Parse as local time in Pacific/Auckland
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date(year, month - 1, day, hours, minutes);
  return date;
}

export async function addToCalendar(params: AddToCalendarParams): Promise<boolean> {
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
}
