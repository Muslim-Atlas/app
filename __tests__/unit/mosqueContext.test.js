import AsyncStorage from '@react-native-async-storage/async-storage';

describe('Mosque Spatial Sorting & Caching Logic', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // meters
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  const resortCachedItems = (items, lat, lng) => {
    if (!items) return [];
    return items
      .map((p) => {
        const pLat = p.location?.latitude || p.geometry?.location?.lat;
        const pLng = p.location?.longitude || p.geometry?.location?.lng;
        if (!pLat || !pLng) return p;
        const distMeters = haversineDistance(lat, lng, pLat, pLng);
        return { ...p, distMeters };
      })
      .sort((a, b) => a.distMeters - b.distMeters);
  };

  it('calculates accurate distance between coordinates', () => {
    // London Eye (51.5033, -0.1195) to Big Ben (51.5007, -0.1246) is ~600m
    const dist = haversineDistance(51.5033, -0.1195, 51.5007, -0.1246);
    expect(dist).toBeGreaterThan(400);
    expect(dist).toBeLessThan(800);
  });

  it('correctly sorts mosques by distance from user location', () => {
    const userLat = 51.5074;
    const userLng = -0.1278;

    const mockMosques = [
      { id: '1', displayName: { text: 'Birmingham Central Mosque' }, location: { latitude: 52.4760, longitude: -1.8904 } }, // ~160km away
      { id: '2', displayName: { text: 'Regents Park Mosque' }, location: { latitude: 51.5298, longitude: -0.1627 } }, // ~3.5km away
      { id: '3', displayName: { text: 'East London Mosque' }, location: { latitude: 51.5178, longitude: -0.0658 } }, // ~4.5km away
    ];

    const sorted = resortCachedItems(mockMosques, userLat, userLng);

    expect(sorted[0].displayName.text).toBe('Regents Park Mosque');
    expect(sorted[1].displayName.text).toBe('East London Mosque');
    expect(sorted[2].displayName.text).toBe('Birmingham Central Mosque');
  });

  it('supports legacy Google Places geometry.location structure', () => {
    const userLat = 51.5074;
    const userLng = -0.1278;

    const mockPlaces = [
      { id: 'far', name: 'Far', geometry: { location: { lat: 52.0, lng: -1.0 } } },
      { id: 'near', name: 'Near', geometry: { location: { lat: 51.5080, lng: -0.1280 } } },
    ];

    const sorted = resortCachedItems(mockPlaces, userLat, userLng);
    expect(sorted[0].id).toBe('near');
    expect(sorted[1].id).toBe('far');
  });

  it('persists and restores cached mosques data in AsyncStorage', async () => {
    const mosques = [
      { id: '1', name: 'Mosque A' },
      { id: '2', name: 'Mosque B' },
    ];

    await AsyncStorage.setItem('@cached_mosques', JSON.stringify(mosques));
    const raw = await AsyncStorage.getItem('@cached_mosques');
    const parsed = JSON.parse(raw);

    expect(parsed).toHaveLength(2);
    expect(parsed[0].name).toBe('Mosque A');
  });
});
