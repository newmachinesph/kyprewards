import { Linking, Text, View } from "react-native";
import { Download, ShieldCheck } from "lucide-react-native";
import {
  getDataExportLink,
  keys,
  requestData,
  useApiMutation,
  useDataRequests,
} from "@kyprewards/api";
import { longDate, relativeTime } from "@kyprewards/ui/format";
import { Screen } from "@/components/Screen";
import { Button, Eyebrow, Panel, Title } from "@/components/ui";
import { notify } from "@/components/Toast";
import { colors } from "@/lib/theme";

/**
 * A formal request under the Data Privacy Act, recorded by the API. Whether
 * one is outstanding is the API's answer, not a flag the phone forgets.
 */
export default function DataExport() {
  const { data: requests = [] } = useDataRequests();
  const request = useApiMutation(requestData, {
    invalidates: [keys.customer.dataRequests()],
    onSuccess: () => notify("Portable data export is being prepared."),
    onError: (failure) => notify(failure.message, "error"),
  });
  const outstanding = requests.some(
    (r) => r.kind === "export" && r.status !== "completed",
  );

  return (
    <Screen title="Download my data" back bottom={48}>
      <Eyebrow>Your control</Eyebrow>
      <Title>Download my data</Title>
      <Panel className="mt-6">
        <ShieldCheck size={22} color={colors.success} />
        <Text className="mt-5 font-sans-extrabold text-[14px] text-ink">
          What a copy includes
        </Text>
        <Text className="mt-2 font-sans text-[12px] leading-[18px] text-muted-strong">
          Your profile, joined businesses, consent history, stamp and reward
          activity, and message history, in a machine-readable file.
        </Text>
      </Panel>
      <Button
        className="mt-5"
        busy={request.isPending}
        disabled={outstanding}
        onPress={() => request.mutate("export")}
      >
        {outstanding ? "Export requested" : "Request portable export"}
      </Button>
      {requests.length > 0 ? (
        <View className="mt-6 rounded-2xl border border-line bg-surface">
          {requests.map((row, index) => (
            <View
              key={row.id}
              className={`flex-row items-center gap-3 p-4 ${index > 0 ? "border-t border-line" : ""}`}
            >
              <View className="min-w-0 flex-1">
                <Text className="font-sans-extrabold text-[14px] text-ink">
                  {row.kind === "export" ? "Portable copy" : "Account deletion"}
                </Text>
                <Text className="mt-0.5 font-sans text-[10px] text-muted">
                  {row.status} · asked {relativeTime(row.requestedAt)}
                  {row.completedAt
                    ? ` · done ${longDate(row.completedAt.slice(0, 10))}`
                    : ""}
                </Text>
              </View>
              {row.kind === "export" && row.status === "ready" ? (
                <Button
                  tone="quiet"
                  full={false}
                  icon={<Download size={14} color={colors.ink} />}
                  onPress={() =>
                    getDataExportLink(row.id)
                      .then((link) => Linking.openURL(link.url))
                      .catch(() =>
                        notify("Could not open that file just now.", "error"),
                      )
                  }
                >
                  Open
                </Button>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}
