"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";

export type Coords = { lat: number; lng: number };

/**
 * Where the visitor is, only after they asked for it.
 *
 * Never requested on load: a browser prompt nobody asked for is the fastest
 * way to be denied for good. Kept in sessionStorage so the tap on the home
 * page still counts on /discover, and forgotten when the tab closes.
 */
const KEY = "kyp.coords";
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const read = () => {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
};

const write = (value: string | null) => {
  try {
    if (value === null) sessionStorage.removeItem(KEY);
    else sessionStorage.setItem(KEY, value);
  } catch {
    // Storage blocked: the position lives for this render only.
  }
  listeners.forEach((listener) => listener());
};

const parse = (raw: string | null): Coords | undefined => {
  if (!raw) return undefined;
  try {
    const value = JSON.parse(raw) as Partial<Coords>;
    if (typeof value.lat === "number" && typeof value.lng === "number") {
      return { lat: value.lat, lng: value.lng };
    }
  } catch {
    // Not ours; ignore.
  }
  return undefined;
};

export type LocationStatus = "idle" | "asking" | "denied";

export function useCoordinates() {
  const raw = useSyncExternalStore(subscribe, read, () => null);
  const coords = useMemo(() => parse(raw), [raw]);
  const [status, setStatus] = useState<LocationStatus>("idle");

  const ask = useCallback(
    () =>
      new Promise<boolean>((resolve) => {
        if (typeof navigator === "undefined" || !navigator.geolocation) {
          setStatus("denied");
          resolve(false);
          return;
        }
        setStatus("asking");
        navigator.geolocation.getCurrentPosition(
          (position) => {
            write(JSON.stringify({ lat: position.coords.latitude, lng: position.coords.longitude }));
            setStatus("idle");
            resolve(true);
          },
          () => {
            setStatus("denied");
            resolve(false);
          },
          { timeout: 8000, maximumAge: 300_000 },
        );
      }),
    [],
  );

  const clear = useCallback(() => {
    write(null);
    setStatus("idle");
  }, []);

  return { coords, status, ask, clear };
}
