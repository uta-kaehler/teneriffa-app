import { useState } from "react";
import {
  getGetLightWeekQueryKey,
  useGetLightWeek,
  useListLocations,
} from "@/lib/lokal-api";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTabularTime } from "@/lib/location-helper";

export default function Light() {
  const { data: locations, isLoading: locLoading } = useListLocations();
  const [selectedLocId, setSelectedLocId] = useState<string>("los-realejos");

  const { data: lightWeek, isLoading: lightLoading } = useGetLightWeek(selectedLocId, {
    query: {
      enabled: !!selectedLocId,
      queryKey: getGetLightWeekQueryKey(selectedLocId),
    },
  });

  return (
    <div className="p-6 pt-12 pb-12 flex flex-col gap-8">
      <header className="space-y-4">
        <h1 className="text-4xl text-foreground">Licht</h1>
        <p className="text-sm font-serif italic text-muted-foreground">Der Rhythmus der Sonne auf der Insel.</p>
      </header>

      {locLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        <div className="flex gap-4 border-b border-border/50 pb-4">
          {locations?.map((loc) => (
            <button
              key={loc.id}
              onClick={() => setSelectedLocId(loc.id)}
              className={`text-xs uppercase tracking-widest pb-1 border-b-2 transition-colors ${
                selectedLocId === loc.id
                  ? "border-primary text-foreground font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {loc.name}
            </button>
          ))}
        </div>
      )}

      {lightLoading || !lightWeek ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="border-b border-border/50">
                <th className="pb-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Datum</th>
                <th className="pb-3 text-xs uppercase tracking-widest text-muted-foreground font-normal text-right">Aufgang</th>
                <th className="pb-3 text-xs uppercase tracking-widest text-muted-foreground font-normal text-right">Abend-Gold</th>
                <th className="pb-3 text-xs uppercase tracking-widest text-muted-foreground font-normal text-right">Untergang</th>
              </tr>
            </thead>
            <tbody>
              {lightWeek.days.map((day) => {
                const dateObj = new Date(day.date);
                const dateStr = dateObj.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
                return (
                  <tr key={day.date} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                    <td className="py-4">
                      <div className="font-mono text-sm">{dateStr}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">{day.dayOfWeek}</div>
                    </td>
                    <td className="py-4 font-mono text-sm text-right text-sun">{formatTabularTime(day.sunrise)}</td>
                    <td className="py-4 font-mono text-sm text-right text-muted-foreground">{formatTabularTime(day.goldenHourEveningStart)}</td>
                    <td className="py-4 font-mono text-sm text-right text-sun">{formatTabularTime(day.sunset)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
