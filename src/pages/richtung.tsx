import { useState, useRef } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { richtungAus } from "@/lib/ohne-ki";

export default function Richtung() {
  const [worte, setWorte] = useState(["", "", ""]);
  const [richtung, setRichtung] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const filled = worte.filter(w => w.trim());
  const canSubmit = filled.length >= 1 && !busy;

  const handleChange = (i: number, val: string) => {
    setWorte(prev => prev.map((w, idx) => idx === i ? val : w));
    setRichtung(undefined);
    setError(undefined);
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (i < 2) inputRefs[i + 1].current?.focus();
      else void submit();
    }
  };

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setRichtung(undefined);
    setError(undefined);
    try {
      // Öffentliche Fassung: eine Karte aus einem Stapel handgeschriebener Einladungen
      await new Promise((r) => setTimeout(r, 400));
      setRichtung(richtungAus(worte));
    } catch {
      setError("Gerade nicht erreichbar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 pt-12 pb-12 flex flex-col gap-10 min-h-screen">
      <header className="space-y-2">
        <h1 className="text-4xl text-foreground">Richtung</h1>
        <p className="text-sm font-serif italic text-muted-foreground">
          Drei Stichworte. Eine Richtung.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        {worte.map((w, i) => (
          <input
            key={i}
            ref={inputRefs[i]}
            type="text"
            value={w}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            placeholder={["erstes Wort", "zweites Wort", "drittes Wort"][i]}
            className="bg-transparent border-b border-border/60 focus:border-foreground outline-none py-3 text-lg font-serif text-foreground placeholder:text-muted-foreground/40 transition-colors"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
        ))}
      </div>

      <button
        onClick={() => void submit()}
        disabled={!canSubmit}
        className="self-start inline-flex items-center gap-2 border border-border px-4 py-3 text-[10px] uppercase tracking-widest text-foreground hover:bg-muted/40 disabled:opacity-30 transition-colors"
      >
        {busy
          ? <Loader2 className="w-3 h-3 animate-spin" />
          : <ArrowRight className="w-3 h-3" />
        }
        Zeig mir wohin
      </button>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {richtung && (
        <div className="border-l-2 border-primary/40 pl-5 py-2">
          <p className="text-xl font-serif italic leading-relaxed text-foreground">
            {richtung}
          </p>
        </div>
      )}
    </div>
  );
}
