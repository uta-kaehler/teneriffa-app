import { lichtKommentar } from "@/lib/ohne-ki";
import { useMemo, useState } from "react";
import SunCalc from "suncalc";
import { useQuery } from "@tanstack/react-query";
import { Sunrise, Sunset, Moon, Sun, Footprints, Users, Camera, Sparkles, ChevronDown, ChevronUp, Wind, CloudRain, Loader2, MessageSquare } from "lucide-react";
import { currentLocation } from "@/lib/events";
import { TOUR_IDEEN, type EffortLevel, type LightPhase, type TourIdee } from "@/data/morgen-inspiration";
import { useWeather, weatherAdvisory, type WeatherData } from "@/lib/weather";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(d: Date): string {
  return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

function tomorrow(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(6, 0, 0, 0);
  return d;
}

interface LightForecast {
  sunrise: string;
  morningGold: string;
  goldenEve: string;
  sunset: string;
}

function computeLight(lat: number, lng: number): LightForecast {
  const t = tomorrow();
  const sun = SunCalc.getTimes(t, lat, lng);
  const goldenHour = (sun as unknown as Record<string, Date>)["goldenHour"];
  return {
    sunrise: fmt(sun.sunrise),
    morningGold: fmt(sun.goldenHourEnd),
    goldenEve: goldenHour ? fmt(goldenHour) : "--:--",
    sunset: fmt(sun.sunset),
  };
}

/** Pick N items deterministically for today's date */
function pickForToday<T>(arr: T[], n: number): T[] {
  const seed = Math.floor(Date.now() / 86_400_000);
  const shuffled = [...arr];
  // Fisher-Yates with seed
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = ((seed * (i + 7919)) ^ (i * 6271)) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, n);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const EFFORT_CONFIG: Record<EffortLevel, { label: string; dots: number; hint: string }> = {
  entspannt: { label: "Entspannt", dots: 1, hint: "Sandalen ok" },
  moderat:   { label: "Moderat",   dots: 2, hint: "Festes Schuhwerk" },
  aktiv:     { label: "Aktiv",     dots: 3, hint: "Bergschuhe" },
  anstrengend: { label: "Sportlich", dots: 4, hint: "Fitness nötig" },
};

const LIGHT_CONFIG: Record<LightPhase, { label: string; icon: typeof Sun; color: string }> = {
  sunrise:    { label: "Sonnenaufgang", icon: Sunrise,  color: "text-sun" },
  morning:    { label: "Morgen-Gold",   icon: Sun,      color: "text-sun" },
  "golden-eve": { label: "Abend-Gold", icon: Sunset,   color: "text-gold" },
  "blue-eve": { label: "Blaue Stunde", icon: Moon,     color: "text-primary" },
  midday:     { label: "Mittag",       icon: Sun,      color: "text-foreground" },
  night:      { label: "Astro-Nacht",  icon: Moon,     color: "text-primary" },
};

const TRUBEL_CONFIG: Record<1 | 2 | 3, { label: string; bar: number; color: string }> = {
  1: { label: "Sehr ruhig",  bar: 1, color: "bg-primary" },
  2: { label: "Gemäßigt",    bar: 2, color: "bg-sun" },
  3: { label: "Belebt",      bar: 3, color: "bg-destructive/60" },
};

function EffortBadge({ level }: { level: EffortLevel }) {
  const cfg = EFFORT_CONFIG[level];
  return (
    <div className="flex items-center gap-2">
      <Footprints className="w-3 h-3 text-muted-foreground shrink-0" />
      <div>
        <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Anstrengung</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4].map((i) => (
              <span key={i} className={`w-2 h-2 rounded-sm ${i <= cfg.dots ? "bg-gold" : "bg-border"}`} />
            ))}
          </div>
          <span className="text-xs text-foreground">{cfg.label}</span>
        </div>
        <p className="text-[9px] text-muted-foreground">{cfg.hint}</p>
      </div>
    </div>
  );
}

