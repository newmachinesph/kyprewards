import { Linking, Text, View } from "react-native";
import { Download, ShieldCheck } from "lucide-react-native";
import {
  getDataExportLink,
  keys,
  requestData,
  useApiMutation,
  useDataRequests,
  type DataRequest,
} from "@kyprewards/api";
import { longDate, relativeTime } from "@kyprewards/ui/format";
import { Screen } from "@/components/Screen";
import { Button, Eyebrow, Panel, Title } from "@/components/ui";
import { notify } from "@/components/Toast";
import { colors } from "@/lib/theme";

/**
 * What a request means for the shopper, in a sentence. The raw status read
 * "processing · asked 3 minutes ago", which says nothing about when or what
 * next. Same words as the web wallet.
 */
function requestLine(row: DataRequest): string {
  if (row.kind === "deletion") {
    if (row.status === "completed") return "Your account deletion is complete.";
    if (row.status === "rejected") return "Your deletion request was not approved.";
    return "Account deletion is queued for identity review. You can still use your wallet until it completes.";
  }
  if (row.status === "ready") return "Your export is ready.";
  if (row.status === "completed") return "This export is complete.";
  if (row.status === "rejected") return "This export could not be prepared.";
  return "Your export is being prepared. It is usually ready within ten minutes, and we will let you know here.";
}

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
                <Text className="mt-0.5 font-sans text-[12px] leading-[18px] text-muted-strong">
                  {requestLine(row)}
                </Text>
                <Text className="mt-0.5 font-sans text-[10px] text-muted">
                  {/* Mid-sentence, so "Just now" and "Yesterday" go lower case. */}
                  Requested{" "}
                  {relativeTime(row.requestedAt).replace(/^[JYT]/, (c) =>
                    c.toLowerCase(),
                  )}
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
