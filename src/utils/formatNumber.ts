/**
 * Formats large numbers to be more readable
 * Examples:
 * - 25582 → 25.6k
 * - 1427 → 1.4k
 * - 999 → 999
 * - 50 → 50
 */
export function formatNumber(num: number | undefined): string {
  if (num === undefined) return '';

  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }

  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }

  return num.toString();
}
