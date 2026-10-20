// Öffentliche Fassung: Auf der Reise beantwortete hier Claude über eine Schnittstelle
// kleine Fragen (Wind-Impuls, Richtung, Licht-Kommentar). Damit die App ohne Server
// und ohne Schlüssel läuft, stehen jetzt handgeschriebene Sätze im gleichen Ton hier.
// Trocken, konkret, kein Servicelächeln.

function zahl(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
function waehle<T>(liste: T[], schluessel: string): T {
  return liste[zahl(schluessel) % liste.length];
}

// ── Wind-Impuls (ein Satz, Englisch wie im Original) ────────────────────────
const IMPULSE_MORGEN = [
  "The wind changes direction just after sunrise; watch the tops of the pines.",
  "The first warm air rises from the rock before it rises from the sea.",
  "Listen for the dogs in the valley; they start before the cars do.",
  "Dew on the agave leaves lasts about twenty minutes longer than you expect.",
  "The clouds on the slope are moving uphill, slowly, as they do every morning.",
];
const IMPULSE_TAG = [
  "The shadows under the balconies are shortest now and darkest.",
  "Wind carries salt as far as the second row of houses.",
  "Lizards come out on the south side of every wall at this hour.",
  "The sea sounds louder when the wind comes from the side.",
  "Somewhere a radio plays in a kitchen; the street goes quiet around it.",
];
const IMPULSE_ABEND = [
  "The rock keeps the heat longer than the air; touch a wall on the way back.",
  "The light turns first on the cliffs, then on the water, then on faces.",
  "Swifts fly lower when the wind drops.",
  "The smell of grilled fish arrives before the harbour comes into view.",
  "The last boat leaves a line on the water that stays for a minute.",
];

export function windImpuls(tageszeit: string, ort: string): string {
  const tag = new Date().toISOString().slice(0, 10);
  const liste = /morgen/i.test(tageszeit) ? IMPULSE_MORGEN : /abend/i.test(tageszeit) ? IMPULSE_ABEND : IMPULSE_TAG;
  return waehle(liste, tag + ort + tageszeit);
}

// ── Richtung (aus drei Stichworten eine Einladung) ──────────────────────────
// Die Stichworte wählen die Karte; gleiche Worte, gleiche Karte.
const RICHTUNGEN: ((wort: string) => string)[] = [
  (w) => `Bleib bei ${w}. Warte, bis sich daran etwas bewegt.`,
  () => "Dreh dich um. Das Bild, das du suchst, liegt hinter dir.",
  () => "Geh zwanzig Schritte weiter, als du wolltest.",
  (w) => `Such ${w} dort, wo das Licht gerade aufhört.`,
  () => "Tiefer gehen. Auf Augenhöhe mit dem Boden.",
  () => "Warte auf den Moment, in dem niemand durchs Bild läuft. Dann noch einen.",
  (w) => `Nicht ${w} selbst. Das, was es berührt.`,
  () => "Der Rand ist interessanter als die Mitte.",
  () => "Schließ ein Auge und such die Linie, die durchs ganze Bild läuft.",
  (w) => `Was macht ${w} in fünf Minuten anders als jetzt?`,
  () => "Weg vom Aussichtspunkt. Zwei Meter reichen.",
  () => "Das Geräusch zuerst. Das Bild kommt danach.",
  (w) => `Zeig ${w}, ohne es ganz zu zeigen.`,
  () => "Folge dem Schatten, nicht dem Licht.",
  () => "Hier ist mehr Zeit als Motiv. Nimm die Zeit.",
];

export function richtungAus(stichworte: string[]): string {
  const worte = stichworte.map((s) => s.trim()).filter(Boolean);
  const schluessel = worte.join("·").toLowerCase();
  const wort = worte[zahl(schluessel) % Math.max(worte.length, 1)] ?? "dem Ort";
  return waehle(RICHTUNGEN, schluessel)(wort);
}

// ── Licht-Kommentar (ein bis zwei Sätze aus den Lichtdaten) ─────────────────
export function lichtKommentar(p: { goldenHourEveningStart: string; sunset: string; uvIndex?: number; timeNow?: string }): string {
  const jetzt = new Date();
  const gold = new Date(p.goldenHourEveningStart);
  const unter = new Date(p.sunset);
  const uhr = (d: Date) => d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  const bisGold = Math.round((gold.getTime() - jetzt.getTime()) / 60000);
  const teile: string[] = [];
  if (jetzt >= gold && jetzt < unter) teile.push("Jetzt.");
  else if (bisGold > 0 && bisGold <= 90) teile.push(`In ${bisGold} Minuten wird es gut. Kamera nicht mehr einpacken.`);
  else if (jetzt >= unter) teile.push("Die Sonne ist weg. Die blaue Stunde ist kürzer, als man denkt.");
  else teile.push(`Goldene Stunde ab ${uhr(gold)}, Sonnenuntergang ${uhr(unter)}. Bis dahin ist das Licht ehrlich, aber hart.`);
  if (p.uvIndex != null && p.uvIndex >= 8) teile.push(`UV ${Math.round(p.uvIndex)}. Die Sonne meint es ernst.`);
  return teile.join(" ");
}