function LightBadge({ phase, light }: { phase: LightPhase; light: LightForecast }) {
  const cfg = LIGHT_CONFIG[phase];
  const Icon = cfg.icon;

  const timeMap: Record<LightPhase, string> = {
    sunrise:      light.sunrise,
    morning:      light.morningGold,
    "golden-eve": light.goldenEve,
    "blue-eve":   light.sunset,
    midday:       "12:00–14:00",
    night:        "22:00–03:00",
  };

  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-3 h-3 shrink-0 ${cfg.color}`} />
      <div>
        <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Licht morgen</p>
        <p className="text-xs text-foreground mt-0.5">
          <span className={`font-mono font-medium ${cfg.color}`}>{timeMap[phase]}</span>
          {" "}· {cfg.label}
        </p>
      </div>
    </div>
  );
}

function TrubelBadge({ level, note }: { level: 1 | 2 | 3; note: string }) {
  const cfg = TRUBEL_CONFIG[level];
  return (
    <div className="flex items-center gap-2">
      <Users className="w-3 h-3 text-muted-foreground shrink-0" />
      <div>
        <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Trubel-Faktor</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className="flex gap-0.5">
            {[1, 2, 3].map((i) => (
              <span key={i} className={`w-2 h-2 rounded-sm ${i <= level ? cfg.color : "bg-border"}`} />
            ))}
          </div>
          <span className="text-xs text-foreground">{cfg.label}</span>
        </div>
        <p className="text-[9px] text-muted-foreground leading-tight">{note}</p>
      </div>
    </div>
  );
}

function IdeaCard({ idea, light, idx }: { idea: TourIdee; light: LightForecast; idx: number }) {
  const [expanded, setExpanded] = useState(false);
  const num = ["①", "②", "③"][idx] ?? "·";

  return (
    <article className="border border-border/70 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-4 pt-4 pb-3 flex items-start justify-between gap-3"
      >
        <div className="flex items-start gap-3 min-w-0">
          <span className="font-mono text-sm text-primary shrink-0 mt-0.5">{num}</span>
          <div className="min-w-0">
            <h3 className="text-base font-serif text-foreground leading-tight">{idea.title}</h3>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1 leading-snug">{idea.subtitle}</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
        )}
      </button>

      {/* Quick pills always visible */}
      <div className="px-4 pb-3 flex flex-wrap gap-3">
        {/* Effort mini-pill */}
        <span className={`text-[9px] uppercase tracking-widest border px-2 py-0.5 ${
          idea.effort === "entspannt" ? "border-primary/50 text-primary" :
          idea.effort === "moderat"   ? "border-sun/50 text-sun" :
          idea.effort === "aktiv"     ? "border-gold/50 text-gold" :
                                        "border-destructive/50 text-destructive"
        }`}>
          {EFFORT_CONFIG[idea.effort].label}
        </span>
        <span className="text-[9px] uppercase tracking-widest border border-border/50 text-muted-foreground px-2 py-0.5">
          {LIGHT_CONFIG[idea.bestLight].label}
        </span>
        <span className="text-[9px] uppercase tracking-widest border border-border/50 text-muted-foreground px-2 py-0.5">
          {TRUBEL_CONFIG[idea.trubel].label}
        </span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border/50 px-4 py-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 gap-4">
            <EffortBadge level={idea.effort} />
            <LightBadge phase={idea.bestLight} light={light} />
            <TrubelBadge level={idea.trubel} note={idea.trubelNote} />
          </div>
          {/* Light note */}
          <p className="text-xs text-foreground/85 leading-relaxed border-l-2 border-sun/50 pl-3">
            {idea.lightNote}
          </p>
          {/* Camera hint */}
          <div className="flex items-start gap-2 bg-muted/20 px-3 py-2">
            <Camera className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground leading-relaxed">{idea.cameraHint}</p>
          </div>
          {/* Effort hint */}
          <p className="text-[9px] text-muted-foreground leading-relaxed">{idea.effortHint}</p>
        </div>
      )}
    </article>
  );
}

// ─── Claude light-comment hook ────────────────────────────────────────────────

interface LightCommentParams {
  goldenHourEveningStart: string;
  sunset: string;
  uvIndex?: number;
  locationName: string;
  timeNow: string;
  enabled: boolean;
}

function useLightComment({ goldenHourEveningStart, sunset, uvIndex, locationName, timeNow, enabled }: LightCommentParams) {
  const today = new Date().toISOString().slice(0, 10);
  return useQuery({
    queryKey: ["light-comment", today, locationName, goldenHourEveningStart],
    queryFn: async () => {
      void locationName;
      return lichtKommentar({ goldenHourEveningStart, sunset, uvIndex, timeNow });
    },
    enabled,
    staleTime: 60 * 60 * 1000, // 1 h — one comment per hour max
    retry: 1,
  });
}

// ─── Weather helpers ──────────────────────────────────────────────────────────

function ideaWeatherScore(idea: TourIdee, w: WeatherData): number {
  let s = 0;
  if (w.isRainy) {
    if (idea.effort === "entspannt") s += 2;
    if (idea.effort === "aktiv" || idea.effort === "anstrengend") s -= 3;
    if (idea.bestLight === "morning" || idea.bestLight === "sunrise" || idea.bestLight === "golden-eve") s -= 2;
    if (idea.bestLight === "midday" || idea.bestLight === "night") s += 1;
  } else if (w.isSunny) {
    if (idea.bestLight === "golden-eve" || idea.bestLight === "sunrise" || idea.bestLight === "morning") s += 2;
    if (idea.effort === "aktiv") s += 1;
  } else if (w.isCloudy) {
    if (idea.effort === "entspannt") s += 1;
    if (idea.bestLight === "morning") s += 1;
  }
  if (w.isWindy && (idea.effort === "aktiv" || idea.effort === "anstrengend")) s -= 1;
  return s;
}

function weatherPickForToday(pool: TourIdee[], w: WeatherData | undefined): TourIdee[] {
  if (!w) return pickForToday(pool, 3);
  const scored = pool
    .map((idea) => ({ idea, score: ideaWeatherScore(idea, w) }))
    .sort((a, b) => b.score - a.score);
  const good = scored.filter((x) => x.score >= 0).map((x) => x.idea);
  const bad  = scored.filter((x) => x.score < 0).map((x) => x.idea);
  return [...pickForToday(good, Math.min(3, good.length)), ...pickForToday(bad, Math.max(0, 3 - good.length))].slice(0, 3);
}

function WeatherMiniStrip({ w }: { w: WeatherData }) {
  return (
    <div className="grid grid-cols-4 gap-1 bg-muted/20 px-3 py-2.5">
      <div className="col-span-2 flex flex-col items-center gap-1 text-center">
        <span className="text-xl leading-none">{w.emoji}</span>
        <span className="text-[9px] uppercase tracking-widest text-muted-foreground leading-tight">{w.condition}</span>
      </div>
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="font-mono text-base text-foreground leading-none">{w.temp}°</span>
        <span className="text-[9px] uppercase tracking-widest text-muted-foreground leading-tight">Temp</span>
      </div>
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="font-mono text-xs text-foreground leading-none">{w.windSpeed}</span>
        <span className="text-[9px] uppercase tracking-widest text-muted-foreground leading-tight">km/h</span>
      </div>
    </div>
  );
}

// ─── Main panel ──────────────────────────────────────────────────────────────

export function MorgenInspiration() {
  const [open, setOpen] = useState(false);

  const loc = currentLocation();
  const light = useMemo(() => computeLight(loc.lat, loc.lng), [loc.lat, loc.lng]);
  const { data: weather, isLoading: weatherLoading } = useWeather(loc.lat, loc.lng);

  const timeNow = useMemo(() =>
    new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }), []);

  const { data: claudeComment, isFetching: commentLoading } = useLightComment({
    goldenHourEveningStart: light.goldenEve,
    sunset: light.sunset,
    uvIndex: weather?.uvIndex,
    locationName: loc.label,
    timeNow,
    enabled: open,
  });

  const pool = useMemo(() => {
    const week = loc.id === "los-realejos" ? 1 : 2;
    return TOUR_IDEEN.filter((t) => t.week === week || t.week === "both");
  }, [loc.id]);

  const picks = useMemo(() => weatherPickForToday(pool, weather), [pool, weather]);

  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
  }, []);

  return (
    <section className="border border-border/60">
      {/* Toggle header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-gold" />
          <div>
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Was machen wir morgen?</p>
            <h2 className="text-base text-foreground font-serif">Morgen-Inspiration</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground hidden sm:block">
            {tomorrow}
          </span>
          {open ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-border/50 p-4 space-y-3 animate-in slide-in-from-top-2 duration-300">
          {/* Weather strip */}
          {weatherLoading && (
            <div className="flex items-center gap-2 text-muted-foreground py-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="text-[10px] uppercase tracking-widest">Wetter lädt…</span>
            </div>
          )}
          {weather && (
            <div className="space-y-1.5">
              <WeatherMiniStrip w={weather} />
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground border-l border-primary/50 pl-2">
                {weatherAdvisory(weather)}
              </p>
            </div>
          )}

          {/* Light overview strip */}
          <div className="grid grid-cols-4 gap-1 bg-muted/20 px-3 py-2.5">
            {[
              { label: "Aufgang",  val: light.sunrise,    icon: Sunrise },
              { label: "Morg.-Gold", val: light.morningGold, icon: Sun },
              { label: "Abd.-Gold", val: light.goldenEve,  icon: Sunset },
              { label: "Sonnen-U.",val: light.sunset,     icon: Sunset },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex flex-col items-center gap-1 text-center">
                  <Icon className="w-3 h-3 text-gold" />
                  <span className="text-[9px] uppercase tracking-widest text-muted-foreground leading-tight">{item.label}</span>
                  <span className="text-[10px] font-mono text-foreground">{item.val}</span>
                </div>
              );
            })}
          </div>

          {/* Claude light comment */}
          {commentLoading && (
            <div className="flex items-center gap-2 text-muted-foreground py-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="text-[10px] uppercase tracking-widest">Licht wird gelesen…</span>
            </div>
          )}
          {claudeComment && !commentLoading && (
            <div className="flex items-start gap-2.5 bg-muted/20 border-l-2 border-primary/60 px-3 py-2.5">
              <MessageSquare className="w-3 h-3 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-foreground/90 leading-relaxed font-serif italic">{claudeComment}</p>
            </div>
          )}

          <p className="text-xs text-muted-foreground px-1">
            Drei Vorschläge für {tomorrow} — tippe einen an für Details.
          </p>

          {picks.map((idea, i) => (
            <IdeaCard key={idea.id} idea={idea} light={light} idx={i} />
          ))}

          <p className="text-[9px] text-muted-foreground text-center pt-1">
            Morgen früh neu generiert · Standort: {loc.label}
          </p>
        </div>
      )}
    </section>
  );
}
