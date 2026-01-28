import { Place } from '../types';

export const mockPlaces: Place[] = [
  {
    id: 'p1',
    name: "Fidel's Cafe",
    category: 'cafe',
    address: '234 Cuba Street, Te Aro',
    latitude: -41.2943,
    longitude: 174.7736,
  },
  {
    id: 'p2',
    name: "Golding's Free Dive",
    category: 'bar',
    address: '14 Leeds Street, Te Aro',
    latitude: -41.2922,
    longitude: 174.7756,
  },
  {
    id: 'p3',
    name: 'Te Papa Museum',
    category: 'attraction',
    address: '55 Cable Street, Wellington',
    latitude: -41.2904,
    longitude: 174.7819,
  },
  {
    id: 'p4',
    name: 'Wellington Cable Car',
    category: 'attraction',
    address: '280 Lambton Quay, Wellington',
    latitude: -41.2835,
    longitude: 174.7699,
  },
  {
    id: 'p5',
    name: 'Loretta',
    category: 'restaurant',
    address: '181 Cuba Street, Te Aro',
    latitude: -41.2931,
    longitude: 174.7739,
  },
  {
    id: 'p6',
    name: 'Wellington Botanic Garden',
    category: 'park',
    address: '101 Glenmore Street, Kelburn',
    latitude: -41.2796,
    longitude: 174.7670,
  },
  {
    id: 'p7',
    name: 'San Fran',
    category: 'venue',
    address: '171 Cuba Street, Te Aro',
    latitude: -41.2929,
    longitude: 174.7740,
  },
  {
    id: 'p8',
    name: 'Prefab',
    category: 'cafe',
    address: '14 Jessie Street, Te Aro',
    latitude: -41.2915,
    longitude: 174.7775,
  },
  {
    id: 'p9',
    name: 'Havana Coffee Works',
    category: 'cafe',
    address: '163 Tory Street, Te Aro',
    latitude: -41.2938,
    longitude: 174.7788,
  },
  {
    id: 'p10',
    name: 'Little Beer Quarter',
    category: 'bar',
    address: '6 Edward Street, Te Aro',
    latitude: -41.2908,
    longitude: 174.7749,
  },
];

export function getPlaceById(id: string): Place | undefined {
  return mockPlaces.find((place) => place.id === id);
}
