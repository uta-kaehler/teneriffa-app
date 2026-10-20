// Öffentliche Fassung: Was früher der kleine Server lieferte (Orte, Licht, Guachinches),
// rechnet die App jetzt selbst im Browser. Gleiche Namen wie die früheren API-Hooks,
// damit die Seiten unverändert bleiben.
import { useQuery } from "@tanstack/react-query";
import { LOCATIONS, getLocation, TRIP_START, TRIP_END } from "@/lib/reise/locations";
import { computeLightDay, eachIsoDate } from "@/lib/reise/light";
import { GUACHINCHES } from "@/lib/reise/guachinches";

export function useListLocations() {
  return useQuery({ queryKey: ["locations"], queryFn: async () => LOCATIONS, staleTime: Infinity });
}

export function useGetLightDay(locationId: string, date: string) {
  return useQuery({
    queryKey: ["light-day", locationId, date],
    queryFn: async () => {
      const loc = getLocation(locationId);
      if (!loc) throw new Error("Unbekannter Ort");
      return computeLightDay(date, loc.latitude, loc.longitude);
    },
    staleTime: Infinity,
  });
}

export const getGetLightWeekQueryKey = (locationId: string) => ["light-week", locationId];

export function useGetLightWeek(locationId: string, options?: { query?: { enabled?: boolean; queryKey?: unknown[] } }) {
  return useQuery({
    queryKey: getGetLightWeekQueryKey(locationId),
    enabled: options?.query?.enabled ?? true,
    queryFn: async () => {
      const loc = getLocation(locationId);
      if (!loc) throw new Error("Unbekannter Ort");
      return { locationId, days: eachIsoDate(TRIP_START, TRIP_END).map((d) => computeLightDay(d, loc.latitude, loc.longitude)) };
    },
    staleTime: Infinity,
  });
}

export function useListGuachinches(params?: { near?: string }) {
  return useQuery({
    queryKey: ["guachinches", params?.near ?? "alle"],
    queryFn: async () => (params?.near ? GUACHINCHES.filter((g) => g.near === params.near) : GUACHINCHES),
    staleTime: Infinity,
  });
}
