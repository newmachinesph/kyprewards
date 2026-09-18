import { useEffect, useState } from "react";
import { Keyboard } from "react-native";

/**
 * How much of the screen the keyboard covers, in points; 0 when it is down.
 *
 * `KeyboardAvoidingView` measured nothing under edge-to-edge (Android 15 and
 * up, the SDK 57 default): walked on the Pixel_10a emulator on 2026-09-18,
 * the number field and "Text me a code" sat under the keyboard. The screens
 * pad their scroll content by this instead, which works the same on iOS.
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const shown = Keyboard.addListener("keyboardDidShow", (event) =>
      setInset(event.endCoordinates.height),
    );
    const hidden = Keyboard.addListener("keyboardDidHide", () => setInset(0));
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, []);
  return inset;
}
