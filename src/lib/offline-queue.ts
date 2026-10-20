import { saveEntry } from "@/lib/logbuch";

export interface QueuedDraft {
  id: string;
  queuedAt: number;
  bullets: string;
  photoSubject?: string;
  location?: string;
  timeOfDay?: string;
  image?: string;
  lastError?: string;
}

const QUEUE_KEY = "tenerife-offline-queue";
const QUEUE_EVENT = "tenerife-offline-queue-changed";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 11);
}

function readQueue(): QueuedDraft[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as QueuedDraft[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(items: QueuedDraft[]): void {
  window.localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(QUEUE_EVENT));
}

export function getQueue(): QueuedDraft[] {
  return readQueue().sort((a, b) => a.queuedAt - b.queuedAt);
}

export function enqueueDraft(payload: Omit<QueuedDraft, "id" | "queuedAt">): QueuedDraft {
  const item: QueuedDraft = {
    ...payload,
    id: newId(),
    queuedAt: Date.now(),
  };
  writeQueue([...readQueue(), item]);
  return item;
}

export function removeFromQueue(id: string): void {
  writeQueue(readQueue().filter((q) => q.id !== id));
}

export function subscribeQueue(listener: () => void): () => void {
  const handler = () => listener();
  window.addEventListener(QUEUE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(QUEUE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

let processing = false;

export async function processQueue(): Promise<void> {
  if (processing) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;
  processing = true;
  try {
    let items = readQueue();
    while (items.length > 0) {
      const item = items[0];
      try {
        // Öffentliche Fassung: kein Textgenerator mehr, die Stichpunkte sind der Text.
        const res = { text: item.bullets };
        await saveEntry({
          bullets: item.bullets,
          text: res.text,
          photoSubject: item.photoSubject,
          location: item.location,
          timeOfDay: item.timeOfDay,
          thumbnail: item.image,
        });
        removeFromQueue(item.id);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const updated = readQueue().map((q) =>
          q.id === item.id ? { ...q, lastError: message } : q,
        );
        writeQueue(updated);
        break;
      }
      items = readQueue();
    }
  } finally {
    processing = false;
  }
}

export function startQueueProcessor(): () => void {
  if (typeof window === "undefined") return () => {};
  const tryProcess = () => {
    void processQueue();
  };
  window.addEventListener("online", tryProcess);
  if (navigator.onLine) {
    setTimeout(tryProcess, 1500);
  }
  return () => {
    window.removeEventListener("online", tryProcess);
  };
}
