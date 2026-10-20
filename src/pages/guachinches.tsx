import { useState } from "react";
import { useListGuachinches, useListLocations } from "@/lib/lokal-api";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin } from "lucide-react";

export default function Guachinches() {
  const [filterLoc, setFilterLoc] = useState<string | undefined>(undefined);
  const { data: locations } = useListLocations();
  const { data: guachinches, isLoading } = useListGuachinches(filterLoc ? { near: filterLoc } : undefined);

  return (
    <div className="p-6 pt-12 pb-12 flex flex-col gap-8">
      <header className="space-y-4">
        <h1 className="text-4xl text-foreground">Guachinches</h1>
        <p className="text-sm font-serif italic text-muted-foreground">Authentische lokale Küche ohne Umwege.</p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 hide-scrollbar">
        <button
          onClick={() => setFilterLoc(undefined)}
          className={`shrink-0 px-4 py-2 border text-xs uppercase tracking-widest transition-colors ${
            filterLoc === undefined
              ? "bg-foreground text-background border-foreground"
              : "bg-transparent text-muted-foreground border-border hover:border-foreground"
          }`}
        >
          Alle
        </button>
        {locations?.map((loc) => (
          <button
            key={loc.id}
            onClick={() => setFilterLoc(loc.id)}
            className={`shrink-0 px-4 py-2 border text-xs uppercase tracking-widest transition-colors ${
              filterLoc === loc.id
                ? "bg-foreground text-background border-foreground"
                : "bg-transparent text-muted-foreground border-border hover:border-foreground"
            }`}
          >
            {loc.name}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {guachinches?.map(g => (
            <article key={g.id} className="border-b border-border/50 pb-8 last:border-0">
              <div className="flex justify-between items-start mb-2 gap-3">
                <h2 className="text-xl font-serif">{g.name}</h2>
                <span className="font-mono text-muted-foreground text-sm">{g.priceLevel}</span>
              </div>
              <div className="flex items-center gap-1 text-xs uppercase tracking-widest text-muted-foreground mb-4">
                <MapPin className="w-3 h-3" />
                {g.town}
              </div>

              <p className="text-sm leading-relaxed mb-4 text-foreground/80">
                {g.description}
              </p>

              <div className="space-y-4 border-l-2 border-primary/20 pl-4 py-1">
                <div>
                  <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Spezialitäten</h3>
                  <p className="text-sm font-medium">{g.signatureDishes.join(" • ")}</p>
                </div>
                <div>
                  <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Hinweis</h3>
                  <p className="text-sm italic font-serif text-muted-foreground">{g.openingNote}</p>
                </div>
              </div>
            </article>
          ))}
          {guachinches?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground font-serif italic border border-dashed border-border">
              Keine Einträge für diese Region gefunden.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
