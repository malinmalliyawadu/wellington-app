const MENTION_REGEX = /(?:^|(?<=\s))@([a-zA-Z0-9_]{1,30})\b/g;

/**
 * Extracts unique lowercase usernames (without `@` prefix) from text.
 * Guards against matching emails by requiring `@` to be at string start or preceded by whitespace.
 */
export function extractMentions(text: string): string[] {
  const mentions = new Set<string>();
  let match;
  while ((match = MENTION_REGEX.exec(text)) !== null) {
    mentions.add(match[1].toLowerCase());
  }
  MENTION_REGEX.lastIndex = 0;
  return [...mentions];
}

/**
 * Detects if the cursor is inside a partially-typed @mention.
 * Scans backwards from cursorPosition to find `@word`.
 * Returns the partial query (without `@`) or null.
 */
export function detectMentionAtCursor(
  text: string,
  cursorPosition: number,
): string | null {
  if (cursorPosition <= 0 || cursorPosition > text.length) return null;

  // Scan backwards from cursor to find the start of a @word
  let i = cursorPosition - 1;
  while (i >= 0 && /[a-zA-Z0-9_]/.test(text[i])) {
    i--;
  }

  // Check if the character before the word is @
  if (i < 0 || text[i] !== '@') return null;

  // Guard against emails: @ must be at start or preceded by whitespace
  if (i > 0 && !/\s/.test(text[i - 1])) return null;

  const partial = text.slice(i + 1, cursorPosition).toLowerCase();
  return partial.length > 0 ? partial : null;
}
