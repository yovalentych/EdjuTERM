import { type ReactNode } from "react";
import { StyleSheet, View, Text, Pressable, Platform, type ViewStyle } from "react-native";
import * as Icons from "lucide-react-native";
import { LucideIcon } from "lucide-react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts } from "@/constants/theme";

// ─── GlassBg ──────────────────────────────────────────────────────────────────
// Soft mesh-gradient bedrock placed behind the whole screen.
// If `tintColor` is provided, builds a custom palette around it.
export function GlassBg({ tone = "default", tintColor }: { tone?: "default" | "lab" | "dark"; tintColor?: string }) {
  let c1: string, c2: string, c3: string;
  if (tintColor) {
    // Build mesh from tintColor: very-light → light → tinted-blob
    c1 = "#f8fafc";
    c2 = tintColor + "14";    // ~8% opacity
    c3 = tintColor + "26";    // ~15% opacity
  } else {
    const palettes: Record<string, [string, string, string]> = {
      default: ["#eef3f8", "#dde9f5", "#e8f2ee"],
      lab:     ["#e6f7f3", "#ddeef3", "#f0eaff"],
      dark:    ["#0f1c1a", "#0b3a36", "#04201e"],
    };
    [c1, c2, c3] = palettes[tone] || palettes.default;
  }
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient colors={[c1, c2]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      {/* Soft blob top-right */}
      <View style={[gs.blob, { backgroundColor: c3, top: -90, right: -60, width: 260, height: 260 }]} />
      {/* Soft blob bottom-left */}
      <View style={[gs.blob, { backgroundColor: c3, bottom: -120, left: -80, width: 320, height: 320, opacity: 0.6 }]} />
    </View>
  );
}

// ─── GlassCard ────────────────────────────────────────────────────────────────
// Light frosted-glass surface, useful for stat cards / list rows over a mesh bg.
export function GlassCard({
  children,
  style,
  intensity = 60,
  tint = "light",
  padding = 16,
  delay = 0,
  accent,
}: {
  children: ReactNode;
  style?: ViewStyle;
  intensity?: number;
  tint?: "light" | "dark" | "default";
  padding?: number;
  delay?: number;
  accent?: string;     // optional left/top accent color
}) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "spring", delay, damping: 18 }}
      style={[gs.card, { padding }, style]}
    >
      <BlurView intensity={Platform.OS === "ios" ? intensity : 100} tint={tint as any} style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={tint === "dark"
            ? ["rgba(20,30,40,0.55)", "rgba(15,30,40,0.7)"]
            : ["rgba(255,255,255,0.78)", "rgba(255,255,255,0.55)"]}
          style={StyleSheet.absoluteFill}
        />
      </BlurView>
      {/* Top hairline highlight */}
      <View pointerEvents="none" style={gs.cardHighlight} />
      {accent && <View pointerEvents="none" style={[gs.cardAccent, { backgroundColor: accent }]} />}
      <View style={{ position: "relative" }}>{children}</View>
    </MotiView>
  );
}

// ─── GlassHeader ──────────────────────────────────────────────────────────────
// Sticky-style top bar with blur, used at the top of fullscreen modules.
export function GlassHeader({
  title,
  subtitle,
  onBack,
  rightActions,
  tone = "light",
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightActions?: ReactNode;
  tone?: "light" | "dark";
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[gs.headerWrap, { paddingTop: insets.top + 6 }]}>
      <BlurView intensity={Platform.OS === "ios" ? 70 : 100} tint={tone === "dark" ? "dark" : "light"} style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={tone === "dark"
            ? ["rgba(15,30,40,0.75)", "rgba(15,30,40,0.55)"]
            : ["rgba(255,255,255,0.85)", "rgba(255,255,255,0.55)"]}
          style={StyleSheet.absoluteFill}
        />
      </BlurView>
      <View style={gs.headerRow}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={8} style={gs.headerCircle}>
            <Icons.ArrowLeft size={18} color={tone === "dark" ? "#fff" : colors.ink} strokeWidth={2.2} />
          </Pressable>
        ) : <View style={gs.headerCircle} />}
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={[gs.headerTitle, tone === "dark" && { color: "#fff" }]} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={[gs.headerSub, tone === "dark" && { color: "rgba(255,255,255,0.65)" }]} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
        <View style={gs.headerActions}>{rightActions}</View>
      </View>
      <View pointerEvents="none" style={gs.headerHairline} />
    </View>
  );
}

