/** Curated Morgen-Inspiration tour ideas for both trip weeks. */

export type EffortLevel = "entspannt" | "moderat" | "aktiv" | "anstrengend";
export type LightPhase  = "sunrise" | "morning" | "golden-eve" | "blue-eve" | "midday" | "night";
export type TrubelLevel = 1 | 2 | 3; // 1=ruhig 2=gemäßigt 3=belebend

export interface TourIdee {
  id: string;
  /** Which trip week(s) this idea applies to. */
  week: 1 | 2 | "both";
  title: string;
  subtitle: string;
  effort: EffortLevel;
  effortHint: string;
  bestLight: LightPhase;
  lightNote: string;   // "Kamera ab 20:15 einpacken" etc.
  trubel: TrubelLevel;
  trubelNote: string;  // timing / crowd detail
  cameraHint: string;  // S25 Ultra one-liner
}

export const TOUR_IDEEN: TourIdee[] = [

  // ── WOCHE 1 — Los Realejos / Nordhang ──────────────────────────────────

  {
    id: "w1-anaga",
    week: 1,
    title: "Lorbeerwald & Wolkenfenster",
    subtitle: "Anaga-Massiv: Chinamada, Cruz del Carmen, Bailadero",
    effort: "moderat",
    effortHint: "Bergpfade, ca. 350 Hm, festes Schuhwerk",
    bestLight: "morning",
    lightNote: "Sickerlicht durch Nebel — ab Sonnenaufgang bis ~10 Uhr optimal",
    trubel: 1,
    trubelNote: "Vor 9 Uhr ist man fast allein. Wochenend-Ausflügler ab 10 Uhr.",
    cameraHint: "0.6x für Baumkronen-Silhouetten, Expert RAW ISO 800, WB Bewölkt",
  },
  {
    id: "w1-nordkueste",
    week: 1,
    title: "Nordküsten-Tour: Wellen & frischer Fisch",
    subtitle: "Garachico → Icod → Bodegas Monje → Charco del Viento",
    effort: "entspannt",
    effortHint: "Flaches Küstenland, bequeme Schuhe reichen",
    bestLight: "golden-eve",
    lightNote: "Abends: Klippen über Garachico glühen — 30 Min vor Sunset aufstellen",
    trubel: 2,
    trubelNote: "Garachico mittags voller, Charco del Viento immer ruhig",
    cameraHint: "3x für Fischboote im Gegenlicht, Langzeit auf Lava-Becken",
  },
  {
    id: "w1-drago-puerto",
    week: 1,
    title: "Drago & Puerto: Tausend Jahre & bunter Hafen",
    subtitle: "Drago Milenario Icod · Plaza Jardín · Hafen Puerto de la Cruz",
    effort: "entspannt",
    effortHint: "Stadtspaziergang, wenig Höhe",
    bestLight: "morning",
    lightNote: "Drago im Morgenlicht wirft besten Schatten — Ankunft vor 9 Uhr",
    trubel: 2,
    trubelNote: "Drago Öffnung 9:00 — davor vom Plaza aus fotografieren",
    cameraHint: "0.6x für die ganze Krone, 10x für Rinde-Textur",
  },
  {
    id: "w1-teide-tag",
    week: 1,
    title: "Gipfel-Tag: Über den Wolken",
    subtitle: "TF-21 hoch, Roques de García, Seilbahn oder Pico Viejo",
    effort: "anstrengend",
    effortHint: "Höhenkrankheit möglich ab 2.100 m, Seilbahn-Ticket vorab buchen",
    bestLight: "sunrise",
    lightNote: "Sonnenaufgang färbt Caldera orange — Ankunft El Portillo vor 7:00",
    trubel: 1,
    trubelNote: "Morgenstunden vor 10 Uhr ruhig. Seilbahn voll ab 11 Uhr.",
    cameraHint: "1x für Weite, 3x für Lava-Texturen, Expert RAW EV −1.0",
  },
  {
    id: "w1-laguna",
    week: 1,
    title: "La Laguna: Unesco-Stadt im Morgenlicht",
    subtitle: "Altstadt, Mercado, Kathedrale, Café am Plaza del Adelantado",
    effort: "entspannt",
    effortHint: "Stadtpflaster, kein Höhenunterschied",
    bestLight: "morning",
    lightNote: "Fassaden leuchten warm bis ~11 Uhr — danach flaches Licht",
    trubel: 2,
    trubelNote: "Markt Sa/So, werktags ruhig bis 10 Uhr",
    cameraHint: "3x aus Abstand für Fassaden-Details, 1x für Gassen-Perspektive",
  },
  {
    id: "w1-teno-nachmittag",
    week: 1,
    title: "Punta de Teno: Ende der Welt",
    subtitle: "Letzter Leuchtturm, Lavakap, La Gomera im Blick",
    effort: "entspannt",
    effortHint: "Straße gesperrt — Shuttlebus (TF-1426) nehmen",
    bestLight: "golden-eve",
    lightNote: "Leuchtturm glüht golden — 45 Min vor Sunset positionieren",
    trubel: 1,
    trubelNote: "Sehr ruhig außer Sa. Letzter Bus zurück beachten.",
    cameraHint: "10x für La Gomera-Silhouette, 0.6x für Kap-Panorama",
  },

  // ── WOCHE 2 — Los Gigantes / Westküste ─────────────────────────────────

  {
    id: "w2-wale",
    week: 2,
    title: "Walbeobachtung: Pilot-Pods vor den Klippen",
    subtitle: "Boot ab Hafen Los Gigantes, 1–2 Std. Ausfahrt",
    effort: "entspannt",
    effortHint: "Boot schaukelt — Magenverträglichkeit morgens besser",
    bestLight: "morning",
    lightNote: "Morgensee spiegelglatt → boot-ruhig → scharfe Fotos. Vor 10 Uhr starten.",
    trubel: 2,
    trubelNote: "Tickets begrenzt, Mo–Sa verfügbar, So oft voll",
    cameraHint: "10x + Burst-Modus, EV +0.3 auf dunklem Wasser",
  },
  {
    id: "w2-masca",
    week: 2,
    title: "Masca-Schlucht: Das Dorf über dem Nichts",
    subtitle: "Schlucht-Wanderung oder nur Dorf-Besuch mit Aussichtspunkt",
    effort: "aktiv",
    effortHint: "Schlucht: 5 h, 700 Hm Abstieg, Boot zurück buchen",
    bestLight: "morning",
    lightNote: "Morgenlicht fällt schräg in die Schlucht — ab 8 Uhr dramatisch",
    trubel: 2,
    trubelNote: "Dorf ab 10 Uhr touristisch, Schlucht immer ruhig",
    cameraHint: "0.6x für Kulisse, 3x für Terrassenmauern, EV −0.7",
  },
  {
    id: "w2-arena-teno",
    week: 2,
    title: "Schwarzer Strand & Teno-Leuchtturm",
    subtitle: "Playa de la Arena → Buenavista → Punta de Teno",
    effort: "entspannt",
    effortHint: "Alles flach, bequeme Schuhe",
    bestLight: "golden-eve",
    lightNote: "Arena-Wellen im Abendrot — 30 Min vor Sunset, EV −0.7",
    trubel: 1,
    trubelNote: "Arena ruhig unter der Woche, Teno immer beschaulich",
    cameraHint: "1x Langzeit für Wellen auf Schwarz, 10x für Leuchtturm von fern",
  },
  {
    id: "w2-guachinche-plateau",
    week: 2,
    title: "Hochplateau & Guachinche-Mittagessen",
    subtitle: "Santiago del Teide · Arguayo · El Aderno",
    effort: "entspannt",
    effortHint: "Fahrt + kurze Dorfläufe, keine Anstrengung",
    bestLight: "midday",
    lightNote: "Mittags: Innenraum Guachinche + Schatten-Suche — kein Licht-Stress",
    trubel: 1,
    trubelNote: "El Aderno nur Di–Sa Mittagsöffnung, Reservierung empfohlen",
    cameraHint: "3x für Tejinaste-Dornensträucher, 1x für Teide-Kulisse im Rücken",
  },
  {
    id: "w2-gigantes-hafen",
    week: 2,
    title: "Klippen-Gold: Archipenque bei Sonnenuntergang",
    subtitle: "Mirador Archipenque · Hafen · Fischrestaurant",
    effort: "entspannt",
    effortHint: "Kurzer Fußweg zum Mirador",
    bestLight: "golden-eve",
    lightNote: "500 m Basalt in Flammen — spätestens 35 Min vor Sunset positionieren",
    trubel: 1,
    trubelNote: "Hafen belebt, Mirador immer ruhig",
    cameraHint: "0.6x für ganze Klippen-Kulisse, EV −1.0, Stativ wenn möglich",
  },
  {
    id: "w2-teide-nacht",
    week: 2,
    title: "Nacht am Teide: Milchstraße mit bloßem Auge",
    subtitle: "Hochebene El Portillo oder Parador-Umgebung",
    effort: "moderat",
    effortHint: "Kalt ab 2.100 m — Polarjacke, warme Schuhe, kein Mondlicht nötig",
    bestLight: "night",
    lightNote: "Milchstraße ab ~22:30 sichtbar — Mondkalender prüfen!",
    trubel: 1,
    trubelNote: "Nachts praktisch menschenleer. Nationalpark-Regeln beachten.",
    cameraHint: "Expert RAW ISO 2500, 25 s, Weitwinkel — Lava-Fels als Stativ",
  },
];
