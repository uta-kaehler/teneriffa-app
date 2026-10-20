import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Polyline, CircleMarker, TileLayer, useMap } from "react-leaflet";
import { divIcon, type LatLngExpression } from "leaflet";
import { Crosshair, X, Navigation, ChevronRight, Clock, CameraIcon, PenLine, MapPin, Plus, Loader2, BookOpen } from "lucide-react";
import { useLocation } from "wouter";
import {
  CATEGORY_GLYPH,
  CATEGORY_LABEL,
  SPOTS,
  effortLabel,
  photoDensityLabel,
  type Spot,
  type SpotCategory,
} from "@/data/spots";
import {
  getCurrentPosition,
  getVisitedAt,
  getVisitedIds,
  getVisitedAll,
  markVisited,
  subscribeVisited,
  unmarkVisited,
  distanceMeters,
} from "@/lib/visited";
import { storeLastGps } from "@/lib/notifications";
import { formatOpenStatus, getOpenStatus, statusTone, summarizeHours } from "@/lib/opening-hours";
import { getEntries, saveEntry, subscribeLogbuch, type LogbookEntry } from "@/lib/logbuch";
import "leaflet/dist/leaflet.css";

const TENERIFE_CENTER: LatLngExpression = [28.34, -16.55];
const GC_CENTER: LatLngExpression = [27.95, -15.59];
const ALL_CATEGORIES: SpotCategory[] = ["guachinche", "markt", "laden", "fotospot", "lebendig"];
const NEAR_KM = 8;
type Island = "tenerife" | "gran-canaria";

const HIGHLIGHT_IDS = new Set([
  "f-drago", "f-garachico-mirador", "f-anaga-bailadero", "f-cruz-carmen",
  "f-pico-ingles", "f-benijo", "f-charco-viento", "f-archipenque",
  "f-playa-arena", "f-roques-garcia", "f-medano", "f-piramides-guimar",
  "f-caleton-garachico", "f-bajamar-charco", "f-faro-abona", "f-punta-teno",
  "p-vilaflor", "p-masca", "p-los-gigantes-hafen",
]);

