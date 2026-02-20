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
