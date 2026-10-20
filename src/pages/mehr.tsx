import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Sun, Mountain, Utensils, Bell, BellOff, Database, ChevronRight, Loader2, Tv2, CalendarDays, Zap, ZapOff, Moon, EyeOff, Compass } from "lucide-react";
import { isWakeLockSupported, useKeepAliveToggle } from "@/lib/keep-alive";
import { useAstroMode } from "@/lib/astro-mode";
import {
  isEnabled,
  notificationsSupported,
  permission,
  requestPermission,
  setEnabled,
  subscribeNotifications,
} from "@/lib/notifications";
import { buildEvents } from "@/lib/events";

export default function Mehr() {
  return (
    <div className="p-6 pt-12 pb-12 flex flex-col gap-8">
      <header>
        <h1 className="text-4xl text-foreground">Mehr</h1>
        <p className="text-sm font-serif italic text-muted-foreground mt-2">
          Nebengleise — Licht, Ausflüge, Daten, Jetzt-Moment.
        </p>
      </header>

      <nav className="flex flex-col">
        <Row href="/light" icon={Sun} label="Licht — Tagesverlauf" hint="Dämmerung, goldene & blaue Stunde, Zenit." />
        <Row href="/ausfluege" icon={Mountain} label="Ausflüge" hint="Anaga, Teide, Punta de Teno, Wal-Tour…" />
        <Row href="/guachinches" icon={Utensils} label="Guachinches (Liste)" hint="Lange Form. Karte zeigt sie alle als Pins." />
        <Row href="/tagesplaner" icon={CalendarDays} label="Tagesplaner" hint="Wetterbasierte Route: drei Spots für heute." />
        <Row href="/richtung" icon={Compass} label="Richtung" hint="Drei Stichworte — eine Einladung, wohin du schaust." />
        <Row href="/slideshow" icon={Tv2} label="Reise-Diashow" hint="Alle Logbuch-Fotos im Vollbild — ideal am TV." />
      </nav>

      <JetztMomentSection />

      <AstroModeSection />

      <KeepAliveSection />

      <DatenSection />
    </div>
  );
}

function Row({
  href,
  icon: Icon,
  label,
  hint,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 py-4 border-t border-border/50 last:border-b hover:bg-muted/20 transition-colors"
    >
      <Icon className="w-5 h-5 shrink-0 text-foreground" strokeWidth={1.5} />
      <div className="flex-1 min-w-0">
        <p className="text-foreground font-serif">{label}</p>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">{hint}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </Link>
  );
}

