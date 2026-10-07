"use client";

import { useEffect, useState } from "react";
import type { Coordinates } from "@kyprewards/api";

/**
 * Where the customer is, once they allow it.
 *
 * Asked for only when something needs it - `enabled` - because a browser
 * prompt on page load is the fastest way to be denied permanently. A refusal
 * is not an error: the wallet works fine without a position, distances just
 * stay unknown.
 */
export function useCoordinates(enabled: boolean): Coordinates | undefined {
  const [where, setWhere] = useState<Coordinates>();

  useEffect(() => {
    if (!enabled || where || typeof navigator === "undefined" || !navigator.geolocation) {
      return;
    }
    let live = true;
    navigator.geolocation.getCurrentPosition(
      (position) =>
        live &&
        setWhere({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      // Swallowed on purpose. Denied, unavailable and timed out all mean the
      // same thing here, and none of them is worth interrupting anyone over.
      () => {},
      { timeout: 8000, maximumAge: 300_000 },
    );
    return () => {
      live = false;
    };
  }, [enabled, where]);

  return where;
}
