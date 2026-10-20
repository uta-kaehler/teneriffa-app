import SunCalc from "suncalc";
import type { ScheduledEvent } from "@/lib/notifications";

export interface LocationCtx {
  id: "los-realejos" | "los-gigantes";
  label: string;
  /** Bezugspunkt für Fahrzeiten (öffentliche Fassung: Ortsmitte) */
  lat: number;
  lng: number;
  accommodation: string;
  address: string;
}

export const LOCATIONS: Record<LocationCtx["id"], LocationCtx> = {
  // Öffentliche Fassung: Ortsmitte statt Unterkunft
  "los-realejos": {
    id: "los-realejos",
    label: "Los Realejos",
    lat: 28.3686,
    lng: -16.5847,
    accommodation: "Unterkunft in Los Realejos",
    address: "Los Realejos",
  },
  "los-gigantes": {
    id: "los-gigantes",
    label: "Los Gigantes",
    lat: 28.2466,
    lng: -16.8423,
    accommodation: "Unterkunft in Los Gigantes",
    address: "Los Gigantes",
  },
};

const TRIP_START  = new Date(2027, 4, 30); // Beispielreise
const SWITCH_DATE = new Date(2027, 5,  6); // Wechsel nach Los Gigantes
const TRIP_END    = new Date(2027, 5, 13);

export function currentLocation(now: Date = new Date()): LocationCtx {
  return now < SWITCH_DATE ? LOCATIONS["los-realejos"] : LOCATIONS["los-gigantes"];
}

function inTrip(d: Date): boolean {
  return d >= TRIP_START && d <= TRIP_END;
}

function locFor(d: Date): LocationCtx {
  return d < SWITCH_DATE ? LOCATIONS["los-realejos"] : LOCATIONS["los-gigantes"];
}

function dateAt(base: Date, h: number, m = 0): Date {
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}

function weekOfTrip(d: Date): number {
  return Math.floor((d.getTime() - TRIP_START.getTime()) / (7 * 86_400_000));
}