// ─── GlassPill (button) ───────────────────────────────────────────────────────
// Rounded pill button — compact, glass-style.
export function GlassPill({
  label,
  onPress,
  icon,
  color = colors.primary,
  tone = "light",
  size = "md",
}: {
  label: string;
  onPress?: () => void;
  icon?: string;
  color?: string;
  tone?: "light" | "tinted" | "filled";
  size?: "sm" | "md";
}) {
  const Icon = icon ? (Icons as any)[icon] as LucideIcon : null;
  const filled = tone === "filled";
  const tinted = tone === "tinted";
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        gs.pill,
        size === "sm" && { paddingHorizontal: 10, paddingVertical: 5 },
        filled && { backgroundColor: color, borderColor: color },
        tinted && { backgroundColor: color + "18", borderColor: color + "40" },
        pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
      ]}
    >
      {Icon && <Icon size={size === "sm" ? 13 : 15} color={filled ? "#fff" : color} strokeWidth={2.2} />}
      <Text style={[
        gs.pillText,
        { color: filled ? "#fff" : color },
        size === "sm" && { fontSize: 11 },
      ]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ─── GlassTabs ────────────────────────────────────────────────────────────────
// Horizontal pill-style tabs with smooth glass active state.
// Each tab can show an optional badge count.
export function GlassTabs<T extends string>({
  tabs,
  active,
  onChange,
  color = colors.primary,
}: {
  tabs: { id: T; label: string; badge?: number | null }[];
  active: T;
  onChange: (id: T) => void;
  color?: string;
}) {
  return (
    <View style={gs.tabsWrap}>
      <BlurView intensity={Platform.OS === "ios" ? 50 : 100} tint="light" style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={["rgba(255,255,255,0.75)", "rgba(255,255,255,0.45)"]}
          style={StyleSheet.absoluteFill}
        />
      </BlurView>
      <View style={gs.tabsRow}>
        {tabs.map(t => {
          const isActive = active === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => onChange(t.id)}
              style={({ pressed }) => [
                gs.tab,
                isActive && [gs.tabActive, { backgroundColor: color }],
                pressed && !isActive && { backgroundColor: "rgba(15,23,42,0.05)" },
              ]}
            >
              <Text
                style={[
                  gs.tabText,
                  isActive ? { color: "#fff" } : { color: colors.muted },
                ]}
                numberOfLines={1}
              >
                {t.label}
              </Text>
              {t.badge != null && t.badge > 0 && (
                <View style={[gs.tabBadge, { backgroundColor: isActive ? "rgba(255,255,255,0.3)" : color + "20" }]}>
                  <Text style={[gs.tabBadgeText, { color: isActive ? "#fff" : color }]}>{t.badge}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── GlassStatTile ────────────────────────────────────────────────────────────
export function GlassStatTile({
  icon,
  label,
  value,
  sub,
  color,
  delay = 0,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
  delay?: number;
}) {
  return (
    <GlassCard padding={14} delay={delay} style={{ flex: 1, minWidth: 100 }}>
      <View style={[gs.statIcon, { backgroundColor: color + "18" }]}>{icon}</View>
      <Text style={[gs.statValue, { color, fontFamily: fonts.title }]}>{value}</Text>
      <Text style={gs.statLabel}>{label}</Text>
      {sub ? <Text style={gs.statSub}>{sub}</Text> : null}
    </GlassCard>
  );
}

// ─── GlassEyebrow ─────────────────────────────────────────────────────────────
// Small uppercase letter-spaced label — used as section/field eyebrow.
export function GlassEyebrow({ children, color = colors.mutedSoft }: { children: ReactNode; color?: string }) {
  return <Text style={[gs.eyebrow, { color }]}>{children}</Text>;
}

// ─── GlassSwitcher ────────────────────────────────────────────────────────────
// Workspace-style 1-row dropdown: emoji + eyebrow + name + counter + chevron.
export function GlassSwitcher({
  emoji,
  label,
  name,
  counter,
  color = colors.primary,
  onPress,
  right,
}: {
  emoji: string;
  label: string;
  name: string;
  counter?: number;
  color?: string;
  onPress?: () => void;
  right?: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        gs.switcher,
        { borderColor: color + "30" },
        pressed && { transform: [{ scale: 0.985 }], opacity: 0.92 },
      ]}
    >
      <Text style={gs.switcherEmoji}>{emoji}</Text>
      <View style={{ flex: 1, justifyContent: "center", gap: 2 }}>
        <View style={gs.switcherLabelRow}>
          <Text style={gs.switcherTopLabel}>{label}</Text>
          {right}
        </View>
        <Text style={gs.switcherName} numberOfLines={1}>{name}</Text>
      </View>
      {counter !== undefined && (
        <View style={[gs.switcherCount, { backgroundColor: color + "15" }]}>
          <Text style={[gs.switcherCountText, { color }]}>{counter}</Text>
        </View>
      )}
      <Icons.ChevronDown size={18} color={colors.muted} strokeWidth={2.2} />
    </Pressable>
  );
}

// ─── GlassCTA ─────────────────────────────────────────────────────────────────
// Solid colored CTA with subtle gradient + scale press feedback.
export function GlassCTA({
  label,
  onPress,
  icon,
  color = colors.primary,
  size = "md",
}: {
  label: string;
  onPress?: () => void;
  icon?: string;
  color?: string;
  size?: "sm" | "md" | "lg";
}) {
  const Icon = icon ? (Icons as any)[icon] as LucideIcon : null;
  const padY = size === "sm" ? 9 : size === "lg" ? 16 : 12;
  const fontSize = size === "sm" ? 12 : size === "lg" ? 15 : 14;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        gs.cta,
        { paddingVertical: padY, backgroundColor: color, shadowColor: color },
        pressed && { opacity: 0.92, transform: [{ scale: 0.985 }] },
      ]}
    >
      <LinearGradient
        colors={[mix(color, "#ffffff", 0.18), color]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {Icon && <Icon size={size === "sm" ? 14 : 16} color="#fff" strokeWidth={2.6} />}
      <Text style={[gs.ctaText, { fontSize }]}>{label}</Text>
    </Pressable>
  );
}

// ─── GlassSectionHeader ───────────────────────────────────────────────────────
// Section title with eyebrow style + optional right chip/action.
export function GlassSectionHeader({
  title,
  right,
  color = colors.mutedSoft,
}: {
  title: string;
  right?: ReactNode;
  color?: string;
}) {
  return (
    <View style={gs.sectionHeader}>
      <Text style={[gs.sectionTitle, { color }]}>{title}</Text>
      {right}
    </View>
  );
}

// ─── GlassItemCard ────────────────────────────────────────────────────────────
// Reusable list-row card with emoji square, title, type-badge, meta line and right action slot.
export function GlassItemCard({
  emoji,
  emojiColor = colors.primary,
  title,
  typeLabel,
  meta,
  badges,
  rightAction,
  onPress,
  dimmed,
  delay = 0,
}: {
  emoji: string;
  emojiColor?: string;
  title: string;
  typeLabel?: string;
  meta?: ReactNode;
  badges?: ReactNode;
  rightAction?: ReactNode;
  onPress?: () => void;
  dimmed?: boolean;
  delay?: number;
}) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 6 }}
      animate={{ opacity: dimmed ? 0.65 : 1, translateY: 0 }}
      transition={{ type: "spring", damping: 18, delay }}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [gs.itemCard, pressed && { transform: [{ scale: 0.985 }] }]}
      >
        <View style={[gs.itemEmojiWrap, { backgroundColor: emojiColor + "18" }]}>
          <Text style={gs.itemEmoji}>{emoji}</Text>
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <View style={gs.itemTopRow}>
            <Text style={gs.itemTitle} numberOfLines={1}>{title}</Text>
            {badges}
            {typeLabel && (
              <View style={[gs.itemTypeBadge, { backgroundColor: emojiColor + "15", borderColor: emojiColor + "30" }]}>
                <Text style={[gs.itemTypeText, { color: emojiColor }]}>{typeLabel}</Text>
              </View>
            )}
          </View>
          {meta && <View style={gs.itemMetaRow}>{meta}</View>}
        </View>
        {rightAction}
      </Pressable>
    </MotiView>
  );
}