function spotIcon(s: Spot, visited: boolean, picked: boolean = false) {
  const star = !picked && HIGHLIGHT_IDS.has(s.id) ? `<span class="spot-star">★</span>` : "";
  const cls = picked ? " route-picked" : visited ? " visited" : "";
  const glyph = picked ? "✓" : CATEGORY_GLYPH[s.category];
  return divIcon({
    className: "spot-pin-wrapper",
    html: `<div class="spot-pin cat-${s.category}${cls}">${glyph}${star}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function youAreHereIcon() {
  return divIcon({
    className: "spot-pin-wrapper",
    html: `<div class="spot-pin you-are-here"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

const ROUTE_NEAR_KM = 5;

async function geocodeTenerife(query: string): Promise<[number, number] | null> {
  try {
    const q = encodeURIComponent(query);
    const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=5&countrycodes=es`;
    const res = await fetch(url, { headers: { "Accept-Language": "de,es,en" } });
    const data = await res.json() as Array<{ lat: string; lon: string }>;
    // pick first result that falls inside Tenerife bbox
    const hit = data.find((r) => {
      const lat = parseFloat(r.lat);
      const lon = parseFloat(r.lon);
      return lat >= 27.9 && lat <= 28.65 && lon >= -16.95 && lon <= -16.1;
    }) ?? data[0];
    if (!hit) return null;
    return [parseFloat(hit.lat), parseFloat(hit.lon)];
  } catch {
    return null;
  }
}

function FlyToControl({ position, trigger }: { position: LatLngExpression | undefined; trigger: number }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 13, { duration: 0.8 });
  }, [trigger, position, map]);
  return null;
}

function FlyToIsland({ island, trigger }: { island: Island; trigger: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(island === "gran-canaria" ? GC_CENTER : TENERIFE_CENTER, 10, { duration: 1.2 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);
  return null;
}

export default function Karte() {
  const [island, setIsland] = useState<Island>("tenerife");
  const [islandFlyTrigger, setIslandFlyTrigger] = useState(0);
  const [categories, setCategories] = useState<Set<SpotCategory>>(new Set(ALL_CATEGORIES));
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [onlyNear, setOnlyNear] = useState(false);
  const [selected, setSelected] = useState<Spot | undefined>(undefined);
  const [visited, setVisited] = useState<Set<string>>(() => getVisitedIds());
  const [me, setMe] = useState<LatLngExpression | undefined>(undefined);
  const [flyTrigger, setFlyTrigger] = useState(0);
  const [locating, setLocating] = useState(false);
  const [routePoints, setRoutePoints] = useState<[number, number][]>([]);
  const [routeLabels, setRouteLabels] = useState<string[]>([]);
  const [onlyOnRoute, setOnlyOnRoute] = useState(false);
  const [showRoutePanel, setShowRoutePanel] = useState(false);
  const [routePickMode, setRoutePickMode] = useState(false);
  const [pickedSpotIds, setPickedSpotIds] = useState<string[]>([]);

  const switchIsland = (next: Island) => {
    setIsland(next);
    setSelected(undefined);
    setIslandFlyTrigger((n) => n + 1);
  };

  const nearRouteIds = useMemo(() => {
    if (routePoints.length === 0) return new Set<string>();
    const near = new Set<string>();
    for (const s of SPOTS) {
      for (const [rlat, rlng] of routePoints) {
        if (distanceMeters({ lat: rlat, lng: rlng }, { lat: s.lat, lng: s.lng }) <= ROUTE_NEAR_KM * 1000) {
          near.add(s.id);
          break;
        }
      }
    }
    return near;
  }, [routePoints]);

  useEffect(() => subscribeVisited(() => setVisited(getVisitedIds())), []);

  // Den eigenen Standort nur zeigen, wenn er schon erlaubt ist; gefragt wird erst über den GPS-Knopf
  useEffect(() => {
    if (!navigator.permissions?.query) return;
    navigator.permissions.query({ name: "geolocation" as PermissionName })
      .then((status) => (status.state === "granted" ? getCurrentPosition() : Promise.reject()))
      .then((pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setMe([lat, lng]);
        storeLastGps(lat, lng);
      })
      .catch(() => { /* Berechtigung verweigert oder nicht verfügbar */ });
  }, []);

  const islandSpots = useMemo(() => SPOTS.filter((s) => (s.island ?? "tenerife") === island), [island]);

  const visibleSpots = useMemo(() => {
    return islandSpots.filter((s) => {
      if (!categories.has(s.category)) return false;
      if (onlyOpen) {
        const st = getOpenStatus(s.hours);
        if (st.state !== "open" && st.state !== "opens-today") return false;
      }
      if (onlyNear && me) {
        const [lat, lng] = Array.isArray(me) ? me : [(me as { lat: number; lng: number }).lat, (me as { lat: number; lng: number }).lng];
        const dist = distanceMeters({ lat: lat as number, lng: lng as number }, { lat: s.lat, lng: s.lng });
        if (dist > NEAR_KM * 1000) return false;
      }
      if (onlyOnRoute && routePoints.length > 0) {
        if (!nearRouteIds.has(s.id)) return false;
      }
      return true;
    });
  }, [islandSpots, categories, onlyOpen, onlyNear, me, onlyOnRoute, nearRouteIds, routePoints.length]);

  const openCount = useMemo(() => islandSpots.filter((s) => getOpenStatus(s.hours).state === "open").length, [islandSpots]);
  const [tagesrouteSaved, setTagesrouteSaved] = useState(false);

  const savePlannedRoute = async (waypoints: string[]) => {
    await saveEntry({
      bullets: waypoints.map((w) => `• ${w}`).join("\n"),
      text: `Geplante Route: ${waypoints.join(" → ")}`,
      location: waypoints[0],
      timeOfDay: "Geplante Route",
    });
  };

  const buildRouteFromPicks = () => {
    const spots = pickedSpotIds.map((id) => SPOTS.find((s) => s.id === id)).filter(Boolean) as typeof SPOTS;
    setRoutePoints(spots.map((s) => [s.lat, s.lng]));
    setRouteLabels(spots.map((s) => s.name));
    setPickedSpotIds([]);
    setRoutePickMode(false);
    setOnlyOnRoute(false);
  };

  const handleSaveTagesroute = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const records = getVisitedAll().filter((r) => r.visitedAt >= today.getTime());
    if (records.length === 0) return;
    records.sort((a, b) => a.visitedAt - b.visitedAt);
    const withNames = records.map((r) => {
      const spot = SPOTS.find((s) => s.id === r.spotId);
      const name = spot?.name ?? r.spotId;
      const time = new Date(r.visitedAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
      return { name, time };
    });
    await saveEntry({
      bullets: withNames.map(({ time, name }) => `• ${time} – ${name}`).join("\n"),
      text: `Tagesroute: ${withNames.map((x) => x.name).join(" → ")}`,
      location: withNames[0]?.name,
      timeOfDay: "Tagesroute",
    });
    setTagesrouteSaved(true);
    setTimeout(() => setTagesrouteSaved(false), 3000);
  };

  const handleLocateMe = async () => {
    setLocating(true);
    try {
      const pos = await getCurrentPosition();
      const { latitude: lat, longitude: lng } = pos.coords;
      setMe([lat, lng]);
      setFlyTrigger((n) => n + 1);
      storeLastGps(lat, lng); // share with notification geofence
    } catch { /* user denied */ }
    finally { setLocating(false); }
  };

  const toggleCategory = (cat: SpotCategory) => {
    setCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next.size === 0 ? new Set(ALL_CATEGORIES) : next;
    });
  };

  return (
    <div className="relative h-[calc(100dvh-7rem)] flex flex-col bg-background">
      <header className="px-5 pt-10 pb-2 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl text-foreground">Karte</h1>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-0.5">
            {visibleSpots.length} sichtbar · {islandSpots.length} gesamt
          </p>
        </div>
        {visited.size > 0 && (
          <button
            onClick={() => void handleSaveTagesroute()}
            className="flex items-center gap-1.5 border border-border px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground shrink-0"
            title="Heutige Besuche ins Logbuch"
          >
            <BookOpen className="w-3.5 h-3.5" />
            {tagesrouteSaved ? "✓ Gespeichert" : "Tagesroute"}
          </button>
        )}
      </header>

      {/* Island toggle */}
      <div className="flex gap-0 px-5 pb-2">
        <button
          onClick={() => switchIsland("tenerife")}
          style={{ touchAction: "manipulation" }}
          className={`flex-1 py-2 text-[10px] uppercase tracking-widest border transition-colors ${island === "tenerife" ? "bg-foreground text-background border-foreground" : "bg-transparent text-muted-foreground border-border"}`}
        >
          Teneriffa
        </button>
        <button
          onClick={() => switchIsland("gran-canaria")}
          style={{ touchAction: "manipulation" }}
          className={`flex-1 py-2 text-[10px] uppercase tracking-widest border-t border-b border-r transition-colors ${island === "gran-canaria" ? "bg-foreground text-background border-foreground" : "bg-transparent text-muted-foreground border-border"}`}
        >
          Gran Canaria
        </button>
      </div>

      {/* Quick-filter bar */}
      <div className="flex items-center gap-2 px-5 pb-3 overflow-x-auto no-scrollbar">
        <QuickChip label={`Jetzt offen (${openCount})`} active={onlyOpen} onToggle={() => setOnlyOpen((v) => !v)} />
        <QuickChip
          label={me ? `< ${NEAR_KM} km` : "In der Nähe"}
          active={onlyNear}
          onToggle={async () => {
            if (!me) await handleLocateMe();
            setOnlyNear((v) => !v);
          }}
        />
        <QuickChip label={locating ? "…" : "GPS"} active={false} onToggle={handleLocateMe} subtle />
        <QuickChip
          label={routePoints.length > 0 ? `↝ Route (${nearRouteIds.size})` : "↝ Route"}
          active={onlyOnRoute}
          onToggle={() => {
            if (routePoints.length === 0) { setShowRoutePanel(true); return; }
            setOnlyOnRoute((v) => !v);
          }}
        />
        <QuickChip label="…" active={false} onToggle={() => setShowRoutePanel(true)} subtle />
        <div className="w-px h-4 bg-border/60 shrink-0" />
        {ALL_CATEGORIES.map((cat) => (
          <QuickChip
            key={cat}
            label={`${CATEGORY_GLYPH[cat]} ${cat === "lebendig" ? "Lebendig" : CATEGORY_LABEL[cat]}`}
            active={categories.has(cat)}
            onToggle={() => toggleCategory(cat)}
          />
        ))}
      </div>

      {routePickMode && (
        <div className="px-5 py-2.5 bg-primary/10 border-b border-primary/40 flex items-center justify-between shrink-0">
          <span className="text-xs font-mono text-primary">
            {pickedSpotIds.length === 0 ? "Spot antippen zum Hinzufügen…" : `${pickedSpotIds.length} Spot${pickedSpotIds.length !== 1 ? "s" : ""} gewählt`}
          </span>
          <div className="flex items-center gap-3">
            <button onClick={() => { setRoutePickMode(false); setPickedSpotIds([]); }} className="text-[10px] uppercase tracking-widest text-muted-foreground">Abbrechen</button>
            {pickedSpotIds.length >= 1 && (
              <button onClick={buildRouteFromPicks} className="text-[10px] uppercase tracking-widest text-primary font-semibold">Fertig →</button>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 relative border-y border-border/50">
        {/* Branding overlay — Teide-Silhouette */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none select-none">
          <img
            src={`${import.meta.env.BASE_URL}favicon.svg`}
            alt="Tenerife"
            className="w-9 h-9 opacity-60 drop-shadow-[0_1px_6px_rgba(201,168,76,0.5)]"
            draggable={false}
          />
        </div>
        <MapContainer center={TENERIFE_CENTER} zoom={10} minZoom={9} maxZoom={17} className="absolute inset-0" zoomControl attributionControl>
          <TileLayer attribution="© OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FlyToControl position={me} trigger={flyTrigger} />
          <FlyToIsland island={island} trigger={islandFlyTrigger} />
          {visibleSpots.map((s) => (
            <Marker
              key={s.id}
              position={[s.lat, s.lng]}
              icon={spotIcon(s, visited.has(s.id), pickedSpotIds.includes(s.id))}
              eventHandlers={{
                click: () => {
                  if (routePickMode) {
                    setPickedSpotIds((prev) =>
                      prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                    );
                  } else {
                    setSelected(s);
                  }
                },
              }}
            />
          ))}
          {me && <Marker position={me} icon={youAreHereIcon()} />}
          {routePoints.length >= 2 && (
            <Polyline positions={routePoints} pathOptions={{ color: "hsl(142,50%,45%)", weight: 3, opacity: 0.8, dashArray: "8 5" }} />
          )}
          {routePoints.map(([lat, lng], i) => (
            <CircleMarker key={i} center={[lat, lng]} radius={7} pathOptions={{ color: "hsl(142,50%,45%)", fillColor: "hsl(142,50%,45%)", fillOpacity: 1, weight: 2 }} />
          ))}
        </MapContainer>
      </div>

      {selected && <SpotSheet spot={selected} onClose={() => setSelected(undefined)} visited={visited.has(selected.id)} me={me} />}
      {showRoutePanel && (
        <RoutePanel
          routeLabels={routeLabels}
          hasRoute={routePoints.length > 0}
          onClose={() => setShowRoutePanel(false)}
          onBuild={async (waypoints) => {
            const results = await Promise.all(waypoints.filter(Boolean).map(geocodeTenerife));
            const points: [number, number][] = [];
            const labels: string[] = [];
            results.forEach((r, i) => { if (r) { points.push(r); labels.push(waypoints[i]); } });
            setRoutePoints(points);
            setRouteLabels(labels);
            if (points.length > 0) setOnlyOnRoute(false);
            return labels;
          }}
          onSaveRoute={savePlannedRoute}
          onPickFromMap={() => {
            setShowRoutePanel(false);
            setPickedSpotIds([]);
            setRoutePickMode(true);
          }}
          onClear={() => {
            setRoutePoints([]);
            setRouteLabels([]);
            setOnlyOnRoute(false);
            setShowRoutePanel(false);
          }}
        />
      )}
    </div>
  );
}

function QuickChip({ label, active, onToggle, subtle = false }: { label: string; active: boolean; onToggle: () => void; subtle?: boolean }) {
  return (
    <button
      onClick={onToggle}
      style={{ touchAction: "manipulation" }}
      className={`shrink-0 min-h-[44px] px-4 border text-[10px] uppercase tracking-widest whitespace-nowrap ${
        active ? "border-primary bg-primary/10 text-primary"
        : subtle ? "border-border/50 text-muted-foreground"
        : "border-border text-foreground hover:bg-muted/30"
      }`}
    >
      {active && !subtle && "✓ "}{label}
    </button>
  );
}

function RoutePanel({
  routeLabels, hasRoute, onClose, onBuild, onSaveRoute, onPickFromMap, onClear,
}: {
  routeLabels: string[];
  hasRoute: boolean;
  onClose: () => void;
  onBuild: (waypoints: string[]) => Promise<string[]>;
  onSaveRoute: (waypoints: string[]) => Promise<void>;
  onPickFromMap: () => void;
  onClear: () => void;
}) {
  const [inputs, setInputs] = useState<string[]>(routeLabels.length > 0 ? routeLabels : ["", "", ""]);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<number[]>([]);
  const [builtLabels, setBuiltLabels] = useState<string[]>([]);
  const [logbuchSaved, setLogbuchSaved] = useState(false);

  const setInput = (i: number, v: string) => { setInputs((prev) => prev.map((x, j) => j === i ? v : x)); setBuiltLabels([]); };
  const addInput = () => setInputs((prev) => [...prev, ""]);
  const removeInput = (i: number) => setInputs((prev) => prev.filter((_, j) => j !== i));

  const handleBuild = async () => {
    const waypoints = inputs.map((s) => s.trim()).filter(Boolean);
    if (waypoints.length < 1) return;
    setBusy(true);
    setFailed([]);
    setBuiltLabels([]);
    setLogbuchSaved(false);
    const results = await Promise.all(waypoints.map(geocodeTenerife));
    const failedIdx = results.map((r, i) => r ? -1 : i).filter((i) => i >= 0);
    setFailed(failedIdx);
    if (failedIdx.length === 0) {
      const labels = await onBuild(waypoints);
      setBuiltLabels(labels);
    }
    setBusy(false);
  };

  const handleSaveLogbuch = async () => {
    if (builtLabels.length === 0) return;
    await onSaveRoute(builtLabels);
    setLogbuchSaved(true);
  };

  const routeReady = builtLabels.length > 0;

  return (
    <div className="fixed inset-0 z-[1200] bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-background border-t border-border overflow-y-auto"
        style={{ maxHeight: "75svh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Route eingeben</span>
            </div>
            <button onClick={onClose} className="p-2"><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>

          <p className="text-xs text-muted-foreground font-serif italic">Orte der Reihe nach — zeigt Spots in 5 km Nähe.</p>

          {inputs.map((val, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-muted-foreground w-4 shrink-0">{i + 1}</span>
              <input
                type="text"
                value={val}
                onChange={(e) => setInput(i, e.target.value)}
                placeholder={i === 0 ? "z.B. La Orotava" : i === 1 ? "z.B. Puerto de la Cruz" : "Weiterer Ort…"}
                className={`flex-1 bg-muted/20 border ${failed.includes(i) ? "border-destructive" : "border-border"} px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary`}
              />
              {inputs.length > 2 && (
                <button onClick={() => removeInput(i)} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>
              )}
            </div>
          ))}

          {failed.length > 0 && (
            <p className="text-xs text-destructive">Nicht gefunden — bitte Ortsnamen prüfen.</p>
          )}

          <button onClick={addInput} className="flex items-center gap-1.5 border border-border px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground">
            <Plus className="w-3 h-3" />Ort
          </button>

          <div className="pt-1 border-t border-border space-y-2">
            {!routeReady && (
              <>
                <button
                  onClick={() => void handleBuild()}
                  disabled={busy || inputs.every((s) => !s.trim())}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-3 text-[10px] uppercase tracking-widest disabled:opacity-50"
                >
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
                  Route zeigen
                </button>
                <button
                  onClick={onPickFromMap}
                  className="w-full flex items-center justify-center gap-2 border border-border px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Spots auf Karte wählen
                </button>
              </>
            )}
            {routeReady && (
              <div className="flex gap-2">
                <button
                  onClick={() => void handleSaveLogbuch()}
                  disabled={logbuchSaved}
                  className="flex-1 flex items-center justify-center gap-1.5 border border-border px-3 py-3 text-[10px] uppercase tracking-widest text-muted-foreground disabled:opacity-60"
                >
                  <BookOpen className="w-3 h-3" />
                  {logbuchSaved ? "✓ Im Logbuch" : "In Logbuch"}
                </button>
                <button onClick={onClose} className="flex-1 border border-primary bg-primary/10 text-primary px-3 py-3 text-[10px] uppercase tracking-widest">
                  Zur Karte
                </button>
              </div>
            )}
            {hasRoute && !routeReady && (
              <button onClick={onClear} className="w-full text-[10px] uppercase tracking-widest text-muted-foreground py-1">
                Route löschen
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterSheet({ categories, onToggle, onClose }: { categories: Set<SpotCategory>; onToggle: (c: SpotCategory) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[1000] bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-background border-t border-border p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] uppercase tracking-widest text-muted-foreground">Kategorien</h2>
          <button onClick={onClose} className="p-2"><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="grid gap-2">
          {ALL_CATEGORIES.map((cat) => {
            const active = categories.has(cat);
            return (
              <button key={cat} onClick={() => onToggle(cat)} className={`min-h-[52px] flex items-center justify-between px-4 py-3 border ${active ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground"} text-xs uppercase tracking-widest`}>
                <span className="flex items-center gap-3">
                  <span className={`spot-pin cat-${cat} !w-6 !h-6 !text-xs ${active ? "" : "opacity-40"}`}>{CATEGORY_GLYPH[cat]}</span>
                  {CATEGORY_LABEL[cat]}
                </span>
                <span className={active ? "text-primary" : "text-muted-foreground/60"}>{active ? "an" : "aus"}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SpotSheet({ spot, onClose, visited, me }: { spot: Spot; onClose: () => void; visited: boolean; me: LatLngExpression | undefined }) {
  const [, navigate] = useLocation();
  const visitedAt = getVisitedAt(spot.id);
  const status = getOpenStatus(spot.hours);
  const tone = statusTone(status);

  // Dynamic photo from Logbuch (first entry linked to this spot)
  const [entries, setEntries] = useState<LogbookEntry[]>(() => getEntries());
  useEffect(() => subscribeLogbuch(() => setEntries(getEntries())), []);
  const spotPhoto = useMemo(() => entries.find((e) => e.spotId === spot.id && e.image), [entries, spot.id]);

  const distanceStr = useMemo(() => {
    if (!me) return undefined;
    const lat = Array.isArray(me) ? me[0] : (me as { lat: number; lng: number }).lat;
    const lng = Array.isArray(me) ? me[1] : (me as { lat: number; lng: number }).lng;
    const m = distanceMeters({ lat: lat as number, lng: lng as number }, { lat: spot.lat, lng: spot.lng });
    return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
  }, [me, spot]);

  return (
    <div className="fixed inset-0 z-[1000] bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-background border-t border-border max-h-[90dvh] overflow-y-auto overscroll-contain" onClick={(e) => e.stopPropagation()}>
        {/* Drag handle */}
        <div className="sticky top-0 bg-background pt-3 pb-0 flex justify-center z-10">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Hero image: dynamic from Logbuch if available */}
        {spotPhoto?.image && (
          <div className="relative w-full">
            <img src={spotPhoto.image} alt="" className="w-full h-48 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            <p className="absolute bottom-2 left-4 text-[9px] uppercase tracking-widest text-foreground/70">
              Dein Foto · {new Date(spotPhoto.createdAt).toLocaleDateString("de-DE", { day: "numeric", month: "short" })}
            </p>
          </div>
        )}

        {/* Header */}
        <div className="sticky top-5 flex items-center justify-between px-5 py-3 bg-background border-b border-border/60 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`spot-pin cat-${spot.category} !w-6 !h-6 !text-xs ${visited ? "visited" : ""}`}>{CATEGORY_GLYPH[spot.category]}{HIGHLIGHT_IDS.has(spot.id) ? <span className="spot-star">★</span> : null}</div>
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground">
                {CATEGORY_LABEL[spot.category]} · {spot.area}{distanceStr ? ` · ${distanceStr}` : ""}
              </p>
              <h2 className="text-lg text-foreground truncate font-serif">{spot.name}</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-2 shrink-0"><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>

        <div className="p-5 space-y-5">
          <p className="text-sm text-foreground/90 leading-relaxed">{spot.blurb}</p>

          {/* Kennzahlen */}
          <div className="grid grid-cols-2 gap-2">
            <Tile label="Anti-Frust-Check" value={formatOpenStatus(status)} tone={tone} />
            {spot.effort && <Tile label="Anstrengung" value={effortLabel(spot)} hint={`~${spot.effort.steps.toLocaleString("de-DE")} Schritte · ${spot.effort.elevationM} Hm`} />}
            <Tile label="Foto / Schritt" value={photoDensityLabel(spot)} />
            {spot.bestLight && spot.bestLight.length > 0 && <Tile label="Bestes Licht" value={spot.bestLight.map(formatLight).join(" · ")} />}
          </div>

          {/* Öffnungszeiten */}
          {spot.hours && (
            <details className="border border-border/60">
              <summary className="px-4 py-3 cursor-pointer text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Clock className="w-3 h-3" /> Öffnungszeiten (vor Ort prüfen)
              </summary>
              <p className="px-4 pb-3 text-xs font-mono text-foreground/85">{summarizeHours(spot.hours)}</p>
            </details>
          )}

          {/* S25 Ultra Setup */}
          {spot.cameraSetup && (
            <div className="border border-border/60 p-4 space-y-3">
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <CameraIcon className="w-3 h-3" /> Samsung S25 Ultra — Setup
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-mono">
                <Kv k="Modus" v={cameraModeLabel(spot.cameraSetup.mode)} />
                {spot.cameraSetup.zoom && <Kv k="Objektiv" v={spot.cameraSetup.zoom} />}
                {spot.cameraSetup.ev && <Kv k="EV" v={spot.cameraSetup.ev} />}
                {spot.cameraSetup.iso && <Kv k="ISO" v={spot.cameraSetup.iso} />}
                {spot.cameraSetup.shutter && <Kv k="Belichtung" v={spot.cameraSetup.shutter} />}
                {spot.cameraSetup.wb && <Kv k="Weißabgl." v={spot.cameraSetup.wb} />}
              </div>
              {spot.cameraSetup.notes && (
                <ul className="text-xs text-foreground/85 space-y-1.5 list-disc pl-4 leading-relaxed">
                  {spot.cameraSetup.notes.map((n, i) => <li key={i}>{n}</li>)}
                </ul>
              )}
            </div>
          )}

          {spot.tip && <p className="text-sm font-serif italic text-foreground/90 border-l-2 border-primary pl-4">{spot.tip}</p>}

          {spot.cautions && spot.cautions.length > 0 && (
            <div className="border border-destructive/40 px-4 py-3 space-y-2">
              <p className="text-[9px] uppercase tracking-widest text-destructive">Achtung</p>
              {spot.cautions.map((c, i) => <p key={i} className="text-xs text-foreground/90 leading-relaxed">{c}</p>)}
            </div>
          )}

          {/* Aktions-Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-border/40">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 border border-border min-h-[52px] text-[10px] uppercase tracking-widest text-foreground hover:bg-muted/40 inline-flex items-center justify-center gap-2"
            >
              <Navigation className="w-3.5 h-3.5" /> Navigation
            </a>
            <button
              onClick={() => { if (visited) unmarkVisited(spot.id); else markVisited(spot.id); }}
              className={`flex-1 min-h-[52px] text-[10px] uppercase tracking-widest inline-flex items-center justify-center gap-2 border ${visited ? "border-gold text-gold" : "border-primary text-primary hover:bg-primary/10"}`}
            >
              {visited ? "Besucht ✓" : "Als besucht"}
            </button>
          </div>

          {/* Vibe-Writer vorausfüllen */}
          <button
            onClick={() => { onClose(); navigate(`/vibe?spotId=${spot.id}&ort=${encodeURIComponent(spot.name)}`); }}
            className="w-full min-h-[52px] border border-border text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted/20 inline-flex items-center justify-center gap-2"
          >
            <PenLine className="w-3.5 h-3.5" /> Eintrag hier schreiben
          </button>
          {!spotPhoto && (
            <p className="text-[9px] text-center text-muted-foreground/70">
              Erstes Logbuch-Foto dieses Spots erscheint hier automatisch.
            </p>
          )}

          {visited && visitedAt && (
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground text-center pb-2">
              Besucht am {new Date(visitedAt).toLocaleDateString("de-DE", { day: "numeric", month: "long" })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Kv({ k, v }: { k: string; v: string }) {
  return (<><span className="text-muted-foreground">{k}</span><span className="text-foreground">{v}</span></>);
}

function Tile({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "open" | "warn" | "closed" | "muted" }) {
  const toneClass = tone === "open" ? "text-primary" : tone === "warn" ? "text-sun" : tone === "closed" ? "text-destructive" : "text-foreground";
  return (
    <div className="border border-border/60 px-3 py-3">
      <p className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-medium leading-tight ${toneClass}`}>{value}</p>
      {hint && <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{hint}</p>}
    </div>
  );
}

function cameraModeLabel(m: string): string {
  const MAP: Record<string, string> = { "expert-raw": "Expert RAW", pro: "Pro", auto: "Foto", nacht: "Nacht-Modus", video: "Video" };
  return MAP[m] ?? m;
}

function formatLight(l: string): string {
  const MAP: Record<string, string> = { sunrise: "Aufgang", morning: "Morgens", midday: "Mittag", golden: "Golden", blue: "Blau", night: "Nacht" };
  return MAP[l] ?? l;
}

export function SpotRow({ spot, onClick }: { spot: Spot; onClick?: () => void }) {
  const vis = getVisitedIds().has(spot.id);
  return (
    <button onClick={onClick} className="flex items-center gap-4 w-full py-3.5 border-t border-border/50 last:border-b text-left hover:bg-muted/20 transition-colors">
      <div className={`spot-pin cat-${spot.category} shrink-0 ${vis ? "visited" : ""}`}>{CATEGORY_GLYPH[spot.category]}{HIGHLIGHT_IDS.has(spot.id) ? <span className="spot-star">★</span> : null}</div>
      <div className="flex-1 min-w-0">
        <p className="text-foreground truncate font-serif">{spot.name}</p>
        <p className="text-[9px] uppercase tracking-widest text-muted-foreground">{CATEGORY_LABEL[spot.category]} · {spot.area}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </button>
  );
}
