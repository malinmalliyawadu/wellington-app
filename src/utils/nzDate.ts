/**
 * Construct a Date (UTC instant) from date and time strings that represent
 * Pacific/Auckland local time. This is needed because `new Date(y, m, d, h, m)`
 * uses the device's local timezone, which may differ from Auckland.
 */
export function nzDate(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);

  // Treat the NZ components as if they were UTC
  const guessUtcMs = Date.UTC(year, month - 1, day, hours, minutes);

  // Use formatToParts to find what Auckland shows at this UTC instant
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Pacific/Auckland',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date(guessUtcMs));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? '0', 10);

  // Reconstruct Auckland local-time components as a UTC timestamp
  const aucklandAsUtcMs = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
  );

  // The difference is the Auckland-UTC offset at this approximate time
  const offsetMs = aucklandAsUtcMs - guessUtcMs;

  // Subtract the offset so the resulting Date represents the correct UTC instant
  return new Date(guessUtcMs - offsetMs);
}
