#!/usr/bin/env node
import { writeFileSync } from 'fs';
import { config } from 'dotenv';

// Load environment variables
config();

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

if (!GOOGLE_API_KEY) {
  console.error('Error: EXPO_PUBLIC_GOOGLE_PLACES_API_KEY not found in .env');
  process.exit(1);
}

const NEIGHBORHOODS = [
  { id: 'cbd', name: 'Wellington Central', search: 'Wellington CBD, Wellington, New Zealand' },
  { id: 'te_aro', name: 'Te Aro', search: 'Te Aro, Wellington, New Zealand' },
  { id: 'mount_victoria', name: 'Mount Victoria', search: 'Mount Victoria, Wellington, New Zealand' },
  { id: 'waterfront', name: 'Waterfront', search: 'Wellington Waterfront, Wellington, New Zealand' },
  { id: 'thorndon', name: 'Thorndon', search: 'Thorndon, Wellington, New Zealand' },
];

async function fetchGeocoding(searchQuery) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&key=${GOOGLE_API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 'OK' || !data.results || data.results.length === 0) {
    console.warn(`No results for: ${searchQuery} (${data.status})`);
    return null;
  }

  return data.results[0].geometry;
}

async function main() {
  console.log('Fetching neighborhood boundaries from Google Geocoding API...\n');

  const boundaries = {};

  for (const neighborhood of NEIGHBORHOODS) {
    console.log(`Fetching: ${neighborhood.name}...`);
    const geometry = await fetchGeocoding(neighborhood.search);

    if (geometry) {
      // Use bounds if available, otherwise use viewport
      const bounds = geometry.bounds || geometry.viewport;

      boundaries[neighborhood.id] = {
        id: neighborhood.id,
        name: neighborhood.name,
        minLat: bounds.southwest.lat,
        maxLat: bounds.northeast.lat,
        minLng: bounds.southwest.lng,
        maxLng: bounds.northeast.lng,
      };

      console.log(`  ✓ ${neighborhood.name}: ${bounds.southwest.lat.toFixed(4)}, ${bounds.southwest.lng.toFixed(4)} to ${bounds.northeast.lat.toFixed(4)}, ${bounds.northeast.lng.toFixed(4)}`);
    } else {
      console.log(`  ✗ Failed to fetch ${neighborhood.name}`);
    }

    // Rate limiting - wait 200ms between requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Write to file
  const outputPath = 'src/data/neighborhoodBoundaries.json';
  writeFileSync(
    outputPath,
    JSON.stringify(boundaries, null, 2),
    'utf-8'
  );

  console.log(`\n✓ Boundaries saved to ${outputPath}`);
  console.log(`Found ${Object.keys(boundaries).length} neighborhoods`);
}

main().catch(console.error);
