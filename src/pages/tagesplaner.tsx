import { useMemo } from "react";
import { Link } from "wouter";
import SunCalc from "suncalc";
import { MapPin, Footprints, Camera, Wind, CloudRain, Sun, Sunset, Utensils, Loader2, RefreshCw, Car } from "lucide-react";
import { currentLocation } from "@/lib/events";
import { useWeather, weatherAdvisory, type WeatherData } from "@/lib/weather";
import { SPOTS, type Spot, type SpotCategory } from "@/data/spots";
import { getVisitedIds } from "@/lib/visited";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function haversineKm(la1: number, ln1: number, la2: number, ln2: number): number {
  const R = 6371;
  const dLat = ((la2 - la1) * Math.PI) / 180;
  const dLng = ((ln2 - ln1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((la1 * Math.PI) / 180) * Math.cos((la2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Rough drive-time estimate for Tenerife mountain roads.
 * Road distance ≈ crow-flies × 1.75 (winding terrain).
 * Avg speed ≈ 45 km/h.
 */
function driveTimeMin(baseLat: number, baseLng: number, spotLat: number, spotLng: number): number {
  const flyKm = haversineKm(baseLat, baseLng, spotLat, spotLng);
  return Math.max(2, Math.round((flyKm * 1.75) / 45 * 60));
}

function fmtDrive(min: number): string {
  if (min < 60) return `ca. ${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `ca. ${h} h ${m} min` : `ca. ${h} h`;
}

function fmtTime(d: Date): string {
  return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

type SlotId = "morgen" | "mittag" | "golden";

interface SlotDef {
  id: SlotId;
  label: string;
  icon: typeof Sun;
  preferredCats: SpotCategory[];
  preferredLight: string[];
}

function scoreSpot(
  spot: Spot,
  slot: SlotId,
  weather: WeatherData,
  visitedIds: Set<string>,
  baseLat: number,
  baseLng: number,
  isWeek2: boolean,
): number {
  if (spot.week2Only && !isWeek2) return -9999;

  let score = 0;

  // Distance from base (closer = better, max penalty -12)
  const distKm = haversineKm(baseLat, baseLng, spot.lat, spot.lng);
  score -= Math.min(distKm * 0.4, 12);

  // Slot preference
  if (slot === "morgen") {
    if (spot.bestLight?.includes("sunrise") || spot.bestLight?.includes("morning")) score += 4;
    if (spot.category === "fotospot" || spot.category === "lebendig") score += 2;
    if (spot.category === "guachinche") score -= 3; // geschlossen morgens
  }
  if (slot === "mittag") {
    if (spot.category === "guachinche" || spot.category === "laden" || spot.category === "markt") score += 5;
    if (spot.category === "fotospot") score -= 2; // hartes Mittagslicht
  }
  if (slot === "golden") {
    if (spot.bestLight?.includes("golden")) score += 5;
    if (spot.category === "fotospot" || spot.category === "lebendig") score += 3;
    if (spot.category === "guachinche") score -= 1;
  }

  // Weather
  if (weather.isRainy) {
    if (spot.category === "guachinche" || spot.category === "laden") score += 6;
    if (spot.category === "fotospot") score -= 5;
    if ((spot.effort?.elevationM ?? 0) > 100) score -= 3;
  } else if (weather.isSunny) {
    if (spot.category === "fotospot" || spot.category === "lebendig") score += 3;
    if (spot.bestLight?.includes("golden") || spot.bestLight?.includes("morning")) score += 2;
  } else if (weather.isCloudy) {
    if (spot.category === "guachinche") score += 2;
  }

  if (weather.isWindy) {
    const cautionTxt = (spot.cautions ?? []).join(" ").toLowerCase();
    if (cautionTxt.includes("wind") || cautionTxt.includes("klippe")) score -= 3;
  }

  // Unvisited bonus
  if (!visitedIds.has(spot.id)) score += 3;

  return score;
}

function pickBestForSlot(
  slot: SlotId,
  weather: WeatherData,
  visitedIds: Set<string>,
  baseLat: number,
  baseLng: number,
  isWeek2: boolean,
  excludeIds: Set<string>,
): Spot | undefined {
  return SPOTS
    .filter((s) => !excludeIds.has(s.id))
    .map((s) => ({ spot: s, score: scoreSpot(s, slot, weather, visitedIds, baseLat, baseLng, isWeek2) }))
    .filter((x) => x.score > -9000)
    .sort((a, b) => b.score - a.score)[0]?.spot;
}

// ─── UI sub-components ────────────────────────────────────────────────────────

const CAT_LABEL: Record<SpotCategory, string> = {
  guachinche: "Guachinche",
  markt: "Markt",
  laden: "Laden",
  fotospot: "Fotospot",
  lebendig: "Lebendiger Ort",
};

const CAT_COLOR: Record<SpotCategory, string> = {
  guachinche: "text-primary border-primary/50",
  markt: "text-sun border-sun/50",
  laden: "text-muted-foreground border-border",
  fotospot: "text-gold border-gold/50",
  lebendig: "text-primary border-primary/50",
};

const SLOT_DEFS: SlotDef[] = [
  { id: "morgen",  label: "Morgen",           icon: Sun,      preferredCats: ["fotospot","lebendig"],          preferredLight: ["sunrise","morning"]    },
  { id: "mittag",  label: "Mittag & Rast",    icon: Utensils, preferredCats: ["guachinche","markt","laden"],   preferredLight: ["midday"]               },
  { id: "golden",  label: "Goldene Stunde",   icon: Sunset,   preferredCats: ["fotospot","lebendig"],          preferredLight: ["golden"]               },
];

function WeatherCard({ w }: { w: WeatherData }) {
  return (
    <div className="border border-border/60 bg-muted/10 px-5 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl leading-none">{w.emoji}</span>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{w.condition}</p>
            <p className="font-mono text-2xl text-foreground leading-tight">{w.temp}°C</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Wind className="w-3 h-3" />
            <span className="font-mono text-xs">{w.windSpeed} km/h</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <CloudRain className="w-3 h-3" />
            <span className="font-mono text-xs">{w.cloudCover} % Bedeckung</span>
          </div>
        </div>
      </div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground border-l-2 border-primary/50 pl-3">
        {weatherAdvisory(w)}
      </p>
    </div>
  );
}

function SpotCard({
  slot,
  spot,
  goldenTime,
  baseLat,
  baseLng,
}: {
  slot: SlotDef;
  spot: Spot;
  goldenTime: string;
  baseLat: number;
  baseLng: number;
}) {
  const Icon = slot.icon;
  const timeLabel =
    slot.id === "morgen"  ? "07:00 – 10:00" :
    slot.id === "mittag"  ? "11:00 – 15:00" :
                             goldenTime;
  const driveMin = driveTimeMin(baseLat, baseLng, spot.lat, spot.lng);

  return (
    <article className="border border-border/60 overflow-hidden">
      {/* Slot header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/10 border-b border-border/40">
        <Icon className="w-4 h-4 text-gold shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground">{slot.label}</p>
          <p className="font-mono text-[10px] text-foreground/70">{timeLabel}</p>
        </div>
        {/* Drive time badge */}
        <div className="flex items-center gap-1 text-muted-foreground shrink-0">
          <Car className="w-3 h-3" />
          <span className="font-mono text-[9px]">{fmtDrive(driveMin)}</span>
        </div>
      </div>

      {/* Spot info */}
      <div className="px-4 py-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-serif text-base text-foreground leading-tight">{spot.name}</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">{spot.area}</p>
          </div>
          <span className={`text-[9px] uppercase tracking-widest border px-2 py-0.5 shrink-0 ${CAT_COLOR[spot.category]}`}>
            {CAT_LABEL[spot.category]}
          </span>
        </div>

        <p className="text-xs text-foreground/80 leading-relaxed line-clamp-3">{spot.blurb}</p>

        <div className="flex flex-wrap gap-3">
          {spot.effort && (
            <div className="flex items-center gap-1.5">
              <Footprints className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">
                {spot.effort.steps.toLocaleString("de-DE")} Schritte · {spot.effort.elevationM} Hm
              </span>
            </div>
          )}
          {spot.cameraSetup && (
            <div className="flex items-center gap-1.5">
              <Camera className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">
                {spot.cameraSetup.mode} · {spot.cameraSetup.zoom ?? "1x"}
              </span>
            </div>
          )}
          {spot.tip && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground line-clamp-1">{spot.tip}</span>
            </div>
          )}
        </div>

        {/* Link to map */}
        <Link
          href={`/?spot=${spot.id}`}
          className="block text-center text-[10px] uppercase tracking-widest text-primary border border-primary/40 py-2 hover:bg-primary/10 transition-colors"
        >
          Auf Karte anzeigen
        </Link>
      </div>
    </article>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function Tagesplaner() {
  const loc = currentLocation();
  const isWeek2 = loc.id === "los-gigantes";

  const { data: weather, isLoading, isError, refetch } = useWeather(loc.lat, loc.lng);

  const today = useMemo(() => {
    return new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
  }, []);

  const goldenHourTime = useMemo(() => {
    const sun = SunCalc.getTimes(new Date(), loc.lat, loc.lng);
    const gh = (sun as unknown as Record<string, Date>)["goldenHour"];
    const sunset = sun.sunset;
    if (!gh) return "18:00 – Sonnenuntergang";
    return `${fmtTime(gh)} – ${fmtTime(sunset)}`;
  }, [loc.lat, loc.lng]);

  const route = useMemo(() => {
    if (!weather) return null;
    const visitedIds = getVisitedIds();
    const used = new Set<string>();
    const result: Array<{ slot: SlotDef; spot: Spot }> = [];

    for (const slot of SLOT_DEFS) {
      const spot = pickBestForSlot(slot.id, weather, visitedIds, loc.lat, loc.lng, isWeek2, used);
      if (spot) {
        used.add(spot.id);
        result.push({ slot, spot });
      }
    }
    return result;
  }, [weather, loc.lat, loc.lng, isWeek2]);

  return (
    <div className="p-6 pt-12 pb-24 space-y-6">
      <header className="space-y-1">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {today}
        </p>
        <h1 className="font-serif text-2xl text-foreground">Tagesplaner</h1>
        <p className="text-sm text-muted-foreground/80 italic">
          Wetterbasierte Route — drei Spots, optimal getaktet.
        </p>
        <div className="pt-1 border-l-2 border-primary/40 pl-3">
          <p className="text-[10px] uppercase tracking-widest text-primary">{loc.accommodation}</p>
          <p className="text-[9px] text-muted-foreground leading-snug">{loc.address}</p>
        </div>
      </header>

      {/* Weather */}
      {isLoading && (
        <div className="flex items-center gap-3 text-muted-foreground py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs">Wetterdaten laden…</span>
        </div>
      )}

      {isError && (
        <div className="border border-border/50 px-4 py-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Wetter nicht verfügbar — Offline?</p>
          <button onClick={() => void refetch()} className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-primary">
            <RefreshCw className="w-3 h-3" /> Nochmal
          </button>
        </div>
      )}

      {weather && <WeatherCard w={weather} />}

      {/* Route */}
      {weather && route && route.length > 0 && (
        <div className="space-y-4">
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground">
            Vorgeschlagene Route — {route.length} Stops
          </p>
          {route.map(({ slot, spot }) => (
            <SpotCard key={slot.id} slot={slot} spot={spot} goldenTime={goldenHourTime} baseLat={loc.lat} baseLng={loc.lng} />
          ))}
        </div>
      )}

      {weather && (!route || route.length === 0) && (
        <p className="text-sm text-muted-foreground italic">
          Keine passenden Spots für die aktuellen Bedingungen gefunden.
        </p>
      )}

      <p className="text-[9px] text-muted-foreground text-center pt-2">
        Aktualisiert alle 15 min · Wetterdaten: Open-Meteo
      </p>
    </div>
  );
}
