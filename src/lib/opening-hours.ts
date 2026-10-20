export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface DaySchedule {
  open: string;
  close: string;
}

export type WeeklyHours = Partial<Record<Weekday, DaySchedule[]>>;

const WEEKDAY_LABELS_DE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
const SHORT_WEEKDAY_DE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function minutesToTime(min: number): string {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
}

export type OpenStatus =
  | { state: "open"; closesAt: string; closesInMin: number }
  | { state: "opens-today"; opensAt: string; opensInMin: number }
  | { state: "closed-today" }
  | { state: "unknown" };

export function getOpenStatus(
  hours: WeeklyHours | undefined,
  now: Date = new Date(),
): OpenStatus {
  if (!hours) return { state: "unknown" };
  const day = now.getDay() as Weekday;
  const today = hours[day];
  if (!today || today.length === 0) {
    return { state: "closed-today" };
  }
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  for (const slot of today) {
    const o = timeToMinutes(slot.open);
    const c = timeToMinutes(slot.close);
    if (minutesNow >= o && minutesNow < c) {
      return {
        state: "open",
        closesAt: slot.close,
        closesInMin: c - minutesNow,
      };
    }
  }
  const upcoming = today
    .map((s) => timeToMinutes(s.open))
    .filter((m) => m > minutesNow)
    .sort((a, b) => a - b)[0];
  if (upcoming !== undefined) {
    return {
      state: "opens-today",
      opensAt: minutesToTime(upcoming),
      opensInMin: upcoming - minutesNow,
    };
  }
  return { state: "closed-today" };
}

export function formatOpenStatus(status: OpenStatus): string {
  switch (status.state) {
    case "open":
      return status.closesInMin <= 60
        ? `Jetzt offen — schließt in ${status.closesInMin} min`
        : `Jetzt offen — bis ${status.closesAt}`;
    case "opens-today":
      return status.opensInMin <= 90
        ? `Öffnet in ${status.opensInMin} min`
        : `Öffnet heute um ${status.opensAt}`;
    case "closed-today":
      return "Heute geschlossen";
    case "unknown":
      return "Öffnungszeiten unbekannt";
  }
}

export function statusTone(status: OpenStatus): "open" | "warn" | "closed" | "muted" {
  if (status.state === "open") {
    return status.closesInMin <= 30 ? "warn" : "open";
  }
  if (status.state === "opens-today") {
    return status.opensInMin <= 120 ? "warn" : "muted";
  }
  if (status.state === "closed-today") return "closed";
  return "muted";
}

export function summarizeHours(hours: WeeklyHours | undefined): string {
  if (!hours) return "—";
  const rows: { days: number[]; slots: DaySchedule[] }[] = [];
  for (let d = 0 as Weekday; d <= 6; d = (d + 1) as Weekday) {
    const slots = hours[d];
    if (!slots) continue;
    const last = rows[rows.length - 1];
    const same =
      last &&
      last.slots.length === slots.length &&
      last.slots.every(
        (s, i) => s.open === slots[i].open && s.close === slots[i].close,
      );
    if (same) {
      last.days.push(d);
    } else {
      rows.push({ days: [d], slots });
    }
  }
  return rows
    .map((r) => {
      const dayLabel =
        r.days.length === 1
          ? SHORT_WEEKDAY_DE[r.days[0]]
          : `${SHORT_WEEKDAY_DE[r.days[0]]}–${SHORT_WEEKDAY_DE[r.days[r.days.length - 1]]}`;
      const slotLabel = r.slots.map((s) => `${s.open}–${s.close}`).join(", ");
      return `${dayLabel} ${slotLabel}`;
    })
    .join(" · ");
}

export { WEEKDAY_LABELS_DE };