function formatHm(d: Date): string {
  return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

// ─── WOCHE 1: Nord / Los Realejos ──────────────────────────────────────────
const GOLDEN_W1: string[] = [
  "Jetzt. Anaga-Lorbeerwald, Mirador del Bailadero, 0.6x, EV −0.7. Das Licht wartet nicht auf dich — aber heute kommt es dir entgegen.",
  "Der Drago Milenario steht seit tausend Jahren. Das Licht gerade: 30 Minuten. Plaza San Marcos, 0.6x. Du weißt, was zu tun ist.",
  "Bodegas Monje, Terrasse, Atlantik. Das Licht fällt schräg von links — EV −0.3, Expert RAW. Den Wein kannst du danach trinken.",
  "Charco del Viento: Lava trifft Wasser trifft goldenes Licht. Langzeitbelichtung. Ein Stein als Stativ reicht. Du hast den Blick.",
  "Puerto de la Cruz leuchtet. Drei Schichten: Brandung, Klippen, Himmel. 0.6x. Kein Filter nötig — das ist das Original.",
  "Garachico, Mirador El Tanque. Schwarzes Lavafeld, weißes Städtchen, der Himmel orange. 0.6x, EV −1.0. Klassiker — weil er stimmt.",
  "La Laguna, goldene Stunde in den Gassen. 3x, diskret. Die langen Schatten machen die Hälfte des Bildes — lass sie.",
  "Punta de Teno glüht gerade. Letzter Leuchtturm, letztes Licht. Wenn du dort bist: 10x für La Gomera. Wenn nicht: morgen früher losfahren.",
];

// ─── WOCHE 2: West / Los Gigantes ──────────────────────────────────────────
const GOLDEN_W2: string[] = [
  "500 Meter Basalt in Flammen. Mirador Archipenque, 0.6x, EV −1.0, Weißabgleich Tageslicht. Die Klippen brennen nur kurz.",
  "Playa de la Arena: schwarzer Sand, goldenes Wasser. 1x, EV −0.7. Die Wellen kommen zuverlässig. Du weißt, wo du stehst.",
  "Masca kurz vor Dunkelheit. Licht fällt schräg in die Schlucht — 0.6x für den Überblick, 3x für das, was dazwischen liegt.",
  "Hafen Los Gigantes, letzte Fischer. Boote im Gegenlicht, Klippen als Kulisse. 3x, EV 0. Ruhige Hand. Du hast sie.",
  "Playa de Santiago, Abendlicht auf weißen Häusern. Selten besucht. Kein Zufall, dass das beste Licht auch die ruhigsten Orte findet.",
  "Buenavista del Norte, Atlantikblick, Licht von rechts. Danach El Aderno — warme Truchas de batata. Erst das Bild, dann das Essen.",
  "Los Gigantes-Hafen, leere Whale-Watching-Boote im Abendrot. Das Bild braucht dich — es macht sich nicht alleine.",
  "Teno-Hochplateau, Ende der Welt, Abendrot. Karge Trockenwälder, Schafe, kein Mensch. 1x, keine EV-Korrektur. Das Licht weiß es selbst.",
];

// ─── ASTRO / TEIDE ──────────────────────────────────────────────────────────
const ASTRO: string[] = [
  "Kein Mond. Der Teide hat 35 % weniger Atmosphäre als du unten — die Milchstraße braucht kein Teleskop. ISO 2500, 25 s, Polarjacke. Und: der Orion steht hier auf dem Kopf.",
  "Nachthimmel-Fenster offen. El Portillo oder Parador — beide außerhalb jeder Lichtkuppel. Was du heute Nacht siehst, haben die meisten Menschen nie gesehen.",
  "Mond schläft schon. Sterne nicht. Expert RAW zeigt die Wahrheit. Nacht-Modus zeigt die Umrisse. Du entscheidest, was du willst.",
  "Astro-Bedingungen heute: sehr gut. Der Teide als Silhouette gegen Sternenstaub — 0.6x, ISO 3200, 20–25 s. Kein Rauschen bitte. Die Stille macht den Rest.",
  "Dunkle Nacht über dem Nationalpark. Tagsüber war er Vulkan. Jetzt ist er Observatory. ISO hoch, Hände in die Taschen, Augen offen.",
  "Mondsichel schläft. Roques de García als Vordergrund, Milchstraße als Hintergrund, 22:30 als Zeitpunkt. Du hast den Blick — und jetzt auch das Fenster.",
];

// ─── WALBEOBACHTUNG ─────────────────────────────────────────────────────────
const WHALE: string[] = [
  "Morgen früh, ruhige See, Kurzflossen-Grindwale vor Los Gigantes. Hafen, Steg 2, Tickets vor Ort. 10x, Burst-Modus. Das Schweigen vor dem Auftauchen ist das Beste daran.",
  "Die Wale haben keinen Kalender. Aber einen Rhythmus — morgens, ruhige See, Westküste. Du weißt, was das bedeutet.",
  "Riesendelfin-Pod heute wahrscheinlich. Nicht übertreiben mit dem Zoom auf dem schwankenden Boot. Burst-Modus tut mehr als Zittern.",
  "Das Schweigen bevor ein Wal auftaucht — das ist das eigentliche Bild. Das Foto danach ist der Beweis, dass du da warst.",
  "Pilotwal: sehr wahrscheinlich. Riesendelfin: fast sicher. Orca: selten, aber nicht unmöglich. 35 € Fahrkarte. Was danach bleibt: unbezahlbar.",
  "See noch spiegelglatt. Das ändert sich nachmittags. Jetzt ist der Moment — für alles, was auftaucht.",
];

// ─── MARKT-TIPPS (Sa/So morgens) ────────────────────────────────────────────
const MARKT: string[] = [
  "Mercado de África öffnet in 30 min. Fischmarkt, Kolonialinnenhof, Blumen. Vor 9:30 ist es still. Danach: Fiesta. Du weißt, welche Version du magst.",
  "Bauernmarkt Tegueste, Gofio, Weichkäse, frisches Obst direkt vom Hof. Man riecht ihn, bevor man ihn sieht. Das ist das richtige Zeichen.",
  "Mercado Pinolere: Keramik, Textilien, kleinster Markt, größte Sorgfalt. 3x für Handwerksdetails. Was mit Händen gemacht wurde, verdient den genauen Blick.",
  "Rastro de Santa Cruz, Sonntagsflohmarkt. 3x aus Abstand, keine Absperrung nötig. Gesichter, Kram, Energie — das ist Tenerife ohne Reiseführer.",
];

/**
 * Build the next ~4 days of notifiable events.
 * Each has an optional `geofence` to avoid firing when the user is far away.
 */
export function buildEvents(now: Date = new Date()): ScheduledEvent[] {
  const out: ScheduledEvent[] = [];

  for (let i = 0; i < 4; i++) {
    const day = new Date(now);
    day.setDate(day.getDate() + i);
    if (!inTrip(day)) continue;

    const loc    = locFor(day);
    const sun    = SunCalc.getTimes(day, loc.lat, loc.lng);
    const moon   = SunCalc.getMoonTimes(day, loc.lat, loc.lng);
    const seed   = Math.floor(day.getTime() / 86_400_000);
    const week   = weekOfTrip(day);
    const dow    = day.getDay(); // 0 = Sonntag

    // ── Goldene Stunde abends (30 min vor Beginn)
    const goldenHour: Date | undefined = (sun as unknown as Record<string, Date>)["goldenHour"];
    if (goldenHour && goldenHour.getTime() > now.getTime()) {
      out.push({
        id: `gold-${day.toISOString().slice(0, 10)}`,
        at: goldenHour,
        leadMin: 30,
        title: `Goldene Stunde · ${formatHm(goldenHour)}`,
        body: pick(week === 0 ? GOLDEN_W1 : GOLDEN_W2, seed),
        url: "/karte",
        geofence: { lat: loc.lat, lng: loc.lng, radiusKm: 60 }, // ganz Tenerife
      });
    }

    // ── Astro-Fenster 22:00 (nur wenn Mond bereits unter Horizont)
    const astroAt = dateAt(day, 22, 0);
    if (astroAt.getTime() > now.getTime()) {
      const moonRise = moon.rise as Date | undefined;
      const moonSet  = moon.set  as Date | undefined;
      const moonUp   = moonRise && moonSet
        ? astroAt > moonRise && astroAt < moonSet
        : moonRise ? astroAt > moonRise : false;
      if (!moonUp) {
        out.push({
          id: `astro-${day.toISOString().slice(0, 10)}`,
          at: astroAt,
          leadMin: 60,
          title: "Astro-Fenster — kein Mondlicht",
          body: pick(ASTRO, seed),
          url: "/ausfluege",
          geofence: { lat: 28.272, lng: -16.642, radiusKm: 80 }, // Teide-Umgebung / ganz Tenerife
        });
      }
    }

    // ── Walbeobachtung: nur Woche 2, Mo–Sa, 8:30 → 60 min Vorlauf
    if (day >= SWITCH_DATE && dow !== 0) {
      const whaleAt = dateAt(day, 8, 30);
      if (whaleAt.getTime() > now.getTime()) {
        out.push({
          id: `whale-${day.toISOString().slice(0, 10)}`,
          at: whaleAt,
          leadMin: 60,
          title: "Walbeobachtung-Fenster",
          body: pick(WHALE, seed),
          url: "/ausfluege",
          geofence: { lat: LOCATIONS["los-gigantes"].lat, lng: LOCATIONS["los-gigantes"].lng, radiusKm: 30 },
        });
      }
    }

    // ── Markt-Tipps: Sa + So, 8:00 → 30 min Vorlauf (nur Woche 1)
    if (week === 0 && (dow === 6 || dow === 0)) {
      const marktAt = dateAt(day, 8, 0);
      if (marktAt.getTime() > now.getTime()) {
        out.push({
          id: `markt-${day.toISOString().slice(0, 10)}`,
          at: marktAt,
          leadMin: 30,
          title: "Markt-Morgen",
          body: pick(MARKT, seed),
          url: "/karte",
          geofence: { lat: LOCATIONS["los-realejos"].lat, lng: LOCATIONS["los-realejos"].lng, radiusKm: 60 },
        });
      }
    }
  }

  return out;
}
