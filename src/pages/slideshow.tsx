import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { X, Play, Pause, ChevronLeft, ChevronRight, Maximize } from "lucide-react";
import { getEntries, getEntryOriginal, type LogbookEntry } from "@/lib/logbuch";

const INTERVAL_MS = 5000;

function formatDayMonth(ts: number): string {
  return new Date(ts).toLocaleDateString("de-DE", { day: "numeric", month: "long" });
}

export default function Slideshow() {
  const [, navigate] = useLocation();
  const [slides, setSlides] = useState<LogbookEntry[]>([]);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [textVisible, setTextVisible] = useState(true);
  const intervalRef = useRef<number | undefined>(undefined);
  const hideTextTimer = useRef<number | undefined>(undefined);
  const rootRef = useRef<HTMLDivElement>(null);

  // Load entries that have a photo
  useEffect(() => {
    const all = getEntries().filter((e) => e.image || e.hasOriginal);
    // Show newest first in slideshow
    setSlides(all);
  }, []);

  // Load best-quality image for current slide
  useEffect(() => {
    const slide = slides[idx];
    if (!slide) { setImageUrl(undefined); return; }
    let cancelled = false;
    setImageUrl(slide.image); // immediate: show thumbnail
    if (slide.hasOriginal) {
      void getEntryOriginal(slide.id).then((blob) => {
        if (cancelled || !blob) return;
        const url = URL.createObjectURL(blob);
        setImageUrl(url);
      });
    }
    return () => { cancelled = true; };
  }, [slides, idx]);

  // Auto-advance
  const advance = useCallback(() => {
    setIdx((i) => (slides.length > 0 ? (i + 1) % slides.length : 0));
    revealText();
  }, [slides.length]);

  useEffect(() => {
    if (!playing || slides.length === 0) return;
    intervalRef.current = window.setInterval(advance, INTERVAL_MS);
    return () => window.clearInterval(intervalRef.current);
  }, [playing, advance, slides.length]);

  // Auto-hide overlay text after 3 s
  const revealText = () => {
    setTextVisible(true);
    window.clearTimeout(hideTextTimer.current);
    hideTextTimer.current = window.setTimeout(() => setTextVisible(false), 3000);
  };

  useEffect(() => { revealText(); }, [idx]);

  // Tap anywhere in center = play/pause, reveal text
  const handleTap = () => {
    setPlaying((p) => !p);
    revealText();
  };

  const prev = () => {
    setIdx((i) => (i === 0 ? slides.length - 1 : i - 1));
    revealText();
  };

  const next = () => {
    setIdx((i) => (i + 1) % slides.length);
    revealText();
  };

  const requestFullscreen = () => {
    try {
      const el = rootRef.current ?? document.documentElement;
      if (el.requestFullscreen) void el.requestFullscreen();
    } catch { /* not available in all contexts */ }
  };

  const handleClose = () => {
    try { if (document.fullscreenElement) void document.exitFullscreen(); } catch { /* ignore */ }
    navigate("/mehr");
  };

  const slide = slides[idx];

  if (slides.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-6 z-[2000]">
        <p className="font-serif italic text-white/60 text-lg">
          Noch keine Fotos im Logbuch.
        </p>
        <button
          onClick={handleClose}
          className="text-[10px] uppercase tracking-widest text-white/50 border border-white/20 px-4 py-3 hover:bg-white/10"
        >
          Zurück
        </button>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="fixed inset-0 bg-black z-[2000] touch-none select-none">
      {/* Background image */}
      {imageUrl && (
        <img
          key={imageUrl}
          src={imageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
          draggable={false}
        />
      )}

      {/* Dark vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

      {/* Tap zone — center */}
      <button
        onClick={handleTap}
        className="absolute inset-0 w-full h-full"
        style={{ background: "transparent" }}
        aria-label="Play / Pause"
      />

      {/* Top bar */}
      <div className={`absolute top-0 inset-x-0 flex items-center justify-between px-5 pt-10 pb-4 transition-opacity duration-500 ${textVisible ? "opacity-100" : "opacity-0"}`}>
        <button onClick={handleClose} className="p-2 rounded-full bg-black/40 text-white/80 hover:bg-black/60">
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <button onClick={requestFullscreen} className="p-2 rounded-full bg-black/40 text-white/80 hover:bg-black/60">
            <Maximize className="w-4 h-4" />
          </button>
          <div className="font-mono text-[10px] uppercase tracking-widest text-white/70 bg-black/40 px-3 py-1.5 rounded-full">
            {idx + 1} / {slides.length}
          </div>
        </div>
      </div>

      {/* Prev / Next */}
      <div className={`absolute inset-y-0 left-0 flex items-center pl-3 transition-opacity duration-500 ${textVisible ? "opacity-100" : "opacity-0"}`}>
        <button onClick={prev} className="p-3 rounded-full bg-black/40 text-white/80 hover:bg-black/60">
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>
      <div className={`absolute inset-y-0 right-0 flex items-center pr-3 transition-opacity duration-500 ${textVisible ? "opacity-100" : "opacity-0"}`}>
        <button onClick={next} className="p-3 rounded-full bg-black/40 text-white/80 hover:bg-black/60">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom caption */}
      {slide && (
        <div className={`absolute bottom-0 inset-x-0 px-6 pb-10 space-y-2 transition-opacity duration-500 ${textVisible ? "opacity-100" : "opacity-0"}`}>
          <p className="font-mono text-[10px] uppercase tracking-widest text-white/60">
            {formatDayMonth(slide.createdAt)}{slide.location ? ` · ${slide.location}` : ""}
          </p>
          {slide.text && (
            <p className="font-serif text-lg text-white leading-snug line-clamp-3">
              {slide.text.slice(0, 200)}
            </p>
          )}
          {/* Progress bar */}
          {playing && (
            <div className="h-0.5 bg-white/20 rounded-full overflow-hidden mt-3">
              <div
                key={`${idx}-${playing}`}
                className="h-full bg-white/70 rounded-full"
                style={{ animation: `slideProgress ${INTERVAL_MS}ms linear forwards` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Play/Pause center indicator (brief) */}
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/50 rounded-full p-5">
            <Pause className="w-8 h-8 text-white/80" />
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideProgress {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );
}
