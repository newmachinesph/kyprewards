"use client";

import { useEffect, useState } from "react";
import type { Coordinates } from "@kyprewards/api";

/** The last position the browser gave, so a screen opened after the Discover
 *  tab starts from it - the same request key, answered from the cache -
 *  rather than asking the API once without it and again with it. */
let lastKnown: Coordinates | undefined;

/**
 * Where the customer is, once they allow it.
 *
 * Asked for only when something needs it - `enabled` - because a browser
 * prompt on page load is the fastest way to be denied permanently. A refusal
 * is not an error: the wallet works fine without a position, distances just
 * stay unknown.
 */
export function useCoordinates(enabled: boolean): Coordinates | undefined {
  const [where, setWhere] = useState<Coordinates | undefined>(() => (enabled ? lastKnown : undefined));

  useEffect(() => {
    if (!enabled || where || typeof navigator === "undefined" || !navigator.geolocation) {
      return;
    }
    let live = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        lastKnown = { lat: position.coords.latitude, lng: position.coords.longitude };
        if (live) setWhere(lastKnown);
      },
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
