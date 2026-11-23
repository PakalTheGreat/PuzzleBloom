/** Haversine distance in kilometers between two WGS84 points. */
export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function formatDistanceKm(km: number | null | undefined): string {
  if (km == null || Number.isNaN(km)) return "";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

/** Coarse city centroids for demo / fallback — never street-level cultivation sites. */
export const CITY_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  "curitiba|pr": { lat: -25.4284, lng: -49.2733 },
  "sao paulo|sp": { lat: -23.5505, lng: -46.6333 },
  "são paulo|sp": { lat: -23.5505, lng: -46.6333 },
  "florianopolis|sc": { lat: -27.5954, lng: -48.548 },
  "florianópolis|sc": { lat: -27.5954, lng: -48.548 },
  "porto alegre|rs": { lat: -30.0346, lng: -51.2177 },
  "belo horizonte|mg": { lat: -19.9167, lng: -43.9345 },
  "campinas|sp": { lat: -22.9056, lng: -47.0608 },
  "joinville|sc": { lat: -26.3045, lng: -48.8487 },
  "londrina|pr": { lat: -23.3045, lng: -51.1696 },
};

export function cityCentroid(
  city?: string | null,
  state?: string | null,
): { lat: number; lng: number } | null {
  if (!city || !state) return null;
  const key = `${city.trim().toLowerCase()}|${state.trim().toLowerCase()}`;
  return CITY_CENTROIDS[key] ?? null;
}

export type Locatable = {
  service_lat?: number | null;
  service_lng?: number | null;
  city?: string | null;
  state?: string | null;
  offers_in_person?: boolean | null;
  offers_remote?: boolean | null;
};

export function resolveServiceCoords(row: Locatable): {
  lat: number;
  lng: number;
} | null {
  if (
    typeof row.service_lat === "number" &&
    typeof row.service_lng === "number" &&
    Number.isFinite(row.service_lat) &&
    Number.isFinite(row.service_lng)
  ) {
    return { lat: row.service_lat, lng: row.service_lng };
  }
  return cityCentroid(row.city, row.state);
}

export function sortByDistance<T extends Locatable>(
  rows: T[],
  origin: { lat: number; lng: number },
  opts?: { preferInPerson?: boolean },
): Array<T & { distance_km: number | null }> {
  const preferInPerson = opts?.preferInPerson ?? true;
  const withDist = rows.map((row) => {
    const coords = resolveServiceCoords(row);
    const distance_km = coords
      ? distanceKm(origin.lat, origin.lng, coords.lat, coords.lng)
      : null;
    return { ...row, distance_km };
  });
  withDist.sort((a, b) => {
    if (preferInPerson) {
      const aIn = a.offers_in_person ? 0 : 1;
      const bIn = b.offers_in_person ? 0 : 1;
      if (aIn !== bIn) return aIn - bIn;
    }
    const da = a.distance_km ?? Number.POSITIVE_INFINITY;
    const db = b.distance_km ?? Number.POSITIVE_INFINITY;
    return da - db;
  });
  return withDist;
}
