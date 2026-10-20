import { useEffect, useState, useCallback } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { ChevronLeft, Trash2, Share2, Download, FileText, Archive } from "lucide-react";
import {
  deleteEntry,
  getEntries,
  getEntry,
  getEntryOriginal,
  type LogbookEntry,
} from "@/lib/logbuch";
import { shareEntry } from "@/lib/share";

import { exportLogbookJson, exportLogbookMarkdown, exportPhotosZip } from "@/lib/export";

const canShare =
  typeof navigator !== "undefined" && typeof navigator.share !== "undefined";

function formatDateLabel(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

export default function Logbuch() {
  const [, params] = useRoute<{ id: string }>("/logbuch/:id");
  if (params?.id) return <LogbookDetail id={params.id} />;
  return <LogbookIndex />;
}

function LogbookIndex() {
  const [entries, setEntries] = useState<LogbookEntry[]>([]);
  const [exportNotice, setExportNotice] = useState<string | undefined>();
  const [zipProgress, setZipProgress] = useState<{ done: number; total: number } | null>(null);

  useEffect(() => {
    setEntries(getEntries());
  }, []);

  const handleExportJson = () => {
    const { count, bytes } = exportLogbookJson();
    setExportNotice(`${count} Einträge gesichert (${formatBytes(bytes)}).`);
    setTimeout(() => setExportNotice(undefined), 4000);
  };

  const handleExportMarkdown = () => {
    const { count } = exportLogbookMarkdown();
    setExportNotice(`${count} Einträge als Text exportiert.`);
    setTimeout(() => setExportNotice(undefined), 4000);
  };

  const handleExportZip = async () => {
    const withOriginals = entries.filter((e) => e.hasOriginal);
    if (withOriginals.length === 0) {
      setExportNotice("Keine Originalfotos gespeichert.");
      setTimeout(() => setExportNotice(undefined), 3000);
      return;
    }
    setZipProgress({ done: 0, total: withOriginals.length });
    try {
      const { count, bytes } = await exportPhotosZip((done, total) => {
        setZipProgress({ done, total });
      });
      setZipProgress(null);
      setExportNotice(`${count} Fotos exportiert (${formatBytes(bytes)}).`);
      setTimeout(() => setExportNotice(undefined), 5000);
    } catch {
      setZipProgress(null);
      setExportNotice("Export fehlgeschlagen — bitte erneut versuchen.");
      setTimeout(() => setExportNotice(undefined), 4000);
    }
  };

  return (
    <div className="p-6 pt-12 pb-12 flex flex-col gap-8">
      <header>
        <h1 className="text-4xl text-foreground">Logbuch</h1>
        <p className="text-sm font-serif italic text-muted-foreground mt-2">
          Inhaltsverzeichnis der Beobachtungen.
        </p>
      </header>

      {entries.length === 0 ? (
        <div className="border border-dashed border-border py-12 px-6 text-center">
          <p className="font-serif italic text-muted-foreground">
            Noch keine Einträge.
          </p>
          <Link
            href="/vibe"
            className="inline-block mt-4 text-[10px] uppercase tracking-widest text-foreground border-b border-foreground/40 pb-0.5 hover:border-foreground"
          >
            Ersten Eintrag schreiben
          </Link>
        </div>
      ) : (
        <ol className="flex flex-col">
          {entries.map((entry) => (
            <LogbookRow key={entry.id} entry={entry} />
          ))}
        </ol>
      )}

      {entries.length > 0 && (
        <section className="space-y-3 pt-6 border-t border-border/50">
          <h2 className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Daten sichern
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Texte und Vorschau-Bilder liegen lokal im Browser. Originale liegen
            zusätzlich im Foto-Speicher des Browsers — vor einem Handy-Wechsel
            unbedingt sichern.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleExportJson}
              className="border border-border px-3 py-3 text-[10px] uppercase tracking-widest text-foreground hover:bg-muted/40 inline-flex items-center justify-center gap-2"
            >
              <Download className="w-3 h-3" />
              JSON-Backup
            </button>
            <button
              onClick={handleExportMarkdown}
              className="border border-border px-3 py-3 text-[10px] uppercase tracking-widest text-foreground hover:bg-muted/40 inline-flex items-center justify-center gap-2"
            >
              <FileText className="w-3 h-3" />
              Texte als .md
            </button>
          </div>
          {entries.some((e) => e.hasOriginal) && (
            <button
              onClick={handleExportZip}
              disabled={!!zipProgress}
              className="w-full border border-border px-3 py-3 text-[10px] uppercase tracking-widest text-foreground hover:bg-muted/40 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              <Archive className="w-3 h-3" />
              {zipProgress
                ? `Fotos packen … ${zipProgress.done} / ${zipProgress.total}`
                : `Alle Fotos als ZIP (${entries.filter((e) => e.hasOriginal).length} Originale)`}
            </button>
          )}
          {exportNotice && (
            <p className="text-xs text-muted-foreground italic">
              {exportNotice}
            </p>
          )}
        </section>
      )}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function LogbookRow({ entry }: { entry: LogbookEntry }) {
  const [sharing, setSharing] = useState(false);

  const handleShare = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (sharing) return;
      setSharing(true);
      await shareEntry(entry);
      setSharing(false);
    },
    [entry, sharing],
  );

  return (
    <li className="border-t border-border/50 last:border-b">
      <div className="flex items-stretch gap-0">
        {/* Main tap area → detail page */}
        <Link
          href={`/logbuch/${entry.id}`}
          className="flex items-center gap-4 py-4 flex-1 min-w-0 hover:bg-muted/30 transition-colors"
        >
          <div className="w-16 h-16 shrink-0 bg-muted/40 border border-border/40 overflow-hidden">
            {entry.image ? (
              <img
                src={entry.image}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
                  ohne
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {formatShortDate(entry.createdAt)}
              {entry.location && <> · {entry.location}</>}
            </div>
            <div className="font-serif text-base text-foreground mt-1 line-clamp-2 leading-snug">
              {entry.text}
            </div>
          </div>
        </Link>
        {/* Share button — inline, right side */}
        {canShare && (
          <button
            onClick={handleShare}
            disabled={sharing}
            aria-label="Teilen"
            className="flex items-center justify-center w-12 shrink-0 text-muted-foreground hover:text-primary disabled:opacity-40 transition-colors border-l border-border/30"
          >
            <Share2
              className={`w-3.5 h-3.5 ${sharing ? "animate-pulse" : ""}`}
            />
          </button>
        )}
      </div>
    </li>
  );
}

function LogbookDetail({ id }: { id: string }) {
  const [, navigate] = useLocation();
  const [entry, setEntry] = useState<LogbookEntry | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareNotice, setShareNotice] = useState<string | undefined>();
  const [originalUrl, setOriginalUrl] = useState<string | undefined>();
  const canShare =
    typeof navigator !== "undefined" && typeof navigator.share !== "undefined";

  useEffect(() => {
    const e = getEntry(id);
    setEntry(e);
    setLoaded(true);
    let revoked = false;
    if (e?.hasOriginal) {
      void getEntryOriginal(id).then((blob) => {
        if (revoked || !blob) return;
        setOriginalUrl(URL.createObjectURL(blob));
      });
    }
    return () => {
      revoked = true;
      setOriginalUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return undefined;
      });
    };
  }, [id]);

  const handleShare = async () => {
    if (!entry) return;
    setShareBusy(true);
    setShareNotice(undefined);
    const res = await shareEntry(entry);
    setShareBusy(false);
    if (!res.ok && res.reason !== "cancelled") {
      setShareNotice("Teilen fehlgeschlagen.");
      setTimeout(() => setShareNotice(undefined), 4000);
    }
  };

  if (!loaded) return null;

  if (!entry) {
    return (
      <div className="p-6 pt-12 pb-12 flex flex-col gap-6">
        <Link
          href="/logbuch"
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-3 h-3" /> Zurück
        </Link>
        <p className="font-serif italic text-muted-foreground">
          Eintrag nicht gefunden.
        </p>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!window.confirm("Diesen Eintrag löschen?")) return;
    await deleteEntry(entry.id);
    navigate("/logbuch");
  };

  const displayImage = originalUrl || entry.image;

  return (
    <div className="p-6 pt-12 pb-12 flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/logbuch"
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-3 h-3" /> Logbuch
        </Link>
        <div className="flex items-center gap-4">
          {canShare && (
            <button
              onClick={handleShare}
              disabled={shareBusy}
              className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-primary hover:text-primary/80 disabled:opacity-60"
            >
              <Share2 className="w-3 h-3" />{" "}
              {entry.hasOriginal ? "Foto + Text teilen" : "Teilen"}
            </button>
          )}
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-3 h-3" /> Löschen
          </button>
        </div>
      </div>

      {shareNotice && (
        <p className="text-xs text-muted-foreground italic">{shareNotice}</p>
      )}

      <header className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {formatDateLabel(entry.createdAt)}
        </p>
        {(entry.location || entry.timeOfDay || entry.photoSubject) && (
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            {[entry.location, entry.timeOfDay, entry.photoSubject]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
      </header>

      {displayImage && (
        <div className="border border-border/60">
          <img src={displayImage} alt="" className="w-full h-auto block" />
          {entry.hasOriginal && (
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-3 py-2 border-t border-border/60">
              Original {originalUrl ? "geladen" : "wird geladen…"} · ungekürzt
              für Share
            </p>
          )}
        </div>
      )}

      <div className="bg-background border border-border p-6">
        <p className="font-serif text-xl leading-relaxed text-foreground whitespace-pre-wrap">
          {entry.text}
        </p>
      </div>

      {entry.bullets && (
        <div className="space-y-2">
          <h2 className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Stichpunkte
          </h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap font-mono">
            {entry.bullets}
          </p>
        </div>
      )}
    </div>
  );
}
