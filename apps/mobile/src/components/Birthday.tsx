import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Check, ChevronDown } from "lucide-react-native";
import { Field } from "@/components/AuthShell";
import { colors } from "@/lib/theme";

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** The longest each month gets, leap years included. The API's own table. */
const LONGEST = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * Birthday as a month from a sheet and a typed day, for sign-up and the
 * profile. Day and month only: a treat needs to know when to fire, not how
 * old anyone is. A day the picked month does not have is cleared rather
 * than sent for the API to refuse.
 */
export function BirthdayInput({
  day,
  month,
  onChange,
}: {
  day: string;
  month: number | null;
  onChange: (next: { day: string; month: number | null }) => void;
}) {
  const [picking, setPicking] = useState(false);
  return (
    <>
      <Text className="font-sans-extrabold text-[12px] text-ink">
        Birthday, optional
      </Text>
      <View className="flex-row gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Birthday month"
          accessibilityValue={{ text: month ? MONTHS[month - 1] : "Not set" }}
          onPress={() => setPicking(true)}
          className="min-h-[50px] flex-1 flex-row items-center justify-between rounded-2xl border border-line-strong bg-surface px-4"
        >
          <Text
            className={`font-sans-semibold text-[15px] ${month ? "text-ink" : "text-muted"}`}
          >
            {month ? MONTHS[month - 1] : "Month"}
          </Text>
          <ChevronDown size={16} color={colors.muted} />
        </Pressable>
        <View className="w-24">
          <Field
            label=""
            value={day}
            onChange={(typed) =>
              onChange({ day: typed.replace(/\D/g, "").slice(0, 2), month })
            }
            placeholder="Day"
            keyboardType="number-pad"
            autoCapitalize="none"
          />
        </View>
      </View>
      <MonthSheet
        open={picking}
        selected={month}
        onPick={(picked) => {
          const fits = !picked || Number(day) <= LONGEST[picked - 1];
          onChange({ day: fits ? day : "", month: picked });
          setPicking(false);
        }}
        onClose={() => setPicking(false)}
      />
    </>
  );
}

/** The twelve months as one list in a sheet, instead of twelve buttons on the form. */
function MonthSheet({
  open,
  selected,
  onPick,
  onClose,
}: {
  open: boolean;
  selected: number | null;
  onPick: (month: number | null) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        accessibilityLabel="Close"
        onPress={onClose}
        className="flex-1 bg-ink/55"
      />
      <View className="max-h-[70%] rounded-t-[18px] bg-surface pb-8 pt-4">
        <Text className="px-5 pb-2 font-sans-extrabold text-[10px] uppercase tracking-[1.2px] text-accent-strong">
          Birthday month
        </Text>
        <ScrollView>
          {MONTHS.map((label, index) => {
            const picked = selected === index + 1;
            return (
              <Pressable
                key={label}
                accessibilityRole="button"
                accessibilityState={{ selected: picked }}
                onPress={() => onPick(index + 1)}
                className="flex-row items-center justify-between border-t border-line px-5 py-3.5"
              >
                <Text
                  className={`text-[15px] text-ink ${picked ? "font-sans-extrabold" : "font-sans-semibold"}`}
                >
                  {label}
                </Text>
                {picked ? (
                  <Check size={16} color={colors.ink} strokeWidth={3} />
                ) : null}
              </Pressable>
            );
          })}
          {selected ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => onPick(null)}
              className="border-t border-line px-5 py-3.5"
            >
              <Text className="font-sans-bold text-[14px] text-muted-strong">
                Clear birthday month
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}
