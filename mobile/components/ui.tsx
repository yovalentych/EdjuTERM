import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type TextStyle } from "react-native";
import { LucideIcon, icons } from "lucide-react-native";
import { View as MotiView } from "moti";
import { colors, spacing, fonts } from "@/constants/theme";

export function Card({ 
  children, 
  tone = "plain", 
  delay = 0 
}: { 
  children: ReactNode; 
  tone?: "plain" | "dark";
  delay?: number;
}) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.95, translateY: 10 }}
      animate={{ opacity: 1, scale: 1, translateY: 0 }}
      transition={{ type: "spring", delay }}
      style={[styles.card, tone === "dark" && styles.darkCard]}
    >
      {children}
    </MotiView>
  );
}

export function Eyebrow({ children, inverse = false }: { children: ReactNode; inverse?: boolean }) {
  return <Text style={[styles.eyebrow, inverse && styles.inverseMuted]}>{children}</Text>;
}

export function Title({ children, inverse = false, style }: { children: ReactNode; inverse?: boolean; style?: TextStyle }) {
  return <Text style={[styles.title, inverse && styles.inverseText, style]}>{children}</Text>;
}

export function Body({ children, inverse = false, style }: { children: ReactNode; inverse?: boolean; style?: TextStyle }) {
  return <Text style={[styles.body, inverse && styles.inverseBody, style]}>{children}</Text>;
}

export function Metric({ label, value, icon }: { label: string; value: string; icon?: keyof typeof icons }) {
  const Icon = icon ? icons[icon] as LucideIcon : null;
  return (
    <MotiView 
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "spring", damping: 15 }}
      style={styles.metric}
    >
      <View style={styles.metricHeader}>
        <Text style={styles.metricLabel}>{label}</Text>
        {Icon && <Icon size={14} color={colors.mutedSoft} strokeWidth={2.5} />}
      </View>
      <Text style={styles.metricValue}>{value}</Text>
    </MotiView>
  );
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
  icon?: keyof typeof icons;
}) {
  const Icon = icon ? icons[icon] as LucideIcon : null;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "secondary" && styles.secondaryButton,
        variant === "ghost" && styles.ghostButton,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.buttonContent}>
        {Icon && (
          <Icon 
            size={18} 
            color={variant === "primary" ? "#fff" : colors.ink} 
            style={styles.buttonIcon} 
            strokeWidth={2.5}
          />
        )}
        <Text style={[
          styles.buttonText, 
          variant === "secondary" && styles.secondaryButtonText,
          variant === "ghost" && styles.secondaryButtonText
        ]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.card,
    padding: spacing.card,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  darkCard: {
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: colors.primaryDark,
    shadowColor: colors.primary,
    shadowOpacity: 0.2,
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
    fontSize: 24,
    letterSpacing: -0.5,
  },
  body: {
    fontFamily: fonts.regular,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  inverseText: {
    color: "#ffffff",
  },
  inverseBody: {
    color: "rgba(255,255,255,0.7)",
  },
  inverseMuted: {
    color: "rgba(255,255,255,0.5)",
  },
  metric: {
    flex: 1,
    minWidth: 100,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: "white",
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metricLabel: {
    fontFamily: fonts.semiBold,
    color: colors.muted,
    fontSize: 12,
  },
  metricValue: {
    fontFamily: fonts.title,
    marginTop: 6,
    color: colors.ink,
    fontSize: 20,
    letterSpacing: -0.5,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 15,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonIcon: {
    marginRight: 10,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "white",
    shadowColor: "transparent",
    elevation: 0,
  },
  ghostButton: {
    backgroundColor: "transparent",
    shadowColor: "transparent",
    elevation: 0,
  },
  buttonText: {
    fontFamily: fonts.bold,
    color: "#ffffff",
    fontSize: 15,
  },
  secondaryButtonText: {
    color: colors.ink,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
});
