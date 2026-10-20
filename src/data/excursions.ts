export type ExcursionCategory = "wandern" | "wasser" | "nacht" | "aussicht" | "insel";

export interface AstroSetupItem { label: string; value: string; }

export interface Excursion {
  id: string;
  title: string;
  area: string;
  category: ExcursionCategory;
  base?: "los-realejos" | "los-gigantes";
  duration?: string;
  description: string;
  notes: string[];
  cameraTips: string[];
  parking?: string;
  caution?: string;
  /** Structured S25 Ultra setup for specialist conditions (astro, underwater, etc.) */
  astroProfile?: AstroSetupItem[];
  /** Interactive pre-departure checklist */
  checklist?: string[];
}

export const excursions: Excursion[] = [
  {
    id: "anaga",
    title: "Anaga — Lorbeerwald",
    area: "Anaga-Gebirge, Nordosten",
    category: "wandern",
    base: "los-realejos",
    duration: "halber bis ganzer Tag",
    description:
      "Älteres Massiv als der Teide. Lorbeerwald (Laurisilva), Reste des Tertiärs, oft in Wolken gehüllt. Pfade zwischen Cruz del Carmen, Chinamada und Punta del Hidalgo.",
    notes: [
      "Wolken hängen häufig schon vormittags ab 800 m im Wald.",
      "Boden feucht, rutschig auf Basalt und Wurzelwerk.",
      "Höhlenwohnungen in Chinamada noch teilweise bewohnt.",
    ],
    cameraTips: [
      "Diffuses Licht — Weißabgleich manuell auf Schatten/Bewölkt setzen, sonst werden Grüntöne zu kalt.",
      "EV +0.3 bis +0.7 unter dichtem Blätterdach, sonst sieht der Wald zu dunkel aus.",
      "Pro-Modus, ISO niedrig (50–200), Handgriff stabil — der Wald ist windstiller als gedacht.",
    ],
    parking: "Extrem limitiert. Cruz del Carmen ist ab 9:00 Uhr meist voll — Ankunft vor 8:30 Uhr empfohlen. Wochenenden kaum machbar; alternativ Bus 077 ab La Laguna.",
  },
  {
    id: "tigaiga",
    title: "Tigaiga — Hänge über Los Realejos",
    area: "Tigaiga-Massiv, oberhalb Los Realejos",
    category: "wandern",
    base: "los-realejos",
    duration: "drei bis fünf Stunden",
    description:
      "Steiler Hangrücken, der vom Orotava-Tal bis fast zum Teide zieht. Mirador El Lance gibt einen ungestörten Blick auf den Vulkan, wenn die Wolken aufreißen.",
    notes: [
      "Nachmittags reißt die Wolkendecke am Teide-Hang oft kurz auf — gutes Zeitfenster für Sicht.",
      "Pfade teilweise nicht beschildert, Karte nötig.",
      "Wenig Schatten ab Mittag.",
    ],
    cameraTips: [
      "Teide im Hintergrund: 3x oder 5x optisch, nicht digital — sonst wird der Krater matschig.",
      "EV -0.7, sonst frisst der helle Himmel den Vulkanumriss.",
      "Polfilter-App im Pro-Modus aus — er bringt hier wenig und schluckt Licht.",
    ],
    parking: "Mirador El Lance: kleiner Schotterparkplatz, meistens Platz. Im Ortskern Los Realejos selbst eng, lieber oberhalb am Mirador parken.",
  },
  {
    id: "masca",
    title: "Masca — Schlucht zum Meer",
    area: "Teno-Gebirge, westliche Inselseite",
    category: "wandern",
    base: "los-gigantes",
    duration: "fünf bis sieben Stunden, Reservierung Pflicht",
    description:
      "Schlucht vom Bergdorf Masca hinunter zur Atlantikbucht. Steile Wände aus geschichtetem Basalt, Bachlauf, am Ende Boot zurück nach Los Gigantes.",
    notes: [
      "Behördlich reglementiert: Helm, Reservierung, festes Schuhwerk verpflichtend.",
      "Im Schluchtgrund selten direkte Sonne — das Licht ist meist seitlich gebrochen.",
      "Boot ab Strand, sonst Rückweg bergauf.",
    ],
    cameraTips: [
      "Hohe Kontraste zwischen Wand und Himmel: EV -0.7, RAW aktivieren, später anpassen.",
      "Im engen Teil der Schlucht 0.6x Ultraweitwinkel — die Felswand kommt sonst nicht ganz ins Bild.",
      "Fokus manuell auf Wandtextur, nicht auf den hellen Himmelsstreifen oben.",
    ],
    parking: "Im Bergdorf Masca extrem knapp (Privatparkplatz an der Kirche, kostenpflichtig). Vor 8:30 Uhr ankommen oder mit Bus 355 ab Buenavista del Norte fahren — die Straße ist eng und im Sommer regelmäßig dicht.",
  },
  {
    id: "los-gigantes",
    title: "Los Gigantes — Klippen am Wasser",
    area: "Acantilados de Los Gigantes",
    category: "aussicht",
    base: "los-gigantes",
    duration: "ein bis zwei Stunden",
    description:
      "500–600 m hohe Basaltwand, die fast senkrecht in den Atlantik fällt. Beste Sicht vom kleinen Hafen, vom Strand und vom Mirador Archipenque.",
    notes: [
      "Mirador Archipenque: nachmittags Gegenlicht — morgens besser für Detailzeichnung.",
      "Vom Boot aus wirken die Wände erst maßstäblich.",
      "Wind im Hafen oft auflandig, scharf.",
    ],
    cameraTips: [
      "Maßstab fehlt schnell — kleines Boot oder Möwe mit ins Bild nehmen.",
      "Gegen Mittag flacht die Wand optisch ab. Goldene Stunde am Abend strukturiert die Schichten.",
      "EV -0.7 am Morgen, manueller Weißabgleich auf Tageslicht (5500 K).",
    ],
    parking: "Tiefgarage am Hafen meist verfügbar (kostenpflichtig). Straßenparken oben am Mirador Archipenque ab 11:00 Uhr eng — vorher hinfahren.",
  },
  {
    id: "punta-de-teno",
    title: "Punta de Teno — Westkap",
    area: "westlichster Punkt der Insel",
    category: "aussicht",
    base: "los-gigantes",
    duration: "ein halber Tag",
    description:
      "Niedrige Lavalandschaft mit Leuchtturm, freier Blick auf La Gomera. Zufahrt mit Privatauto nur außerhalb der Hauptzeit erlaubt — sonst Bus ab Buenavista.",
    notes: [
      "Wind fast immer stark, Sand und Salz im Objektiv.",
      "Sonnenuntergang ohne Hindernis — bevorzugte Position für die letzten zwanzig Minuten.",
      "Buslinie 369 ab Buenavista del Norte regelmäßig; Auto nur abends/morgens.",
    ],
    cameraTips: [
      "Gegen den Wind fotografieren, nicht mit dem Wind — sonst Spritzer auf der Linse.",
      "Sonnenuntergang: EV -1.0, Pro-Modus, RAW. Das Smartphone-Auto wird sonst zu warm.",
      "Stativ niedrig stellen wegen Wind, Selbstauslöser 2 s.",
    ],
    parking: "Privatauto nur 19:00–10:00 Uhr erlaubt — tagsüber muss man den Bus 369 ab Buenavista nehmen. Wenn Auto erlaubt: kleiner Parkplatz am Leuchtturm, zur Sonnenuntergangszeit voll, lieber 30 min vorher da sein.",
  },
  {
    id: "teide-nacht",
    title: "Teide Nacht-Tour — Sterne",
    area: "Teide-Nationalpark, oberhalb 2000 m",
    category: "nacht",
    duration: "Abend bis weit nach Mitternacht",
    description:
      "Sternenbeobachtung über der Wolkengrenze. Milchstraße im Sommer fast senkrecht über dem Krater. Stille, Kälte, dünne Luft.",
    notes: [
      "Temperatursturz nach Sonnenuntergang: zweite Jacke, Mütze, Handschuhe.",
      "Stirnlampe mit Rotlicht — schont die Adaption der Augen.",
      "Mond-Phase prüfen; Neumond gibt das dunkelste Bild.",
    ],
    cameraTips: [
      "Stativ zwingend. Ohne Stativ keine brauchbaren Sternenbilder.",
      "Expert RAW → Astrofoto-Modus, Belichtung 15–25 s (Stativ) oder 4–10 Min (Tracker).",
      "Fokus manuell auf Unendlich, dann fixieren (Klebeband über Fokusring). Autofokus aus.",
      "ISO 800–1600 manuell, nicht Auto — Astromodus neigt zu Überrauschen.",
      "Akku warm halten (Innentasche), kalter Akku liefert keine 10 Minuten Belichtung.",
      "2 s Selbstauslöser gegen Kamerawackeln beim Antippen.",
    ],
    astroProfile: [
      { label: "Modus",         value: "Expert RAW → Astrofoto" },
      { label: "Fokus",         value: "Manuell · ∞ fixieren" },
      { label: "Belichtung",    value: "15–25 s (Stativ zwingend)" },
      { label: "ISO",           value: "800–1600 (manuell)" },
      { label: "Auslöseverzög.", value: "2 s Selbstauslöser" },
      { label: "Format",        value: "RAW aktivieren" },
      { label: "Weißabgleich",  value: "≈ 3800 K manuell" },
      { label: "Zoom",          value: "0.6× Ultraweitwinkel" },
    ],
    checklist: [
      "Stativ eingepackt?",
      "Powerbank voll geladen?",
      "Warme Jacke + Mütze + Handschuhe (unter 0 °C möglich)?",
      "Rotlicht-Stirnlampe einsatzbereit?",
      "Akku des Smartphones > 80 %?",
      "Wasser + Snacks für mehrere Stunden?",
      "Mond-Phase gecheckt (Neumond = ideale Bedingungen)?",
      "Letzter Tankstopp vor der Auffahrt erledigt?",
    ],
    parking: "Roques de García und El Portillo haben große Parkplätze, abends nahezu leer. Letzter Tankstopp Vilaflor oder La Orotava — oben gibt es nichts.",
    caution:
      "Höhenkrankheit ab 2000 m möglich — langsam bewegen, viel trinken.",
  },
  {
    id: "walbeobachtung",
    title: "Walbeobachtung — Westküste",
    area: "Atlantik vor Los Gigantes / Puerto Colón",
    category: "wasser",
    base: "los-gigantes",
    duration: "zwei bis drei Stunden auf See",
    description:
      "Ständige Population von Grindwalen und Großen Tümmlern in der Strömung zwischen Teneriffa und La Gomera. Begegnung auf Distanz, ohne Eingriff.",
    notes: [
      "Anbieter mit blauer Flagge wählen — sie halten die gesetzliche Distanz von 60 m ein.",
      "Frühe Tour (vormittags) — See meist ruhiger, Licht weicher.",
      "Seekrankheit: vorher leicht essen, Tablette eine Stunde vorher.",
    ],
    cameraTips: [
      "10x optischer Zoom nutzen (Periskoplinse), nicht digital — digitales Heranzoomen wird unscharf.",
      "Serienbild aktivieren (Auslöser gedrückt halten) — Auftauchmoment dauert oft unter eine Sekunde.",
      "Verschlusszeit kurz: 1/1000 s im Pro-Modus, ISO automatisch bis 800.",
      "Kein Blitz. Auf den Horizont vorfokussieren, dann bei Bewegung schwenken.",
    ],
    parking: "Hafen Los Gigantes: Tiefgarage direkt am Anleger (kostenpflichtig), morgens noch entspannt. Ab Puerto Colón: mehrere Parkhäuser, ausreichend Platz.",
    caution:
      "Distanz wahren ist Pflicht. Tiere nicht durch Lärm oder Annäherung stören.",
  },
  {
    id: "tauchen-erste-schritte",
    title: "Tauchen — erste Schritte",
    area: "Bucht vor Los Gigantes / Playa Paraíso",
    category: "wasser",
    base: "los-gigantes",
    duration: "halber Tag inkl. Briefing",
    description:
      "Geführter Schnuppertauchgang in geschützter Bucht. Sicht oft 20–30 m. Eine andere Akustik unter Wasser — kein Wind, nur das eigene Atmen.",
    notes: [
      "Brevet nicht nötig, ärztlicher Selbstcheck-Bogen reicht.",
      "Nicht fliegen 24 Stunden nach dem Tauchgang.",
      "Wassertemperatur Mai/Juni um 20 °C — kurzer Anzug ausreichend, langer angenehmer.",
    ],
    cameraTips: [
      "Nur mit dichtem Unterwassergehäuse für das S25 Ultra (Tiefe prüfen).",
      "Weißabgleich manuell auf 'Unterwasser' — sonst alles grünlich-blau.",
      "Pro-Modus, niedrige ISO (50–200), Verschluss 1/250 s gegen Bewegungsunschärfe.",
      "Nicht zu nah an Tiere — auch hier Distanz halten.",
    ],
    parking: "Anbieter haben in der Regel eigene Stellplätze direkt an der Tauchbasis. Adresse bei Buchung erfragen — sonst Hafen Los Gigantes oder Playa Paraíso.",
    caution:
      "Druckausgleich konsequent. Bei Erkältung nicht tauchen.",
  },
  {
    id: "gran-canaria",
    title: "Gran Canaria — Tagesausflug",
    area: "Agaete · Fataga · Maspalomas · Mirador Degollada",
    category: "insel",
    base: "los-gigantes",
    duration: "ganzer Tag (Fähre 8:00 / Rück 20:00)",
    description:
      "Fred Olsen Express ab Los Cristianos, Ankunft Agaete ~9:20. Von dort die Küste entlang: Puerto de Mogán mit seinen Blumenbögen, die Sahara-Dünen von Maspalomas, und zum Abschluss der Mirador Astronómico de la Degollada. Rückfähre Agaete 20:00.",
    notes: [
      "Station 1 — Agaete / Puerto de las Nieves: Kleines Fischerdorf direkt am Fährhafen. Türkises Wasser, schwarzes Gestein, Altstadt mit Blumen an den Fenstern. Erster Stopp nach Ankunft.",
      "Station 2 — Puerto de Mogán: Das 'Kleine Venedig' Gran Canarias. Blumenbögen über den Gassen, kleine Kanäle, bunt gestrichene Boote. Sehr ruhig abseits der Hauptstraße. Kaffee hier.",
      "Station 3 — Maspalomas: Dünen treffen Atlantik. Naturschutzgebiet, kein Betreten außerhalb der Wege. Leuchtturm Faro de Maspalomas als Orientierungspunkt.",
      "Station 4 — Mirador Astronómico de la Degollada de Becerra: Sternwarte-Mirador, Blick auf beide Küsten bei klarem Wetter. Einer der dunkelsten Standorte der Kanaren.",
      "Rückweg nach Agaete: Küstenstraße GC-2 — schneller als Inland, Blick auf den Atlantik.",
    ],
    cameraTips: [
      "Agaete morgens (9:30–11:00): weiches Licht, noch keine Touristen. 1x Weitwinkel für den Hafen, 3x für Details an Fassaden.",
      "Puerto de Mogán: Blumenbögen von unten fotografieren — 1x oder 0.6x, Weitwinkel, Gegenlicht funktioniert gut. Boote im Kanal: Spiegelungen morgens schärfer als mittags.",
      "Maspalomas Dünen: Gegenlicht in den Dünenkämmen — silhouettenartige Strukturen. Wind: Linse mit einer Hand schützen. Nahaufnahme Sandkörner mit Makro-Modus.",
      "Mirador Degollada: Panorama mit 0.6x Weitwinkel, Horizont in unteres Drittel. Wenn der Himmel klar ist: beide Küsten gleichzeitig sichtbar.",
      "Fähre Überfahrt: Atlantik, Schaumkronen — Pro-Modus, Verschlusszeit 1/1000+ damit die Wellen scharf bleiben.",
    ],
    parking:
      "Kein eigenes Auto nötig — Mietwagen oder Taxi ab Agaete. Alternativ: Buslinie 18 Agaete–Maspalomas (ca. 2h, günstig).",
    caution:
      "Rückfähre 20:00 ist bindend — Tickets vorab buchen (fredolsen.es). Dünen von Maspalomas: kein Schatten, Sonnenschutz zwingend. Puerto de Mogán: Bargeld mitnehmen, kleine Läden oft nur bar.",
    checklist: [
      "Fähr-Ticket gebucht (fredolsen.es) — Hin & Rück",
      "Abfahrt Los Cristianos spätestens 7:15 Uhr",
      "Sonnenschutz + Wasser (mind. 1,5 L)",
      "Bargeld für Fataga",
      "Kamera-Akku voll, Speicherkarte leer",
      "Festes Schuhwerk für Dünen",
      "Route offline gespeichert",
    ],
  },
];

export const generalCameraTips = [
  {
    title: "Hohe Kontraste",
    detail: "EV -0.7 bei direkter Sonne und hellem Himmel. RAW im Pro-Modus aktivieren, damit dunkle Bereiche nachträglich aufgehellt werden können.",
  },
  {
    title: "Manueller Weißabgleich",
    detail: "Auto-Weißabgleich kippt bei Lava und tiefem Schatten. Tageslicht ~5500 K, Schatten/Bewölkt ~6500 K, Sonnenauf-/untergang ~3200 K.",
  },
  {
    title: "Stille Hände",
    detail: "Beide Ellbogen am Körper, Atem aus, dann auslösen. Selbstauslöser 2 s bei wichtigen Aufnahmen — entlastet den Auslösefinger.",
  },
];
