import type { LogbookEntry } from "@/lib/logbuch";
import { getEntryOriginal } from "@/lib/logbuch";

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

async function dataUrlToFile(dataUrl: string, name: string): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const ext = blob.type.includes("png") ? "png" : "jpg";
  return new File([blob], `${name}.${ext}`, { type: blob.type || "image/jpeg" });
}

function blobToFile(blob: Blob, name: string): File {
  const ext = blob.type.includes("png")
    ? "png"
    : blob.type.includes("heic")
      ? "heic"
      : "jpg";
  return new File([blob], `${name}.${ext}`, { type: blob.type || "image/jpeg" });
}

export interface ShareResult {
  ok: boolean;
  reason?: "unsupported" | "cancelled" | "error";
  message?: string;
}

interface SharePayload {
  title: string;
  text: string;
  file?: File;
}

async function tryNativeShare(payload: SharePayload): Promise<ShareResult> {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return { ok: false, reason: "unsupported" };
  }
  try {
    if (payload.file) {
      const data: ShareData = {
        title: payload.title,
        text: payload.text,
        files: [payload.file],
      };
      if (typeof navigator.canShare === "function" && navigator.canShare(data)) {
        await navigator.share(data);
        return { ok: true };
      }
    }
    await navigator.share({ title: payload.title, text: payload.text });
    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, reason: "cancelled" };
    }
    return {
      ok: false,
      reason: "error",
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Open WhatsApp directly with text only (no file possible via deep-link). */
export function openWhatsAppText(text: string): void {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Share a saved logbook entry. Prefers the IndexedDB original blob, falls
 * back to the compressed thumbnail data URL, falls back to text-only.
 */
export async function shareEntry(entry: LogbookEntry): Promise<ShareResult> {
  const titleParts = [formatDate(entry.createdAt), entry.location].filter(Boolean);
  const title = `Logbuch — ${titleParts.join(" · ")}`;
  const contextLine = [entry.location, entry.timeOfDay].filter(Boolean).join(" · ");
  const text = contextLine ? `${entry.text}\n\n${contextLine}` : entry.text;

  let file: File | undefined;
  if (entry.hasOriginal) {
    try {
      const blob = await getEntryOriginal(entry.id);
      if (blob) file = blobToFile(blob, `tenerife-${entry.id}`);
    } catch {
      /* ignore */
    }
  }
  if (!file && entry.image) {
    try {
      file = await dataUrlToFile(entry.image, `tenerife-${entry.id}`);
    } catch {
      /* ignore */
    }
  }

  const native = await tryNativeShare({ title, text, file });
  if (native.ok || native.reason === "cancelled") return native;
  // Final fallback: text-only WhatsApp deep link
  openWhatsAppText(`${title}\n\n${text}`);
  return { ok: true };
}

/**
 * Share an unsaved draft (Vibe-Writer just generated). The original Blob
 * is held in memory; the share sheet receives it directly.
 */
export async function shareDraft(opts: {
  text: string;
  location?: string;
  timeOfDay?: string;
  originalBlob?: Blob;
}): Promise<ShareResult> {
  const contextLine = [opts.location, opts.timeOfDay].filter(Boolean).join(" · ");
  const text = contextLine ? `${opts.text}\n\n${contextLine}` : opts.text;
  const title = `Tenerife — ${opts.location ?? "Notiz"}`;
  const file = opts.originalBlob
    ? blobToFile(opts.originalBlob, `tenerife-${Date.now()}`)
    : undefined;
  const native = await tryNativeShare({ title, text, file });
  if (native.ok || native.reason === "cancelled") return native;
  openWhatsAppText(text);
  return { ok: true };
}
