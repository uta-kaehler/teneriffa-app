import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "tenerife-keep-alive";
const CHANGE_EVENT = "tenerife-keep-alive-changed";
const PING_INTERVAL_MS = 4 * 60 * 1000; // 4 min — keeps API server warm

// ─── Shared state helpers ─────────────────────────────────────────────────────

export function getKeepAliveEnabled(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v !== "false"; // default ON
  } catch {
    return true;
  }
}

export function setKeepAliveEnabled(v: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, v ? "true" : "false");
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  } catch { /* ignore */ }
}

export function isWakeLockSupported(): boolean {
  return typeof navigator !== "undefined" && "wakeLock" in navigator;
}

export type WakeLockStatus = "active" | "released" | "unsupported" | "error";

// ─── Active hook — call once in App.tsx ───────────────────────────────────────

/**
 * Keeps the screen awake via the Wake Lock API and pings the API server
 * periodically to prevent cold starts. Reads `enabled` from localStorage and
 * re-subscribes when toggled from elsewhere (e.g. the Mehr page).
 */
export function useKeepAlive(): { enabled: boolean; wakeLockStatus: WakeLockStatus } {
  const [enabled, setEnabled] = useState(getKeepAliveEnabled);
  const [wakeLockStatus, setWakeLockStatus] = useState<WakeLockStatus>(
    isWakeLockSupported() ? "released" : "unsupported",
  );
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  // Sync enabled state when toggled from Mehr
  useEffect(() => {
    const handler = () => setEnabled(getKeepAliveEnabled());
    window.addEventListener(CHANGE_EVENT, handler);
    return () => window.removeEventListener(CHANGE_EVENT, handler);
  }, []);

  // Wake Lock lifecycle
  useEffect(() => {
    if (!enabled || !isWakeLockSupported()) {
      if (!enabled) {
        sentinelRef.current?.release().catch(() => {});
        sentinelRef.current = null;
        setWakeLockStatus("released");
      }
      return;
    }

    let cancelled = false;

    async function acquire() {
      if (cancelled) return;
      try {
        const sentinel = await navigator.wakeLock.request("screen");
        if (cancelled) { sentinel.release().catch(() => {}); return; }
        sentinelRef.current = sentinel;
        setWakeLockStatus("active");
        sentinel.addEventListener("release", () => {
          if (!cancelled) setWakeLockStatus("released");
        });
      } catch {
        if (!cancelled) setWakeLockStatus("error");
      }
    }

    void acquire();

    // Wake Lock is auto-released when the tab is hidden — re-acquire on return
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && enabled) void acquire();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      sentinelRef.current?.release().catch(() => {});
      sentinelRef.current = null;
    };
  }, [enabled]);

  // API server keep-alive ping
  useEffect(() => {
    if (!enabled) return;
    const ping = () => {
      // Öffentliche Fassung: kein Server mehr, der wach gehalten werden müsste.
    };
    ping(); // immediate ping on mount / enable
    const id = window.setInterval(ping, PING_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [enabled]);

  return { enabled, wakeLockStatus };
}

// ─── Lightweight status hook — for UI only (Mehr page) ───────────────────────

export function useKeepAliveToggle() {
  const [enabled, setEnabledState] = useState(getKeepAliveEnabled);

  useEffect(() => {
    const handler = () => setEnabledState(getKeepAliveEnabled());
    window.addEventListener(CHANGE_EVENT, handler);
    return () => window.removeEventListener(CHANGE_EVENT, handler);
  }, []);

  const toggle = () => setKeepAliveEnabled(!enabled);

  return { enabled, toggle };
}
