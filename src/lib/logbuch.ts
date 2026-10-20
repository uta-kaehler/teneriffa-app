import { buildThumbnailDataUrl, deleteOriginal, putOriginal, getOriginal } from "@/lib/blob-storage";

export interface LogbookEntry {
  id: string;
  createdAt: number;
  bullets: string;
  text: string;
  photoSubject?: string;
  location?: string;
  timeOfDay?: string;
  /** Compressed JPEG thumbnail (~480 px), stored inline for fast lists. */
  image?: string;
  /** True if a full-resolution original is stored in IndexedDB under this id. */
  hasOriginal?: boolean;
  /** Mime type of the stored original (image/jpeg, image/heic, etc.). */
  originalMime?: string;
  /** Reference to a spot on the map (visited tracking). */
  spotId?: string;
}

const STORAGE_KEY = "tenerife-logbuch";
const LEGACY_KEY = "tenerife-vibe-history";
const EVENT = "tenerife-logbuch-changed";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 11);
}

function readRaw(): LogbookEntry[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as LogbookEntry[];
    } catch {
      return [];
    }
  }
  const legacy = window.localStorage.getItem(LEGACY_KEY);
  if (legacy) {
    try {
      const parsed = JSON.parse(legacy);
      if (Array.isArray(parsed)) {
        const migrated: LogbookEntry[] = parsed.map((e: unknown) => {
          const entry = e as Partial<LogbookEntry> & { createdAt?: number };
          return {
            id: entry.id ?? newId(),
            createdAt: entry.createdAt ?? Date.now(),
            bullets: entry.bullets ?? "",
            text: entry.text ?? "",
            photoSubject: entry.photoSubject,
            location: entry.location,
            timeOfDay: entry.timeOfDay,
          };
        });
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }
    } catch {
      /* ignore */
    }
  }
  return [];
}

function writeAll(entries: LogbookEntry[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function getEntries(): LogbookEntry[] {
  return readRaw().sort((a, b) => b.createdAt - a.createdAt);
}

export function getEntry(id: string): LogbookEntry | undefined {
  return readRaw().find((e) => e.id === id);
}

export interface SaveEntryInput {
  bullets: string;
  text: string;
  photoSubject?: string;
  location?: string;
  timeOfDay?: string;
  /** Original full-quality photo. Stored uncompressed in IndexedDB. */
  originalBlob?: Blob;
  /** Pre-built thumbnail data URL (from blob-storage.buildThumbnailDataUrl). */
  thumbnail?: string;
  spotId?: string;
}

export async function saveEntry(input: SaveEntryInput): Promise<LogbookEntry> {
  const id = newId();
  let thumb = input.thumbnail;
  if (!thumb && input.originalBlob && input.originalBlob.type.startsWith("image/")) {
    try {
      thumb = await buildThumbnailDataUrl(input.originalBlob);
    } catch {
      thumb = undefined;
    }
  }
  if (input.originalBlob) {
    try {
      await putOriginal(id, input.originalBlob);
    } catch {
      /* fall through — entry still saved without original */
    }
  }
  const next: LogbookEntry = {
    id,
    createdAt: Date.now(),
    bullets: input.bullets,
    text: input.text,
    photoSubject: input.photoSubject,
    location: input.location,
    timeOfDay: input.timeOfDay,
    image: thumb,
    hasOriginal: Boolean(input.originalBlob),
    originalMime: input.originalBlob?.type,
    spotId: input.spotId,
  };
  writeAll([next, ...readRaw()]);
  return next;
}

export function updateEntry(id: string, patch: Partial<Pick<LogbookEntry, "text" | "bullets" | "location" | "timeOfDay" | "photoSubject">>): void {
  const all = readRaw();
  const idx = all.findIndex((e) => e.id === id);
  if (idx < 0) return;
  all[idx] = { ...all[idx], ...patch };
  writeAll(all);
}

export async function deleteEntry(id: string): Promise<void> {
  const all = readRaw().filter((e) => e.id !== id);
  writeAll(all);
  try { await deleteOriginal(id); } catch { /* ignore */ }
}

export async function getEntryOriginal(id: string): Promise<Blob | undefined> {
  try { return await getOriginal(id); } catch { return undefined; }
}

export function subscribeLogbuch(listener: () => void): () => void {
  const handler = () => listener();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

/**
 * Legacy helper kept for the offline queue, which can't easily hold blobs.
 * Produces a compressed JPEG data URL — the queue stores the small version
 * and on processing creates an entry without an "original" blob.
 */
export async function fileToCompressedDataUrl(
  file: File,
  maxWidth = 960,
  quality = 0.82,
): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Bild konnte nicht geladen werden."));
    i.src = dataUrl;
  });

  const ratio = img.height / img.width;
  const targetW = Math.min(maxWidth, img.width);
  const targetH = Math.round(targetW * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas-Kontext nicht verfügbar.");
  ctx.drawImage(img, 0, 0, targetW, targetH);
  return canvas.toDataURL("image/jpeg", quality);
}
