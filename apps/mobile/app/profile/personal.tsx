import { useState } from "react";
import { Text, View } from "react-native";
import {
  changeCustomerPassword,
  confirmMobileChange,
  keys,
  requestMobileChange,
  resendEmailConfirmation,
  updateCustomerProfile,
  useApiMutation,
  useCustomerProfile,
  type CustomerProfile,
} from "@kyprewards/api";
import {
  isCompleteMobile,
  normalizeMobile,
  toE164,
} from "@kyprewards/ui/format";
import { Field, MobileField } from "@/components/AuthShell";
import { BirthdayInput, MONTHS } from "@/components/Birthday";
import { Screen } from "@/components/Screen";
import { Button, Eyebrow, QueryState, Title } from "@/components/ui";
import { notify } from "@/components/Toast";

/** "12 March", as the API writes it, back into its two halves. */
function birthdayParts(birthday: string | null): {
  day: string;
  month: number | null;
} {
  const [day = "", name = ""] = (birthday ?? "").split(" ");
  const month = MONTHS.indexOf(name) + 1;
  return month ? { day, month } : { day: "", month: null };
}

/**
 * Name, email, mobile, birthday. Saved on the button, not on every keystroke: a phone
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
  const given = birthdayParts(profile.birthday);
  const [birthday, setBirthday] = useState(given);
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
  // Both halves or neither, as at sign-up. The API keeps a birthday once
  // given, so clearing both is no change.
  const birthdayHalf = Boolean(birthday.day) !== Boolean(birthday.month);
  const birthdayChanged =
    Boolean(birthday.day && birthday.month) &&
    (Number(birthday.day) !== Number(given.day) ||
      birthday.month !== given.month);
  const changed =
    nameChanged || emailChanged || birthdayHalf || birthdayChanged;

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
      <PasswordSection hasPassword={Boolean(profile.hasPassword)} />
      <View className="gap-2">
        <BirthdayInput
          day={birthday.day}
          month={birthday.month}
          onChange={setBirthday}
        />
        <Text className="font-sans text-[12px] leading-[18px] text-muted-strong">
          Shops you join can send you something on your birthday; we hold the
          day and month only.
        </Text>
      </View>
      <Button
        busy={save.isPending}
        disabled={!changed}
        onPress={() => {
          if (birthdayHalf)
            return notify(
              "Give both the day and the month, or neither.",
              "error",
            );
          save.mutate({
            ...(nameChanged ? { name } : {}),
            ...(emailChanged ? { email } : {}),
            ...(birthdayChanged
              ? {
                  birthdayDay: Number(birthday.day),
                  birthdayMonth: birthday.month ?? undefined,
                }
              : {}),
          });
        }}
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
  // +63 and ten digits, however it was typed - the same number the sign-in
  // screens send, so the move and the next sign-in agree on it.
  const number = toE164(normalizeMobile(mobile));
  const send = useApiMutation(requestMobileChange, {
    onSuccess: (_, sent) => setSentTo(sent),
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
          <MobileField
            label="Move to a new number"
            value={mobile}
            onChange={setMobile}
          />
          <Text className="font-sans text-[11px] text-muted">
            We text a code to the new number. Your wallet moves when you enter
            it.
          </Text>
          <Button
            busy={send.isPending}
            disabled={!isCompleteMobile(normalizeMobile(mobile))}
            onPress={() => send.mutate(number)}
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
          {/* A typo in the number used to leave the code field as the only
              way forward, waiting on a text that was never coming. */}
          <Button
            tone="quiet"
            disabled={confirm.isPending}
            onPress={() => {
              setSentTo(null);
              setCode("");
            }}
          >
            Use another number
          </Button>
        </>
      )}
    </View>
  );
}

/**
 * Set a first password (a wallet from before passwords, or one opened with
 * Google or Apple) or change it; the current one is asked for when there is
 * one, so an unlocked phone cannot lock its owner out.
 */
function PasswordSection({ hasPassword }: { hasPassword: boolean }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const save = useApiMutation(changeCustomerPassword, {
    invalidates: [keys.customer.profile()],
    onSuccess: () => {
      setCurrent("");
      setNext("");
      notify(hasPassword ? "Password changed." : "Password set. Sign in with it next time.");
    },
    onError: (failure) => notify(failure.message, "error"),
  });
  return (
    <View className="gap-3">
      <Text className="font-sans-extrabold text-[13px] text-ink">
        {hasPassword ? "Change password" : "Set a password"}
      </Text>
      {hasPassword ? (
        <Field
          label="Current password"
          value={current}
          onChange={setCurrent}
          secure
          autoCapitalize="none"
          autoComplete="current-password"
        />
      ) : null}
      <Field
        label="New password"
        value={next}
        onChange={setNext}
        secure
        autoCapitalize="none"
        autoComplete="new-password"
        hint="At least 8 characters."
      />
      <Button
        tone="quiet"
        busy={save.isPending}
        disabled={next.length < 8 || (hasPassword && !current)}
        onPress={() =>
          save.mutate({
            ...(hasPassword ? { currentPassword: current } : {}),
            newPassword: next,
          })
        }
      >
        {hasPassword ? "Change password" : "Set password"}
      </Button>
    </View>
  );
}
