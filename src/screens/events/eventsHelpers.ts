import { Ionicons } from "@expo/vector-icons";
import { SFSymbol } from "expo-symbols";
import type { Event, Place } from "../../types";

// ─── Types & Constants ───────────────────────────────────────────────

export type DateRange = "today" | "tomorrow" | "weekend" | "month";

export const DATE_RANGE_LABELS: Record<DateRange, string> = {
  today: "Today",
  tomorrow: "Tomorrow",
  weekend: "This Weekend",
  month: "This Month",
};

export function getDateRange(range: DateRange): { start: string; end: string } {
  const now = new Date();
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-CA", { timeZone: "Pacific/Auckland" });

  switch (range) {
    case "today":
      return { start: fmt(now), end: fmt(now) };
    case "tomorrow": {
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      return { start: fmt(tomorrow), end: fmt(tomorrow) };
    }
    case "weekend": {
      const day = now.getDay();
      const daysUntilSat = day === 0 ? 6 : 6 - day;
      const sat = new Date(now);
      sat.setDate(now.getDate() + daysUntilSat);
      const sun = new Date(sat);
      sun.setDate(sat.getDate() + 1);
      const start = day === 0 || day === 6 ? now : sat;
      return { start: fmt(start), end: fmt(sun) };
    }
    case "month": {
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start: fmt(now), end: fmt(endOfMonth) };
    }
  }
}

export interface QuickChip {
  key: string;
  label: string;
  icon: { sf: SFSymbol; fallback: keyof typeof Ionicons.glyphMap };
}

export const QUICK_CHIPS: QuickChip[] = [
  {
    key: "today",
    label: "Today",
    icon: { sf: "sun.max.fill", fallback: "sunny" },
  },
  {
    key: "tomorrow",
    label: "Tomorrow",
    icon: { sf: "arrow.right.circle", fallback: "arrow-forward-circle" },
  },
  {
    key: "weekend",
    label: "Weekend",
    icon: { sf: "cup.and.saucer.fill", fallback: "cafe" },
  },
  {
    key: "free",
    label: "Free",
    icon: { sf: "tag.fill", fallback: "pricetag" },
  },
  {
    key: "volunteering",
    label: "Volunteering",
    icon: { sf: "hands.sparkles.fill", fallback: "heart" },
  },
  {
    key: "filters",
    label: "Filters",
    icon: { sf: "slider.horizontal.3", fallback: "options" },
  },
];

export type EventWithPlace = { event: Event; place: Place };

export type DiscoveryItem =
  | { type: "chips" }
  | {
      type: "carousel";
      key: string;
      title: string;
      icon: { sf: SFSymbol; fallback: keyof typeof Ionicons.glyphMap };
      items: EventWithPlace[];
      count: number;
    }
  | {
      type: "featured";
      item: EventWithPlace;
      restCarousel: EventWithPlace[];
      title: string;
      icon: { sf: SFSymbol; fallback: keyof typeof Ionicons.glyphMap };
      count: number;
    }
  | { type: "comingUpHeader"; count: number }
  | { type: "comingUpItem"; item: EventWithPlace }
  | { type: "viewAll" }
  | { type: "empty" }
  | { type: "footer" };

// ─── Section classification for discovery mode ───────────────────────

export function classifySections(eventsWithPlaces: EventWithPlace[]) {
  const now = new Date();
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-CA", { timeZone: "Pacific/Auckland" });
  const todayStr = fmt(now);

  // Compute tomorrow/weekend using NZ date to avoid device-timezone mismatch.
  // Parse the NZ-formatted date and do day arithmetic on that.
  const [y, mo, d] = todayStr.split("-").map(Number);
  const nzDate = new Date(y, mo - 1, d); // midnight local, but only used for day math
  const addDays = (base: Date, n: number) => {
    const r = new Date(base);
    r.setDate(r.getDate() + n);
    return r.toLocaleDateString("en-CA");
  };
  // Weekend dates (based on NZ day of week)
  const nzDay = nzDate.getDay();
  const daysUntilSat = nzDay === 0 ? 6 : 6 - nzDay;
  const satStr = addDays(nzDate, daysUntilSat);
  const sunStr = addDays(nzDate, daysUntilSat + 1);
  const isCurrentlyWeekend = nzDay === 0 || nzDay === 6;

  const happeningNow: EventWithPlace[] = [];
  const weekend: EventWithPlace[] = [];
  const free: EventWithPlace[] = [];
  const volunteering: EventWithPlace[] = [];
  const comingUp: EventWithPlace[] = [];

  // Current time in minutes since midnight (NZ timezone)
  const nzTimeStr = now.toLocaleTimeString("en-GB", {
    timeZone: "Pacific/Auckland",
    hour12: false,
  });
  const [nowH, nowM] = nzTimeStr.split(":").map(Number);
  const nowMinutes = nowH * 60 + nowM;

  const toMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  for (const item of eventsWithPlaces) {
    const { event } = item;
    const isToday = event.date === todayStr;
    const isWeekend =
      event.date === satStr ||
      event.date === sunStr ||
      (isCurrentlyWeekend && isToday);
    const isFree = event.price == null || event.price === 0;

    // For "Happening Now": skip today's events that have already finished.
    // Use endTime if available, otherwise assume ~3 hours after start.
    let hasEnded = false;
    if (isToday) {
      const endMinutes = event.endTime
        ? toMinutes(event.endTime)
        : toMinutes(event.startTime) + 180;
      hasEnded = endMinutes <= nowMinutes;
    }
    if (isToday && !hasEnded) happeningNow.push(item);
    if (isWeekend && !(isToday && hasEnded)) weekend.push(item);
    if (isFree && !(isToday && hasEnded)) free.push(item);
    if (event.category === 'volunteering' && !(isToday && hasEnded)) volunteering.push(item);
    if (!(isToday && hasEnded)) comingUp.push(item);
  }

  // Sort sections by AI score (highest first), unscored events fall to end
  const byScore = (a: EventWithPlace, b: EventWithPlace) =>
    (b.event.aiScore ?? -1) - (a.event.aiScore ?? -1);

  happeningNow.sort(byScore);
  weekend.sort(byScore);
  free.sort(byScore);
  volunteering.sort(byScore);
  comingUp.sort(byScore);

  // Popular = top 10 by attendee count (social signal, not AI score)
  const popular = [...eventsWithPlaces]
    .sort(
      (a, b) =>
        (b.event.attendeeIds?.length ?? 0) - (a.event.attendeeIds?.length ?? 0)
    )
    .slice(0, 10)
    .filter((item) => (item.event.attendeeIds?.length ?? 0) > 0);

  return { happeningNow, weekend, popular, free, volunteering, comingUp };
}
