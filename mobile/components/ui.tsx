import type { ReactNode } from "react";
import { Platform, Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import * as Icons from "lucide-react-native";
import { LucideIcon } from "lucide-react-native";
import { View as MotiView } from "moti";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { colors, spacing, fonts } from "@/constants/theme";

// ─── Card ────────────────────────────────────────────────────────────────────
// Thin wrapper over Glass-style frosted surface. Public API stays compatible
// with legacy screens that still import { Card } from "@/components/ui".
export function Card({
  children,
  tone = "plain",
  delay = 0,
  style,
}: {
  children: ReactNode;
  tone?: "plain" | "dark";
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const isDark = tone === "dark";
  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "spring", damping: 18, delay }}
      style={[s.card, isDark && s.cardDark, style]}
    >
      {!isDark && (
        <BlurView
          intensity={Platform.OS === "ios" ? 60 : 100}
          tint="light"
          style={StyleSheet.absoluteFill}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0.78)", "rgba(255,255,255,0.55)"]}
            style={StyleSheet.absoluteFill}
          />
        </BlurView>
      )}
      {isDark && (
        <LinearGradient
          colors={[colors.primaryDark, "#0a3a36"]}
          style={StyleSheet.absoluteFill}
        />
      )}
      {!isDark && <View pointerEvents="none" style={s.cardHighlight} />}
      <View style={{ position: "relative", gap: 10 }}>{children}</View>
    </MotiView>
  );
}

// ─── Typography ──────────────────────────────────────────────────────────────
export function Eyebrow({ children, inverse = false }: { children: ReactNode; inverse?: boolean }) {
  return <Text style={[s.eyebrow, inverse && s.inverseMuted]}>{children}</Text>;
}

export function Title({
  children,
  inverse = false,
  style,
}: {
  children: ReactNode;
  inverse?: boolean;
  style?: TextStyle;
}) {
  return <Text style={[s.title, inverse && s.inverseText, style]}>{children}</Text>;
}

export function Body({
  children,
  inverse = false,
  style,
}: {
  children: ReactNode;
  inverse?: boolean;
  style?: TextStyle;
}) {
  return <Text style={[s.body, inverse && s.inverseBody, style]}>{children}</Text>;
}

// ─── Metric ──────────────────────────────────────────────────────────────────
// Compact stat tile — visually aligned with GlassStatTile.
export function Metric({ label, value, icon }: { label: string; value: string; icon?: string }) {
  const Icon = resolveIcon(icon);
  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "spring", damping: 16 }}
      style={s.metric}
    >
      <View style={s.metricHeader}>
        <Text style={s.metricLabel}>{label}</Text>
        {Icon && <Icon size={14} color={colors.mutedSoft} strokeWidth={2.4} />}
      </View>
      <Text style={s.metricValue}>{value}</Text>
    </MotiView>
  );
}

// ─── ActionButton ────────────────────────────────────────────────────────────
// Solid (primary), outlined (secondary), or text-only (ghost) action.
// Accepts either lucide PascalCase ("ArrowLeft") or Feather kebab-case
// ("arrow-left") — converts to lucide identifier if needed.
function resolveIcon(name?: string): LucideIcon | undefined {
  if (!name) return undefined;
  const direct = (Icons as any)[name] as LucideIcon | undefined;
  if (direct) return direct;
  const pascal = name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  return (Icons as any)[pascal] as LucideIcon | undefined;
}

export function ActionButton({
  label,
  onPress,
  variant = "primary",
  icon,
}: {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  icon?: string;
}) {
  const Icon = resolveIcon(icon);
  const isPrimary = variant === "primary";
  const isSecondary = variant === "secondary";
  const isGhost = variant === "ghost";
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        isSecondary && s.secondaryButton,
        isGhost && s.ghostButton,
        pressed && s.pressed,
      ]}
    >
      {isPrimary && (
        <LinearGradient
          colors={["#1a8c81", colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={s.buttonContent}>
        {Icon && (
          <Icon
            size={16}
            color={isPrimary ? "#fff" : colors.ink}
            style={s.buttonIcon}
            strokeWidth={2.4}
          />
        )}
        <Text
          style={[
            s.buttonText,
            (isSecondary || isGhost) && s.secondaryButtonText,
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.7)",
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.35)",
    padding: spacing.card,
    shadowColor: "#0b1626",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  cardDark: {
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: colors.primaryDark,
    shadowColor: colors.primary,
    shadowOpacity: 0.22,
    shadowRadius: 18,
  },
  cardHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.9)",
  },

  eyebrow: {
    fontFamily: fonts.bold,
    color: colors.muted,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: fonts.title,
    color: colors.ink,
    fontSize: 22,
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  body: {
    fontFamily: fonts.regular,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  inverseText: { color: "#ffffff" },
  inverseBody: { color: "rgba(255,255,255,0.72)" },
  inverseMuted: { color: "rgba(255,255,255,0.5)" },

  metric: {
    flex: 1,
    minWidth: 100,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.7)",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.78)",
    padding: 13,
    shadowColor: "#0b1626",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metricLabel: {
    fontFamily: fonts.semiBold,
    color: colors.muted,
    fontSize: 11,
  },
  metricValue: {
    fontFamily: fonts.title,
    marginTop: 6,
    color: colors.ink,
    fontSize: 20,
    letterSpacing: -0.5,
  },

  button: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 13,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonIcon: { marginRight: 8 },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.85)",
    shadowColor: "transparent",
    shadowOpacity: 0,
    elevation: 0,
  },
  ghostButton: {
    backgroundColor: "transparent",
    shadowColor: "transparent",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    fontFamily: fonts.bold,
    color: "#ffffff",
    fontSize: 14,
    letterSpacing: -0.2,
  },
  secondaryButtonText: { color: colors.ink },
  pressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
});
