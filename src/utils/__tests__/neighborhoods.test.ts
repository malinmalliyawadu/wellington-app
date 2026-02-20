import {
  getNeighborhoodCenter,
  getNeighborhood,
  getAllNeighborhoodIds,
  getNeighborhoodName,
  NEIGHBORHOODS,
} from '../neighborhoods';

describe('getNeighborhoodCenter', () => {
  it('computes the centroid of a neighborhood polygon', () => {
    const neighborhood = {
      id: 'test',
      name: 'Test',
      polygon: [
        { latitude: 0, longitude: 0 },
        { latitude: 0, longitude: 10 },
        { latitude: 10, longitude: 10 },
        { latitude: 10, longitude: 0 },
      ],
    };

    const center = getNeighborhoodCenter(neighborhood);
    expect(center.latitude).toBe(5);
    expect(center.longitude).toBe(5);
  });
});

describe('getNeighborhood', () => {
  it('returns the correct neighborhood for a known location', () => {
    // CBD center coordinates
    const result = getNeighborhood(-41.283, 174.777);
    expect(result).toBe('cbd');
  });

  it('returns null for coordinates outside all neighborhoods', () => {
    // Somewhere in the ocean
    const result = getNeighborhood(-42.0, 175.5);
    expect(result).toBeNull();
  });

  it('identifies Te Aro', () => {
    const result = getNeighborhood(-41.294, 174.778);
    expect(result).toBe('te_aro');
  });
});

describe('getAllNeighborhoodIds', () => {
  it('returns all neighborhood IDs', () => {
    const ids = getAllNeighborhoodIds();
    expect(ids.length).toBe(NEIGHBORHOODS.length);
    expect(ids).toContain('cbd');
    expect(ids).toContain('te_aro');
    expect(ids).toContain('karori');
  });
});

describe('getNeighborhoodName', () => {
  it('returns the name for a valid ID', () => {
    expect(getNeighborhoodName('cbd')).toBe('CBD');
    expect(getNeighborhoodName('te_aro')).toBe('Te Aro');
    expect(getNeighborhoodName('mount_victoria')).toBe('Mount Victoria');
  });

  it('returns null for an invalid ID', () => {
    expect(getNeighborhoodName('nonexistent')).toBeNull();
  });
});
