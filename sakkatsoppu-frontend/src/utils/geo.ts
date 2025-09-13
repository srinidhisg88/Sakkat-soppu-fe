// Simple geospatial helpers for service area checks

// Haversine distance between two lat/lng points in kilometers
export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Approximate center of Mysore (Mysuru), India
const MYSORE_CENTER = { lat: 12.2958, lon: 76.6394 };

// Returns true if the given coordinates are within the service radius around Mysore center
export function isWithinMysore(lat?: number | null, lon?: number | null, radiusKm = 30): boolean {
  if (typeof lat !== 'number' || typeof lon !== 'number') return false;
  const d = haversineDistanceKm(lat, lon, MYSORE_CENTER.lat, MYSORE_CENTER.lon);
  return d <= radiusKm;
}
