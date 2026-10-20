import { useEffect, useState } from "react";
import { getVisitedAll, subscribeVisited } from "@/lib/visited";
import { SPOTS } from "@/data/spots";
import { useGetLightDay, useListLocations } from "@/lib/lokal-api";
import { getCurrentLocationContext, formatTabularTime, getDayLabel, getTripDay } from "@/lib/location-helper";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow, isAfter } from "date-fns";
import { de } from "date-fns/locale";
import { ExternalLink, X } from "lucide-react";

// Ortsnotizen: Kommt man an einem dieser Orte an (GPS oder auf der Karte als besucht markiert),
// erscheint hier ein kurzer Hinweis zum Ort. Im Original standen an dieser Stelle persönliche Notizen.
const SPOT_NOTES: Record<string, string> = {
  "f-drago": "Der Drachenbaum bildet keine Jahresringe. Wie alt er ist, lässt sich nur schätzen. Ein guter Ort, um einmal nicht zu zählen.",
  "f-roques-garcia": "Je tiefer die Sonne steht, desto länger werden die Schatten der Felsen über der Ebene. Wer bis zum späten Nachmittag bleibt, sieht die Landschaft zweimal.",
  "p-masca": "Die Häuser sitzen auf dem Grat, die Schlucht fällt bis zum Meer ab. Ein paar Schritte weitergehen und dann zurückschauen.",
  "f-punta-teno": "Hinter dem Leuchtturm kommt nur noch Atlantik. Bei klarer Sicht liegt La Gomera am Horizont.",
  "f-benijo": "Die Felsen stehen draußen im Wasser. Bei Ebbe reicht der Strand weit hinaus, und gegen Abend wird es hier still.",
  "p-los-gigantes-hafen": "Von der Hafenmauer aus wirken die Klippen fast senkrecht. Wie hoch sie wirklich sind, zeigt sich erst vom Wasser aus.",
};
const SPOT_NOTE_HOURS = 12;

function SpotNote() {
  const [, setTick] = useState(0);
  useEffect(() => subscribeVisited(() => setTick((t) => t + 1)), []);
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("tenerife-spot-notes-seen") || "[]")); } catch { return new Set(); }
  });

  const recent = getVisitedAll()
    .filter((v) => SPOT_NOTES[v.spotId] && !dismissed.has(v.spotId) && Date.now() - v.visitedAt < SPOT_NOTE_HOURS * 3_600_000)
    .sort((a, b) => b.visitedAt - a.visitedAt)[0];
  if (!recent) return null;
  const spot = SPOTS.find((s) => s.id === recent.spotId);

  const dismiss = () => {
    const next = new Set(dismissed).add(recent.spotId);
    try { localStorage.setItem("tenerife-spot-notes-seen", JSON.stringify([...next])); } catch { /* egal */ }
    setDismissed(next);
  };

  return (
    <div className="border border-border/60 px-4 py-4 space-y-2 relative">
      <button
        onClick={dismiss}
        aria-label="Schließen"
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
      <p className="text-[10px] uppercase tracking-widest text-gold pr-6">Ortsnotiz · {spot?.name ?? "angekommen"}</p>
      <p className="text-sm font-serif italic leading-relaxed text-foreground/85 pr-6">
        {SPOT_NOTES[recent.spotId]}
      </p>
    </div>
  );
}

const AEMET_URLS: Record<string, { label: string; url: string }> = {
  "los-realejos": {
    label: "AEMET — Los Realejos",
    url: "https://www.aemet.es/es/eltiempo/prediccion/municipios/realejos-los-id38031",
  },
  "los-gigantes": {
    label: "AEMET — Santiago del Teide / Los Gigantes",
    url: "https://www.aemet.es/es/eltiempo/prediccion/municipios/santiago-del-teide-id38040",
  },
};
const AEMET_FALLBACK = {
  label: "AEMET — Teneriffa",
  url: "https://www.aemet.es/es/eltiempo/prediccion/playas/tenerife",
};

