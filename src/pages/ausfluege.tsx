import { useState } from "react";
import { Camera, MapPin, AlertTriangle, Clock, Car, Moon, EyeOff, CheckSquare, Square } from "lucide-react";
import { excursions, generalCameraTips, type ExcursionCategory, type AstroSetupItem } from "@/data/excursions";
import { MorgenInspiration } from "@/components/morgen-inspiration";
import { useAstroMode } from "@/lib/astro-mode";

const CATEGORIES: { id: ExcursionCategory | "alle"; label: string }[] = [
  { id: "alle", label: "Alle" },
  { id: "wandern", label: "Wandern" },
  { id: "wasser", label: "Wasser" },
  { id: "nacht", label: "Nacht" },
  { id: "aussicht", label: "Aussicht" },
  { id: "insel", label: "Inselausflug" },
];

function AstroProfileSection({ items }: { items: AstroSetupItem[] }) {
  return (
    <div className="space-y-2 border-l-2 border-red-900/60 pl-4 py-1">
      <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground inline-flex items-center gap-2">
        <Moon className="w-3 h-3" /> S25 Ultra — Astro Pro-Setup
      </h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {items.map((item) => (
          <div key={item.label}>
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground">{item.label}</p>
            <p className="text-xs font-mono text-foreground leading-snug">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChecklistSection({ items }: { items: string[] }) {
  const [checked, setChecked] = useState<boolean[]>(() => items.map(() => false));
  const allDone = checked.every(Boolean);
  const toggle = (i: number) => setChecked((prev) => prev.map((v, idx) => idx === i ? !v : v));
  return (
    <div className="space-y-2 border border-border/50 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">Checkliste Abfahrt</h3>
        {allDone && (
          <span className="text-[9px] uppercase tracking-widest text-primary">Alles bereit ✓</span>
        )}
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={item}>
            <button
              onClick={() => toggle(i)}
              className="flex items-start gap-3 w-full text-left group"
            >
              {checked[i]
                ? <CheckSquare className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                : <Square className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground group-hover:text-foreground" />
              }
              <span className={`text-sm leading-snug transition-colors ${checked[i] ? "line-through text-muted-foreground" : "text-foreground"}`}>
                {item}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AstroModeToggle() {
  const [astroMode, setAstroMode] = useAstroMode();
  return (
    <button
      onClick={() => setAstroMode(!astroMode)}
      className={`w-full inline-flex items-center justify-center gap-2 border px-3 py-3 text-[10px] uppercase tracking-widest transition-colors ${
        astroMode
          ? "border-red-800 bg-red-950/60 text-red-400"
          : "border-border text-foreground hover:bg-muted/40"
      }`}
    >
      {astroMode ? <Moon className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
      {astroMode ? "Astro-Modus an — Display dunkelrot" : "Astro-Modus aus"}
    </button>
  );
}

export default function Ausfluege() {
  const [filter, setFilter] = useState<ExcursionCategory | "alle">("alle");
  const items = filter === "alle" ? excursions : excursions.filter((e) => e.category === filter);

  return (
    <div className="p-6 pt-12 pb-12 flex flex-col gap-8">
      <header>
        <h1 className="text-4xl text-foreground">Touren</h1>
        <p className="text-sm font-serif italic text-muted-foreground mt-2">
          Wege, Wasser, Nacht — mit Notizen zur Kamera.
        </p>
      </header>

      <MorgenInspiration />

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 hide-scrollbar">
        {CATEGORIES.map((c) => {
          const active = filter === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              className={`shrink-0 px-4 py-2 border text-xs uppercase tracking-widest transition-colors ${
                active
                  ? "bg-foreground text-background border-foreground"
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <section className="border border-border/60 p-5 space-y-3">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Camera className="w-3 h-3" /> Kamera — allgemein
        </h2>
        <ul className="space-y-3">
          {generalCameraTips.map((t) => (
            <li key={t.title}>
              <p className="text-sm font-medium text-foreground">{t.title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{t.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="space-y-10">
        {items.map((e) => (
          <article key={e.id} className="border-b border-border/50 pb-8 last:border-0 space-y-5">
            <header className="space-y-2">
              <h2 className="text-2xl font-serif text-foreground leading-tight">{e.title}</h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {e.area}
                </span>
                {e.duration && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {e.duration}
                  </span>
                )}
              </div>
            </header>

            <p className="text-sm leading-relaxed text-foreground/85">{e.description}</p>

            {e.notes.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">Notizen</h3>
                <ul className="space-y-1.5">
                  {e.notes.map((n, i) => (
                    <li key={i} className="text-sm text-foreground/80 flex gap-3">
                      <span className="text-muted-foreground font-mono shrink-0">·</span>
                      <span>{n}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {e.cameraTips.length > 0 && (
              <div className="space-y-2 border-l-2 border-primary/40 pl-4 py-1">
                <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground inline-flex items-center gap-2">
                  <Camera className="w-3 h-3" /> Kamera — Notizen
                </h3>
                <ul className="space-y-1.5">
                  {e.cameraTips.map((t, i) => (
                    <li key={i} className="text-sm text-foreground/85 flex gap-3">
                      <span className="text-muted-foreground font-mono shrink-0">·</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {e.astroProfile && e.astroProfile.length > 0 && (
              <AstroProfileSection items={e.astroProfile} />
            )}

            {e.checklist && e.checklist.length > 0 && (
              <ChecklistSection items={e.checklist} />
            )}

            {e.astroProfile && (
              <AstroModeToggle />
            )}

            {e.parking && (
              <div className="space-y-2 border-l-2 border-secondary/40 pl-4 py-1">
                <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground inline-flex items-center gap-2">
                  <Car className="w-3 h-3" /> Parken
                </h3>
                <p className="text-sm text-foreground/85 leading-relaxed">{e.parking}</p>
              </div>
            )}

            {e.caution && (
              <div className="flex gap-3 items-start text-xs text-muted-foreground border border-border/40 px-3 py-2">
                <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                <span>{e.caution}</span>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
