import { storeLastGps } from "@/lib/notifications";

const KEY = "tenerife-visited";
const EVENT = "tenerife-visited-changed";
const PROXIMITY_M = 120;

interface VisitedRecord {
  spotId: string;
  visitedAt: number;
}

function read(): VisitedRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as VisitedRecord[]) : [];
  } catch {
    return [];
  }
}

function write(items: VisitedRecord[]): void {
  window.localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function getVisitedIds(): Set<string> {
  return new Set(read().map((r) => r.spotId));
}

export function getVisitedAll(): { spotId: string; visitedAt: number }[] {
  return read();
}

export function getVisitedAt(spotId: string): number | undefined {
  return read().find((r) => r.spotId === spotId)?.visitedAt;
}

export function markVisited(spotId: string): void {
  const items = read();
  if (items.some((r) => r.spotId === spotId)) return;
  write([...items, { spotId, visitedAt: Date.now() }]);
}

export function unmarkVisited(spotId: string): void {
  write(read().filter((r) => r.spotId !== spotId));
}

export function subscribeVisited(listener: () => void): () => void {
  const handler = () => listener();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6_371_000;
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export interface SpotLite {
  id: string;
  lat: number;
  lng: number;
}

/**
 * GPS-Tracking: Battery-aware.
 * – Nur aktiv wenn die App im Vordergrund ist (Page Visibility API).
 * – Alle 3 Minuten eine einzelne getCurrentPosition — kein permanentes watchPosition.
 * – Stoppt sofort wenn die Seite versteckt / die App in den Hintergrund geht.
 */
export function startGeoTracking(spots: SpotLite[]): () => void {
  if (typeof navigator === "undefined" || !navigator.geolocation) return () => {};
  if (typeof document === "undefined") return () => {};

  let timerId: ReturnType<typeof setTimeout> | undefined;
  let running = true;

  const checkProximity = () => {
    if (!running || document.hidden) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!running) return;
        const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        // Share fix with notification geofence
        storeLastGps(here.lat, here.lng);
        const visited = getVisitedIds();
        for (const spot of spots) {
          if (visited.has(spot.id)) continue;
          if (distanceMeters(here, spot) <= PROXIMITY_M) {
            markVisited(spot.id);
          }
        }
        // Schedule next check in 3 minutes
        if (running) timerId = setTimeout(checkProximity, 3 * 60_000);
      },
      () => {
        // Permission denied or error — retry in 5 minutes (won't spam)
        if (running) timerId = setTimeout(checkProximity, 5 * 60_000);
      },
      { enableHighAccuracy: false, maximumAge: 120_000, timeout: 20_000 },
    );
  };

  const onVisibilityChange = () => {
    if (document.hidden) {
      // Pause: clear pending timer
      if (timerId !== undefined) {
        clearTimeout(timerId);
        timerId = undefined;
      }
    } else {
      // Resume: check immediately
      checkProximity();
    }
  };

  document.addEventListener("visibilitychange", onVisibilityChange);

  // Start first check only if page is visible right now
  if (!document.hidden) {
    checkProximity();
  }

  return () => {
    running = false;
    if (timerId !== undefined) clearTimeout(timerId);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
}

export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation nicht verfügbar."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      maximumAge: 30_000,
      timeout: 15_000,
    });
  });
}
