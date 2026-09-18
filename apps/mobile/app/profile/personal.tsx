import { useState } from "react";
import { Text, View } from "react-native";
import {
  confirmMobileChange,
  keys,
  requestMobileChange,
  resendEmailConfirmation,
  updateCustomerProfile,
  useApiMutation,
  useCustomerProfile,
  type CustomerProfile,
} from "@kypstamping/api";
import { Field } from "@/components/AuthShell";
import { Screen } from "@/components/Screen";
import { Button, Eyebrow, QueryState, Title } from "@/components/ui";
import { notify } from "@/components/Toast";

/**
 * Name, email, mobile. Saved on the button, not on every keystroke: a phone
 * keyboard produces a request per character, and the web wallet's
 * save-as-you-type sent a half-typed mobile number to the API.
 */
export default function Personal() {
  const profile = useCustomerProfile();

  return (
    <Screen title="Personal information" back bottom={48}>
      <Eyebrow>Your control</Eyebrow>
      <Title>Personal information</Title>
      <QueryState
        isPending={profile.isPending}
        error={profile.error}
        onRetry={() => void profile.refetch()}
        label="your details"
      >
        {profile.data ? <PersonalForm profile={profile.data} /> : null}
      </QueryState>
    </Screen>
  );
}

// Mounted only once the profile is here, so the fields start from it and
// never need syncing afterwards: what is typed stays typed until saved.
function PersonalForm({ profile }: { profile: CustomerProfile }) {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email ?? "");
  const save = useApiMutation(updateCustomerProfile, {
    invalidates: [keys.customer.profile()],
    onSuccess: () =>
      notify("Saved. Your details are updated across the wallet."),
    onError: (failure) => notify(failure.message, "error"),
  });
  const resend = useApiMutation(resendEmailConfirmation, {
    onError: (failure) => notify(failure.message, "error"),
  });
  const nameChanged = name !== profile.name;
  const emailChanged = email !== (profile.email ?? "");
  const changed = nameChanged || emailChanged;

  return (
    <View className="mt-6 gap-4">
      <Field label="Name" value={name} onChange={setName} autoComplete="name" />
      <Field
        label="Email"
        value={email}
        onChange={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      {profile.email && profile.emailVerified === false ? (
        <Text className="font-sans text-[12px] leading-[18px] text-muted-strong">
          Not confirmed yet. Open the link we emailed to sign in with this address.{" "}
          <Text
            accessibilityRole="button"
            disabled={resend.isPending || resend.isSuccess}
            onPress={() => resend.mutate(undefined)}
            className="font-sans-extrabold text-accent-strong underline"
          >
            {resend.isSuccess ? "Sent" : "Send it again"}
          </Text>
        </Text>
      ) : null}
      <MobileNumber current={profile.mobile ?? ""} />
      <Text className="font-sans text-[12px] leading-[18px] text-muted-strong">
        Birthday: {profile.birthday ?? "not given"}. Shops you join can send you
        something on your birthday; we hold the day and month only.
      </Text>
      <Button
        busy={save.isPending}
        disabled={!changed}
        onPress={() =>
          save.mutate({
            ...(nameChanged ? { name } : {}),
            ...(emailChanged ? { email } : {}),
          })
        }
      >
        Save changes
      </Button>
    </View>
  );
}

/**
 * Moving the wallet to a new number: a code to the new SIM, then the move.
 * Not part of Save, because a number is proven rather than typed.
 */
function MobileNumber({ current }: { current: string }) {
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const send = useApiMutation(requestMobileChange, {
    onSuccess: () => setSentTo(mobile.trim()),
    onError: (failure) => notify(failure.message, "error"),
  });
  const confirm = useApiMutation(confirmMobileChange, {
    invalidates: [keys.customer.profile()],
    onSuccess: () => {
      setSentTo(null);
      setMobile("");
      setCode("");
      notify("Your wallet is on the new number now.");
    },
    onError: (failure) => notify(failure.message, "error"),
  });

  return (
    <View className="gap-3">
      <Text className="font-sans text-[12px] leading-[18px] text-muted-strong">
        Mobile: {current || "not given"}
      </Text>
      {sentTo === null ? (
        <>
          <Field
            label="Move to a new number"
            value={mobile}
            onChange={setMobile}
            keyboardType="phone-pad"
            autoComplete="tel"
            hint="We text a code to the new number. Your wallet moves when you enter it."
          />
          <Button
            busy={send.isPending}
            disabled={!mobile.trim()}
            onPress={() => send.mutate(mobile.trim())}
          >
            Text me a code
          </Button>
        </>
      ) : (
        <>
          <Field
            label={`Code sent to ${sentTo}`}
            value={code}
            onChange={(value) => setCode(value.replace(/\D/g, "").slice(0, 6))}
            keyboardType="number-pad"
            autoComplete="one-time-code"
          />
          <Button
            busy={confirm.isPending}
            disabled={code.length !== 6}
            onPress={() => confirm.mutate({ mobile: sentTo, code })}
          >
            Move my wallet
          </Button>
        </>
      )}
    </View>
  );
}
