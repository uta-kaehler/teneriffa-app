import { zipSync, strToU8 } from "fflate";
import { getEntries, type LogbookEntry } from "@/lib/logbuch";
import { getOriginal } from "@/lib/blob-storage";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function timestampSlug(): string {
  const d = new Date();
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function formatLong(ts: number): string {
  return new Date(ts).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function exportLogbookJson(): { count: number; bytes: number } {
  const entries = getEntries();
  const payload = {
    app: "tenerife-logbuch",
    version: 1,
    exportedAt: new Date().toISOString(),
    count: entries.length,
    entries,
  };
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  downloadBlob(blob, `tenerife-logbuch-${timestampSlug()}.json`);
  return { count: entries.length, bytes: blob.size };
}

function entryToMarkdown(e: LogbookEntry): string {
  const lines: string[] = [];
  const meta = [formatLong(e.createdAt), e.location, e.timeOfDay, e.photoSubject]
    .filter(Boolean)
    .join(" · ");
  lines.push(`## ${meta}`);
  lines.push("");
  lines.push(e.text.trim());
  if (e.bullets?.trim()) {
    lines.push("");
    lines.push("> " + e.bullets.trim().split("\n").join("\n> "));
  }
  lines.push("");
  return lines.join("\n");
}

export function exportLogbookMarkdown(): { count: number; bytes: number } {
  const entries = getEntries();
  const header = `# Tenerife — Logbuch\n\n_Export ${new Date().toLocaleString("de-DE")} · ${entries.length} Einträge_\n\n---\n\n`;
  const body = entries.map(entryToMarkdown).join("\n---\n\n");
  const blob = new Blob([header + body], { type: "text/markdown;charset=utf-8" });
  downloadBlob(blob, `tenerife-logbuch-${timestampSlug()}.md`);
  return { count: entries.length, bytes: blob.size };
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" }[c] ?? c))
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
}

function guessExt(mime: string | undefined): string {
  if (!mime) return "jpg";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("png")) return "png";
  if (mime.includes("heic") || mime.includes("heif")) return "heic";
  if (mime.includes("webp")) return "webp";
  return "jpg";
}

export async function exportPhotosZip(
  onProgress?: (done: number, total: number) => void,
): Promise<{ count: number; bytes: number }> {
  const entries = getEntries().filter((e) => e.hasOriginal);
  if (entries.length === 0) return { count: 0, bytes: 0 };

  const files: Record<string, Uint8Array> = {};

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    onProgress?.(i, entries.length);
    const blob = await getOriginal(e.id);
    if (!blob) continue;
    const buf = await blob.arrayBuffer();
    const date = new Date(e.createdAt).toISOString().slice(0, 10);
    const loc = e.location ? `-${slugify(e.location)}` : "";
    const ext = guessExt(e.originalMime);
    const filename = `${date}${loc}-${e.id.slice(0, 6)}.${ext}`;
    files[filename] = new Uint8Array(buf);
  }

  const readme = `# Tenerife Fotos — Export ${new Date().toLocaleString("de-DE")}\n\n${Object.keys(files).length} Originalfotos\n`;
  files["README.txt"] = strToU8(readme);

  const zipped = zipSync(files, { level: 0 }); // level 0 = store only (photos are already compressed)
  const zipBlob = new Blob([zipped], { type: "application/zip" });
  downloadBlob(zipBlob, `tenerife-fotos-${timestampSlug()}.zip`);
  onProgress?.(entries.length, entries.length);
  return { count: Object.keys(files).length - 1, bytes: zipBlob.size };
}
