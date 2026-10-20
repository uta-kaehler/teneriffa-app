import { useQuery } from "@tanstack/react-query";

export interface WeatherData {
  temp: number;
  feelsLike: number;
  precipitation: number;
  weatherCode: number;
  cloudCover: number;
  windSpeed: number;
  uvIndex: number;
  condition: string;
  emoji: string;
  isRainy: boolean;
  isCloudy: boolean;
  isSunny: boolean;
  isWindy: boolean;
}

const WMO: Record<number, { label: string; emoji: string }> = {
  0:  { label: "Strahlend",          emoji: "☀️"  },
  1:  { label: "Überwiegend klar",   emoji: "🌤️" },
  2:  { label: "Wechselnd bewölkt",  emoji: "⛅"  },
  3:  { label: "Bedeckt",            emoji: "☁️"  },
  45: { label: "Nebel",              emoji: "🌫️" },
  48: { label: "Nebel (Reif)",       emoji: "🌫️" },
  51: { label: "Leichter Niesel",    emoji: "🌦️" },
  53: { label: "Niesel",             emoji: "🌦️" },
  55: { label: "Starker Niesel",     emoji: "🌧️" },
  61: { label: "Leichter Regen",     emoji: "🌧️" },
  63: { label: "Regen",              emoji: "🌧️" },
  65: { label: "Starker Regen",      emoji: "🌧️" },
  80: { label: "Regenschauer",       emoji: "🌦️" },
  81: { label: "Schauer",            emoji: "🌧️" },
  82: { label: "Starke Schauer",     emoji: "⛈️" },
  95: { label: "Gewitter",           emoji: "⛈️" },
  96: { label: "Gewitter + Hagel",   emoji: "⛈️" },
  99: { label: "Schweres Gewitter",  emoji: "⛈️" },
};

function wmoInfo(code: number): { label: string; emoji: string } {
  return WMO[code] ?? WMO[Math.floor(code / 10) * 10] ?? { label: "Unbekannt", emoji: "🌡️" };
}

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    precipitation: number;
    weather_code: number;
    cloud_cover: number;
    wind_speed_10m: number;
    uv_index: number;
  };
}

export async function fetchWeather(lat: number, lng: number): Promise<WeatherData> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,apparent_temperature,precipitation,weather_code,cloud_cover,wind_speed_10m,uv_index` +
    `&wind_speed_unit=kmh&timezone=Atlantic%2FCanary`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Wetterdaten nicht verfügbar");
  const json = (await res.json()) as OpenMeteoResponse;
  const c = json.current;
  const { label, emoji } = wmoInfo(c.weather_code);

  return {
    temp: Math.round(c.temperature_2m),
    feelsLike: Math.round(c.apparent_temperature),
    precipitation: c.precipitation,
    weatherCode: c.weather_code,
    cloudCover: c.cloud_cover,
    windSpeed: Math.round(c.wind_speed_10m),
    uvIndex: Math.round(c.uv_index ?? 0),
    condition: label,
    emoji,
    isRainy:  c.precipitation > 0.1 || (c.weather_code >= 51 && c.weather_code <= 99),
    isCloudy: c.cloud_cover > 60,
    isSunny:  c.cloud_cover < 35 && c.precipitation <= 0.1,
    isWindy:  c.wind_speed_10m > 30,
  };
}

export function useWeather(lat: number, lng: number) {
  return useQuery({
    queryKey: ["weather", lat, lng],
    queryFn: () => fetchWeather(lat, lng),
    staleTime: 15 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/** One-line advisory string based on weather conditions. */
export function weatherAdvisory(w: WeatherData): string {
  if (w.isRainy)                    return "Regen — Guachinches & Läden priorisieren";
  if (w.isCloudy)                   return "Bedeckt — diffuses Licht, gut für Wald & Porträts";
  if (w.isWindy && w.isSunny)       return "Sonnig & windig — exponierte Klippen mit Vorsicht";
  if (w.isSunny)                    return "Ideal — Fotospots und Outdoor-Spots voll im Grünen";
  return "Wechselhaft — flexible Planung empfohlen";
}
