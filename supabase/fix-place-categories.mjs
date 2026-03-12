import pg from 'pg';
import 'dotenv/config';

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set. Add it to your .env file.');
  process.exit(1);
}

if (!GOOGLE_PLACES_API_KEY) {
  console.error('EXPO_PUBLIC_GOOGLE_PLACES_API_KEY is not set. Add it to your .env file.');
  process.exit(1);
}

const applyChanges = process.argv.includes('--apply');

// Map Google Place types to app categories
function mapGoogleCategory(types) {
  if (types.includes('cafe') || types.includes('bakery') || types.includes('coffee_shop')) return 'cafe';
  // Check bar BEFORE restaurant — places with both should stay as bar
  if (types.includes('bar') || types.includes('night_club')) return 'bar';
  if (types.includes('restaurant') || types.includes('food')) return 'restaurant';
  if (types.includes('park') || types.includes('natural_feature') || types.includes('campground')) return 'park';
  if (
    types.includes('museum') ||
    types.includes('tourist_attraction') ||
    types.includes('art_gallery') ||
    types.includes('zoo') ||
    types.includes('aquarium') ||
    types.includes('library') ||
    types.includes('church') ||
    types.includes('place_of_worship') ||
    types.includes('amusement_park')
  ) return 'attraction';
  if (
    types.includes('stadium') ||
    types.includes('movie_theater') ||
    types.includes('bowling_alley') ||
    types.includes('performing_arts_theater') ||
    types.includes('concert_hall') ||
    types.includes('event_venue')
  ) return 'venue';
  // Only match shop on specific store types — bare 'store' alone is too ambiguous
  const specificStoreTypes = [
    'shopping_mall', 'clothing_store', 'book_store', 'home_goods_store',
    'jewelry_store', 'shoe_store', 'gift_shop', 'florist', 'pet_store',
    'bicycle_store', 'electronics_store', 'furniture_store', 'hardware_store',
    'supermarket', 'convenience_store', 'department_store',
  ];
  if (types.some(t => specificStoreTypes.includes(t))) return 'shop';
  // Bare 'store' or 'shop' without a specific type — uncertain
  if (types.includes('store') || types.includes('shop')) return null;
  // Return null for uncertain mappings so we can flag them
  return null;
}

async function fetchPlaceTypes(googlePlaceId) {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${googlePlaceId}&fields=types,name&key=${GOOGLE_PLACES_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status === 'OK' && data.result) {
    return { types: data.result.types || [], name: data.result.name };
  }
  return null;
}

async function findPlaceByNameAndLocation(name, lat, lng) {
  const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(name)}&inputtype=textquery&locationbias=circle:500@${lat},${lng}&fields=place_id,types,name&key=${GOOGLE_PLACES_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status === 'OK' && data.candidates && data.candidates.length > 0) {
    const candidate = data.candidates[0];
    return { types: candidate.types || [], name: candidate.name, placeId: candidate.place_id };
  }
  return null;
}

// Rate limiting: wait between API calls
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();

  console.log('Fetching all places from database...\n');
  const { rows: places } = await client.query(
    'SELECT id, name, category, address, latitude, longitude, google_place_id FROM places ORDER BY name'
  );

  console.log(`Found ${places.length} places.\n`);

  const changes = [];
  const uncertain = [];
  const noMatch = [];
  let checked = 0;

  for (const place of places) {
    checked++;
    process.stdout.write(`\r  Checking ${checked}/${places.length}: ${place.name.padEnd(40).slice(0, 40)}`);

    let result;
    try {
      if (place.google_place_id) {
        result = await fetchPlaceTypes(place.google_place_id);
      } else {
        result = await findPlaceByNameAndLocation(place.name, place.latitude, place.longitude);
      }
    } catch (err) {
      console.error(`\n  Error looking up ${place.name}: ${err.message}`);
      continue;
    }

    if (!result || result.types.length === 0) {
      noMatch.push({ name: place.name, currentCategory: place.category });
      await sleep(100);
      continue;
    }

    const suggestedCategory = mapGoogleCategory(result.types);

    // Keep trails as trails — Google often misclassifies them as parks/attractions
    if (place.category === 'trail' && suggestedCategory !== 'trail') {
      await sleep(100);
      continue;
    }

    if (suggestedCategory === null) {
      uncertain.push({
        id: place.id,
        name: place.name,
        currentCategory: place.category,
        googleTypes: result.types,
      });
    } else if (suggestedCategory !== place.category) {
      changes.push({
        id: place.id,
        name: place.name,
        currentCategory: place.category,
        suggestedCategory,
        googleTypes: result.types,
        googlePlaceId: place.google_place_id || result.placeId,
      });
    }

    // Rate limit: ~10 requests/sec
    await sleep(100);
  }

  console.log('\n');

  // Print report
  if (changes.length === 0 && uncertain.length === 0 && noMatch.length === 0) {
    console.log('All place categories look correct!');
    await client.end();
    return;
  }

  if (changes.length > 0) {
    console.log(`=== CATEGORY CHANGES (${changes.length}) ===\n`);
    for (const c of changes) {
      console.log(`  ${c.name}`);
      console.log(`    ${c.currentCategory} → ${c.suggestedCategory}`);
      console.log(`    Google types: ${c.googleTypes.join(', ')}`);
      console.log();
    }
  }

  if (uncertain.length > 0) {
    console.log(`=== UNCERTAIN - NEEDS MANUAL REVIEW (${uncertain.length}) ===\n`);
    for (const u of uncertain) {
      console.log(`  ${u.name} (currently: ${u.currentCategory})`);
      console.log(`    Google types: ${u.googleTypes.join(', ')}`);
      console.log();
    }
  }

  if (noMatch.length > 0) {
    console.log(`=== NO GOOGLE MATCH FOUND (${noMatch.length}) ===\n`);
    for (const n of noMatch) {
      console.log(`  ${n.name} (currently: ${n.currentCategory})`);
    }
    console.log();
  }

  // Apply changes
  if (changes.length > 0 && applyChanges) {
    console.log('Applying changes...\n');
    for (const c of changes) {
      await client.query('UPDATE places SET category = $1 WHERE id = $2', [c.suggestedCategory, c.id]);
      // Also set google_place_id if it was found via name search
      if (c.googlePlaceId && !c.currentGooglePlaceId) {
        await client.query('UPDATE places SET google_place_id = $1 WHERE id = $2 AND google_place_id IS NULL', [c.googlePlaceId, c.id]);
      }
      console.log(`  ✓ ${c.name}: ${c.currentCategory} → ${c.suggestedCategory}`);
    }
    console.log(`\nDone. Updated ${changes.length} places.`);
  } else if (changes.length > 0) {
    console.log(`Run with --apply to update ${changes.length} places.`);
  }

  await client.end();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
