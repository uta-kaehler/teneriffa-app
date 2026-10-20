import { windImpuls } from "@/lib/ohne-ki";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getCurrentLocationContext } from "@/lib/location-helper";

const STANDORT_TYP: Record<string, string> = {
  "los-realejos": "North coast with vineyards, pine forest and old villages",
  "los-gigantes": "West coast with lava cliffs, Atlantic views and quiet coves",
};

function getTageszeit(): string {
  const h = new Date().getHours();
  if (h < 7)  return "early morning before sunrise";
  if (h < 10) return "morning";
  if (h < 13) return "late morning";
  if (h < 15) return "midday";
  if (h < 18) return "afternoon";
  if (h < 20) return "early evening";
  return "evening";
}

const SHOW_PROBABILITY = 0.70;
const SPLASH_MS = 2500;
const IMPULS_MS = 20_000;

function storageKey(locationId: string, date: string) {
  return `tenerife-wind-impuls-${locationId}-${date}`;
}

interface Props { onDone: () => void; }

export function SplashScreen({ onDone }: Props) {
  const [impuls, setImpuls] = useState<string | null>(null);
  const calledRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finish = useRef(() => {
    if (!calledRef.current) { calledRef.current = true; onDone(); }
  });
  finish.current = () => {
    if (!calledRef.current) { calledRef.current = true; onDone(); }
  };

  // Short fallback timer — dismissed quickly when no impuls is shown
  useEffect(() => {
    timerRef.current = setTimeout(() => finish.current(), SPLASH_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [onDone]);

  // When impuls arrives, extend display to 20 s from now
  useEffect(() => {
    if (!impuls) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => finish.current(), IMPULS_MS);
  }, [impuls]);

  useEffect(() => {
    const { locationId } = getCurrentLocationContext();
    const today = new Date().toISOString().slice(0, 10);
    const key = storageKey(locationId, today);
    const stored = localStorage.getItem(key);

    if (stored === "__skip__") return;
    if (stored) { setImpuls(stored); return; }

    if (Math.random() > SHOW_PROBABILITY) {
      localStorage.setItem(key, "__skip__");
      return;
    }

    Promise.resolve((({ standortTyp, tageszeit }: { standortTyp: string; tageszeit: string }) => ({ impuls: windImpuls(tageszeit, standortTyp) }))({
        standortTyp: STANDORT_TYP[locationId] ?? "Tenerife",
        tageszeit: getTageszeit(),
      }))
      .then((data: { impuls: string }) => {
        if (data.impuls) {
          localStorage.setItem(key, data.impuls);
          setImpuls(data.impuls);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      onClick={() => finish.current()}
      className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center gap-8 px-10"
    >
      <motion.img
        src={`${import.meta.env.BASE_URL}favicon.svg`}
        alt="Tenerife"
        draggable={false}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-20 h-20 drop-shadow-[0_2px_16px_rgba(201,168,76,0.35)]"
      />
      <AnimatePresence>
        {impuls && (
          <motion.p
            key="impuls-text"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.25, duration: 0.7, ease: "easeOut" }}
            className="text-sm font-serif italic text-foreground/55 text-center leading-relaxed max-w-[17rem]"
          >
            {impuls}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