export default function Dashboard() {
  const ctx = getCurrentLocationContext();
  const { data: locations, isLoading: locLoading } = useListLocations();
  const { data: lightDay, isLoading: lightLoading } = useGetLightDay(ctx.locationId, ctx.date);

  const location = locations?.find(l => l.id === ctx.locationId);

  if (locLoading || lightLoading) {
    return (
      <div className="p-6 pt-12 space-y-8 animate-pulse">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!location || !lightDay) return null;

  // Find next golden hour
  const now = new Date();
  let nextEvent = null;
  let eventName = "";

  const morningGoldenHour = new Date(lightDay.goldenHourMorningEnd);
  const eveningGoldenHour = new Date(lightDay.goldenHourEveningStart);

  if (isAfter(morningGoldenHour, now)) {
    nextEvent = morningGoldenHour;
    eventName = "Ende der goldenen Stunde (Morgen)";
  } else if (isAfter(eveningGoldenHour, now)) {
    nextEvent = eveningGoldenHour;
    eventName = "Beginn der goldenen Stunde (Abend)";
  }

  return (
    <div className="p-6 pt-12 pb-12 flex flex-col gap-10">
      {ctx.isSimulated && (
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground border border-border/50 px-3 py-1 self-start">
          Ausserhalb des Reisezeitraums — Zeige {getDayLabel(ctx.date)}
        </div>
      )}

      <header className="space-y-2">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-4xl text-foreground">{location.name}</h1>
          {(() => {
            const trip = getTripDay();
            if (!trip) return null;
            return (
              <span className="font-mono text-[10px] uppercase tracking-widest text-gold shrink-0">
                Tag {trip.day} / {trip.total}
              </span>
            );
          })()}
        </div>
        <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">{getDayLabel(ctx.date)}</p>
      </header>

      <SpotNote />

      <section className="space-y-4">
        <p className="text-sm leading-relaxed text-foreground/80 font-serif italic text-lg">
          {location.blurb}
        </p>
      </section>

      {nextEvent && (
        <section className="border border-border/60 p-5 space-y-2">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground">Anstehend</h2>
          <div className="flex justify-between items-end gap-4">
            <p className="text-sm text-foreground">{eventName}</p>
            <p className="font-mono text-foreground text-sm">
              {formatDistanceToNow(nextEvent, { locale: de, addSuffix: true })}
            </p>
          </div>
        </section>
      )}

      <section className="space-y-6">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-2">Lichtverlauf</h2>

        <div className="relative pt-6 pb-2 overflow-x-auto hide-scrollbar flex gap-6">
          <div className="absolute top-8 left-0 right-0 h-[1px] bg-border/50" />
          <TimelineItem time={lightDay.dawn} label="Dämmerung" />
          <TimelineItem time={lightDay.sunrise} label="Aufgang" variant="sun" />
          <TimelineItem time={lightDay.goldenHourMorningEnd} label="Morgen-Gold" variant="emphasis" />
          <TimelineItem time={lightDay.solarNoon} label="Zenit" />
          <TimelineItem time={lightDay.goldenHourEveningStart} label="Abend-Gold" variant="emphasis" />
          <TimelineItem time={lightDay.sunset} label="Untergang" variant="sun" />
          <TimelineItem time={lightDay.dusk} label="Dämmerung" />
        </div>
      </section>

      <section className="pt-2">
        {(() => {
          const aemet = AEMET_URLS[ctx.locationId] ?? AEMET_FALLBACK;
          return (
            <a
              href={aemet.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground border-b border-border/50 hover:border-foreground pb-0.5"
            >
              <span>Wetter — {aemet.label}</span>
              <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
            </a>
          );
        })()}
      </section>
    </div>
  );
}

function TimelineItem({
  time,
  label,
  variant = "default",
}: {
  time: string;
  label: string;
  variant?: "default" | "emphasis" | "sun";
}) {
  const t = formatTabularTime(time);
  const isSun = variant === "sun";
  const isEmphasis = variant === "emphasis";

  const dotClass = isSun
    ? "bg-sun"
    : isEmphasis
      ? "bg-foreground"
      : "bg-border group-hover:bg-foreground";

  const labelClass = isSun
    ? "text-sun font-medium"
    : isEmphasis
      ? "text-foreground font-medium"
      : "text-muted-foreground group-hover:text-foreground";

  const timeClass = isSun ? "text-sun font-medium" : "text-foreground";

  return (
    <div className="relative flex flex-col items-center justify-start group min-w-[70px]">
      <div className={`absolute top-[6px] w-2 h-2 rounded-full border border-background transition-colors z-10 ${dotClass}`} />
      <span className={`mt-6 text-[10px] uppercase tracking-widest text-center ${labelClass}`}>{label}</span>
      <span className={`font-mono text-sm mt-1 ${timeClass}`}>{t}</span>
    </div>
  );
}
