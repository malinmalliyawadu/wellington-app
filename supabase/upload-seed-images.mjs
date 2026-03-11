/**
 * Upload seed images to Supabase Storage and generate URL mapping.
 *
 * Usage:
 *   node supabase/upload-seed-images.mjs
 *
 * Expects images in supabase/seed-images/ named by place slug:
 *   flight-coffee.jpg          → single image for Flight Coffee
 *   te-papa-01.jpg, te-papa-02.jpg  → multiple images for Te Papa
 *   wellington-01.jpg          → general Wellington shots
 *
 * Outputs:
 *   supabase/seed-image-urls.json   → mapping of slug → public URL(s)
 *
 * Requires: EXPO_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'fs';
import { join, extname, basename } from 'path';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BUCKET = 'post-media';
const SEED_FOLDER = 'seed'; // uploads go to post-media/seed/
const IMAGES_DIR = new URL('./seed-images', import.meta.url).pathname;

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic']);

function getMimeType(ext) {
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.heic': 'image/heic',
  };
  return types[ext] || 'image/jpeg';
}

/**
 * Parse filename into slug and optional index.
 * "te-papa-01.jpg" → { slug: "te-papa", index: 1 }
 * "flight-coffee.jpg" → { slug: "flight-coffee", index: 0 }
 * "wellington-03.jpg" → { slug: "wellington", index: 3 }
 */
function parseFilename(filename) {
  const name = basename(filename, extname(filename));
  // Match trailing -NN (1 or 2 digit number)
  const match = name.match(/^(.+)-(\d{1,2})$/);
  if (match) {
    return { slug: match[1], index: parseInt(match[2], 10) };
  }
  return { slug: name, index: 0 };
}

async function main() {
  if (!existsSync(IMAGES_DIR)) {
    console.error(`No seed-images directory found at ${IMAGES_DIR}`);
    console.error('Create it and add your images there.');
    process.exit(1);
  }

  const files = readdirSync(IMAGES_DIR)
    .filter(f => IMAGE_EXTENSIONS.has(extname(f).toLowerCase()))
    .sort();

  if (files.length === 0) {
    console.error('No image files found in seed-images/');
    console.error('Add .jpg, .jpeg, .png, or .webp files named by place slug.');
    process.exit(1);
  }

  console.log(`Found ${files.length} images to upload.\n`);

  // Load the image map for reference
  const imageMap = JSON.parse(readFileSync(new URL('./seed-image-map.json', import.meta.url), 'utf-8'));
  const knownSlugs = new Set(Object.keys(imageMap.places));

  const urlMapping = {}; // slug → [url1, url2, ...]
  let uploaded = 0;
  let skipped = 0;
  let errors = 0;

  for (const file of files) {
    const ext = extname(file).toLowerCase();
    const { slug, index } = parseFilename(file);
    const filePath = join(IMAGES_DIR, file);
    const fileBuffer = readFileSync(filePath);
    const storagePath = `${SEED_FOLDER}/${file}`;

    // Warn about unknown slugs
    if (!knownSlugs.has(slug) && !slug.startsWith('wellington') && !slug.startsWith('cuba') &&
        !slug.startsWith('waterfront') && !slug.startsWith('sunset') && !slug.startsWith('food') &&
        !slug.startsWith('coffee') && !slug.startsWith('craft-beer') && !slug.startsWith('live-music') &&
        !slug.startsWith('nature') && !slug.startsWith('nightlife')) {
      console.warn(`  ⚠ Unknown slug "${slug}" (from ${file}) — not in image map`);
    }

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: getMimeType(ext),
        upsert: true,
      });

    if (error) {
      console.error(`  ✗ ${file} — ${error.message}`);
      errors++;
      continue;
    }

    // Get public URL
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    const publicUrl = data.publicUrl;

    if (!urlMapping[slug]) {
      urlMapping[slug] = [];
    }
    urlMapping[slug].push({ index, url: publicUrl, file });

    console.log(`  ✓ ${file} → ${slug}[${index}]`);
    uploaded++;
  }

  // Sort each slug's URLs by index
  for (const slug of Object.keys(urlMapping)) {
    urlMapping[slug].sort((a, b) => a.index - b.index);
  }

  // Write URL mapping
  const outputPath = new URL('./seed-image-urls.json', import.meta.url).pathname;
  writeFileSync(outputPath, JSON.stringify(urlMapping, null, 2));

  console.log(`\nDone! ${uploaded} uploaded, ${skipped} skipped, ${errors} errors.`);
  console.log(`URL mapping written to: supabase/seed-image-urls.json`);

  // Show summary
  console.log('\n── Coverage Summary ──');
  const placeSlugs = Object.keys(imageMap.places).filter(k => !k.startsWith('_'));
  const covered = placeSlugs.filter(s => urlMapping[s]);
  const missing = placeSlugs.filter(s => !urlMapping[s]);
  console.log(`Places with images: ${covered.length}/${placeSlugs.length}`);
  if (missing.length > 0) {
    console.log(`Missing: ${missing.join(', ')}`);
  }

  // Show how to use the URLs
  console.log('\n── Next Steps ──');
  console.log('Run: node supabase/generate-seed-sql.mjs');
  console.log('This will update seed.sql and seed-content.sql with the uploaded image URLs.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
