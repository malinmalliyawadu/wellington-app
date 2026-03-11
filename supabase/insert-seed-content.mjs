/**
 * Insert curated @welly content into production database.
 *
 * Prerequisites:
 *   1. Run: node supabase/create-seed-users.mjs   (creates auth users)
 *   2. Run: node supabase/upload-seed-images.mjs   (uploads images, creates seed-image-urls.json)
 *   3. Run: node supabase/insert-seed-content.mjs  (this script)
 *
 * What it does:
 *   - Creates @welly profile + 10 fake user profiles
 *   - Inserts editorial posts for 60+ Wellington places with real images
 *   - Creates curated guides (Essential Wellington, Cuba Street, etc.)
 *   - Adds follows, likes, comments for social proof
 *   - Creates hashtags
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { randomUUID } from 'crypto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Load image URLs ──
const imageUrls = JSON.parse(
  readFileSync(new URL('./seed-image-urls.json', import.meta.url), 'utf-8')
);

function getImageUrl(slug, index = 0) {
  const imgs = imageUrls[slug];
  if (!imgs || imgs.length === 0) return null;
  const i = index < imgs.length ? index : index % imgs.length;
  return imgs[i].url;
}

// ── User IDs ──
const WELLY_ID = '00000000-0000-0000-0000-000000000011';
const USERS = [
  { id: '00000000-0000-0000-0000-000000000002', username: 'sarah_eats_welly', displayName: 'Sarah Chen' },
  { id: '00000000-0000-0000-0000-000000000003', username: 'artsy_jordan', displayName: 'Jordan Taylor' },
  { id: '00000000-0000-0000-0000-000000000004', username: 'gig_queen_mel', displayName: 'Mel Rodriguez' },
  { id: '00000000-0000-0000-0000-000000000005', username: 'coffeesnob_nz', displayName: 'Alex Kim' },
  { id: '00000000-0000-0000-0000-000000000006', username: 'welly_walks', displayName: 'Tane Mahuta' },
  { id: '00000000-0000-0000-0000-000000000007', username: 'craft_beer_sam', displayName: "Sam O'Brien" },
  { id: '00000000-0000-0000-0000-000000000008', username: 'market_maya', displayName: 'Maya Patel' },
  { id: '00000000-0000-0000-0000-000000000009', username: 'night_owl_pete', displayName: 'Pete Williams' },
  { id: '00000000-0000-0000-0000-000000000010', username: 'comedy_kate', displayName: 'Kate Nguyen' },
];

// ── Production place ID mapping (slug → UUID) ──
const PLACES = {
  'flight-coffee':      '115f0b8f-898a-4cf1-acef-6018f03758fa',
  'customs':            '4329501e-8d19-41da-90da-50478baa43e7',
  'loretta':            '6621dfb0-bd00-4ee2-9c2b-e90702ca60cc',
  'hillside':           '96411cd8-53e7-4259-a5e9-5c83387b0354',
  'prefab':             '1980b983-5a42-4d3b-ad27-e98705d48fc4',
  'aunty-menas':        '16e17850-2ada-476e-94bf-f49e940af1e1',
  'goldings':           'ce3e8b89-8587-44b2-9dd1-7aa61ab2874d',
  'the-library':        'fb1c0757-d250-4552-b6bb-585277c25d8b',
  'rogue-vagabond':     '0a0c2c79-4f8a-41c7-b222-d3869eae91ea',
  'te-papa':            'db5a3a42-f40f-4afb-81f3-79c28ae44909',
  'cable-car':          'e55e6935-2c8c-42fc-8f91-1486cddfe60c',
  'zealandia':          'f6295511-e5ef-4966-bf78-b0bc7384b302',
  'botanic-garden':     '1106981f-c6e1-4375-95d2-4f278a3dd9e9',
  'oriental-bay':       '2ea767d2-d37d-487d-949c-7adf4ace4996',
  'san-fran':           '06a8ef9a-1bcb-4b29-ba5a-7fcedb90e7f0',
  'meow':               '2d3cc942-7534-49c2-96a9-0c3b4aaa9045',
  'valhalla':           '1582dd04-a03b-486d-a579-8b54b3e21b7b',
  'bats':               'e7a42572-ceec-4828-afaa-16260c666c0a',
  'raglan-roast':       '03677f55-454e-4e97-9e5a-aadcb8e37c9c',
  'fidels':             'efaad5bc-6f4d-4772-b17c-c4fb0a20bcf6',
  'logan-brown':        '9074c87b-ae61-4848-8915-0ffead2ee325',
  'ortega':             'd3ab1004-4411-4026-bbe7-29b5d83107c5',
  'capitol':            'd0b87c40-5b3f-4a01-abe2-8017d7da7b30',
  'dragonfly':          '3d45ae92-6a32-4a05-9f32-c54634257c83',
  'mr-gos':             '5ad37b60-6357-4b72-9b20-ec2597264625',
  'hawthorn-lounge':    '6bc0e04a-e804-4152-9a47-c157137b40c2',
  'fork-brewer':        'ef835fe4-1846-4741-b4b9-ae05e080278d',
  'little-beer-quarter':'a6f6730d-4cfc-4e3d-af90-941aab5b5035',
  'garage-project':     '6509e737-f516-4455-b952-780feaee8e76',
  'wellington-museum':  '35397975-b333-41ff-869a-b7485f615d64',
  'space-place':        '4143da19-33ab-461d-b355-e447ae81a8c1',
  'city-gallery':       '2d39c5ca-d6e4-45a7-a626-3431fe9b6b8e',
  'waitangi-park':      'a677427f-e5e4-493c-b0ac-1d79ce06cadc',
  'frank-kitts':        '58e7d43f-842b-454e-9880-c48499676305',
  'town-belt':          '1e24874b-63eb-4925-a2ac-b44d3b42cd8e',
  'circa':              'e5dca7db-a1c4-474f-afc0-4a1a311030e2',
  'opera-house':        '1ce9a265-6cf1-4748-bec4-eccf13d40fab',
  'tsb-arena':          '204b8e04-44fa-4689-9e94-42edb0a9c774',
  'wharewaka':          'bbcff732-a139-4707-9e96-792a1fa25721',
  'everybody-eats':     'ef94203e-1fce-4f24-bec3-8f2a139c8f57',
  'mt-kaukau':          '10000000-0000-0000-0000-000000000101',
  'te-ahumairangi':     '10000000-0000-0000-0000-000000000103',
  'northern-walkway':   '10000000-0000-0000-0000-000000000104',
  'arobake':            'f12a7e45-396b-4afb-a0e5-312a53a9c7d3',
  'charley-noble':      'b413bc4f-cae0-45bb-ae69-ee7b68946b74',
  'dirty-little-secret':'b8a9c3a1-c988-4bd9-86b5-7dec2e14ca09',
  'floriditas':         '4e5063e3-c06a-4178-9b50-0b7de59633de',
  'laffare':            '3d538b6a-29d8-4e07-842c-7766588eb912',
  'midnight-espresso':  '66842fa7-64f4-444c-95a6-d461f6a1472d',
  'moore-wilsons':      '2d836a0e-1b0c-4a16-b82f-d5d24a73923b',
  'noble-rot':          '60a76ea4-1bc1-4cea-b352-96c9faa270f0',
  'parrotdog':          '36996300-8b57-4bc4-b510-88ed8216b9d6',
  'scopa':              'a5e906d1-942e-4268-aa7e-fd1a920d1048',
  'heyday-beer':        '18139057-f5de-4645-8587-d887c3bc827e',
  'wellington-chocolate':'5f280a02-3497-44c1-9a99-cf72223008e4',
  'wellington-zoo':     'c256aa3e-c372-49a4-9737-74a8cd5a8a62',
  'portrait-gallery':   'e77e8ca9-1dcb-4e0b-a6dc-53caba7a0483',
  'parliament':         'ef827e17-0162-4e24-8d1f-9bc865bb9ce0',
  'takina':             '53daea59-8540-4dbb-9ab1-a7eded6fdea5',
  'civic-square':       '5e5f921c-531d-4117-974a-23fdeb8c3015',
  'cuba-street':        'bcff6ed6-9d31-480b-82f9-775628c992ce',
  'courtenay-place':    'e3e698f4-738c-4e89-adb2-de1ef36c51d2',
  'aro-valley':         'd3b9ceca-5ad7-4040-bf96-2181a0b4717f',
  'newtown':            'd21df6b9-ca75-4fce-9f3e-e74c5c841491',
  'island-bay':         'ef7ea183-f768-4283-936b-68db2db0b735',
  'lyall-bay':          'e29ba76b-2532-4495-932a-cd08fc026658',
  'houghton-bay':       '43829801-ad04-4f87-8ec8-d8636125fabc',
  'brewtown':           '8de39260-8192-46e7-8dc0-5c1a245c0d7b',
  'makara-peak':        '535e6900-24a3-41c8-8001-aa91d24da963',
  'butterfly-creek':    '3b3b2e83-9837-4e8b-8d46-88c0cc280292',
  'pencarrow':          '94bacf23-cc0c-482d-8b4b-c6aadd6d2f05',
  'remutaka-trail':     '76bf1125-9195-4602-8c4b-1288d2f3d220',
  'skyline-walkway':    '10000000-0000-0000-0000-000000000117',
  'waterfront':         'e0782d3a-7109-4af9-9692-c674aa01984d',
  'waterfront-market':  'a5110625-db70-42c2-a87b-b05b0dab6042',
  'lambton-quay':       '3e80c981-7e67-4ed4-83f9-fbbaea53701f',
  'havana-coffee':      undefined, // not matched
  'mt-vic':             undefined, // not matched
};

// ── Editorial post content ──
// Each post: { slug, content, hashtags, imageIndex?, userId? }
// userId defaults to WELLY_ID. imageIndex defaults to 0.
const POSTS = [
  // ── Cafes ──
  {
    slug: 'flight-coffee',
    content: 'The Hangar is where Wellington\'s coffee obsession makes perfect sense. Flight Coffee roasts some of the best beans in the country, and this airy Dixon Street space is the perfect place to taste them. Order the filter if you want to really appreciate what they do.',
    hashtags: ['wellingtoncoffee', 'flightcoffee', 'specialtycoffee', 'wellingtoncafes'],
  },
  {
    slug: 'flight-coffee',
    content: 'Saturday morning ritual sorted. The Hangar is always buzzing but never rushed — grab a window seat and watch Dixon Street wake up. Their seasonal single origin is always worth trying.',
    hashtags: ['flightcoffee', 'saturdaymorning', 'wellingtoncoffee'],
    imageIndex: 1,
    userId: USERS[3].id, // Alex (coffeesnob)
  },
  {
    slug: 'customs',
    content: 'Customs on Ghuznee — where Coffee Supreme\'s finest creations meet one of the most beautiful cafe fit-outs in the city. The food menu is seriously good too. This is the kind of place that makes you understand why Wellington is New Zealand\'s coffee capital.',
    hashtags: ['customs', 'coffeesupreme', 'wellingtoncafes', 'ghuzneestreet'],
  },
  {
    slug: 'fidels',
    content: 'Fidel\'s has been a Cuba Street institution for decades and it hasn\'t lost a step. Revolutionary decor, strong coffee, and the kind of generous brunch plates that keep you coming back every weekend. A Wellington classic.',
    hashtags: ['fidels', 'cubastreet', 'wellingtonbrunch', 'wellingtoncafes'],
  },
  {
    slug: 'prefab',
    content: 'Prefab on Jessie Street is proof that good things come in converted containers. The cabinet food is always on point, the coffee is excellent, and there\'s something about the industrial-meets-cosy vibe that just works. One of Wellington\'s best all-rounders.',
    hashtags: ['prefab', 'wellingtoncafes', 'wellingtonlunch'],
  },
  {
    slug: 'hillside',
    content: 'Hillside Kitchen is the kind of neighbourhood gem every city needs. Tucked away in Thorndon, the seasonal menu changes regularly and everything tastes like someone genuinely cared about making it. Don\'t skip the wine list.',
    hashtags: ['hillsidekitchen', 'thorndon', 'wellingtondining', 'farmtotable'],
  },
  {
    slug: 'raglan-roast',
    content: 'Raglan Roast bringing those smooth, approachable roasts to the capital. If you like your coffee without pretension but with plenty of flavour, this is your spot. The team here are always happy to talk beans.',
    hashtags: ['raglanroast', 'wellingtoncoffee', 'nzcoffee'],
  },
  {
    slug: 'laffare',
    content: 'L\'affare has been part of Wellington\'s coffee story since before specialty coffee was even a thing. The College Street roastery and cafe is an institution — watch the roasters at work while you drink some of NZ\'s most iconic coffee.',
    hashtags: ['laffare', 'wellingtoncoffee', 'coffeeroasters', 'wellingtoninstitution'],
  },
  {
    slug: 'midnight-espresso',
    content: 'Midnight Espresso on Cuba Street is where you go when everywhere else has closed. Open ridiculously late, serving strong coffee and comfort food to Wellington\'s night owls. An absolute Cuba Street icon.',
    hashtags: ['midnightespresso', 'cubastreet', 'latenightcoffee', 'wellingtonatnight'],
  },
  {
    slug: 'arobake',
    content: 'If you haven\'t had an Arobake croissant, have you even done Wellington? This tiny Aro Street bakery has been turning out some of the best pastries in the city for years. Get there early — the good stuff sells out fast.',
    hashtags: ['arobake', 'arovalley', 'wellingtonbakery', 'croissants'],
  },
  {
    slug: 'floriditas',
    content: 'Floriditas is one of those rare places that nails every meal of the day. Breakfast, lunch, dinner — it\'s all excellent. The Cuba Street corner spot has been a Wellington staple for years, and the cabinet baking is dangerously good.',
    hashtags: ['floriditas', 'cubastreet', 'wellingtondining', 'allday'],
  },
  {
    slug: 'moore-wilsons',
    content: 'Moore Wilson\'s isn\'t just a grocery store — it\'s a Wellington pilgrimage. The fresh market has the best produce, deli, and specialty ingredients in the city. Come for the cheese, stay for the seafood counter. Every foodie in Welly ends up here.',
    hashtags: ['moorewilsons', 'wellingtonfood', 'freshmarket', 'foodie'],
  },
  {
    slug: 'wellington-chocolate',
    content: 'Wellington Chocolate Factory on Eva Street — bean-to-bar chocolate made right here in the capital. Watch them craft small batches of single-origin chocolate, then try the hot chocolate. It\'s life-changing. The ethical sourcing makes it taste even better.',
    hashtags: ['wellingtonchocolate', 'beantobar', 'evastreet', 'craftchocolate'],
  },

  // ── Restaurants ──
  {
    slug: 'logan-brown',
    content: 'Logan Brown is fine dining done the Wellington way — world-class food in a beautifully restored banking chamber, but without a shred of stuffiness. The pāua ravioli is legendary for a reason. This is the restaurant you bring visitors to when you want to show off your city.',
    hashtags: ['loganbrown', 'wellingtondining', 'finedining', 'cubastreet'],
  },
  {
    slug: 'ortega',
    content: 'Ortega Fish Shack proves that the best seafood doesn\'t need to be complicated. Fresh catches, simply prepared, in a cosy Majoribanks Street space. The fish of the day with a glass of something crisp — that\'s a perfect Wellington evening.',
    hashtags: ['ortegafishshack', 'wellingtonseafood', 'majoribanks', 'freshcatch'],
  },
  {
    slug: 'capitol',
    content: 'Capitol on Kent Terrace delivers modern European cooking with serious technique and zero fuss. The degustation is always an adventure, and the team here have a knack for making every dish feel both surprising and exactly right.',
    hashtags: ['capitol', 'wellingtondining', 'degustation', 'moderneuropean'],
  },
  {
    slug: 'dragonfly',
    content: 'Dragonfly is Wellington\'s go-to for vibrant Southeast Asian flavours. The Courtenay Place location is always packed — and for good reason. Bold dishes, generous portions, and that buzzy atmosphere that makes a night out feel special.',
    hashtags: ['dragonfly', 'asianfusion', 'courtenayplace', 'wellingtondining'],
  },
  {
    slug: 'mr-gos',
    content: 'Mr Go\'s has quickly become one of Wellington\'s most talked-about spots. Asian-inspired sharing plates that punch well above their weight, in a space that feels effortlessly cool. Book ahead — word has well and truly gotten out.',
    hashtags: ['mrgos', 'wellingtondining', 'sharingplates', 'asianinspired'],
  },
  {
    slug: 'charley-noble',
    content: 'Charley Noble on the waterfront brings open-fire cooking to Wellington. There\'s something primal about food cooked over flames, and the team here have turned it into an art form. Great cocktails too.',
    hashtags: ['charleynoble', 'wellingtonwaterfront', 'openfirecoking', 'wellingtondining'],
  },
  {
    slug: 'scopa',
    content: 'Scopa on Cuba Street — rustic Italian done right. Handmade pasta, woodfired pizza, and that warm, noisy atmosphere that makes you feel like you\'ve been transported to a Roman trattoria. One of Wellington\'s best.',
    hashtags: ['scopa', 'cubastreet', 'italian', 'handmadepasta'],
  },
  {
    slug: 'dirty-little-secret',
    content: 'Don\'t let the name fool you — Dirty Little Secret is one of Wellington\'s best-kept gems. Inventive cocktails, incredible sharing plates, and a moody atmosphere that makes every visit feel like a special occasion.',
    hashtags: ['dirtylittlesecret', 'wellingtondining', 'cocktails', 'hiddenbar'],
  },
  {
    slug: 'everybody-eats',
    content: 'Everybody Eats is Wellington at its best. A pay-as-you-feel restaurant that turns surplus food into beautiful meals, proving that good food and good values go hand in hand. Come for the kai, stay for the community spirit.',
    hashtags: ['everybodyeats', 'wellingtoncommunity', 'payasyoufeel', 'zerowaste'],
  },
  {
    slug: 'aunty-menas',
    content: 'Aunty Mena\'s has been serving legendary vegetarian food on Cuba Street since 1995. The Malaysian-inspired menu is bold, flavourful, and entirely meat-free. A Wellington institution that proves veggie food can be the main event.',
    hashtags: ['auntymenas', 'vegetarian', 'cubastreet', 'malaysian'],
  },

  // ── Bars ──
  {
    slug: 'goldings',
    content: 'Golding\'s Free Dive is craft beer culture at its purest. No pretension, just an ever-rotating lineup of the best NZ and international craft beers in a dive bar setting that feels like your cool friend\'s living room. Leeds Street\'s finest.',
    hashtags: ['goldings', 'craftbeer', 'leedsstreet', 'wellingtonbars'],
  },
  {
    slug: 'the-library',
    content: 'The Library on Courtenay Place is Wellington\'s cosiest bar. Sink into a leather armchair, order a cocktail, and pretend you\'re in a Victorian reading room. The book-lined walls and dim lighting make every night feel like an occasion.',
    hashtags: ['thelibrary', 'courtenayplace', 'cocktailbar', 'wellingtonbars'],
  },
  {
    slug: 'rogue-vagabond',
    content: 'Rogue & Vagabond is that rare bar that works for everything — casual after-work drinks, live music, pizza, or a lazy Sunday session in the garden bar. The tap list is always solid and the vibes are always right.',
    hashtags: ['rogueandvagabond', 'wellingtonbars', 'livemusic', 'gardenbar'],
  },
  {
    slug: 'garage-project',
    content: 'Garage Project on Aro Street — where Wellington\'s most creative brewery pours its freshest creations straight from the source. The taproom is an experience in itself. Try whatever\'s newest, it\'ll probably be unlike anything you\'ve had before.',
    hashtags: ['garageproject', 'craftbeer', 'arostreet', 'wellingtonbrewery'],
  },
  {
    slug: 'hawthorn-lounge',
    content: 'Hawthorn Lounge is where you go when you want a proper cocktail in Wellington. Tucked upstairs on Tory Street, the bartenders here are among the best in the country. Trust them — order off-menu and prepare to be impressed.',
    hashtags: ['hawthornlounge', 'cocktails', 'torystreet', 'wellingtonbars'],
  },
  {
    slug: 'fork-brewer',
    content: 'Fork & Brewer on Bond Street brews its own beer and pairs it with hearty food in a gorgeous heritage building. The in-house lager is crisp, the burgers are huge, and the space has that classic Wellington industrial-chic feel.',
    hashtags: ['forkandbrewer', 'wellingtonbrewery', 'bondstreet', 'craftbeer'],
  },
  {
    slug: 'little-beer-quarter',
    content: 'Little Beer Quarter on Edward Street is a craft beer lover\'s paradise. Over 20 taps of the best local and international brews, plus a killer menu. It\'s the kind of place where one beer always turns into three.',
    hashtags: ['littlebeerquarter', 'craftbeer', 'wellingtonbars'],
  },
  {
    slug: 'noble-rot',
    content: 'Noble Rot is Wellington\'s wine bar of choice for those who take their drops seriously. A curated list of natural, organic, and biodynamic wines in a warm, intimate space. The kind of place where you discover your new favourite bottle.',
    hashtags: ['noblerot', 'winebar', 'naturalwine', 'wellingtonbars'],
  },
  {
    slug: 'parrotdog',
    content: 'Parrotdog\'s brewery and taproom in Lyall Bay is worth the trip south. Fresh hoppy brews, food trucks, and a relaxed suburban vibe that feels a world away from the CBD. Their hazy IPA is consistently one of the best in NZ.',
    hashtags: ['parrotdog', 'craftbeer', 'lyallbay', 'wellingtonbrewery'],
  },
  {
    slug: 'heyday-beer',
    content: 'Heyday Beer Co brings the good times to the waterfront. A sunshine-soaked taproom with a rotating lineup of fresh, approachable beers. Perfect for a Friday afternoon knock-off with mates.',
    hashtags: ['heydaybeer', 'craftbeer', 'wellingtonwaterfront', 'fridaybeers'],
  },

  // ── Attractions ──
  {
    slug: 'te-papa',
    content: 'Te Papa is genuinely one of the best museums in the world — and it\'s free. From the earthquake house to the colossal squid, there\'s always something that stops you in your tracks. A must-visit whether it\'s your first time or your fiftieth.',
    hashtags: ['tepapa', 'wellington', 'museum', 'freeentry'],
  },
  {
    slug: 'cable-car',
    content: 'The Wellington Cable Car — an icon for a reason. The ride up from Lambton Quay is short but the views from the top are spectacular. On a clear day you can see all the way to the South Island. Start here, then wander down through the Botanic Garden.',
    hashtags: ['wellingtoncablecar', 'lambtonquay', 'wellingtonviews', 'mustdo'],
  },
  {
    slug: 'zealandia',
    content: 'Zealandia is a window into what Aotearoa looked like before humans arrived. A predator-free ecosanctuary right in the city, home to some of our rarest native birds. The night tour is absolutely magical — tuatara spotting in the dark.',
    hashtags: ['zealandia', 'nativebirds', 'ecosanctuary', 'wellingtonnature'],
  },
  {
    slug: 'botanic-garden',
    content: 'Wellington Botanic Garden is the city\'s green heart. 25 hectares of native bush, exotic plantings, and stunning views — all a cable car ride from the CBD. The rose garden in summer is something else.',
    hashtags: ['botanicgarden', 'wellington', 'gardens', 'wellingtonnature'],
  },
  {
    slug: 'wellington-museum',
    content: 'Wellington Museum on Queens Wharf tells the story of the city through the eyes of its people. Maritime history, earthquake stories, and a celebration of Wellington\'s creative spirit. The harbour views from inside are a bonus.',
    hashtags: ['wellingtonmuseum', 'queenswharf', 'wellingtonhistory'],
  },
  {
    slug: 'space-place',
    content: 'Space Place at Carter Observatory sits at the top of the Botanic Garden with some of the best views in Wellington. Planetarium shows, real telescopes, and exhibits that make you feel tiny in the best way possible.',
    hashtags: ['spaceplace', 'carterobservatory', 'wellington', 'stargazing'],
  },
  {
    slug: 'city-gallery',
    content: 'City Gallery Wellington in Civic Square is where the city\'s art scene comes alive. Bold contemporary exhibitions that challenge, inspire, and occasionally confuse — in the best way. Always free, always worth checking what\'s on.',
    hashtags: ['citygallery', 'civicsquare', 'wellingtonart', 'contemporaryart'],
  },
  {
    slug: 'wellington-zoo',
    content: 'Wellington Zoo has been a favourite since 1906 — making it the oldest zoo in New Zealand. The conservation work here is world-class, and meeting the cheeky kea and sun bears up close never gets old. A great family day out.',
    hashtags: ['wellingtonzoo', 'wildlife', 'conservation', 'familyday'],
  },
  {
    slug: 'portrait-gallery',
    content: 'The New Zealand Portrait Gallery on the waterfront showcases the faces that have shaped Aotearoa. Intimate exhibitions, beautifully curated, and always thought-provoking. A quieter gallery experience that rewards a slow visit.',
    hashtags: ['portraitgallery', 'nzart', 'wellingtongalleries', 'waterfront'],
  },
  {
    slug: 'parliament',
    content: 'The Beehive and Parliament Buildings are worth a visit whether you\'re into politics or not. Free guided tours take you through the stunning architecture and the halls where New Zealand\'s laws are made. History in action.',
    hashtags: ['parliament', 'beehive', 'wellington', 'nzhistory'],
  },
  {
    slug: 'takina',
    content: 'Tākina is Wellington\'s newest jewel — a stunning convention and exhibition centre that\'s quickly become a must-visit. The architecture alone is worth the trip, and the exhibitions (often in partnership with Te Papa) are world-class.',
    hashtags: ['takina', 'wellington', 'exhibitions', 'architecture'],
  },

  // ── Parks & Outdoors ──
  {
    slug: 'oriental-bay',
    content: 'Oriental Bay on a calm evening is about as good as city life gets. The golden sand, the pohutukawa-lined promenade, the city lights reflecting on the harbour. Wellington\'s answer to a beach holiday, right in the CBD.',
    hashtags: ['orientalbay', 'wellingtonharbour', 'beachlife', 'citybeach'],
  },
  {
    slug: 'oriental-bay',
    content: 'Morning swim at Oriental Bay before the city wakes up. There\'s nothing quite like floating in the harbour with the sunrise hitting the hills. Wellington, you\'re alright.',
    hashtags: ['orientalbay', 'morningswim', 'wellingtonmornings'],
    imageIndex: 3,
    userId: USERS[4].id, // Tane (welly_walks)
  },
  {
    slug: 'mt-kaukau',
    content: 'Mt Kaukau is the rooftop of Wellington. The climb is a solid workout — about 90 minutes return from Khandallah — but the 360-degree views from the summit make every step worth it. On a clear day you can see both coasts.',
    hashtags: ['mtkaukau', 'wellingtonwalks', 'hilltop', 'wellingtonviews'],
  },
  {
    slug: 'mt-kaukau',
    content: 'Golden hour from the top of Kaukau hits different. Packed the thermos and made it up just in time for this — the Kāpiti Coast glowing in the distance. Worth the burn.',
    hashtags: ['mtkaukau', 'goldenhour', 'wellingtonwalks', 'sunset'],
    imageIndex: 2,
    userId: USERS[4].id, // Tane
  },
  {
    slug: 'waitangi-park',
    content: 'Waitangi Park is where Wellington comes to play. Skatepark, playground, weekend markets, and that beautiful wetland area that cleans stormwater naturally. Urban design done right.',
    hashtags: ['waitangipark', 'wellington', 'urbanpark', 'skateboarding'],
  },
  {
    slug: 'frank-kitts',
    content: 'Frank Kitts Park is the heart of Wellington\'s waterfront. Weekend markets, playground for the kids, and some of the best harbour views in the city. Grab a coffee and just sit — this is people-watching paradise.',
    hashtags: ['frankkitts', 'wellingtonwaterfront', 'weekendvibes'],
  },
  {
    slug: 'town-belt',
    content: 'The Town Belt is Wellington\'s best-kept secret — 425 hectares of bush and trails wrapping around the city. You can be deep in native forest within 10 minutes of the CBD. The birdlife is incredible.',
    hashtags: ['townbelt', 'wellingtonwalks', 'nativebush', 'urbanwildlife'],
  },
  {
    slug: 'island-bay',
    content: 'Island Bay is Wellington\'s southern soul. Wild coastline, the smell of salt and pine, and Tapu Te Ranga Island sitting just offshore. The beach is perfect for a rugged South Coast walk.',
    hashtags: ['islandbay', 'southcoast', 'wellingtonbeaches', 'wildcoast'],
  },
  {
    slug: 'lyall-bay',
    content: 'Lyall Bay is where Wellington surfs. Even on a grey day there\'s something mesmerising about the waves rolling in with planes landing overhead. The fish and chips on the beach tradition is mandatory.',
    hashtags: ['lyallbay', 'wellingtonsurfing', 'beachlife', 'southcoast'],
  },
  {
    slug: 'houghton-bay',
    content: 'Houghton Bay is the quiet one on the South Coast. No cafes, no crowds — just a rocky little bay with crystal-clear water and a community that likes it that way. Perfect for a contemplative afternoon.',
    hashtags: ['houghtonbay', 'southcoast', 'hiddenbeach', 'quietlife'],
  },
  {
    slug: 'makara-peak',
    content: 'Makara Peak is mountain biking mecca for Wellingtonians. Over 40km of hand-built trails through regenerating bush, from mellow beginner loops to gnarly downhill runs. The community behind this place is incredible.',
    hashtags: ['makarapeak', 'mountainbiking', 'wellingtontrails', 'mtb'],
  },
  {
    slug: 'butterfly-creek',
    content: 'Butterfly Creek is a short, sweet walk through lush native bush — perfect for families or anyone wanting a quick nature fix. The stream crossings and dappled light make it feel like a miniature jungle adventure.',
    hashtags: ['butterflycreek', 'wellingtonwalks', 'nativebush', 'familywalk'],
  },
  {
    slug: 'pencarrow',
    content: 'The Pencarrow coast walk is one of the best-kept secrets in the Wellington region. Wild coastline, historic lighthouse, and views across to the South Island. Pack a picnic and make a day of it.',
    hashtags: ['pencarrow', 'wellingtonwalks', 'lighthouse', 'coastwalk'],
  },
  {
    slug: 'remutaka-trail',
    content: 'The Remutaka Cycle Trail is an epic day out. The old rail trail climbs through bush and tunnels over the Remutaka Range — the summit tunnel is dark, eerie, and unforgettable. Bring good lights and warm layers.',
    hashtags: ['remutaka', 'cycletrail', 'wellingtontrails', 'bikepacking'],
  },
  {
    slug: 'skyline-walkway',
    content: 'The Skyline Walkway runs along the ridgeline above Wellington, connecting Johnsonville to Karori with jaw-dropping views in every direction. It\'s one of the great urban walks in New Zealand.',
    hashtags: ['skylinewalkway', 'wellingtonwalks', 'ridgewalk', 'urbantrails'],
  },
  {
    slug: 'te-ahumairangi',
    content: 'Te Ahumairangi Hill (Tinakori Hill) is a beautiful pocket of bush right above the city. The loop track winds through towering pines and native forest, with stunning harbour views. A lunchbreak escape for Thorndon workers.',
    hashtags: ['teahumairangi', 'tinakorihill', 'wellingtonwalks', 'lunchbreak'],
  },
  {
    slug: 'northern-walkway',
    content: 'The Northern Walkway links the city to the northern suburbs through native bush and ridgeline tracks. On a good day the views stretch from the harbour to the Tararuas. Proper Wellington tramping without leaving the city.',
    hashtags: ['northernwalkway', 'wellingtonwalks', 'nativebush', 'daytrip'],
  },

  // ── Venues & Culture ──
  {
    slug: 'san-fran',
    content: 'San Fran on Cuba Street is the beating heart of Wellington\'s live music scene. From local bands to international acts, this intimate venue has hosted some legendary nights. Check what\'s on — it\'s always worth it.',
    hashtags: ['sanfran', 'livemusic', 'cubastreet', 'wellingtonmusic'],
  },
  {
    slug: 'meow',
    content: 'Meow on Edward Street is part bar, part venue, part community hub. Live music, DJs, quiz nights, comedy — there\'s always something happening. The kind of place that defines Wellington\'s creative energy.',
    hashtags: ['meow', 'livemusic', 'wellingtonnightlife', 'edwardstreet'],
  },
  {
    slug: 'valhalla',
    content: 'Valhalla is where Wellington\'s music lovers gather. The Aro Street venue has a lineup that punches well above its size — from heavy metal to jazz to experimental weirdness. If it\'s good, Valhalla will book it.',
    hashtags: ['valhalla', 'livemusic', 'arostreet', 'wellingtonmusic'],
  },
  {
    slug: 'bats',
    content: 'BATS Theatre is the scrappy, beloved heart of Wellington\'s independent theatre scene. Boundary-pushing performances in an intimate space where you\'re close enough to feel every moment. Support your local arts — go see something at BATS.',
    hashtags: ['batstheatre', 'wellingtontheatre', 'independentarts', 'liveperformance'],
  },
  {
    slug: 'circa',
    content: 'Circa Theatre sits right on the waterfront with harbour views and some of the best professional theatre in the country. From new NZ writing to reimagined classics, the programming here is consistently brilliant.',
    hashtags: ['circatheatre', 'wellingtontheatre', 'waterfront', 'nzdrama'],
  },
  {
    slug: 'opera-house',
    content: 'The Opera House is Wellington\'s grand dame. This heritage venue hosts everything from the Royal New Zealand Ballet to major touring shows. The ornate interior is worth seeing even if you\'re just passing through.',
    hashtags: ['operahouse', 'wellington', 'performing arts', 'heritage'],
  },
  {
    slug: 'tsb-arena',
    content: 'TSB Arena on Queens Wharf has hosted some of the biggest events in Wellington. Concerts, expos, conferences — if it\'s happening in the city, chances are it\'s happening here. The waterfront location is hard to beat.',
    hashtags: ['tsbarena', 'queenswharf', 'wellingtonevents', 'liveevents'],
  },
  {
    slug: 'wharewaka',
    content: 'Te Wharewaka o Pōneke on the waterfront is a place of cultural significance and beauty. Traditional Māori waka (canoe) experiences, harbour tours, and a stunning venue that connects visitors to the stories of this harbour city.',
    hashtags: ['wharewaka', 'maoriculture', 'wellingtonwaterfront', 'wakaama'],
  },

  // ── Neighbourhoods & Areas ──
  {
    slug: 'cuba-street',
    content: 'Cuba Street is Wellington\'s creative soul. Every corner has a story — buskers, vintage shops, street art, the Bucket Fountain doing its thing. No trip to Wellington is complete without a wander down Cuba.',
    hashtags: ['cubastreet', 'wellington', 'streetlife', 'bucketfountain'],
  },
  {
    slug: 'cuba-street',
    content: 'Cuba Street on a Friday night — buskers competing with restaurant noise, fairy lights strung between buildings, and that electric energy that only Welly can deliver. This is the street that never gets boring.',
    hashtags: ['cubastreet', 'fridaynight', 'wellingtonnightlife'],
    imageIndex: 3,
    userId: USERS[7].id, // Pete (night_owl)
  },
  {
    slug: 'waterfront',
    content: 'Wellington\'s waterfront is the city\'s living room. From Frank Kitts to Oriental Bay, this stretch of harbour edge is where Wellingtonians come to run, eat, think, and be. Best at golden hour when the hills glow.',
    hashtags: ['wellingtonwaterfront', 'harbour', 'goldenhour', 'wellington'],
  },
  {
    slug: 'waterfront-market',
    content: 'The Harbourside Market on a Sunday morning is a Wellington ritual. Fresh produce, artisan food, coffee in the sun, and the harbour sparkling behind it all. Get there early for the best stuff — the locals know.',
    hashtags: ['harbourside market', 'sundaymarket', 'wellingtonfood', 'fresh'],
  },
  {
    slug: 'civic-square',
    content: 'Civic Square is Wellington\'s cultural crossroads. City Gallery, the library, and the City-to-Sea bridge all converge here. The Nikau palms and public art make it one of the most photogenic spots in the city.',
    hashtags: ['civicsquare', 'wellington', 'publicart', 'culturalhub'],
  },
  {
    slug: 'aro-valley',
    content: 'Aro Valley is Wellington\'s bohemian heart. A tight-knit community tucked into a green valley, with some of the city\'s best cafes, a legendary brewery, and a community spirit that\'s hard to find anywhere else.',
    hashtags: ['arovalley', 'wellington', 'community', 'bohemian'],
  },
  {
    slug: 'newtown',
    content: 'Newtown is Wellington\'s most diverse neighbourhood and arguably its most delicious. The restaurant scene here spans the globe — from Ethiopian to Cambodian to Turkish — all at prices that won\'t break the bank.',
    hashtags: ['newtown', 'wellington', 'multiculturaldining', 'foodie'],
  },
  {
    slug: 'brewtown',
    content: 'Brewtown in Upper Hutt brings together a cluster of craft breweries, distilleries, and food outlets under one roof. A beer lover\'s playground just 30 minutes from the city. Try them all — that\'s what the train is for.',
    hashtags: ['brewtown', 'craftbeer', 'upperhut', 'beertour'],
  },

  // ── User posts (not @welly) ──
  {
    slug: 'garage-project',
    content: 'Aro Street tap day vibes. Garage Project just dropped a new hazy and it\'s absolutely crushable. The amount of creativity that comes out of this tiny brewery is insane 🍺',
    hashtags: ['garageproject', 'craftbeer', 'hazyipa'],
    imageIndex: 1,
    userId: USERS[5].id, // Sam (craft_beer)
  },
  {
    slug: 'te-papa',
    content: 'Took the family to Te Papa today and my 6-year-old spent an HOUR in the earthquake house. Free entry, world-class museum. Wellington really does it right.',
    hashtags: ['tepapa', 'familyday', 'wellington'],
    imageIndex: 1,
    userId: USERS[6].id, // Maya (market)
  },
  {
    slug: 'logan-brown',
    content: 'Anniversary dinner at Logan Brown. The pāua ravioli lived up to every bit of the hype. If you haven\'t been, just go. You won\'t regret it.',
    hashtags: ['loganbrown', 'finedining', 'datenight'],
    imageIndex: 0,
    userId: USERS[0].id, // Sarah
  },
  {
    slug: 'zealandia',
    content: 'Did the night tour at Zealandia last night and saw a tuatara just chilling on the path!! Also heard kiwi calling. An absolutely magical experience, right in the middle of the city.',
    hashtags: ['zealandia', 'tuatara', 'nighttour', 'nativewildlife'],
    imageIndex: 2,
    userId: USERS[4].id, // Tane
  },
  {
    slug: 'goldings',
    content: 'Friday knock-offs at Golding\'s. Fresh tap list, good tunes, no attitude. This is what a craft beer bar should be.',
    hashtags: ['goldings', 'craftbeer', 'fridaybeers'],
    imageIndex: 1,
    userId: USERS[5].id, // Sam
  },
  {
    slug: 'cable-car',
    content: 'Took some friends visiting from Auckland up the Cable Car today. The views never get old. Walked back down through the Botanic Garden — perfect Wellington afternoon.',
    hashtags: ['wellingtoncablecar', 'botanicgarden', 'wellingtonviews'],
    imageIndex: 2,
    userId: USERS[1].id, // Jordan
  },
];

// ── Guide definitions ──
const GUIDES = [
  {
    title: 'Essential Wellington',
    description: 'The absolute must-dos for first-time visitors. These are the places that define Wellington — start here.',
    coverSlug: 'cable-car',
    places: [
      { slug: 'te-papa', note: 'World-class museum, always free' },
      { slug: 'cable-car', note: 'Ride up, walk back through the gardens' },
      { slug: 'cuba-street', note: 'Wellington\'s creative heartbeat' },
      { slug: 'zealandia', note: 'See native birds in a predator-free sanctuary' },
      { slug: 'oriental-bay', note: 'The city\'s golden-sand beach' },
      { slug: 'botanic-garden', note: '25 hectares of green above the city' },
      { slug: 'waterfront', note: 'Walk from Te Papa to Oriental Bay' },
      { slug: 'flight-coffee', note: 'Welcome to NZ\'s coffee capital' },
    ],
  },
  {
    title: 'Cuba Street Guide',
    description: 'Wellington\'s most iconic street, block by block. Everything from dawn espresso to late-night cocktails.',
    coverSlug: 'cuba-street',
    places: [
      { slug: 'fidels', note: 'Legendary brunch and people-watching' },
      { slug: 'floriditas', note: 'All-day dining institution' },
      { slug: 'midnight-espresso', note: 'Open late, always buzzing' },
      { slug: 'logan-brown', note: 'Fine dining in an old bank' },
      { slug: 'scopa', note: 'Handmade pasta perfection' },
      { slug: 'goldings', note: 'Craft beer in a dive bar setting' },
      { slug: 'san-fran', note: 'Live music every week' },
      { slug: 'garage-project', note: 'Just off Cuba — NZ\'s most creative brewery' },
    ],
  },
  {
    title: 'Free Things to Do',
    description: 'Wellington is generous. These are the best experiences that won\'t cost you a cent.',
    coverSlug: 'te-papa',
    places: [
      { slug: 'te-papa', note: 'New Zealand\'s national museum — always free' },
      { slug: 'city-gallery', note: 'Bold contemporary art, free entry' },
      { slug: 'botanic-garden', note: 'Gardens, bush walks, and views' },
      { slug: 'town-belt', note: '425 hectares of urban bush' },
      { slug: 'cuba-street', note: 'Street art, buskers, and vibes' },
      { slug: 'civic-square', note: 'Public art and architecture' },
      { slug: 'waterfront', note: 'Harbour walks any time of day' },
      { slug: 'portrait-gallery', note: 'The faces of Aotearoa' },
      { slug: 'parliament', note: 'Free guided tours' },
    ],
  },
  {
    title: 'Wellington for Foodies',
    description: 'The restaurants, markets, and food experiences that make Wellington NZ\'s culinary capital.',
    coverSlug: 'floriditas',
    places: [
      { slug: 'logan-brown', note: 'Iconic fine dining — try the pāua ravioli' },
      { slug: 'ortega', note: 'The freshest seafood in town' },
      { slug: 'capitol', note: 'Modern European degustation' },
      { slug: 'scopa', note: 'Rustic Italian done right' },
      { slug: 'moore-wilsons', note: 'The ultimate food market' },
      { slug: 'everybody-eats', note: 'Pay-as-you-feel community dining' },
      { slug: 'waterfront-market', note: 'Sunday morning fresh market' },
      { slug: 'wellington-chocolate', note: 'Bean-to-bar craft chocolate' },
      { slug: 'charley-noble', note: 'Open-fire waterfront dining' },
      { slug: 'mr-gos', note: 'Asian-inspired sharing plates' },
    ],
  },
  {
    title: 'Late Night Wellington',
    description: 'Where to go when the sun goes down. Wellington\'s best bars, music venues, and after-dark experiences.',
    coverSlug: 'cuba-street',
    coverImageIndex: 4,
    places: [
      { slug: 'goldings', note: 'Craft beer, dive bar energy' },
      { slug: 'the-library', note: 'Cocktails in a book-lined lounge' },
      { slug: 'hawthorn-lounge', note: 'World-class cocktails upstairs' },
      { slug: 'san-fran', note: 'Live music most nights' },
      { slug: 'rogue-vagabond', note: 'Garden bar and gigs' },
      { slug: 'dirty-little-secret', note: 'Inventive cocktails, moody vibes' },
      { slug: 'noble-rot', note: 'Natural wine in a cosy bar' },
      { slug: 'midnight-espresso', note: 'Late-night coffee and food' },
      { slug: 'meow', note: 'Music, comedy, quiz nights' },
    ],
  },
  {
    title: 'Walks & Viewpoints',
    description: 'Wellington is built on hills — make the most of it. The best walks and lookouts in the city.',
    coverSlug: 'mt-kaukau',
    places: [
      { slug: 'mt-kaukau', note: 'The highest point — 360° views' },
      { slug: 'te-ahumairangi', note: 'Bush loop above Thorndon' },
      { slug: 'skyline-walkway', note: 'Ridgeline walk across the city' },
      { slug: 'northern-walkway', note: 'City to suburbs through bush' },
      { slug: 'town-belt', note: 'Urban bush minutes from the CBD' },
      { slug: 'makara-peak', note: 'Mountain biking and walking trails' },
      { slug: 'pencarrow', note: 'Wild coast walk to a lighthouse' },
      { slug: 'remutaka-trail', note: 'Epic rail trail cycle' },
    ],
  },
  {
    title: 'Waterfront Walk',
    description: 'Follow the harbour from end to end. Wellington\'s waterfront is its greatest public space.',
    coverSlug: 'waterfront',
    places: [
      { slug: 'frank-kitts', note: 'Start here — markets on weekends' },
      { slug: 'te-papa', note: 'Detour through the museum' },
      { slug: 'waterfront', note: 'The promenade to Oriental Bay' },
      { slug: 'wharewaka', note: 'Māori cultural experiences' },
      { slug: 'oriental-bay', note: 'The beach at the end of the walk' },
      { slug: 'charley-noble', note: 'Refuel with waterfront dining' },
      { slug: 'wellington-museum', note: 'Maritime history on Queens Wharf' },
      { slug: 'heyday-beer', note: 'Finish with a cold beer' },
    ],
  },
  {
    title: 'Rainy Day in Wellington',
    description: 'Wellington and rain go together. When the weather turns, head inside — there\'s plenty to do.',
    coverSlug: 'te-papa',
    coverImageIndex: 1,
    places: [
      { slug: 'te-papa', note: 'You could spend a whole day here' },
      { slug: 'city-gallery', note: 'Bold art in Civic Square' },
      { slug: 'wellington-museum', note: 'Stories of the city' },
      { slug: 'space-place', note: 'Planetarium shows rain or shine' },
      { slug: 'flight-coffee', note: 'Settle in with great coffee' },
      { slug: 'garage-project', note: 'Brewery tour and tasting' },
      { slug: 'wellington-chocolate', note: 'Bean-to-bar chocolate experience' },
      { slug: 'wellington-zoo', note: 'Many exhibits are undercover' },
    ],
  },
  {
    title: 'Craft Beer Trail',
    description: 'Wellington is the craft beer capital of NZ. Hit these spots for the best brews in the city.',
    coverSlug: 'garage-project',
    places: [
      { slug: 'garage-project', note: 'NZ\'s most creative brewery' },
      { slug: 'goldings', note: 'Best rotating tap list in town' },
      { slug: 'fork-brewer', note: 'Brewery restaurant in a heritage building' },
      { slug: 'little-beer-quarter', note: '20+ taps of the good stuff' },
      { slug: 'parrotdog', note: 'Lyall Bay brewery taproom' },
      { slug: 'heyday-beer', note: 'Waterfront sunshine beers' },
      { slug: 'rogue-vagabond', note: 'Great taps and garden bar' },
      { slug: 'brewtown', note: 'Upper Hutt beer precinct' },
    ],
  },
];

// ── Helper: generate staggered past dates ──
function pastDate(daysAgo, hoursOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(d.getHours() - hoursOffset);
  return d.toISOString();
}

// ── Main ──
async function main() {
  console.log('── Insert Seed Content ──\n');

  // 1. Create profiles (via upsert, not auth — auth users created separately)
  console.log('Creating profiles...');

  const wellyProfile = {
    id: WELLY_ID,
    username: 'welly',
    display_name: 'Welly',
    bio: 'Your guide to Wellington. Curated spots, local tips, and the best of the capital. 📍',
    avatar_url: getImageUrl('wellington', 0),
    onboarding_completed: true,
  };

  const { error: wellyErr } = await supabase
    .from('profiles')
    .upsert(wellyProfile, { onConflict: 'id' });
  if (wellyErr) {
    console.error('  Failed to create @welly profile:', wellyErr.message);
    console.error('  You may need to run create-seed-users.mjs first to create auth users.');
    process.exit(1);
  }
  console.log('  ✓ @welly profile created');

  for (const user of USERS) {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        username: user.username,
        display_name: user.displayName,
        onboarding_completed: true,
      }, { onConflict: 'id' });
    if (error) {
      console.warn(`  ⚠ ${user.username}: ${error.message}`);
    } else {
      console.log(`  ✓ ${user.username}`);
    }
  }

  // 2. Insert posts
  console.log('\nCreating posts...');
  const postRecords = [];
  const postMediaRecords = [];
  let postCount = 0;

  for (let i = 0; i < POSTS.length; i++) {
    const post = POSTS[i];
    const placeId = PLACES[post.slug];
    if (!placeId) {
      console.warn(`  ⚠ Skipping post for "${post.slug}" — no place ID`);
      continue;
    }

    const imageUrl = getImageUrl(post.slug, post.imageIndex || 0);
    if (!imageUrl) {
      console.warn(`  ⚠ Skipping post for "${post.slug}" — no image`);
      continue;
    }

    const postId = randomUUID();
    const userId = post.userId || WELLY_ID;
    const daysAgo = Math.floor(i * 1.5) + 1; // Spread posts over past ~120 days
    const hoursOffset = Math.floor(Math.random() * 12);

    postRecords.push({
      id: postId,
      user_id: userId,
      place_id: placeId,
      type: 'photo',
      content: post.content,
      media_url: imageUrl,
      media_width: 1200,
      media_height: 900,
      likes: 0,
      created_at: pastDate(daysAgo, hoursOffset),
    });

    // Add extra images as post_media if available
    const allImages = imageUrls[post.slug] || [];
    if (allImages.length > 1 && !post.userId) {
      // Only add multi-image for @welly posts
      const startIdx = post.imageIndex || 0;
      for (let j = 0; j < Math.min(allImages.length, 4); j++) {
        postMediaRecords.push({
          id: randomUUID(),
          post_id: postId,
          media_url: allImages[j].url,
          media_type: 'photo',
          media_width: 1200,
          media_height: 900,
          sort_order: j,
        });
      }
    }

    // Store hashtags and postId for later
    postRecords[postRecords.length - 1]._hashtags = post.hashtags || [];
    postRecords[postRecords.length - 1]._postId = postId;
    postCount++;
  }

  // Insert posts in batches
  const POST_BATCH = 20;
  for (let i = 0; i < postRecords.length; i += POST_BATCH) {
    const batch = postRecords.slice(i, i + POST_BATCH).map(p => {
      const { _hashtags, _postId, ...row } = p;
      return row;
    });
    const { error } = await supabase.from('posts').upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error(`  ✗ Posts batch ${i}: ${error.message}`);
    }
  }
  console.log(`  ✓ ${postCount} posts created`);

  // Insert post media
  if (postMediaRecords.length > 0) {
    for (let i = 0; i < postMediaRecords.length; i += POST_BATCH) {
      const batch = postMediaRecords.slice(i, i + POST_BATCH);
      const { error } = await supabase.from('post_media').upsert(batch, { onConflict: 'id' });
      if (error) {
        console.error(`  ✗ Post media batch ${i}: ${error.message}`);
      }
    }
    console.log(`  ✓ ${postMediaRecords.length} post media entries created`);
  }

  // 3. Create hashtags and post_hashtags
  console.log('\nCreating hashtags...');
  const allHashtags = new Set();
  for (const post of postRecords) {
    for (const tag of post._hashtags || []) {
      allHashtags.add(tag.toLowerCase().replace(/[^a-z0-9]/g, ''));
    }
  }

  const hashtagMap = {}; // name → id
  for (const tagName of allHashtags) {
    if (!tagName) continue;
    const { data, error } = await supabase
      .from('hashtags')
      .upsert({ name: tagName, post_count: 0 }, { onConflict: 'name' })
      .select('id')
      .single();
    if (error) {
      console.warn(`  ⚠ hashtag "${tagName}": ${error.message}`);
    } else {
      hashtagMap[tagName] = data.id;
    }
  }
  console.log(`  ✓ ${Object.keys(hashtagMap).length} hashtags created`);

  // Link posts to hashtags
  const postHashtagRecords = [];
  for (const post of postRecords) {
    for (const tag of post._hashtags || []) {
      const cleanTag = tag.toLowerCase().replace(/[^a-z0-9]/g, '');
      const hashtagId = hashtagMap[cleanTag];
      if (hashtagId) {
        postHashtagRecords.push({
          post_id: post._postId,
          hashtag_id: hashtagId,
        });
      }
    }
  }

  for (let i = 0; i < postHashtagRecords.length; i += POST_BATCH) {
    const batch = postHashtagRecords.slice(i, i + POST_BATCH);
    const { error } = await supabase
      .from('post_hashtags')
      .upsert(batch, { onConflict: 'post_id,hashtag_id', ignoreDuplicates: true });
    if (error) {
      console.warn(`  ⚠ post_hashtags batch ${i}: ${error.message}`);
    }
  }
  console.log(`  ✓ ${postHashtagRecords.length} post-hashtag links created`);

  // 4. Create guides
  console.log('\nCreating guides...');
  for (const guide of GUIDES) {
    const guideId = randomUUID();
    const coverUrl = getImageUrl(guide.coverSlug, guide.coverImageIndex || 0);

    const { error: guideErr } = await supabase
      .from('guides')
      .insert({
        id: guideId,
        user_id: WELLY_ID,
        title: guide.title,
        description: guide.description,
        cover_image_url: coverUrl,
        likes: 0,
      });

    if (guideErr) {
      console.error(`  ✗ Guide "${guide.title}": ${guideErr.message}`);
      continue;
    }

    // Add guide places
    const guidePlaces = [];
    for (let j = 0; j < guide.places.length; j++) {
      const gp = guide.places[j];
      const placeId = PLACES[gp.slug];
      if (!placeId) continue;
      guidePlaces.push({
        guide_id: guideId,
        place_id: placeId,
        sort_order: j,
        note: gp.note,
      });
    }

    if (guidePlaces.length > 0) {
      const { error: gpErr } = await supabase
        .from('guide_places')
        .insert(guidePlaces);
      if (gpErr) {
        console.error(`  ✗ Guide places for "${guide.title}": ${gpErr.message}`);
      }
    }

    console.log(`  ✓ "${guide.title}" (${guidePlaces.length} places)`);
  }

  // 5. Add follows — all seed users follow @welly
  console.log('\nCreating follows...');
  const followRecords = USERS.map(u => ({
    follower_id: u.id,
    following_id: WELLY_ID,
  }));
  // Also have some users follow each other
  followRecords.push(
    { follower_id: USERS[0].id, following_id: USERS[1].id },
    { follower_id: USERS[0].id, following_id: USERS[3].id },
    { follower_id: USERS[1].id, following_id: USERS[0].id },
    { follower_id: USERS[2].id, following_id: USERS[3].id },
    { follower_id: USERS[3].id, following_id: USERS[5].id },
    { follower_id: USERS[4].id, following_id: USERS[5].id },
    { follower_id: USERS[5].id, following_id: USERS[4].id },
    { follower_id: USERS[6].id, following_id: USERS[0].id },
    { follower_id: USERS[7].id, following_id: USERS[3].id },
  );

  for (const follow of followRecords) {
    const { error } = await supabase
      .from('follows')
      .upsert(follow, { onConflict: 'follower_id,following_id', ignoreDuplicates: true });
    if (error && !error.message.includes('duplicate')) {
      console.warn(`  ⚠ follow: ${error.message}`);
    }
  }
  console.log(`  ✓ ${followRecords.length} follows created`);

  // 6. Add likes — spread across posts for social proof
  console.log('\nAdding likes...');
  let likeCount = 0;
  for (const post of postRecords) {
    // Each post gets 2-7 random likes from seed users
    const numLikes = 2 + Math.floor(Math.random() * 6);
    const shuffledUsers = [...USERS].sort(() => Math.random() - 0.5);
    const likers = shuffledUsers.slice(0, numLikes);

    for (const liker of likers) {
      // Don't like your own posts
      if (post.user_id === liker.id) continue;

      const { error } = await supabase
        .from('post_likes')
        .upsert(
          { post_id: post._postId, user_id: liker.id },
          { onConflict: 'post_id,user_id', ignoreDuplicates: true }
        );
      if (!error) likeCount++;
    }
  }
  console.log(`  ✓ ${likeCount} likes added`);

  // 7. Add some comments for social proof
  console.log('\nAdding comments...');
  const COMMENT_TEMPLATES = [
    // Food/cafe comments
    { patterns: ['coffee', 'cafe', 'roast', 'espresso', 'laffare', 'arobake'], comments: [
      { userId: USERS[3].id, text: 'Their coffee is consistently amazing' },
      { userId: USERS[0].id, text: 'My go-to spot! The food is great too' },
      { userId: USERS[6].id, text: 'Love this place. Always a good vibe' },
    ]},
    { patterns: ['restaurant', 'dining', 'food', 'logan', 'ortega', 'scopa', 'capitol'], comments: [
      { userId: USERS[0].id, text: 'One of the best meals I\'ve had in Wellington' },
      { userId: USERS[6].id, text: 'Absolutely love this place. The menu is incredible' },
      { userId: USERS[7].id, text: 'Added to my list!' },
    ]},
    // Bar comments
    { patterns: ['bar', 'beer', 'cocktail', 'brew', 'garage', 'goldings'], comments: [
      { userId: USERS[5].id, text: 'The tap list here is always solid' },
      { userId: USERS[7].id, text: 'Great vibes, great drinks' },
      { userId: USERS[0].id, text: 'This is the one 🙌' },
    ]},
    // Outdoors comments
    { patterns: ['walk', 'trail', 'peak', 'bay', 'hill', 'kaukau', 'pencarrow'], comments: [
      { userId: USERS[4].id, text: 'One of my favourite walks in Welly' },
      { userId: USERS[1].id, text: 'Those views! Need to do this one' },
      { userId: USERS[6].id, text: 'Went last weekend — absolutely stunning' },
    ]},
    // Attractions/culture comments
    { patterns: ['museum', 'gallery', 'theatre', 'zoo', 'zealandia'], comments: [
      { userId: USERS[1].id, text: 'Such a great experience every time' },
      { userId: USERS[6].id, text: 'Took friends here last week, they loved it' },
      { userId: USERS[8].id, text: 'Wellington has some amazing cultural spots' },
    ]},
  ];

  let commentCount = 0;
  for (const post of postRecords) {
    const contentLower = post.content?.toLowerCase() || '';
    const hashtagStr = (post._hashtags || []).join(' ').toLowerCase();
    const fullText = contentLower + ' ' + hashtagStr;

    // Find matching comment template
    for (const template of COMMENT_TEMPLATES) {
      const matches = template.patterns.some(p => fullText.includes(p));
      if (matches && Math.random() > 0.5) {
        // Pick 1-2 comments
        const numComments = 1 + Math.floor(Math.random() * 2);
        const shuffled = [...template.comments].sort(() => Math.random() - 0.5);
        for (let c = 0; c < numComments && c < shuffled.length; c++) {
          const comment = shuffled[c];
          // Don't comment on your own post
          if (comment.userId === post.user_id) continue;

          const { error } = await supabase
            .from('comments')
            .insert({
              post_id: post._postId,
              user_id: comment.userId,
              text: comment.text,
            });
          if (!error) commentCount++;
        }
        break; // Only one template match per post
      }
    }
  }
  console.log(`  ✓ ${commentCount} comments added`);

  // 8. Add some guide likes
  console.log('\nAdding guide likes...');
  // We don't have guide IDs stored, so fetch them
  const { data: allGuides } = await supabase
    .from('guides')
    .select('id')
    .eq('user_id', WELLY_ID);

  let guideLikeCount = 0;
  if (allGuides) {
    for (const guide of allGuides) {
      const numLikes = 3 + Math.floor(Math.random() * 5);
      const shuffled = [...USERS].sort(() => Math.random() - 0.5);
      for (let i = 0; i < numLikes && i < shuffled.length; i++) {
        const { error } = await supabase
          .from('guide_likes')
          .upsert(
            { guide_id: guide.id, user_id: shuffled[i].id },
            { onConflict: 'guide_id,user_id', ignoreDuplicates: true }
          );
        if (!error) guideLikeCount++;
      }
    }
  }
  console.log(`  ✓ ${guideLikeCount} guide likes added`);

  // Summary
  console.log('\n── Done! ──');
  console.log(`Posts: ${postCount}`);
  console.log(`Post media: ${postMediaRecords.length}`);
  console.log(`Guides: ${GUIDES.length}`);
  console.log(`Hashtags: ${Object.keys(hashtagMap).length}`);
  console.log(`Follows: ${followRecords.length}`);
  console.log(`Likes: ~${likeCount}`);
  console.log(`Comments: ~${commentCount}`);
  console.log(`Guide likes: ~${guideLikeCount}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