function JetztMomentSection() {
  const supported = notificationsSupported();
  const [perm, setPerm] = useState<NotificationPermission>(supported ? permission() : "denied");
  const [enabled, setEnabledState] = useState(supported && isEnabled());
  const [busy, setBusy] = useState(false);
  const [upcomingCount, setUpcomingCount] = useState(0);

  useEffect(() => {
    setUpcomingCount(buildEvents().length);
    return subscribeNotifications(() => {
      setEnabledState(isEnabled());
      setPerm(permission());
    });
  }, []);

  const handleToggle = async () => {
    if (!supported) return;
    setBusy(true);
    try {
      if (!enabled) {
        const result = perm === "granted" ? perm : await requestPermission();
        setPerm(result);
        if (result === "granted") {
          setEnabled(true);
          setEnabledState(true);
        }
      } else {
        setEnabled(false);
        setEnabledState(false);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-3 pt-6 border-t border-border/50">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[10px] uppercase tracking-widest text-muted-foreground">Jetzt-Moment</h2>
        {supported && perm === "granted" && (
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {upcomingCount} geplant
          </span>
        )}
      </div>
      <p className="text-xs text-foreground/85 leading-relaxed">
        Stille Erinnerungen für goldene Stunde am Abend, Astro-Fenster auf dem
        Teide und Walbeobachtung morgens ab Los Gigantes.
      </p>

      <button
        onClick={handleToggle}
        disabled={!supported || busy || perm === "denied"}
        className={`w-full inline-flex items-center justify-center gap-2 border px-3 py-3 text-[10px] uppercase tracking-widest ${enabled ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground hover:bg-muted/40"} disabled:opacity-50`}
      >
        {busy ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : enabled ? (
          <>
            <Bell className="w-3 h-3" /> Jetzt-Moment an
          </>
        ) : (
          <>
            <BellOff className="w-3 h-3" /> Jetzt-Moment aus
          </>
        )}
      </button>

      <div className="text-[10px] leading-relaxed text-muted-foreground space-y-1">
        {!supported && (
          <p>Dein Browser unterstützt keine Benachrichtigungen.</p>
        )}
        {supported && perm === "denied" && (
          <p>Benachrichtigungen wurden im Browser blockiert. Über die System-Einstellungen wieder erlauben.</p>
        )}
        <p>
          Ehrlich: Erinnerungen feuern zuverlässig, solange die App im Hintergrund
          aktiv ist. Für echte Hintergrund-Pushs (App komplett zu, Handy gesperrt)
          die App auf dem Homebildschirm installieren — Samsung Internet & Chrome
          unterstützen das, iOS Safari nur sehr eingeschränkt.
        </p>
      </div>
    </section>
  );
}

function AstroModeSection() {
  const [astroMode, setAstroMode] = useAstroMode();
  return (
    <section className="space-y-3 pt-6 border-t border-border/50">
      <h2 className="text-[10px] uppercase tracking-widest text-muted-foreground">Astro-Modus</h2>
      <p className="text-xs text-foreground/85 leading-relaxed">
        Schaltet das Display auf ein tiefes Dunkelrot. Schützt die Dunkeladaption der Augen
        beim Fotografieren auf dem Teide (2000 m+).
      </p>
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
      <p className="text-[10px] leading-relaxed text-muted-foreground">
        Auch direkt auf der Teide-Tour-Seite umschaltbar. Einstellung bleibt bis
        zum nächsten manuellen Deaktivieren gespeichert.
      </p>
    </section>
  );
}

function KeepAliveSection() {
  const { enabled, toggle } = useKeepAliveToggle();
  const wakeLockOk = isWakeLockSupported();

  return (
    <section className="space-y-3 pt-6 border-t border-border/50">
      <h2 className="text-[10px] uppercase tracking-widest text-muted-foreground">Keep-Alive</h2>
      <p className="text-xs text-foreground/85 leading-relaxed">
        Hält den Bildschirm wach und den Server warm — ideal beim aktiven Fotografieren oder
        wenn die App ständig im Blick bleiben soll.
      </p>

      <button
        onClick={toggle}
        className={`w-full inline-flex items-center justify-center gap-2 border px-3 py-3 text-[10px] uppercase tracking-widest transition-colors ${
          enabled
            ? "border-primary bg-primary/10 text-primary"
            : "border-border text-foreground hover:bg-muted/40"
        }`}
      >
        {enabled ? (
          <>
            <Zap className="w-3 h-3" /> Keep-Alive an
          </>
        ) : (
          <>
            <ZapOff className="w-3 h-3" /> Keep-Alive aus
          </>
        )}
      </button>

      <div className="text-[10px] leading-relaxed text-muted-foreground space-y-1">
        {!wakeLockOk && (
          <p>Bildschirm-Wachhalten wird von diesem Browser nicht unterstützt — Server-Ping läuft trotzdem.</p>
        )}
        {wakeLockOk && enabled && (
          <p>Bildschirm bleibt an · Server-Ping alle 4 Minuten.</p>
        )}
        {!enabled && (
          <p>Deaktiviert — Bildschirm schläft normal, Server kann kalt werden.</p>
        )}
      </div>
    </section>
  );
}

function DatenSection() {
  return (
    <section className="space-y-3 pt-6 border-t border-border/50">
      <h2 className="text-[10px] uppercase tracking-widest text-muted-foreground">Daten</h2>
      <p className="text-xs text-foreground/85 leading-relaxed">
        Alles bleibt auf diesem Gerät. Logbuch-Texte und Vorschau-Bilder im
        Browser-Speicher, Original-Fotos zusätzlich im Foto-Speicher des
        Browsers (IndexedDB).
      </p>
      <Link
        href="/logbuch"
        className="inline-flex items-center gap-2 border border-border px-3 py-3 text-[10px] uppercase tracking-widest text-foreground hover:bg-muted/40 w-full justify-center"
      >
        <Database className="w-3 h-3" />
        Backup im Logbuch
      </Link>
    </section>
  );
}
