/**
 * Generate updated seed SQL files using uploaded image URLs.
 *
 * Usage:
 *   node supabase/generate-seed-sql.mjs
 *
 * Reads:  supabase/seed-image-urls.json (from upload-seed-images.mjs)
 * Updates: supabase/seed.sql and supabase/seed-content.sql
 *
 * Replaces all Unsplash placeholder URLs with real uploaded image URLs.
 * Falls back to existing URL if no image was uploaded for that place.
 */

import { readFileSync, writeFileSync } from 'fs';

// Load URL mapping
const urlsPath = new URL('./seed-image-urls.json', import.meta.url).pathname;
let urls;
try {
  urls = JSON.parse(readFileSync(urlsPath, 'utf-8'));
} catch {
  console.error('No seed-image-urls.json found. Run upload-seed-images.mjs first.');
  process.exit(1);
}

// Helper: get URL for a slug, optionally at a specific index
function getUrl(slug, index = 0) {
  const images = urls[slug];
  if (!images || images.length === 0) return null;
  if (index < images.length) return images[index].url;
  // Wrap around if fewer images than needed
  return images[index % images.length].url;
}

// Helper: get any available image URL, trying slug first, then fallbacks
function getUrlWithFallback(slug, index = 0, ...fallbackSlugs) {
  const url = getUrl(slug, index);
  if (url) return url;
  for (const fb of fallbackSlugs) {
    const fbUrl = getUrl(fb, 0);
    if (fbUrl) return fbUrl;
  }
  return null;
}

/**
 * Replace Unsplash URLs in a SQL file with uploaded URLs.
 * Matches the pattern and replaces based on context (place name / nearby content).
 */
