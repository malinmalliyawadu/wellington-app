/**
 * Map downloaded WellingtonNZ images to seed data place slugs.
 *
 * Reads from:  ~/Downloads/WellingtonNZ Resource Library/
 * Outputs to:  supabase/seed-images/ (resized to 1200px wide, JPEG quality 80)
 *
 * Usage: node supabase/prepare-seed-images.mjs
 */

import { readdirSync, copyFileSync, mkdirSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { execSync } from 'child_process';

const SOURCE_DIR = '/Users/malin/Downloads/WellingtonNZ Resource Library';
const OUTPUT_DIR = new URL('./seed-images', import.meta.url).pathname;
const MAX_WIDTH = 1200;
const JPEG_QUALITY = 80;

// Map filename patterns → place slugs
// Order matters: first match wins. More specific patterns first.
const FILENAME_MAPPINGS = [
  // ── Cafes ──
  [/Flight Coffee|The Hangar Flight Coffee|The Hangar_Flight/i, 'flight-coffee'],
  [/Customs_/i, 'customs'],
  [/Loretta/i, 'loretta'],
  [/Hillside Kitchen/i, 'hillside'],
  [/PREFAB EATERY|Prefab/i, 'prefab'],
  [/Peoples Coffee/i, 'peoples-coffee'],
  [/Lamason/i, 'lamason'],
  [/Raglan Roast/i, 'raglan-roast'],
  [/Mojo Coffee/i, 'mojo'],
  [/Memphis Belle/i, 'memphis-belle'],
  [/Fidels/i, 'fidels'],
  [/Midnight Expresso/i, 'midnight-espresso'],
  [/L'affare/i, 'laffare'],
  [/Arobake/i, 'arobake'],

  // ── Restaurants ──
  [/Hiakai/i, 'hiakai'],
  [/Egmont St/i, 'egmont-st-deli'],
  [/Aunty Mena/i, 'aunty-menas'],
  [/Logan Brown|Bellamys by Logan/i, 'logan-brown'],
  [/Ortega Fish Shack/i, 'ortega'],
  [/Capitol/i, 'capitol'],
  [/Dragonfly/i, 'dragonfly'],
  [/Mr Go/i, 'mr-gos'],
  [/KK Malaysian/i, 'kk-malaysian'],
  [/Everybody Eats/i, 'everybody-eats'],
  [/Floriditas/i, 'floriditas'],
  [/Charley Noble/i, 'charley-noble'],
  [/Scopa/i, 'scopa'],

  // ── Bars ──
  [/Hashigo/i, 'hashigo-zake'],
  [/Golding/i, 'goldings'],
  [/The Library_/i, 'the-library'],
  [/Rogue.*Vagabond/i, 'rogue-vagabond'],
  [/Hawthorn/i, 'hawthorn-lounge'],
  [/Fork.*Brewer/i, 'fork-brewer'],
  [/Little Beer/i, 'little-beer-quarter'],
  [/Laundry/i, 'laundry'],
  [/Garage Project/i, 'garage-project'],
  [/Noble Rot/i, 'noble-rot'],
  [/Dirty Little Secret/i, 'dirty-little-secret'],

  // ── Attractions ──
  [/Te Papa/i, 'te-papa'],
  [/Cable Car/i, 'cable-car'],
  [/Zealandia/i, 'zealandia'],
  [/Wellington Museum/i, 'wellington-museum'],
  [/Space Place/i, 'space-place'],
  [/City Gallery/i, 'city-gallery'],
  [/Te Ngākau|Civic Square/i, 'civic-square'],
  [/Portrait Gallery/i, 'portrait-gallery'],
  [/Wellington Zoo/i, 'wellington-zoo'],
  [/Wētā/i, 'weta-workshop'],
  [/Parliament|Parliment/i, 'parliament'],

  // ── Parks & Outdoors ──
  [/Botanic Garden|Botanical Garden/i, 'botanic-garden'],
  [/Mt Vic|Mount Victoria|Mt Victoria/i, 'mt-vic'],
  [/Oriental Bay/i, 'oriental-bay'],
  [/Waitangi Park/i, 'waitangi-park'],
  [/Frank Kitts/i, 'frank-kitts'],
  [/Town Belt/i, 'town-belt'],
  [/Kaukau|Mount Kaukau/i, 'mt-kaukau'],
  [/Te Ahumairangi|Tinakori Hill/i, 'te-ahumairangi'],
  [/Skyline.*Walk|Skyline.*Track/i, 'skyline-walkway'],
  [/Spicer Link/i, 'nature-trail'],
  [/Island Bay/i, 'island-bay'],
  [/Lyall Bay/i, 'lyall-bay'],
  [/Houghton Bay/i, 'houghton-bay'],

  // ── Venues ──
  [/San Fran/i, 'san-fran'],
  [/Meow/i, 'meow'],
  [/Valhalla/i, 'valhalla'],
  [/BATS Theatre/i, 'bats'],
  [/Circa/i, 'circa'],
  [/Opera House/i, 'opera-house'],
  [/TSB Arena/i, 'tsb-arena'],
  [/Wharewaka|Te Wharewaka/i, 'wharewaka'],
  [/Caroline/i, 'caroline'],
  [/Tākina/i, 'takina'],

  // ── General / Areas ──
  [/Cuba Street|CubaDupa/i, 'cuba-street'],
  [/Bucket Fountain/i, 'cuba-street'],
  [/Courtenay Place/i, 'courtenay-place'],
  [/Lambton Quay/i, 'lambton-quay'],
  [/Hannahs Laneway|Eva Street|Willis Lane/i, 'laneway'],
  [/City Scenic/i, 'wellington'],
  [/Well_ngton Sign/i, 'wellington'],
  [/Whairepo Lagoon/i, 'waterfront'],
  [/Harbourside Market/i, 'waterfront-market'],
  [/Solace In The Wind/i, 'waterfront'],
  [/Aro Valley/i, 'aro-valley'],
  [/Newtown/i, 'newtown'],
  [/Wellington Station/i, 'wellington'],
  [/Boat Sheds/i, 'oriental-bay'],
  [/Beach Babylon/i, 'oriental-bay'],
  [/Karaka Cafe/i, 'wharewaka'],

  // ── Trails ──
  [/Remutaka Cycle/i, 'remutaka-trail'],
  [/Mākara Peak|Makara Peak/i, 'makara-peak'],
  [/Te Whiti Riser/i, 'te-whiti-trail'],
  [/Butterfly Creek/i, 'butterfly-creek'],
  [/Pencarrow/i, 'pencarrow'],
  [/Escarpment Track/i, 'escarpment-track'],

  // ── Beer/Food specific ──
  [/Beervana/i, 'beervana'],
  [/Parrotdog/i, 'parrotdog'],
  [/Heyday Beer/i, 'heyday-beer'],
  [/Brewtown/i, 'brewtown'],
  [/Homegrown/i, 'homegrown'],
  [/Moore Wilson/i, 'moore-wilsons'],
  [/Wellington Chocolate/i, 'wellington-chocolate'],
  [/Havana Coffee/i, 'havana-coffee'],
];

function matchSlug(filename) {
  for (const [pattern, slug] of FILENAME_MAPPINGS) {
    if (pattern.test(filename)) {
      return slug;
    }
  }
  return null;
}

function main() {
  if (!existsSync(SOURCE_DIR)) {
    console.error(`Source directory not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });

  const files = readdirSync(SOURCE_DIR)
    .filter(f => /\.(jpg|jpeg|png|webp|heic)$/i.test(f))
    .sort();

  console.log(`Found ${files.length} images in download folder.\n`);

  // Group files by slug
  const slugFiles = {};
  const unmatched = [];

  for (const file of files) {
    const slug = matchSlug(file);
    if (slug) {
      if (!slugFiles[slug]) slugFiles[slug] = [];
      slugFiles[slug].push(file);
    } else {
      unmatched.push(file);
    }
  }

  // Copy and resize matched files
  let copied = 0;
  const slugSummary = {};

  for (const [slug, slugFileList] of Object.entries(slugFiles).sort()) {
    for (let i = 0; i < slugFileList.length; i++) {
      const srcFile = slugFileList[i];
      const srcPath = join(SOURCE_DIR, srcFile);
      const suffix = slugFileList.length > 1 ? `-${String(i + 1).padStart(2, '0')}` : '';
      const outName = `${slug}${suffix}.jpg`;
      const outPath = join(OUTPUT_DIR, outName);

      try {
        // Use macOS sips to resize and convert to JPEG
        execSync(
          `sips --resampleWidth ${MAX_WIDTH} --setProperty format jpeg --setProperty formatOptions ${JPEG_QUALITY} "${srcPath}" --out "${outPath}" 2>/dev/null`,
          { stdio: 'pipe' }
        );
        copied++;
        if (!slugSummary[slug]) slugSummary[slug] = [];
        slugSummary[slug].push(outName);
      } catch (err) {
        // Fallback: just copy
        try {
          copyFileSync(srcPath, outPath);
          copied++;
          if (!slugSummary[slug]) slugSummary[slug] = [];
          slugSummary[slug].push(outName);
        } catch (copyErr) {
          console.error(`  ✗ Failed to process ${srcFile}: ${copyErr.message}`);
        }
      }
    }
  }

  // Print summary
  console.log('── Matched & Copied ──');
  for (const [slug, files] of Object.entries(slugSummary).sort()) {
    console.log(`  ${slug}: ${files.length} image(s)`);
  }

  // Show which seed places have images
  const SEED_PLACE_SLUGS = [
    'flight-coffee', 'customs', 'loretta', 'hillside', 'prefab',
    'hiakai', 'egmont-st-deli', 'aunty-menas', 'hashigo-zake', 'goldings',
    'the-library', 'rogue-vagabond', 'te-papa', 'cable-car', 'zealandia',
    'botanic-garden', 'mt-vic', 'oriental-bay', 'san-fran', 'meow',
    'valhalla', 'bats', 'peoples-coffee', 'lamason', 'raglan-roast',
    'mojo', 'memphis-belle', 'fidels', 'logan-brown', 'ortega',
    'capitol', 'dragonfly', 'mr-gos', 'kk-malaysian', 'hawthorn-lounge',
    'fork-brewer', 'little-beer-quarter', 'laundry', 'garage-project',
    'wellington-museum', 'space-place', 'city-gallery', 'waitangi-park',
    'frank-kitts', 'town-belt', 'circa', 'opera-house', 'tsb-arena',
    'wharewaka', 'caroline', 'everybody-eats', 'mt-kaukau', 'mt-vic-trail',
    'te-ahumairangi', 'northern-walkway',
  ];

  const covered = SEED_PLACE_SLUGS.filter(s => slugSummary[s]);
  const missing = SEED_PLACE_SLUGS.filter(s => !slugSummary[s]);

  console.log(`\n── Seed Place Coverage: ${covered.length}/${SEED_PLACE_SLUGS.length} ──`);
  if (missing.length > 0) {
    console.log(`Missing: ${missing.join(', ')}`);
    console.log('\nFor missing places, generic images will be used as fallback.');
  }

  // Show generic images available for fallback
  const genericSlugs = Object.keys(slugSummary).filter(s => !SEED_PLACE_SLUGS.includes(s));
  if (genericSlugs.length > 0) {
    console.log(`\n── Generic/Extra images: ${genericSlugs.join(', ')} ──`);
  }

  if (unmatched.length > 0) {
    console.log(`\n── Unmatched files (${unmatched.length}) ──`);
    for (const f of unmatched) {
      console.log(`  ? ${f}`);
    }
  }

  console.log(`\n✓ ${copied} images prepared in supabase/seed-images/`);
  console.log('\nNext: node supabase/upload-seed-images.mjs');
}

main();
