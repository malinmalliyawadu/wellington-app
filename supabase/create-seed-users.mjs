import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const users = [
  { id: '00000000-0000-0000-0000-000000000001', email: 'you@test.com', username: 'you', display_name: 'You' },
  { id: '00000000-0000-0000-0000-000000000002', email: 'sarah@test.com', username: 'sarah_eats_welly', display_name: 'Sarah Chen' },
  { id: '00000000-0000-0000-0000-000000000003', email: 'jordan@test.com', username: 'artsy_jordan', display_name: 'Jordan Taylor' },
  { id: '00000000-0000-0000-0000-000000000004', email: 'mel@test.com', username: 'gig_queen_mel', display_name: 'Mel Rodriguez' },
  { id: '00000000-0000-0000-0000-000000000005', email: 'alex@test.com', username: 'coffeesnob_nz', display_name: 'Alex Kim' },
  { id: '00000000-0000-0000-0000-000000000006', email: 'tane@test.com', username: 'welly_walks', display_name: 'Tane Mahuta' },
  { id: '00000000-0000-0000-0000-000000000007', email: 'sam@test.com', username: 'craft_beer_sam', display_name: "Sam O'Brien" },
  { id: '00000000-0000-0000-0000-000000000008', email: 'maya@test.com', username: 'market_maya', display_name: 'Maya Patel' },
  { id: '00000000-0000-0000-0000-000000000009', email: 'pete@test.com', username: 'night_owl_pete', display_name: 'Pete Williams' },
  { id: '00000000-0000-0000-0000-000000000010', email: 'kate@test.com', username: 'comedy_kate', display_name: 'Kate Nguyen' },
];

console.log('Creating seed auth users...');

for (const user of users) {
  const { error } = await supabase.auth.admin.createUser({
    id: user.id,
    email: user.email,
    password: 'testpass123',
    email_confirm: true,
    user_metadata: {
      username: user.username,
      display_name: user.display_name,
    },
  });

  if (error) {
    if (error.message.includes('already been registered')) {
      console.log(`  ${user.email} — already exists, skipping`);
    } else {
      console.error(`  ${user.email} — error: ${error.message}`);
    }
  } else {
    console.log(`  ${user.email} — created`);
  }
}

console.log('Done.');
