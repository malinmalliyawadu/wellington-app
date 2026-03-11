/**
 * Add a single @welly post with images.
 *
 * Usage: node supabase/add-single-post.mjs <placeId> <content> <image1> [image2] [image3] [--hashtags tag1,tag2,...]
 *
 * Or import and call addPost() programmatically.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { randomUUID } from 'crypto';

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const WELLY_ID = '00000000-0000-0000-0000-000000000011';
const BUCKET = 'post-media';

export async function addPost({ placeId, content, images, hashtags = [] }) {
  const urls = [];

  // Upload images
  for (const img of images) {
    const buf = readFileSync(img.path);
    const storagePath = 'seed/' + img.filename;
    const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buf, {
      contentType: 'image/jpeg',
      upsert: true,
    });
    if (error) { console.error('Upload error:', error.message); return; }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    urls.push(data.publicUrl);
    console.log('  ✓ uploaded ' + img.filename);
  }

  // Create post
  const postId = randomUUID();
  const daysAgo = 1 + Math.floor(Math.random() * 60);
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
  if (postErr) { console.error('Post error:', postErr.message); return; }
  console.log('  ✓ post created');

  // Add all images as post_media
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
  if (urls.length > 1) console.log(`  ✓ ${urls.length} carousel images`);

  // Add hashtags
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
  if (hashtags.length > 0) console.log(`  ✓ ${hashtags.length} hashtags`);

  return postId;
}
