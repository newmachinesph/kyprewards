import { useEffect, useState } from "react";
import * as Location from "expo-location";
import type { Coordinates } from "@kypstamping/api";

/**
 * Where the customer is, once they allow it.
 *
 * Asked for only when a screen needs it, because a permission prompt on
 * launch is the fastest way to be denied permanently. A refusal is not an
 * error: the wallet works without a position, distances just stay unknown.
 * Coarse accuracy on purpose - "which shops are near" does not need metres,
 * and asking for less is faster and kinder to the battery.
 */
export function useCoordinates(
  mode: "ask" | "granted-only",
): Coordinates | undefined {
  const [where, setWhere] = useState<Coordinates>();

  useEffect(() => {
    if (where) return;
    let live = true;
    (async () => {
      // Home only reads a position somebody already allowed; Discover and a
      // place page are about where things are, and they may ask.
      const { status } =
        mode === "ask"
          ? await Location.requestForegroundPermissionsAsync()
          : await Location.getForegroundPermissionsAsync();
      if (status !== "granted") return;
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      }).catch(() => null);
      if (live && position) {
        setWhere({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      }
    })();
    return () => {
      live = false;
    };
  }, [mode, where]);

  return where;
}
