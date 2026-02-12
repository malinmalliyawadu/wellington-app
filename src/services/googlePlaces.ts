import type { Place } from '../types';

interface GooglePlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
}

interface AutocompletePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

// Wellington coordinates as search center
const WELLINGTON_COORDS = {
  latitude: -41.2865,
  longitude: 174.7762,
};

// You'll need to add this to your .env file
const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';

function mapGoogleCategory(types: string[]): Place['category'] {
  if (types.includes('cafe') || types.includes('bakery')) return 'cafe';
  if (types.includes('restaurant') || types.includes('food')) return 'restaurant';
  if (types.includes('bar') || types.includes('night_club')) return 'bar';
  if (types.includes('park') || types.includes('natural_feature')) return 'park';
  if (
    types.includes('museum') ||
    types.includes('tourist_attraction') ||
    types.includes('art_gallery') ||
    types.includes('zoo') ||
    types.includes('aquarium')
  )
    return 'attraction';
  if (
    types.includes('stadium') ||
    types.includes('movie_theater') ||
    types.includes('bowling_alley')
  )
    return 'venue';
  return 'attraction';
}

export async function searchGooglePlaces(
  query: string,
  latitude: number = WELLINGTON_COORDS.latitude,
  longitude: number = WELLINGTON_COORDS.longitude
): Promise<Array<Omit<Place, 'id'>>> {
  if (!query.trim() || query.trim().length < 2) {
    return [];
  }

  if (!GOOGLE_PLACES_API_KEY) {
    console.warn('Google Places API key not configured');
    return [];
  }

  try {
    // Step 1: Use Autocomplete API for prefix matching
    const autocompleteUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      query
    )}&location=${latitude},${longitude}&radius=15000&components=country:nz&key=${GOOGLE_PLACES_API_KEY}`;

    console.log('Autocomplete URL:', autocompleteUrl.replace(GOOGLE_PLACES_API_KEY, 'API_KEY'));

    const autocompleteResponse = await fetch(autocompleteUrl);
    const autocompleteData = await autocompleteResponse.json();

    console.log('Autocomplete response:', {
      status: autocompleteData.status,
      predictionCount: autocompleteData.predictions?.length,
      query: query,
    });

    if (autocompleteData.status !== 'OK' && autocompleteData.status !== 'ZERO_RESULTS') {
      console.error('Autocomplete API error:', autocompleteData.status, autocompleteData.error_message);
      return [];
    }

    if (!autocompleteData.predictions || autocompleteData.predictions.length === 0) {
      return [];
    }

    // Step 2: Fetch details for each prediction (limit to first 10)
    const predictions = autocompleteData.predictions.slice(0, 10);
    const detailsPromises = predictions.map(async (prediction: AutocompletePrediction) => {
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=name,formatted_address,geometry,types&key=${GOOGLE_PLACES_API_KEY}`;

      const detailsResponse = await fetch(detailsUrl);
      const detailsData = await detailsResponse.json();

      if (detailsData.status === 'OK' && detailsData.result) {
        const result = detailsData.result;
        return {
          name: result.name,
          address: result.formatted_address,
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
          category: mapGoogleCategory(result.types || []),
        };
      }
      return null;
    });

    const results = await Promise.all(detailsPromises);
    const mappedResults = results.filter((r) => r !== null) as Array<Omit<Place, 'id'>>;

    console.log('Final mapped results count:', mappedResults.length);

    return mappedResults;
  } catch (error) {
    console.error('Google Places search error:', error);
    return [];
  }
}
