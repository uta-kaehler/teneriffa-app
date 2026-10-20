export function getCurrentLocationContext() {
  // Hardcoded target date for testing, since the trip lies in the future.
  // In a real app we'd use new Date() but to show the dashboard properly we simulate a trip day.
  // Let's default to today's date if it falls within the trip, otherwise default to the first trip day.

  const now = new Date();
  const tripStart = new Date("2027-05-30T00:00:00Z");
  const week2Start = new Date("2027-06-07T00:00:00Z");
  const tripEnd = new Date("2027-06-13T23:59:59Z");

  let targetDate = now;
  let isSimulated = false;

  if (now < tripStart || now > tripEnd) {
    targetDate = tripStart; // Simulate first day
    isSimulated = true;
  }

  const dateString = targetDate.toISOString().split("T")[0];
  const locationId = targetDate >= week2Start ? "los-gigantes" : "los-realejos";

  return {
    date: dateString,
    locationId,
    isSimulated
  };
}

const TRIP_START_MS = Date.UTC(2027, 4, 30); // Beispielreise, 30. Mai
const TRIP_DAYS = 15; // May 31 – June 14 inclusive

export function getTripDay(): { day: number; total: number } | null {
  const diff = Math.floor((Date.now() - TRIP_START_MS) / 86_400_000);
  if (diff < 0 || diff >= TRIP_DAYS) return null;
  return { day: diff + 1, total: TRIP_DAYS };
}

export function formatTabularTime(isoString: string) {
  const d = new Date(isoString);
  return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

export function getDayLabel(dateString: string) {
  const d = new Date(dateString);
  return d.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long" });
}
