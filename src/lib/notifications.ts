const KEY_ENABLED = "tenerife-notifications-enabled";
const KEY_FIRED   = "tenerife-notifications-fired";
const KEY_LAST_GPS = "tenerife-last-gps";
const EVENT = "tenerife-notifications-changed";

let intervalId: number | undefined;

export interface Geofence {
  lat: number;
  lng: number;
  radiusKm: number;
}

export interface ScheduledEvent {
  id: string;
  at: Date;
  title: string;
  body: string;
  url?: string;
  leadMin?: number;
  /** If set, only fire if last known GPS is within this radius. */
  geofence?: Geofence;
}

// ─── GPS caching ─────────────────────────────────────────────────────────────

export function storeLastGps(lat: number, lng: number): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY_LAST_GPS, JSON.stringify({ lat, lng, ts: Date.now() }));
}

function getLastGps(): { lat: number; lng: number } | undefined {
  try {
    const raw = window.localStorage.getItem(KEY_LAST_GPS);
    if (!raw) return undefined;
    const p = JSON.parse(raw) as { lat: number; lng: number; ts: number };
    // Ignore GPS fixes older than 6 hours
    if (Date.now() - p.ts > 6 * 3_600_000) return undefined;
    return { lat: p.lat, lng: p.lng };
  } catch {
    return undefined;
  }
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function isInGeofence(fence: Geofence): boolean {
  const gps = getLastGps();
  if (!gps) return true; // no GPS → don't block notification
  return haversineKm(gps, fence) <= fence.radiusKm;
}

// ─── Permission helpers ───────────────────────────────────────────────────────

export function notificationsSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator
  );
}

export function permission(): NotificationPermission {
  if (!notificationsSupported()) return "denied";
  return Notification.permission;
}

export function isEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (window.localStorage.getItem(KEY_ENABLED) !== "1") return false;
  return permission() === "granted";
}

export function setEnabled(enabled: boolean): void {
  window.localStorage.setItem(KEY_ENABLED, enabled ? "1" : "0");
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function subscribeNotifications(listener: () => void): () => void {
  const handler = () => listener();
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return "denied";
  return Notification.requestPermission();
}

// ─── Service Worker ───────────────────────────────────────────────────────────

async function getRegistration(): Promise<ServiceWorkerRegistration | undefined> {
  if (!("serviceWorker" in navigator)) return undefined;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    return regs[0] ?? (await navigator.serviceWorker.ready);
  } catch {
    return undefined;
  }
}

// ─── Firing fired-event cache ─────────────────────────────────────────────────

function readFired(): Set<string> {
  try {
    const raw = window.localStorage.getItem(KEY_FIRED);
    if (!raw) return new Set();
    const p = JSON.parse(raw);
    return new Set(Array.isArray(p) ? p : []);
  } catch {
    return new Set();
  }
}

function writeFired(set: Set<string>): void {
  window.localStorage.setItem(KEY_FIRED, JSON.stringify([...set].slice(-200)));
}

function eventKey(ev: ScheduledEvent): string {
  return `${ev.id}@${ev.at.toISOString().slice(0, 16)}`;
}

// ─── Dispatch ─────────────────────────────────────────────────────────────────

async function dispatch(ev: ScheduledEvent): Promise<void> {
  const reg = await getRegistration();
  const payload = {
    type: "show-notification" as const,
    title: ev.title,
    body: ev.body,
    tag: ev.id,
    url: ev.url ?? "/",
  };
  if (reg && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(payload);
  } else if (reg) {
    await reg.showNotification(ev.title, {
      body: ev.body,
      tag: ev.id,
      data: { url: ev.url ?? "/" },
    });
  } else {
    new Notification(ev.title, { body: ev.body, tag: ev.id });
  }
}

// ─── Scheduler ───────────────────────────────────────────────────────────────

export type EventProvider = () => ScheduledEvent[];

export function startScheduler(provider: EventProvider): () => void {
  if (intervalId !== undefined) {
    window.clearInterval(intervalId);
    intervalId = undefined;
  }
  if (typeof window === "undefined") return () => {};

  const tick = () => {
    if (!isEnabled()) return;
    const now = Date.now();
    const fired = readFired();
    const events = provider();
    let changed = false;

    for (const ev of events) {
      const key = eventKey(ev);
      if (fired.has(key)) continue;

      const lead    = (ev.leadMin ?? 0) * 60_000;
      const trigger = ev.at.getTime() - lead;

      // Only fire within a 30-minute window after the trigger time
      if (trigger > now || now - trigger >= 30 * 60_000) continue;

      // Geofence check: skip if user is too far away
      if (ev.geofence && !isInGeofence(ev.geofence)) continue;

      void dispatch(ev);
      fired.add(key);
      changed = true;
    }

    if (changed) writeFired(fired);
  };

  tick();
  intervalId = window.setInterval(tick, 60_000);

  return () => {
    if (intervalId !== undefined) {
      window.clearInterval(intervalId);
      intervalId = undefined;
    }
  };
}

export async function registerServiceWorker(basePath: string): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register(`${basePath}sw.js`, { scope: basePath });
  } catch {
    /* notifications gracefully degrade */
  }
}
