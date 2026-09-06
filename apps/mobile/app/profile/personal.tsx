import { useState } from "react";
import { Text, View } from "react-native";
import {
  keys,
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
  const [mobile, setMobile] = useState(profile.mobile ?? "");
  const save = useApiMutation(updateCustomerProfile, {
    invalidates: [keys.customer.profile()],
    onSuccess: () =>
      notify("Saved. Your details are updated across the wallet."),
    onError: (failure) => notify(failure.message, "error"),
  });
  const nameChanged = name !== profile.name;
  const emailChanged = email !== (profile.email ?? "");
  const mobileChanged = mobile !== (profile.mobile ?? "");
  const changed = nameChanged || emailChanged || mobileChanged;

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
      <Field
        label="Mobile"
        value={mobile}
        onChange={setMobile}
        keyboardType="phone-pad"
        autoComplete="tel"
        hint="Changing this changes how you sign in. The old address is told."
      />
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
            ...(mobileChanged ? { mobile } : {}),
          })
        }
      >
        Save changes
      </Button>
    </View>
  );
}
