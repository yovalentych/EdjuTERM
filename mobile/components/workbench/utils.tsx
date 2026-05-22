import { StyleSheet, View, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import { MotiView } from "moti";
import { colors, fonts } from "@/constants/theme";

// ─── Lab colour palette ───────────────────────────────────────────────────────
export const lab = {
  dark:    "#073d35",
  mid:     "#0f5c50",
  accent:  "#0f766e",
  soft:    "#d0faf5",
  amber:   "#d97706",
  danger:  "#be123c",
  ok:      "#047857",
  bio:     "#7c3aed",
  neutral: "#64748b",
};

export function hazardColor(h: string) {
  switch (h) {
    case "toxic":       return lab.danger;
    case "flammable":   return lab.amber;
    case "corrosive":   return "#b45309";
    case "oxidizing":   return "#0369a1";
    case "biohazard":   return lab.bio;
    case "explosive":   return "#991b1b";
    default:            return lab.neutral;
  }
}

export function hazardIcon(h: string): string {
  switch (h) {
    case "toxic":       return "☠";
    case "flammable":   return "🔥";
    case "corrosive":   return "⚗";
    case "oxidizing":   return "🔵";
    case "biohazard":   return "☣";
    case "explosive":   return "💥";
    default:            return "•";
  }
}

export type Module =
  | "quick_run" | "course_session" | "activity_feed" | "lab_tools"
  | "inventory" | "equipment" | "diary" | "glp_journal" | "experiments"
  | "safety" | "waste" | "analytics" | "reports" | "notifications"
  | "schedule" | "access" | "library" | "team_chat";

// ─── Shared small components ──────────────────────────────────────────────────

export function StatPill({ Icon, label, value, color, warn }: {
  Icon: any; label: string; value: string; color: string; warn?: boolean;
}) {
  return (
    <View style={[sharedStyles.statPill, warn && { borderColor: color + "60", borderWidth: 1.5 }]}>
      <Icon size={14} color={color} strokeWidth={2} />
      <Text style={[sharedStyles.statVal, { color }]}>{value}</Text>
      <Text style={sharedStyles.statLabel}>{label}</Text>
    </View>
  );
}

export function MetaChip({ icon, text, mono, bold }: {
  icon: string; text: string; mono?: boolean; bold?: boolean;
}) {
  return (
    <View style={sharedStyles.metaChip}>
      <Feather name={icon as any} size={10} color={lab.neutral} />
      <Text style={[
        sharedStyles.metaChipText,
        mono && sharedStyles.mono,
        bold && { fontFamily: fonts.bold, color: colors.ink },
      ]}>
        {text}
      </Text>
    </View>
  );
}

export function ToolCard({ icon, title, desc, onPress, badge }: {
  icon: string; title: string; desc: string; onPress?: () => void; badge?: string;
}) {
  const { Pressable } = require("react-native");
  return (
    <Pressable onPress={onPress} style={({ pressed }: any) => [sharedStyles.toolCard, pressed && { opacity: 0.8 }]}>
      <View style={sharedStyles.toolIcon}><Feather name={icon as any} size={22} color={lab.accent} /></View>
      <View style={{ flex: 1 }}>
        <Text style={sharedStyles.toolTitle}>{title}</Text>
        <Text style={sharedStyles.toolDesc}>{desc}</Text>
      </View>
      {badge
        ? <View style={sharedStyles.toolBadge}><Text style={sharedStyles.toolBadgeText}>{badge}</Text></View>
        : <Feather name="chevron-right" size={18} color={colors.border} />
      }
    </Pressable>
  );
}

export function KpiCard({ value, label, color, Icon }: {
  value: number; label: string; color: string; Icon: any;
}) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", damping: 15 }}
      style={sharedStyles.kpiCard}
    >
      <Icon size={16} color={color} strokeWidth={1.8} />
      <Text style={[sharedStyles.kpiValue, { color }]}>{value}</Text>
      <Text style={sharedStyles.kpiLabel}>{label}</Text>
    </MotiView>
  );
}

