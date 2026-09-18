import { useState } from "react";
import { Image, View } from "react-native";
import {
  Coffee,
  Croissant,
  Dumbbell,
  Gift,
  Leaf,
  Store,
  UserRound,
} from "lucide-react-native";
import { colors } from "@/lib/theme";

/** A shop's category as an icon. Mirrors `categoryIcons` in the web wallet. */
export const categoryIcons: Record<string, typeof Store> = {
  Bakery: Croissant,
  Café: Coffee,
  Wellness: Leaf,
  Fitness: Dumbbell,
  Retail: Gift,
  Grooming: UserRound,
};

export function CategoryIcon({
  category,
  size = 22,
  color = colors.mutedStrong,
}: {
  category: string;
  size?: number;
  color?: string;
}) {
  const Icon = categoryIcons[category] ?? Store;
  return <Icon size={size} color={color} />;
}

/**
 * The storefront photo, or the category icon when there is none or it will
 * not load. A presigned URL expires, and a failed load left a blank square
 * where the shop should be.
 */
export function PlaceThumb({
  image,
  category,
  size = 52,
}: {
  image: string | null;
  category: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <View
      className="items-center justify-center overflow-hidden rounded-xl bg-surface"
      style={{ width: size, height: size }}
    >
      {image && !failed ? (
        <Image
          source={{ uri: image }}
          style={{ width: size, height: size }}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <CategoryIcon category={category} />
      )}
    </View>
  );
}
