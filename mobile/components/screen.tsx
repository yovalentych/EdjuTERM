import React, { type ReactNode } from "react";
import { RefreshControl, ScrollView, StyleSheet, View, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "@/constants/theme";
import { GlassBg } from "@/components/glass";
import { EmailVerifyBanner } from "@/components/email-verify-banner";
import { useMobileStore } from "@/lib/mobile-store";

export function Screen({
  children,
  scroll = true,
  style,
  refreshControl,
  bg = "auto",
  tintColor,
}: {
  children: ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  refreshControl?: React.ReactElement<React.ComponentProps<typeof RefreshControl>>;
  bg?: "auto" | "default" | "lab" | "dark" | "none";
  tintColor?: string;
}) {
  const { activeWorkspaceItem, activeProjectId, projects } = useMobileStore();
  const legacyProject = projects.find(p => String(p.id) === String(activeProjectId));
  const isLab = activeWorkspaceItem?.type === "laboratory" || legacyProject?.projectType === "laboratory";
  const tone: "default" | "lab" | "dark" = bg === "auto" ? (isLab ? "lab" : "default") : bg === "none" ? "default" : bg;

  return (
    <View style={styles.root}>
      {bg !== "none" && <GlassBg tone={tone} tintColor={tintColor} />}
      <SafeAreaView style={[styles.safe, style]} edges={["top", "left", "right"]}>
        {scroll ? (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={refreshControl}>
            <EmailVerifyBanner />
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.content, { flex: 1 }]}>
            <EmailVerifyBanner />
            {children}
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1, backgroundColor: "transparent" },
  content: {
    gap: 14,
    padding: spacing.page,
    paddingBottom: 110, // space for floating glass tab bar + FAB
  },
});