export function AnalLegendRow({ color, label, value, total }: {
  color: string; label: string; value: number; total: number;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <View style={{ gap: 3 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
          <Text style={{ fontSize: 11, color: colors.muted }}>{label}</Text>
        </View>
        <Text style={{ fontSize: 11, fontWeight: "900", color }}>{value}</Text>
      </View>
      <View style={[sharedStyles.wasteProgBar, { height: 4 }]}>
        <MotiView
          from={{ width: "0%" }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "timing", duration: 600 }}
          style={[sharedStyles.wasteProgFill, { backgroundColor: color, height: 4 }]}
        />
      </View>
    </View>
  );
}

// ─── Shared StyleSheet ────────────────────────────────────────────────────────
export const sharedStyles = StyleSheet.create({
  // Back button
  backBtn:     { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 6, marginBottom: 16, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.75)", borderWidth: 0.5, borderColor: "rgba(255,255,255,0.65)", shadowColor: "#0b1626", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 8 },
  backBtnText: { fontSize: 13, fontFamily: fonts.bold, color: "#0f766e", letterSpacing: -0.2 },

  // Stats
  statsRow:   { flexDirection: "row", gap: 10 },
  statPill:   { flex: 1, backgroundColor: "white", borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 12, alignItems: "center", gap: 4 },
  statVal:    { fontSize: 20, fontFamily: fonts.bold },
  statLabel:  { fontSize: 10, color: colors.muted, textAlign: "center" },

  // Section label
  sectionLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 1.5, color: colors.mutedSoft, textTransform: "uppercase", marginTop: 2 },

  // Module header
  moduleHeader:   { flexDirection: "row", alignItems: "center", gap: 12 },
  moduleIconWrap: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  moduleTitle:    { fontSize: 17, fontFamily: fonts.bold, color: colors.ink },
  moduleSub:      { fontSize: 12, color: colors.muted },

  // Filter row
  filterRow:           { flexDirection: "row", gap: 0, backgroundColor: "#f1f5f9", borderRadius: 10, padding: 3 },
  filterTab:           { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 8, borderRadius: 8 },
  filterTabActive:     { backgroundColor: "white", elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4 },
  filterTabText:       { fontSize: 13, fontFamily: fonts.bold, color: colors.mutedSoft },
  filterTabTextActive: { color: colors.ink },

  // Empty
  emptyWrap: { alignItems: "center", paddingVertical: 32, gap: 12 },
  emptyText: { fontSize: 14, color: colors.muted, fontFamily: fonts.bold },

  // Chip
  chip:     { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#f1f5f9", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: colors.border },
  chipText: { fontSize: 12, fontFamily: fonts.bold, color: colors.muted },

  // Meta chip
  metaChip:     { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#f8fafc", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  metaChipText: { fontSize: 11, color: colors.muted },
  mono:         { fontFamily: "monospace" } as any,

  // Warn chip
  warnChip:     { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#d97706" + "18", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  warnChipText: { fontSize: 12, fontWeight: "900", color: "#d97706" },

  // Tool card
  toolCard:      { backgroundColor: "white", borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16, flexDirection: "row", alignItems: "center", gap: 14, elevation: 2, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6 },
  toolIcon:      { width: 44, height: 44, borderRadius: 12, backgroundColor: "#0f766e" + "12", alignItems: "center", justifyContent: "center" },
  toolTitle:     { fontSize: 15, fontFamily: fonts.bold, color: colors.ink },
  toolDesc:      { fontSize: 12, color: colors.muted, lineHeight: 17 },
  toolBadge:     { backgroundColor: "#f1f5f9", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7 },
  toolBadgeText: { fontSize: 9, fontWeight: "900", color: colors.muted, textTransform: "uppercase" },

  // KPI card
  kpiRow:   { flexDirection: "row", gap: 8, marginBottom: 4 },
  kpiCard:  { flex: 1, backgroundColor: "white", borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 10, alignItems: "center", gap: 3, elevation: 2, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 5 },
  kpiValue: { fontSize: 20, fontFamily: fonts.bold },
  kpiLabel: { fontSize: 9, color: colors.muted, textAlign: "center" },

  // Danger zone
  dangerZone:  { borderRadius: 14, borderWidth: 1, borderColor: "#be123c" + "30", backgroundColor: "#be123c" + "05", padding: 16, gap: 12 },
  dangerTitle: { fontSize: 11, fontWeight: "900", color: "#be123c", textTransform: "uppercase", letterSpacing: 1 },

  // Create form
  createForm: { gap: 4 },
  fieldLabel: { fontSize: 11, fontWeight: "800", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4, marginTop: 8 },
  fieldInput: { backgroundColor: "#f8fafc", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: colors.border, fontSize: 15, color: colors.ink },
  textArea:   { minHeight: 80, textAlignVertical: "top" as const },

  // Progress bars (shared)
  wasteProgBar:  { height: 6, backgroundColor: "#f1f5f9", borderRadius: 3, overflow: "hidden" as const },
  wasteProgFill: { height: 6, borderRadius: 3 },

  // Lab row
  labRow:        { backgroundColor: "white", borderRadius: 16, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 14, padding: 14, elevation: 2, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8 },
  labRowPressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
  labRowIcon:    { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1, flexShrink: 0, overflow: "hidden" as const },
  labRowLabel:   { fontSize: 15, fontFamily: fonts.bold, color: colors.ink, marginBottom: 2 },
  labRowSub:     { fontSize: 12, color: colors.muted, lineHeight: 16 },
  labRowChevron: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center", flexShrink: 0 },

  // Safety notice
  safetyNotice: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#0f5c50" + "10", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#0f5c50" + "25" },
  safetyText:   { flex: 1, fontSize: 12, color: "#0f5c50", lineHeight: 16 },

  // Group header
  groupHeader:      { flexDirection: "row" as const, alignItems: "center" as const, gap: 10, borderRadius: 12, borderWidth: 1, padding: 10 },
  groupHeaderIcon:  { width: 30, height: 30, borderRadius: 9, alignItems: "center" as const, justifyContent: "center" as const },
  groupHeaderLabel: { fontSize: 10, fontWeight: "900" as const, letterSpacing: 1.2, textTransform: "uppercase" as const },
  groupHeaderDesc:  { fontSize: 11, color: colors.muted, marginTop: 1 },

  // Generic dashboard header
  genericHeader:      { flexDirection: "row" as const, alignItems: "center" as const, gap: 14, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.primary + "20" },
  genericHeaderIcon:  { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.primary + "18", alignItems: "center" as const, justifyContent: "center" as const },
  genericHeaderTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.ink },
  genericHeaderSub:   { fontSize: 12, color: colors.muted, marginTop: 2 },

  // Form
  formLabel: { fontSize: 12, fontFamily: fonts.bold, color: colors.muted, textTransform: "uppercase" as const, letterSpacing: 0.5 },
  formInput:  { borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.ink, backgroundColor: "#fafafa" },

  // Notif info card (shared)
  notifInfoCard: { flexDirection: "row" as const, alignItems: "flex-start" as const, gap: 8, backgroundColor: "#0369a110", borderRadius: 12, borderWidth: 1, borderColor: "#0369a128", padding: 12 },
  notifInfoText: { flex: 1, fontSize: 11, color: "#0369a1", lineHeight: 16 },

  // Add button
  addBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#7c3aed", alignItems: "center", justifyContent: "center" },
});
