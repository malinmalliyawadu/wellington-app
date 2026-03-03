/**
 * Construct a Date (UTC instant) from date and time strings that represent
 * Pacific/Auckland local time. This is needed because `new Date(y, m, d, h, m)`
 * uses the device's local timezone, which may differ from Auckland.
 */
export function nzDate(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);

  // Treat the NZ components as if they were UTC
  const guess = new Date(Date.UTC(year, month - 1, day, hours, minutes));

  // Determine what Auckland shows at this UTC instant
  const inAuckland = new Date(
    guess.toLocaleString('en-US', { timeZone: 'Pacific/Auckland' }),
  );

  // The difference is the Auckland-UTC offset at this approximate time
  const offsetMs = inAuckland.getTime() - guess.getTime();

  // Subtract the offset so the resulting Date represents the correct UTC instant
  return new Date(guess.getTime() - offsetMs);
}
