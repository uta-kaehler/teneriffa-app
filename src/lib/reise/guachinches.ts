export interface GuachincheRecord {
  id: string;
  name: string;
  town: string;
  near: string;
  description: string;
  signatureDishes: string[];
  priceLevel: string;
  openingNote: string;
  address?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
}

// Curated list of guachinches and casas de comida near the two stays.
// Information is observational; opening notes are general guidance only.
export const GUACHINCHES: GuachincheRecord[] = [
  // --- LOS REALEJOS / NORDEN ---
  {
    id: "casa-egon",
    name: "Casa Egon",
    town: "La Orotava",
    near: "los-realejos",
    description:
      "Familienbäckerei mit angeschlossener Cafetería. Holzvertäfelung, lokale Stammkundschaft, ruhig am Vormittag.",
    signatureDishes: ["Truchas de batata", "Bizcochón", "Café cortado"],
    priceLevel: "€",
    openingNote: "Tagsüber geöffnet, sonntags meist geschlossen.",
    address: "Calle León 5, La Orotava",
    latitude: 28.3905,
    longitude: -16.5236,
  },
  {
    id: "guachinche-el-cordero",
    name: "Guachinche El Cordero",
    town: "La Perdoma",
    near: "los-realejos",
    description:
      "Schlichter Hofbetrieb, eigener Wein im Karaffe, ehrliche Küche aus dem Tal.",
    signatureDishes: ["Costillas con piñas", "Garbanzas", "Conejo en salmorejo"],
    priceLevel: "€€",
    openingNote: "Saisonal geöffnet — vor Besuch telefonisch bestätigen.",
    address: "La Perdoma, La Orotava",
    latitude: 28.3705,
    longitude: -16.5398,
  },
  {
    id: "guachinche-los-roques",
    name: "Guachinche Los Roques",
    town: "Los Realejos",
    near: "los-realejos",
    description:
      "Direkt im Ort. Lange Holztische, kein Schnickschnack, Karte hängt an der Wand.",
    signatureDishes: ["Carne fiesta", "Papas arrugadas", "Queso asado"],
    priceLevel: "€",
    openingNote: "Mittags am verlässlichsten.",
    address: "Los Realejos",
    latitude: 28.3692,
    longitude: -16.5848,
  },
  {
    id: "tasca-el-olivo",
    name: "Tasca El Olivo",
    town: "Puerto de la Cruz",
    near: "los-realejos",
    description:
      "Kleine Tasca in einer Seitengasse. Gute Auswahl an einheimischem Wein, kein Touristenmenü.",
    signatureDishes: ["Pulpo a la plancha", "Croquetas caseras", "Vino tinto del país"],
    priceLevel: "€€",
    openingNote: "Abends ab ca. 19 Uhr.",
    address: "Puerto de la Cruz",
    latitude: 28.4136,
    longitude: -16.5448,
  },
  {
    id: "guachinche-tio-pepe",
    name: "Guachinche Tío Pepe",
    town: "Icod el Alto",
    near: "los-realejos",
    description:
      "Erhöhte Lage über Los Realejos, Blick aufs Meer. Wein vom Hang, deftige Küche.",
    signatureDishes: ["Cabra guisada", "Escaldón de gofio", "Mojo verde"],
    priceLevel: "€€",
    openingNote: "Häufig nur Donnerstag bis Sonntag.",
    address: "Icod el Alto",
    latitude: 28.3851,
    longitude: -16.6173,
  },
  {
    id: "el-calderito-abuela",
    name: "El Calderito de la Abuela",
    town: "Santa Úrsula",
    near: "los-realejos",
    description:
      "Bekanntere Adresse mit Terrasse und Aussicht. Etwas gehobener als ein Guachinche, aber regional verwurzelt.",
    signatureDishes: ["Ropa vieja", "Pollo al cilantro", "Quesillo"],
    priceLevel: "€€€",
    openingNote: "Reservierung empfehlenswert.",
    address: "Carretera General del Norte 130, Santa Úrsula",
    latitude: 28.4178,
    longitude: -16.4828,
  },

  // --- LOS GIGANTES / WESTEN ---
  {
    id: "guachinche-rincon-tasca",
    name: "Rincón de Tasca",
    town: "Tamaimo",
    near: "los-gigantes",
    description:
      "Kleines Lokal im Bergdorf hinter Los Gigantes. Wenig Plätze, ehrlicher Hausweinausschank.",
    signatureDishes: ["Conejo al ajillo", "Papas con mojo", "Pata asada"],
    priceLevel: "€€",
    openingNote: "Tagesgeschäft, abends manchmal früh ausverkauft.",
    address: "Tamaimo, Santiago del Teide",
    latitude: 28.2872,
    longitude: -16.8023,
  },
  {
    id: "casa-pancho",
    name: "Casa Pancho",
    town: "Playa de la Arena",
    near: "los-gigantes",
    description:
      "Strandnahe Adresse, schon länger etabliert. Fisch des Tages aus dem nahen Hafen.",
    signatureDishes: ["Vieja a la sal", "Ensalada de pulpo", "Lapas a la plancha"],
    priceLevel: "€€€",
    openingNote: "Mittags und abends; freitags voll.",
    address: "Avenida Marítima, Playa de la Arena",
    latitude: 28.2349,
    longitude: -16.8443,
  },
  {
    id: "guachinche-arguayo",
    name: "Guachinche de Arguayo",
    town: "Arguayo",
    near: "los-gigantes",
    description:
      "Bergdorf oberhalb des Tals. Lehmöfen, traditionelle Töpferei nebenan, sehr ruhig.",
    signatureDishes: ["Cherne encebollado", "Potaje de berros", "Gofio escaldado"],
    priceLevel: "€",
    openingNote: "Wochentags meist geschlossen.",
    address: "Arguayo, Santiago del Teide",
    latitude: 28.2745,
    longitude: -16.8211,
  },
  {
    id: "el-pescador-puerto",
    name: "El Pescador del Puerto",
    town: "Puerto de Los Gigantes",
    near: "los-gigantes",
    description:
      "Direkt am kleinen Hafen. Schnörkellos, Tagesfang an der Theke sichtbar.",
    signatureDishes: ["Sancocho canario", "Bocinegro a la espalda", "Mejillones al vapor"],
    priceLevel: "€€",
    openingNote: "Mittagstisch täglich, abends nicht immer.",
    address: "Puerto Deportivo, Los Gigantes",
    latitude: 28.2473,
    longitude: -16.8419,
  },
  {
    id: "guachinche-el-cordon",
    name: "Guachinche El Cordón",
    town: "Tamaimo",
    near: "los-gigantes",
    description:
      "Hofbetrieb mit eigenem Wein. Lange Tische, die Karte richtet sich nach dem, was da ist.",
    signatureDishes: ["Carne de cerdo en adobo", "Garbanzas compuestas", "Vino blanco de la casa"],
    priceLevel: "€€",
    openingNote: "Tendenziell Wochenende; vorab anrufen.",
    address: "Tamaimo, Santiago del Teide",
    latitude: 28.2861,
    longitude: -16.7994,
  },
  {
    id: "tasca-mirador-archipenque",
    name: "Tasca Mirador Archipenque",
    town: "Los Gigantes",
    near: "los-gigantes",
    description:
      "Aussichtspunkt mit kleinem Tasca-Anbau. Klippenblick, einfache Karte.",
    signatureDishes: ["Tortilla de atún", "Queso a la plancha", "Cerveza Dorada"],
    priceLevel: "€",
    openingNote: "Tagsüber geöffnet, Sonnenuntergang sehr beliebt.",
    address: "Mirador de Archipenque, Los Gigantes",
    latitude: 28.2503,
    longitude: -16.8381,
  },
];
