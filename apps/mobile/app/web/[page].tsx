import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import { createHandoff } from "@kypstamping/api";
import { Screen } from "@/components/Screen";
import { useAuth } from "@/lib/auth";
import { MARKETPLACE_URL } from "@/lib/config";
import { colors } from "@/lib/theme";

/**
 * The one web slot: a kyp.ph page, signed in, inside the app.
 *
 * Content lives on the web - how it works, the privacy notice, the terms, a
 * shop's long-form about page - and rebuilding it natively would buy
 * nothing. The page should still know who is reading, so it opens with a
 * sixty-second single-use handoff code the API exchanges for its own cookie
 * session. The app's own token never enters the webview.
 *
 * Two messages come back, and that is the whole bridge: `close`, and
 * `navigate` with a native route. If merchants ever author pages of their
 * own inside the app, this is the seam an SDK grows from.
 */
const PAGES = new Set(["how-it-works", "privacy", "terms", "for-shops"]);

export default function WebSlot() {
  const router = useRouter();
  const { page } = useLocalSearchParams<{ page: string }>();
  const signedIn = useAuth((state) => state.status === "signed-in");
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState("");
  const path = PAGES.has(page ?? "") ? `/${page}` : "/";

  useEffect(() => {
    let live = true;
    (async () => {
      if (!signedIn) {
        setUrl(`${MARKETPLACE_URL}${path}`);
        return;
      }
      try {
        const { code } = await createHandoff();
        if (live)
          setUrl(
            `${MARKETPLACE_URL}${path}?handoff=${encodeURIComponent(code)}`,
          );
      } catch {
        // The page still reads fine signed out; the handoff is a nicety.
        if (live) setUrl(`${MARKETPLACE_URL}${path}`);
      }
    })();
    return () => {
      live = false;
    };
  }, [path, signedIn]);

  if (failed) {
    return (
      <Screen title="KYP" back>
        <Text className="font-sans text-[13px] text-muted-strong">
          {failed}
        </Text>
      </Screen>
    );
  }

  return (
    <Screen title="KYP" back padded={false} bottom={0}>
      {url ? (
        <WebView
          source={{ uri: url }}
          style={{ flex: 1, minHeight: 700, backgroundColor: colors.paper }}
          onError={() => setFailed("Could not open that page just now.")}
          onMessage={(event) => {
            try {
              const message = JSON.parse(event.nativeEvent.data) as {
                type?: string;
                route?: string;
              };
              if (message.type === "close") router.back();
              else if (
                message.type === "navigate" &&
                typeof message.route === "string"
              ) {
                router.push(message.route as never);
              }
            } catch {
              // Not one of ours. Web pages post all sorts of things.
            }
          }}
          startInLoadingState
          renderLoading={() => (
            <View className="absolute inset-0 items-center justify-center bg-paper">
              <ActivityIndicator color={colors.mutedStrong} />
            </View>
          )}
        />
      ) : (
        <View className="items-center py-16">
          <ActivityIndicator color={colors.mutedStrong} />
        </View>
      )}
    </Screen>
  );
}
