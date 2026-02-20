export interface TextSegment {
  type: 'text' | 'hashtag';
  value: string;
}

const HASHTAG_REGEX = /#([a-zA-Z0-9_]{1,30})\b/g;

/**
 * Extracts unique lowercase hashtag names (without `#` prefix) from text.
 */
export function extractHashtags(text: string): string[] {
  const tags = new Set<string>();
  let match;
  while ((match = HASHTAG_REGEX.exec(text)) !== null) {
    tags.add(match[1].toLowerCase());
  }
  HASHTAG_REGEX.lastIndex = 0;
  return [...tags];
}

/**
 * Splits text into segments of plain text and hashtags for rich rendering.
 */
/**
 * Converts a place name to a valid hashtag (lowercase, alphanumeric only, max 30 chars).
 * Returns null if the result is empty.
 */
export function placeNameToHashtag(name: string): string | null {
  const tag = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 30);
  return tag.length > 0 ? tag : null;
}

/**
 * Detects if the cursor is inside a partially-typed hashtag.
 * Scans backwards from cursorPosition to find `#word`.
 * Returns the partial query (without `#`) or null.
 */
export function detectHashtagAtCursor(
  text: string,
  cursorPosition: number,
): string | null {
  if (cursorPosition <= 0 || cursorPosition > text.length) return null;

  // Scan backwards from cursor to find the start of a #word
  let i = cursorPosition - 1;
  while (i >= 0 && /[a-zA-Z0-9_]/.test(text[i])) {
    i--;
  }

  // Check if the character before the word is a #
  if (i < 0 || text[i] !== '#') return null;

  const partial = text.slice(i + 1, cursorPosition).toLowerCase();
  // Only return if there's at least one character after #
  return partial.length > 0 ? partial : null;
}

export function parseTextWithHashtags(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let lastIndex = 0;
  let match;

  while ((match = HASHTAG_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'hashtag', value: match[1] });
    lastIndex = match.index + match[0].length;
  }

  HASHTAG_REGEX.lastIndex = 0;

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return segments;
}