function replaceUrlsInFile(filePath) {
  let sql = readFileSync(filePath, 'utf-8');
  let replacements = 0;

  // Find all Unsplash URLs and replace them
  // Strategy: find each INSERT line with an unsplash URL and try to determine
  // which place it belongs to from surrounding context
  const unsplashPattern = /https:\/\/images\.unsplash\.com\/[^\s'",]+/g;

  // Build a mapping of unsplash URL → what to replace it with
  // by scanning the SQL for context clues near each URL
  const lines = sql.split('\n');
  const urlReplacements = new Map();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const unsplashUrls = line.match(unsplashPattern);
    if (!unsplashUrls) continue;

    // Look at surrounding lines for context (place name, slug hints)
    const context = lines.slice(Math.max(0, i - 3), i + 3).join(' ').toLowerCase();

    for (const unsplashUrl of unsplashUrls) {
      if (urlReplacements.has(unsplashUrl)) continue;

      // Try to match context to a place slug
      const slugMatches = [
        [/flight coffee/i, 'flight-coffee'],
        [/customs/i, 'customs'],
        [/loretta/i, 'loretta'],
        [/hillside/i, 'hillside'],
        [/prefab/i, 'prefab'],
        [/hiakai/i, 'hiakai'],
        [/egmont/i, 'egmont-st-deli'],
        [/aunty mena/i, 'aunty-menas'],
        [/hashigo/i, 'hashigo-zake'],
        [/golding/i, 'goldings'],
        [/the library/i, 'the-library'],
        [/rogue.*vagabond/i, 'rogue-vagabond'],
        [/te papa/i, 'te-papa'],
        [/cable car/i, 'cable-car'],
        [/zealandia/i, 'zealandia'],
        [/botanic garden/i, 'botanic-garden'],
        [/mt vic|mt victoria/i, 'mt-vic'],
        [/oriental bay/i, 'oriental-bay'],
        [/san fran/i, 'san-fran'],
        [/meow/i, 'meow'],
        [/valhalla/i, 'valhalla'],
        [/bats theatre/i, 'bats'],
        [/peoples coffee/i, 'peoples-coffee'],
        [/lamason/i, 'lamason'],
        [/raglan roast/i, 'raglan-roast'],
        [/mojo/i, 'mojo'],
        [/memphis belle/i, 'memphis-belle'],
        [/fidels/i, 'fidels'],
        [/logan brown/i, 'logan-brown'],
        [/ortega/i, 'ortega'],
        [/capitol/i, 'capitol'],
        [/dragonfly/i, 'dragonfly'],
        [/mr go/i, 'mr-gos'],
        [/kk malaysian/i, 'kk-malaysian'],
        [/hawthorn/i, 'hawthorn-lounge'],
        [/fork.*brewer/i, 'fork-brewer'],
        [/little beer/i, 'little-beer-quarter'],
        [/laundry/i, 'laundry'],
        [/garage project/i, 'garage-project'],
        [/wellington museum/i, 'wellington-museum'],
        [/space place/i, 'space-place'],
        [/city gallery/i, 'city-gallery'],
        [/waitangi/i, 'waitangi-park'],
        [/frank kitts/i, 'frank-kitts'],
        [/town belt/i, 'town-belt'],
        [/circa/i, 'circa'],
        [/opera house/i, 'opera-house'],
        [/tsb arena/i, 'tsb-arena'],
        [/wharewaka/i, 'wharewaka'],
        [/caroline/i, 'caroline'],
        [/everybody eats/i, 'everybody-eats'],
        [/mt kaukau|kaukau/i, 'mt-kaukau'],
        [/te ahumairangi/i, 'te-ahumairangi'],
        [/northern walkway/i, 'northern-walkway'],
      ];

      let matched = false;
      for (const [pattern, slug] of slugMatches) {
        if (pattern.test(context)) {
          const replacement = getUrl(slug);
          if (replacement) {
            urlReplacements.set(unsplashUrl, replacement);
            matched = true;
            break;
          }
        }
      }

      // Try generic category fallbacks based on URL content
      if (!matched) {
        const genericFallbacks = [
          [/coffee|espresso|latte/i, 'coffee'],
          [/beer|brew|tap/i, 'craft-beer'],
          [/music|band|concert|gig/i, 'live-music'],
          [/food|dish|plate|restaurant/i, 'food'],
          [/sunset|sunrise|golden/i, 'sunset'],
          [/nature|bush|tree|forest/i, 'nature'],
          [/harbour|waterfront|bay/i, 'waterfront'],
          [/bar|cocktail|drink/i, 'nightlife'],
        ];

        for (const [pattern, slug] of genericFallbacks) {
          if (pattern.test(context)) {
            const replacement = getUrl(slug);
            if (replacement) {
              urlReplacements.set(unsplashUrl, replacement);
              matched = true;
              break;
            }
          }
        }
      }
    }
  }

  // Apply replacements
  for (const [oldUrl, newUrl] of urlReplacements) {
    const escaped = oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'g');
    const count = (sql.match(regex) || []).length;
    sql = sql.replace(regex, newUrl);
    replacements += count;
  }

  return { sql, replacements, totalUrls: urlReplacements.size };
}

// Process both seed files
const files = ['seed.sql', 'seed-content.sql'];
for (const file of files) {
  const filePath = new URL(`./${file}`, import.meta.url).pathname;
  try {
    const { sql, replacements, totalUrls } = replaceUrlsInFile(filePath);
    writeFileSync(filePath, sql);
    console.log(`✓ ${file}: ${replacements} URL replacements (${totalUrls} unique URLs matched)`);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log(`⊘ ${file}: not found, skipping`);
    } else {
      console.error(`✗ ${file}: ${err.message}`);
    }
  }
}

// Also update avatar URLs for profiles
console.log('\n── Avatar URL Check ──');
const avatarSlugs = ['welly-avatar'];
for (const slug of avatarSlugs) {
  const url = getUrl(slug);
  if (url) {
    console.log(`✓ ${slug}: ${url}`);
  } else {
    console.log(`⊘ ${slug}: no image uploaded (add ${slug}.jpg to seed-images/)`);
  }
}

console.log('\nDone! Review the updated SQL files before running them.');
