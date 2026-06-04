import { useEffect, useRef, useCallback } from "react";

export function usePolling(callback: () => void | Promise<void>, intervalMs: number, enabled = true) {
  const saved = useRef(callback);
  saved.current = callback;

  const tick = useCallback(async () => {
    await saved.current();
  }, []);

  useEffect(() => {
    if (!enabled) return;
    tick();
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled, tick]);
}
