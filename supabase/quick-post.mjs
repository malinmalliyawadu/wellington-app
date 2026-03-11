/**
 * Quick post creator: resize, upload, and create a @welly post in one step.
 *
 * Usage:
 *   node supabase/quick-post.mjs \
 *     --place "search term" \
 *     --content "Post caption text" \
 *     --hashtags "tag1,tag2,tag3" \
 *     --files "file1.jpg" "file2.jpg" ...
 *
 * Or as a module:
 *   import { quickPost } from './supabase/quick-post.mjs';
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join, basename } from 'path';
import { randomUUID } from 'crypto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const WELLY_ID = '00000000-0000-0000-0000-000000000011';
const BUCKET = 'post-media';
const SOURCE_DIR = '/Users/malin/Downloads/WellingtonNZ Resource Library';
const SEED_DIR = new URL('./seed-images', import.meta.url).pathname;

export async function quickPost({ placeSearch, placeId, content, hashtags = [], files = [], slug }) {
  mkdirSync(SEED_DIR, { recursive: true });

  // 1. Find place
  if (!placeId) {
    const { data: places } = await supabase
      .from('places')
      .select('id,name,category')
      .ilike('name', `%${placeSearch}%`)
      .limit(5);

    if (!places || places.length === 0) {
      console.error(`  ✗ No place found matching "${placeSearch}"`);
      return null;
    }
    if (places.length > 1) {
      console.log('  Multiple matches:');
      places.forEach(p => console.log(`    ${p.id} — ${p.name} (${p.category})`));
      console.log('  Using first match.');
    }
    placeId = places[0].id;
    console.log(`  → ${places[0].name} (${places[0].category})`);
  }

  // 2. Resize and upload images
  const urls = [];
  const autoSlug = slug || placeSearch.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');

  for (let i = 0; i < files.length; i++) {
    const srcPath = files[i].startsWith('/') ? files[i] : join(SOURCE_DIR, files[i]);
    const suffix = files.length > 1 ? `-${String(i + 1).padStart(2, '0')}` : '';
    const outName = `${autoSlug}${suffix}.jpg`;
    const outPath = join(SEED_DIR, outName);

    // Resize
    try {
      execSync(
        `sips --resampleWidth 1200 --setProperty format jpeg --setProperty formatOptions 80 "${srcPath}" --out "${outPath}" 2>/dev/null`,
        { stdio: 'pipe' }
      );
    } catch {
      console.error(`  ✗ Failed to resize ${basename(srcPath)}`);
      continue;
    }

    // Upload
    const buf = readFileSync(outPath);
    const storagePath = `seed/${outName}`;
    const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buf, {
      contentType: 'image/jpeg',
      upsert: true,
    });
    if (error) {
      console.error(`  ✗ Upload failed: ${error.message}`);
      continue;
    }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    urls.push(data.publicUrl);
  }

  if (urls.length === 0) {
    console.error('  ✗ No images uploaded');
    return null;
  }
  console.log(`  ✓ ${urls.length} image(s) uploaded`);

  // 3. Create post
  const postId = randomUUID();
  const daysAgo = 1 + Math.floor(Math.random() * 90);
  const { error: postErr } = await supabase.from('posts').insert({
    id: postId,
    user_id: WELLY_ID,
    place_id: placeId,
    type: 'photo',
    content,
    media_url: urls[0],
    media_width: 1200,
    media_height: 900,
    likes: 0,
    created_at: new Date(Date.now() - daysAgo * 86400000).toISOString(),
  });
  if (postErr) {
    console.error(`  ✗ Post error: ${postErr.message}`);
    return null;
  }

  // 4. Post media carousel
  for (let i = 0; i < urls.length; i++) {
    await supabase.from('post_media').insert({
      id: randomUUID(),
      post_id: postId,
      media_url: urls[i],
      media_type: 'photo',
      media_width: 1200,
      media_height: 900,
      sort_order: i,
    });
  }

  // 5. Hashtags
  for (const tag of hashtags) {
    const clean = tag.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!clean) continue;
    const { data: ht } = await supabase
      .from('hashtags')
      .upsert({ name: clean, post_count: 0 }, { onConflict: 'name' })
      .select('id').single();
    if (ht) {
      await supabase.from('post_hashtags')
        .upsert({ post_id: postId, hashtag_id: ht.id }, { onConflict: 'post_id,hashtag_id', ignoreDuplicates: true });
    }
  }

  console.log(`  ✓ Post created with ${urls.length} image(s) and ${hashtags.length} hashtags`);
  return postId;
}

// CLI mode
const args = process.argv.slice(2);
if (args.length > 0) {
  let placeSearch = '', content = '', hashtags = [], files = [], slug = '';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--place') placeSearch = args[++i];
    else if (args[i] === '--content') content = args[++i];
    else if (args[i] === '--hashtags') hashtags = args[++i].split(',');
    else if (args[i] === '--slug') slug = args[++i];
    else if (args[i] === '--files') {
      while (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        files.push(args[++i]);
      }
    }
  }
  if (placeSearch && content && files.length > 0) {
    quickPost({ placeSearch, content, hashtags, files, slug });
  } else {
    console.error('Usage: --place "name" --content "text" --files file1 file2 [--hashtags t1,t2] [--slug name]');
  }
}
