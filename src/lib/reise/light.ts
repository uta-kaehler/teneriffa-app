import SunCalc from "suncalc";

export interface LightDayResult {
  date: string;
  dayOfWeek: string;
  dawn: string;
  sunrise: string;
  goldenHourMorningEnd: string;
  solarNoon: string;
  goldenHourEveningStart: string;
  sunset: string;
  dusk: string;
  dayLengthMinutes: number;
  moonPhase: number;
  moonIllumination: number;
}

const TIMEZONE = "Atlantic/Canary";

function toIsoLocal(date: Date, timeZone: string): string {
  // Format the UTC instant `date` as an ISO string carrying the local
  // wall-clock for the given IANA timezone (with offset).
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = dtf.formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  const y = get("year");
  const m = get("month");
  const d = get("day");
  let hh = get("hour");
  if (hh === "24") hh = "00";
  const mm = get("minute");
  const ss = get("second");

  // Compute offset for the given instant in the target timezone.
  const offsetMinutes = getOffsetMinutes(date, timeZone);
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  const oh = String(Math.floor(abs / 60)).padStart(2, "0");
  const om = String(abs % 60).padStart(2, "0");
  return `${y}-${m}-${d}T${hh}:${mm}:${ss}${sign}${oh}:${om}`;
}

function getOffsetMinutes(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUTC = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return Math.round((asUTC - date.getTime()) / 60000);
}

function dayOfWeekDe(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    timeZone,
    weekday: "long",
  }).format(date);
}

export function computeLightDay(
  isoDate: string,
  latitude: number,
  longitude: number,
): LightDayResult {
  // Build a noon-UTC anchor for the given calendar date so SunCalc
  // gets a stable instant within the day.
  const [y, m, d] = isoDate.split("-").map(Number);
  const anchor = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const times = SunCalc.getTimes(anchor, latitude, longitude);
  const moon = SunCalc.getMoonIllumination(anchor);

  const sunrise = times.sunrise;
  const sunset = times.sunset;
  const dayLengthMinutes = Math.round(
    (sunset.getTime() - sunrise.getTime()) / 60000,
  );

  return {
    date: isoDate,
    dayOfWeek: dayOfWeekDe(anchor, TIMEZONE),
    dawn: toIsoLocal(times.dawn, TIMEZONE),
    sunrise: toIsoLocal(times.sunrise, TIMEZONE),
    goldenHourMorningEnd: toIsoLocal(times.goldenHourEnd, TIMEZONE),
    solarNoon: toIsoLocal(times.solarNoon, TIMEZONE),
    goldenHourEveningStart: toIsoLocal(times.goldenHour, TIMEZONE),
    sunset: toIsoLocal(times.sunset, TIMEZONE),
    dusk: toIsoLocal(times.dusk, TIMEZONE),
    dayLengthMinutes,
    moonPhase: Number(moon.phase.toFixed(3)),
    moonIllumination: Number(moon.fraction.toFixed(3)),
  };
}

export function eachIsoDate(start: string, end: string): string[] {
  const out: string[] = [];
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  const startUTC = Date.UTC(sy, sm - 1, sd);
  const endUTC = Date.UTC(ey, em - 1, ed);
  for (let t = startUTC; t <= endUTC; t += 86400000) {
    const dd = new Date(t);
    const yy = dd.getUTCFullYear();
    const mm = String(dd.getUTCMonth() + 1).padStart(2, "0");
    const dy = String(dd.getUTCDate()).padStart(2, "0");
    out.push(`${yy}-${mm}-${dy}`);
  }
  return out;
}