// Helpers
function mix(hex: string, target: string, ratio: number) {
  // simple hex mix; falls back to original on any parsing issue
  const a = parseHex(hex);
  const b = parseHex(target);
  if (!a || !b) return hex;
  const r = Math.round(a.r + (b.r - a.r) * ratio);
  const g = Math.round(a.g + (b.g - a.g) * ratio);
  const bl = Math.round(a.b + (b.b - a.b) * ratio);
  return `#${[r, g, bl].map(v => v.toString(16).padStart(2, "0")).join("")}`;
}

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.replace("#", "");
  if (m.length !== 6) return null;
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return null;
  return { r, g, b };
}

const gs = StyleSheet.create({
  blob: { position: "absolute", borderRadius: 999, opacity: 0.5 },

  card: {
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.35)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.7)",
    shadowColor: "#0b1626",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  cardHighlight: { position: "absolute", top: 0, left: 0, right: 0, height: 1, backgroundColor: "rgba(255,255,255,0.9)" },
  cardAccent: { position: "absolute", left: 0, top: 0, bottom: 0, width: 3, borderTopLeftRadius: 22, borderBottomLeftRadius: 22 },

  // Header
  headerWrap: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 100, overflow: "hidden", borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, gap: 10 },
  headerCircle: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(100,116,139,0.12)" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 6, minWidth: 36, justifyContent: "flex-end" },
  headerTitle: { fontFamily: fonts.title, fontSize: 17, color: colors.ink, letterSpacing: -0.3 },
  headerSub: { fontSize: 11, color: colors.muted, marginTop: 1 },
  headerHairline: { position: "absolute", bottom: 0, left: 0, right: 0, height: 0.5, backgroundColor: "rgba(15,23,42,0.08)" },

  // Pill
  pill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: "rgba(15,23,42,0.08)", backgroundColor: "rgba(255,255,255,0.6)" },
  pillText: { fontSize: 12, fontFamily: fonts.bold, letterSpacing: -0.1 },

  // Stat tile
  statIcon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  statValue: { fontSize: 22, letterSpacing: -0.6 },
  statLabel: { fontSize: 11, fontFamily: fonts.bold, color: colors.ink, marginTop: 2 },
  statSub: { fontSize: 10, color: colors.muted, marginTop: 1 },

  // Tabs
  tabsWrap: { borderRadius: 16, overflow: "hidden", padding: 4, borderWidth: 0.5, borderColor: "rgba(255,255,255,0.7)" },
  tabsRow: { flexDirection: "row", gap: 4 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 9, paddingHorizontal: 10, borderRadius: 12 },
  tabActive: { shadowColor: "#0b1626", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 3 },
  tabText: { fontSize: 12, fontFamily: fonts.bold, letterSpacing: -0.1 },
  tabBadge: { paddingHorizontal: 6, minWidth: 18, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  tabBadgeText: { fontSize: 10, fontWeight: "900" },

  // Eyebrow
  eyebrow: { fontSize: 10, fontFamily: fonts.bold, letterSpacing: 1.5, textTransform: "uppercase" },

  // Switcher
  switcher: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1, backgroundColor: "rgba(255,255,255,0.78)", shadowColor: "#0b1626", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8 },
  switcherEmoji: { fontSize: 28 },
  switcherLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  switcherTopLabel: { fontSize: 9, fontFamily: fonts.bold, letterSpacing: 1.4, color: colors.mutedSoft, textTransform: "uppercase" },
  switcherName: { fontSize: 16, fontFamily: fonts.title, color: colors.ink, letterSpacing: -0.3 },
  switcherCount: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, minWidth: 26, alignItems: "center" },
  switcherCountText: { fontSize: 12, fontFamily: fonts.bold, letterSpacing: -0.2 },

  // CTA
  cta: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 18, borderRadius: 14, overflow: "hidden", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.22, shadowRadius: 12, elevation: 4 },
  ctaText: { color: "#fff", fontFamily: fonts.bold, letterSpacing: -0.2 },

  // Section header
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 2 },
  sectionTitle: { fontSize: 10, fontFamily: fonts.bold, letterSpacing: 1.4, textTransform: "uppercase" },

  // Item card (shared list-row)
  itemCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.78)", borderWidth: 0.5, borderColor: "rgba(255,255,255,0.7)", shadowColor: "#0b1626", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
  itemEmojiWrap: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  itemEmoji: { fontSize: 22 },
  itemTopRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  itemTitle: { flex: 1, fontSize: 14, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.2 },
  itemTypeBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  itemTypeText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.2 },
  itemMetaRow: { flexDirection: "row", alignItems: "center", gap: 5, flexWrap: "wrap" },
});
