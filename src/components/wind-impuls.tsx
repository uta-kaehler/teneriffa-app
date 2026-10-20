import { windImpuls } from "@/lib/ohne-ki";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STANDORT_TYP: Record<string, string> = {
  "los-realejos": "Nordküste mit Weinbergen, Kiefernwald und alten Dörfern",
  "los-gigantes": "Westküste mit Lavaklippen, Atlantikblick und ruhigen Buchten",
};

function getTageszeit(): string {
  const h = new Date().getHours();
  if (h < 7) return "früher Morgen vor Sonnenaufgang";
  if (h < 10) return "Morgen";
  if (h < 13) return "Vormittag";
  if (h < 15) return "Mittag";
  if (h < 18) return "Nachmittag";
  if (h < 20) return "früher Abend";
  return "Abend";
}

const SHOW_PROBABILITY = 0.35;
const DISPLAY_MS = 10_000;

function storageKey(locationId: string, date: string) {
  return `tenerife-wind-impuls-${locationId}-${date}`;
}

export function WindImpuls({ locationId }: { locationId: string }) {
  const [text, setText] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const key = storageKey(locationId, today);
    const stored = localStorage.getItem(key);

    let impulse: string | null = null;

    if (stored === "__skip__") return;

    if (stored) {
      impulse = stored;
    } else if (Math.random() <= SHOW_PROBABILITY) {
      const standortTyp = STANDORT_TYP[locationId] ?? "Teneriffa";
      const tageszeit = getTageszeit();
      Promise.resolve((({ standortTyp, tageszeit }: { standortTyp: string; tageszeit: string }) => ({ impuls: windImpuls(tageszeit, standortTyp) }))({ standortTyp, tageszeit }))
        .then((data: { impuls: string }) => {
          if (data.impuls) {
            localStorage.setItem(key, data.impuls);
            setText(data.impuls);
            setVisible(true);
          }
        })
        .catch(() => {});
      return;
    } else {
      localStorage.setItem(key, "__skip__");
      return;
    }

    if (impulse) {
      setText(impulse);
      setVisible(true);
    }
  }, [locationId]);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setVisible(false), DISPLAY_MS);
    return () => clearTimeout(t);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && text && (
        <motion.button
          key="wind-impuls"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          onClick={() => setVisible(false)}
          className="absolute bottom-5 left-4 right-4 z-[1001] text-left"
          aria-label="Wind-Impuls schließen"
        >
          <div className="bg-background/80 backdrop-blur-sm border-l-2 border-primary/70 px-4 py-3">
            <p className="text-sm font-serif italic text-foreground/80 leading-relaxed">
              {text}
            </p>
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
