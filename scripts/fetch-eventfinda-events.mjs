/**
 * Fetch events from Eventfinda Wellington by scraping their website.
 *
 * Usage:
 *   node scripts/fetch-eventfinda-events.mjs [--pages N] [--dry-run]
 *
 * Requires .env with:
 *   EXPO_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const EVENTFINDA_BASE = 'https://www.eventfinda.co.nz';
const WELLINGTON_EVENTS_URL = `${EVENTFINDA_BASE}/whatson/events/wellington`;
const EVENT_IMAGES_BUCKET = 'event-images';
const PAGES_TO_SCRAPE = parseInt(process.argv.find((_, i, a) => a[i - 1] === '--pages') ?? '3', 10);
const DRY_RUN = process.argv.includes('--dry-run');
const DELAY_MS = 1200; // be polite, >1 req/s

// Load .env
const envPath = path.resolve(import.meta.dirname, '..', '.env');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// Category mapping: Eventfinda category slugs → our event_category enum
// ---------------------------------------------------------------------------

// These are the slugs from setTargeting('category', [...]) on detail pages
const CATEGORY_SLUG_MAP = {
  // Music
  'concerts-gig-guide': 'music',
  'classic-rock-gigs': 'music',
  'rock-gigs': 'music',
  'pop-gigs': 'music',
  'jazz-gigs': 'music',
  'hip-hop-gigs': 'music',
  'rnb-gigs': 'music',
  'electronic-gigs': 'music',
  'classical-concerts': 'music',
  'folk-gigs': 'music',
  'country-gigs': 'music',
  'metal-gigs': 'music',
  'punk-gigs': 'music',
  'indie-gigs': 'music',
  'soul-gigs': 'music',
  'blues-gigs': 'music',
  'reggae-gigs': 'music',
  'dj-dance': 'music',
  'opera': 'music',
  'world-music-gigs': 'music',
  'alternative-gigs': 'music',
  'singer-songwriter-gigs': 'music',
  'latin-gigs': 'music',
  'funk-gigs': 'music',

  // Comedy
  'comedy': 'comedy',
  'stand-up-comedy': 'comedy',
  'improv-comedy': 'comedy',
  'comedy-shows': 'comedy',

  // Art / Performing arts
  'performing-arts': 'art',
  'theatre': 'art',
  'dance': 'art',
  'ballet': 'art',
  'musicals': 'art',
  'visual-arts': 'art',
  'exhibitions': 'art',
  'galleries': 'art',
  'film': 'art',
  'cinema': 'art',
  'photography': 'art',
  'literary': 'art',
  'poetry': 'art',
  'cabaret': 'art',
  'circus': 'art',
  'fringe': 'art',

  // Food
  'food-drink': 'food',
  'food-wine': 'food',
  'beer-festivals': 'food',
  'wine-events': 'food',
  'cooking-classes': 'food',
  'dining': 'food',
  'food-festivals': 'food',

  // Market
  'markets': 'market',
  'craft-markets': 'market',
  'farmers-markets': 'market',
  'night-markets': 'market',

  // Community
  'community': 'community',
  'charity-fundraisers': 'community',
  'social': 'community',
  'networking': 'community',
  'workshops': 'community',
  'seminars': 'community',
  'conferences': 'community',
  'lectures': 'community',
  'talks': 'community',
  'tours': 'community',
  'sports': 'community',
  'fitness': 'community',
  'wellness-health': 'community',
  'dating': 'community',
  'singles': 'community',
  'socials': 'community',
  'speed-dating': 'community',
  'lifestyle': 'community',
  'nature-outdoors': 'community',
  'walks': 'community',

  // Quiz
  'quiz-nights': 'quiz',
  'trivia': 'quiz',

  // Craft
  'craft': 'craft',
  'pottery': 'craft',
  'diy': 'craft',
  'maker': 'craft',

  // Kids
  'kids-family': 'kids',
  'family': 'kids',
  'children': 'kids',
  'kids': 'kids',

  // Cultural
  'cultural': 'cultural',
  'festivals-lifestyle': 'cultural',
  'heritage': 'cultural',
  'maori': 'cultural',
  'pasifika': 'cultural',
  'cultural-festivals': 'cultural',
};

// Fallback keyword matching when slugs don't match
const KEYWORD_MAP = {
  'concert': 'music', 'gig': 'music', 'music': 'music', 'band': 'music', 'dj': 'music',
  'comedy': 'comedy', 'stand-up': 'comedy', 'improv': 'comedy', 'comedian': 'comedy',
  'theatre': 'art', 'theater': 'art', 'exhibition': 'art', 'gallery': 'art', 'dance': 'art', 'ballet': 'art', 'fringe': 'art', 'film': 'art',
  'food': 'food', 'wine': 'food', 'beer': 'food', 'dining': 'food', 'cooking': 'food',
  'market': 'market', 'bazaar': 'market',
  'quiz': 'quiz', 'trivia': 'quiz',
  'craft': 'craft', 'pottery': 'craft',
  'kids': 'kids', 'family': 'kids', 'children': 'kids',
  'festival': 'cultural', 'cultural': 'cultural', 'heritage': 'cultural', 'matariki': 'cultural', 'pasifika': 'cultural',
};

function mapCategory(categorySlugs, eventName) {
  // Try slug-based mapping — prefer the most specific slug (last in array)
  if (categorySlugs?.length) {
    // Check most specific (last) slug first, then broader ones
    for (const slug of [...categorySlugs].reverse()) {
      if (CATEGORY_SLUG_MAP[slug]) return CATEGORY_SLUG_MAP[slug];
    }
    // Try partial slug matching on most specific first
    for (const slug of [...categorySlugs].reverse()) {
      for (const [key, value] of Object.entries(CATEGORY_SLUG_MAP)) {
        if (slug.includes(key) || key.includes(slug)) return value;
      }
    }
  }

  // Fall back to keyword matching on event name + category slugs
  const text = ((categorySlugs || []).join(' ') + ' ' + (eventName || '')).toLowerCase();
  for (const [keyword, category] of Object.entries(KEYWORD_MAP)) {
    if (text.includes(keyword)) return category;
  }

  return 'community'; // default
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchPage(url) {
  console.log(`  Fetching: ${url}`);
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function extractEventUrls(html) {
  const pattern = /href="(\/\d{4}\/[^"]+\/(?:wellington|wellington-region))"/g;
  const urls = new Set();
  let match;
  while ((match = pattern.exec(html)) !== null) {
    urls.add(match[1]);
  }
  return [...urls];
}

function extractJsonLdArray(html) {
  // Eventfinda puts all JSON-LD in a single array: [{Place}, {Offer}, {Event}, ...]
  const pattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = pattern.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      // It's an array of objects
      if (Array.isArray(parsed)) return parsed;
      // Single object
      return [parsed];
    } catch {
      // skip malformed
    }
  }
  return [];
}

function resolveJsonLdRefs(items) {
  // Build a map of @id → object for resolving references
  const idMap = new Map();
  for (const item of items) {
    if (item['@id']) idMap.set(item['@id'], item);
  }

  // Find the Event object and resolve its references
  const eventObj = items.find((i) => i['@type'] === 'Event');
  if (!eventObj) return null;

  // Resolve location
  if (eventObj.location?.['@id']) {
    const resolved = idMap.get(eventObj.location['@id']);
    if (resolved) eventObj.location = resolved;
  }

  // Resolve offers
  if (eventObj.offers) {
    const offers = Array.isArray(eventObj.offers) ? eventObj.offers : [eventObj.offers];
    eventObj.offers = offers.map((o) => {
      if (o['@id']) return idMap.get(o['@id']) || o;
      return o;
    });
  }

  return eventObj;
}

function extractCategorySlugs(html) {
  // Extract from: setTargeting('category', ["concerts-gig-guide","classic-rock-gigs"])
  const match = html.match(/setTargeting\s*\(\s*'category'\s*,\s*\[([^\]]*)\]/);
  if (!match) return [];
  try {
    return JSON.parse(`[${match[1]}]`);
  } catch {
    return [];
  }
}

function extractDescription(html) {
  // Try description div first (fullest content)
  const descDiv = html.match(/class=["'][^"']*description[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|p)>/i);
  if (descDiv) {
    const text = descDiv[1].replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
    if (text.length > 20) return decodeHtmlEntities(text);
  }

  // Fall back to meta description
  const metaMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']/i);
  if (metaMatch) return decodeHtmlEntities(metaMatch[1]).trim();

  return null;
}

function extractTicketUrl(html) {
  const ticketMatch = html.match(/href=["'](https?:\/\/[^"']*(?:ticket|book|eventbrite|humanitix|undertheradar|iticket|dashtickets)[^"']*)["']/i);
  if (ticketMatch) return ticketMatch[1];
  return null;
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

// ---------------------------------------------------------------------------
// Image download & upload
// ---------------------------------------------------------------------------

async function downloadAndUploadImage(imageUrl, eventSlug) {
  if (!imageUrl) return null;

  try {
    // Try larger image variant: -34 → -7
    const largeUrl = imageUrl.replace(/-34\./, '-7.');
    console.log(`    Downloading image...`);

    let buffer, contentType;
    const res = await fetch(largeUrl);
    if (res.ok) {
      buffer = Buffer.from(await res.arrayBuffer());
      contentType = res.headers.get('content-type') || 'image/jpeg';
    } else {
      // Fall back to original
      const res2 = await fetch(imageUrl);
      if (!res2.ok) {
        console.log(`    Image download failed: ${res2.status}`);
        return null;
      }
      buffer = Buffer.from(await res2.arrayBuffer());
      contentType = res2.headers.get('content-type') || 'image/jpeg';
    }

    if (buffer.length === 0) {
      console.log('    Image is empty, skipping');
      return null;
    }

    const ext = contentType.includes('png') ? 'png' : 'jpg';
    const filePath = `${eventSlug}-${Date.now()}.${ext}`;

    console.log(`    Uploading: ${filePath} (${(buffer.length / 1024).toFixed(1)}KB)`);

    const { error } = await supabase.storage
      .from(EVENT_IMAGES_BUCKET)
      .upload(filePath, buffer, { contentType, upsert: true });

    if (error) {
      console.error(`    Upload error: ${error.message}`);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(EVENT_IMAGES_BUCKET)
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (err) {
    console.error(`    Image error: ${err.message}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Database operations
// ---------------------------------------------------------------------------

async function ensureStorageBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.id === EVENT_IMAGES_BUCKET);

  if (!exists) {
    console.log(`Creating storage bucket: ${EVENT_IMAGES_BUCKET}`);
    const { error } = await supabase.storage.createBucket(EVENT_IMAGES_BUCKET, { public: true });
    if (error) {
      console.error(`Failed to create bucket: ${error.message}`);
      process.exit(1);
    }
  } else {
    console.log(`Storage bucket "${EVENT_IMAGES_BUCKET}" already exists`);
  }
}

async function findOrCreatePlace(venueName, address, lat, lng) {
  const { data: existing } = await supabase
    .from('places')
    .select('id, name, latitude, longitude')
    .ilike('name', venueName)
    .limit(1);

  if (existing?.length > 0) {
    return existing[0].id;
  }

  const { data: newPlace, error } = await supabase
    .from('places')
    .insert({
      name: venueName,
      category: 'venue',
      address: address || `${venueName}, Wellington`,
      latitude: lat || -41.2924,
      longitude: lng || 174.7787,
    })
    .select('id')
    .single();

  if (error) {
    console.error(`    Failed to create place "${venueName}": ${error.message}`);
    return null;
  }

  console.log(`    Created place: ${venueName} (${newPlace.id})`);
  return newPlace.id;
}

async function clearExistingEvents() {
  console.log('Clearing existing events...');

  const { error: attError } = await supabase
    .from('event_attendees')
    .delete()
    .neq('event_id', '00000000-0000-0000-0000-000000000000');
  if (attError) console.error(`  Error clearing attendees: ${attError.message}`);

  const { error } = await supabase
    .from('events')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) {
    console.error(`  Error clearing events: ${error.message}`);
  } else {
    console.log(`  Cleared events`);
  }

  // Clean up old images
  const { data: files } = await supabase.storage
    .from(EVENT_IMAGES_BUCKET)
    .list('', { limit: 1000 });
  if (files?.length > 0) {
    await supabase.storage.from(EVENT_IMAGES_BUCKET).remove(files.map((f) => f.name));
    console.log(`  Removed ${files.length} old images from storage`);
  }
}

async function insertEvent(eventData) {
  const { data, error } = await supabase
    .from('events')
    .insert(eventData)
    .select('id')
    .single();

  if (error) {
    console.error(`  Failed to insert "${eventData.title}": ${error.message}`);
    return null;
  }
  return data.id;
}

// ---------------------------------------------------------------------------
// Main scraping logic
// ---------------------------------------------------------------------------

async function scrapeEventListing() {
  const allEventUrls = [];

  for (let page = 1; page <= PAGES_TO_SCRAPE; page++) {
    const url = page === 1
      ? WELLINGTON_EVENTS_URL
      : `${WELLINGTON_EVENTS_URL}/page/${page}`;

    const html = await fetchPage(url);
    const urls = extractEventUrls(html);
    console.log(`  Page ${page}: found ${urls.length} event URLs`);
    allEventUrls.push(...urls);

    if (page < PAGES_TO_SCRAPE) await sleep(DELAY_MS);
  }

  return [...new Set(allEventUrls)];
}

async function scrapeEventDetail(eventPath) {
  const url = `${EVENTFINDA_BASE}${eventPath}`;
  const html = await fetchPage(url);

  // Parse JSON-LD array and resolve @id references
  const jsonLdItems = extractJsonLdArray(html);
  const eventData = resolveJsonLdRefs(jsonLdItems);

  if (!eventData) {
    console.log(`    No JSON-LD Event data found`);
    return null;
  }

  // Extract category from setTargeting
  const categorySlugs = extractCategorySlugs(html);

  // Get fuller description from page HTML
  const pageDescription = extractDescription(html);

  // Clean up JSON-LD description (remove HTML tags and trailing venue info)
  let ldDescription = (eventData.description || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim();

  // Description from JSON-LD is often truncated and has venue info appended
  // Prefer the page description if it's longer
  const description = (pageDescription && pageDescription.length > ldDescription.length)
    ? pageDescription
    : ldDescription;

  const ticketUrl = extractTicketUrl(html) || url;

  // Parse dates
  const startDate = eventData.startDate ? new Date(eventData.startDate) : null;
  const endDate = eventData.endDate ? new Date(eventData.endDate) : null;

  if (!startDate) {
    console.log(`    No start date`);
    return null;
  }

  // Skip past events (compare date only, ignoring time)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (startDate < today) {
    console.log(`    Skipping past event: ${eventData.name} (${startDate.toLocaleDateString()})`);
    return null;
  }

  // Extract location (now resolved from @id references)
  const location = eventData.location || {};
  const venueName = location.name || 'Wellington Venue';
  const address = location.address?.streetAddress
    || (typeof location.address === 'string' ? location.address : '')
    || `${venueName}, Wellington`;
  const lat = location.geo?.latitude || null;
  const lng = location.geo?.longitude || null;

  // Extract price from resolved offers
  let price = null;
  if (eventData.offers) {
    const offers = Array.isArray(eventData.offers) ? eventData.offers : [eventData.offers];
    for (const offer of offers) {
      if (offer.price === '0' || offer.price === 0 || offer.name?.toLowerCase() === 'free') {
        price = 0;
        break;
      } else if (offer.price && !isNaN(parseFloat(offer.price))) {
        price = parseFloat(offer.price);
      }
    }
  }

  // Skip events without images
  if (!eventData.image) {
    console.log(`    Skipping — no image`);
    return null;
  }

  const slug = eventPath.split('/').filter(Boolean).slice(1, -1).join('-') || 'event';

  return {
    name: decodeHtmlEntities(eventData.name || ''),
    description: description || `${eventData.name} at ${venueName}`,
    imageUrl: eventData.image || null,
    startDate,
    endDate,
    venueName: decodeHtmlEntities(venueName),
    address: decodeHtmlEntities(address),
    lat,
    lng,
    category: mapCategory(categorySlugs, eventData.name),
    ticketUrl,
    price,
    slug,
    eventfindaUrl: url,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== Eventfinda Wellington Event Scraper ===\n');
  console.log(`Pages to scrape: ${PAGES_TO_SCRAPE}`);
  console.log(`Dry run: ${DRY_RUN}\n`);

  if (!DRY_RUN) {
    await ensureStorageBucket();
    await clearExistingEvents();
  }

  // Step 1: Get event URLs from listing pages
  console.log('\n--- Step 1: Scraping event listing pages ---');
  const eventUrls = await scrapeEventListing();
  console.log(`\nFound ${eventUrls.length} unique event URLs\n`);

  // Step 2: Scrape each event detail page
  console.log('--- Step 2: Scraping event details ---');
  const events = [];
  let scraped = 0;

  for (const eventUrl of eventUrls) {
    scraped++;
    console.log(`\n[${scraped}/${eventUrls.length}] ${eventUrl}`);

    try {
      const event = await scrapeEventDetail(eventUrl);
      if (event) {
        events.push(event);
        console.log(`    -> ${event.name} | ${event.startDate.toLocaleDateString()} | ${event.category} | ${event.venueName}`);
      }
    } catch (err) {
      console.error(`    Error: ${err.message}`);
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n--- Scraped ${events.length} valid events ---\n`);

  if (DRY_RUN) {
    console.log('DRY RUN — would insert these events:');
    for (const e of events) {
      console.log(`  ${e.name} (${e.category}) — ${e.startDate.toLocaleDateString()} at ${e.venueName}`);
    }
    return;
  }

  // Step 3: Download images and insert events
  console.log('--- Step 3: Processing images and inserting events ---');
  let inserted = 0;

  for (const event of events) {
    console.log(`\n  Processing: ${event.name}`);

    const uploadedImageUrl = await downloadAndUploadImage(event.imageUrl, event.slug);

    const placeId = await findOrCreatePlace(event.venueName, event.address, event.lat, event.lng);
    if (!placeId) {
      console.log(`    Skipping — could not create place`);
      continue;
    }

    // Format date/time for Postgres
    const dateStr = event.startDate.toISOString().split('T')[0];
    const startTime = event.startDate.toLocaleTimeString('en-NZ', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Pacific/Auckland',
    });
    const endTime = event.endDate
      ? event.endDate.toLocaleTimeString('en-NZ', {
          hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Pacific/Auckland',
        })
      : null;

    const eventId = await insertEvent({
      title: event.name,
      description: event.description,
      place_id: placeId,
      date: dateStr,
      start_time: startTime,
      end_time: endTime,
      image_url: uploadedImageUrl,
      category: event.category,
      ticket_url: event.ticketUrl,
      price: event.price,
    });

    if (eventId) {
      inserted++;
      console.log(`    Inserted (${eventId})`);
    }
  }

  console.log(`\n=== Done! Inserted ${inserted} events ===`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
