export const WELLINGTON_COORDS = {
  latitude: -41.2865,
  longitude: 174.7762,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export const TOP_ATTRACTIONS = [
  {
    id: '1',
    name: 'Te Papa Museum',
    description: 'Museum of New Zealand - free entry, world-class exhibits',
    category: 'Museum',
    coords: { latitude: -41.2901, longitude: 174.7817 },
  },
  {
    id: '2',
    name: 'Wellington Cable Car',
    description: 'Iconic red cable car with panoramic city views',
    category: 'Transport & Views',
    coords: { latitude: -41.2792, longitude: 174.7769 },
  },
  {
    id: '3',
    name: 'Zealandia',
    description: 'Eco-sanctuary with native wildlife',
    category: 'Nature',
    coords: { latitude: -41.2882, longitude: 174.7537 },
  },
  {
    id: '4',
    name: 'Cuba Street',
    description: 'Bohemian heart of Wellington with shops and cafes',
    category: 'Shopping & Culture',
    coords: { latitude: -41.2935, longitude: 174.7755 },
  },
  {
    id: '5',
    name: 'Weta Workshop',
    description: 'Behind-the-scenes tours of film special effects',
    category: 'Entertainment',
    coords: { latitude: -41.3157, longitude: 174.7804 },
  },
  {
    id: '6',
    name: 'Mount Victoria',
    description: 'Panoramic views across the city and harbour',
    category: 'Nature & Views',
    coords: { latitude: -41.2968, longitude: 174.7934 },
  },
];

export const CATEGORIES = [
  { id: 'all', name: 'All', icon: '🏙️' },
  { id: 'food', name: 'Food & Coffee', icon: '☕' },
  { id: 'attractions', name: 'Attractions', icon: '🎭' },
  { id: 'nature', name: 'Nature & Parks', icon: '🌳' },
  { id: 'events', name: 'Events', icon: '🎉' },
  { id: 'transport', name: 'Transport', icon: '🚌' },
];
