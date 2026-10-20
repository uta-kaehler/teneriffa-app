import { useState, useEffect, useCallback } from "react";

const KEY = "tenerife-astro-mode";
const CLASS = "astro-mode";
const EVENT = "tenerife-astro-mode-changed";

export function isAstroModeEnabled(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(KEY) === "1";
}

export function applyAstroModeClass(): void {
  if (typeof document === "undefined") return;
  if (isAstroModeEnabled()) {
    document.documentElement.classList.add(CLASS);
  } else {
    document.documentElement.classList.remove(CLASS);
  }
}

export function setAstroMode(enabled: boolean): void {
  localStorage.setItem(KEY, enabled ? "1" : "0");
  applyAstroModeClass();
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function useAstroMode(): [boolean, (v: boolean) => void] {
  const [enabled, setEnabled] = useState(() => isAstroModeEnabled());

  useEffect(() => {
    applyAstroModeClass();
    const handler = () => setEnabled(isAstroModeEnabled());
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);

  const toggle = useCallback((v: boolean) => {
    setAstroMode(v);
  }, []);

  return [enabled, toggle];
}
