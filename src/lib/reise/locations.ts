export interface TripLocation {
  id: string;
  name: string;
  region: string;
  weekLabel: string;
  startDate: string;
  endDate: string;
  latitude: number;
  longitude: number;
  timezone: string;
  blurb: string;
}

export const LOCATIONS: TripLocation[] = [
  {
    id: "los-realejos",
    name: "Los Realejos",
    region: "Norden, Teneriffa",
    weekLabel: "Woche 1",
    startDate: "2027-05-30",
    endDate: "2027-06-06",
    latitude: 28.3686,
    longitude: -16.5847,
    timezone: "Atlantic/Canary",
    blurb:
      "Grüner Norden, Lorbeerwald, Klippen über dem Atlantik. Weiches Licht, oft Wolken am Hang des Teide.",
  },
  {
    id: "los-gigantes",
    name: "Los Gigantes",
    region: "Westen, Teneriffa",
    weekLabel: "Woche 2",
    startDate: "2027-06-07",
    endDate: "2027-06-13",
    latitude: 28.2466,
    longitude: -16.8423,
    timezone: "Atlantic/Canary",
    blurb:
      "Senkrechte Basaltklippen, trockenes Westklima. Sonnenuntergänge fallen direkt ins Meer.",
  },
];

export function getLocation(id: string): TripLocation | undefined {
  return LOCATIONS.find((l) => l.id === id);
}

export const TRIP_START = "2027-05-30";
export const TRIP_END = "2027-06-13";
