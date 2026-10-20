import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import * as exifr from "exifr";
import heic2any from "heic2any";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, ImagePlus, X, Share2, Copy, Check, Pencil } from "lucide-react";
import { saveEntry } from "@/lib/logbuch";
import { shareDraft } from "@/lib/share";

function useObjectUrl(blob: Blob | undefined): string | undefined {
  return useMemo(() => {
    if (!blob) return undefined;
    return URL.createObjectURL(blob);
  }, [blob]);
}

export default function VibeWriter() {
  const [loc, navigate] = useLocation();
  const fileRef = useRef<HTMLInputElement>(null);

  const params = useMemo(() => {
    if (typeof window === "undefined") return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc]);
  const spotId = params.get("spotId") ?? undefined;
  const spotName = params.get("ort") ? decodeURIComponent(params.get("ort")!) : undefined;

  const [text, setText] = useState("");
  const [location, setLocation] = useState(() => spotName ?? "");
  const [originalBlob, setOriginalBlob] = useState<Blob | undefined>(undefined);
  const [imageError, setImageError] = useState<string | undefined>(undefined);
  const [imageBusy, setImageBusy] = useState(false);
  const [shareNotice, setShareNotice] = useState<string | undefined>();
  const [shareBusy, setShareBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const previewUrl = useObjectUrl(originalBlob);
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const isHeic = (file: File) =>
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    /\.(heic|heif)$/i.test(file.name);

  const handleImage = useCallback(async (file: File | undefined) => {
    if (!file) return;
    setImageError(undefined);
    setImageBusy(true);
    try {
      let blob: Blob = file;
      if (isHeic(file)) {
        const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
        blob = Array.isArray(converted) ? converted[0] : converted;
      }
      setOriginalBlob(blob);
      try {
        const gps = await exifr.gps(file);
        if (gps?.latitude != null && gps?.longitude != null) {
          const lat = gps.latitude;
          const lng = gps.longitude;
          const str = `${Math.abs(lat).toFixed(5)}°${lat >= 0 ? "N" : "S"}, ${Math.abs(lng).toFixed(5)}°${lng >= 0 ? "E" : "W"}`;
          setLocation((prev) => prev || str);
        }
      } catch { /* kein EXIF — ignorieren */ }
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Bild konnte nicht verarbeitet werden.");
    } finally {
      setImageBusy(false);
    }
  }, []);

  const reset = () => {
    setText("");
    setLocation(spotName ?? "");
    setOriginalBlob(undefined);
    setImageError(undefined);
    setSaved(false);
  };

  const handleCopy = async () => {
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const handleShare = async () => {
    if (!text.trim()) return;
    setShareBusy(true);
    setShareNotice(undefined);
    const res = await shareDraft({
      text: text.trim(),
      location: location || undefined,
      originalBlob,
    });
    setShareBusy(false);
    if (!res.ok && res.reason !== "cancelled") {
      setShareNotice("Teilen fehlgeschlagen — Text wurde stattdessen kopiert.");
      try { await navigator.clipboard.writeText(text.trim()); } catch { /* ignore */ }
      setTimeout(() => setShareNotice(undefined), 4000);
    }
  };

  const handleSave = async () => {
    if (!text.trim()) return;
    setSaveBusy(true);
    try {
      await saveEntry({
        bullets: "",
        text: text.trim(),
        location: location || undefined,
        originalBlob,
        spotId,
      });
      setSaved(true);
    } finally {
      setSaveBusy(false);
    }
  };

  return (
    <div className="p-6 pt-12 pb-12 flex flex-col gap-8">
      <header>
        <h1 className="text-4xl text-foreground">Schreiben</h1>
        <p className="text-sm font-serif italic text-muted-foreground mt-2">Foto + dein Text · Logbuch und WhatsApp.</p>
        {spotName && (
          <div className="mt-3 border border-primary/40 bg-primary/5 px-3 py-2 text-xs text-primary/90 uppercase tracking-widest">
            📍 {spotName}
          </div>
        )}
      </header>

      <div className="space-y-6">

        {/* Foto */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-muted-foreground">Foto (optional)</label>
          {previewUrl ? (
            <div className="relative border border-border/60">
              <img src={previewUrl} alt="" className="w-full h-auto block" />
              <button
                type="button"
                onClick={() => setOriginalBlob(undefined)}
                className="absolute top-2 right-2 p-1.5 bg-background/90 border border-border hover:bg-background"
                aria-label="Foto entfernen"
              >
                <X className="w-3 h-3" />
              </button>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-3 py-2 border-t border-border/60">
                {originalBlob && (originalBlob as File).name ? (originalBlob as File).name : "Foto bereit"}
                {originalBlob && ` · ${formatBytes(originalBlob.size)} (Original)`}
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={imageBusy}
              className="w-full border border-dashed border-border py-8 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors"
            >
              {imageBusy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ImagePlus className="w-5 h-5" strokeWidth={1.5} />
                  <span className="text-[10px] uppercase tracking-widest">Foto wählen</span>
                </>
              )}
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.heic,.heif"
            className="hidden"
            onChange={(e) => void handleImage(e.target.files?.[0])}
          />
          {imageError && <p className="text-xs text-destructive">{imageError}</p>}
        </div>

        {/* Ort */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-muted-foreground">Ort (optional)</label>
          <Input
            placeholder="z.B. Garachico, Nordküste"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="rounded-none border-border bg-transparent focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0"
          />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Pencil className="w-3 h-3" />
            Dein Text
          </label>
          <Textarea
            placeholder="Was du siehst, was du fühlst, was du mitnehmen willst…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[200px] rounded-none border-border focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 bg-transparent resize-y font-serif text-xl leading-relaxed text-foreground"
          />
          <button
            onClick={() => void handleCopy()}
            disabled={!text.trim()}
            className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
          >
            {copied ? (
              <><Check className="w-3 h-3 text-primary" />Kopiert!</>
            ) : (
              <><Copy className="w-3 h-3" />Kopieren</>
            )}
          </button>
        </div>

        {shareNotice && (
          <p className="text-xs text-muted-foreground italic">{shareNotice}</p>
        )}

        {/* Aktionen — beide immer sichtbar */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={() => void handleShare()}
            disabled={shareBusy || !text.trim()}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none font-mono uppercase tracking-widest text-xs h-12 inline-flex items-center justify-center gap-2"
          >
            {shareBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <>
                <Share2 className="w-4 h-4" />
                {originalBlob ? "Foto + Text → WhatsApp" : "Text → WhatsApp"}
              </>
            )}
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={saveBusy || !text.trim()}
            variant="outline"
            className="rounded-none font-mono uppercase tracking-widest text-xs h-12 border-border inline-flex items-center justify-center gap-2"
          >
            {saveBusy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <><Check className="w-4 h-4 text-primary" />Im Logbuch</>
            ) : (
              "Ins Logbuch"
            )}
          </Button>
          <button
            onClick={reset}
            className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground self-center mt-2"
          >
            Verwerfen
          </button>
        </div>
      </div>

    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
