import { useState, useMemo } from "react";
import {
  View, Text, StyleSheet, Pressable, ScrollView, Alert,
} from "react-native";
import * as Icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import { colors, fonts } from "@/constants/theme";
import {
  useMobileStore,
  type LabActivity, type LabActivityCategory,
} from "@/lib/mobile-store";

const CATEGORY_META: Record<LabActivityCategory | "all", { label: string; color: string; emoji: string }> = {
  all:          { label: "Всі",        color: "#0f766e", emoji: "✨" },
  run:          { label: "Аналізи",    color: "#0f766e", emoji: "⚡" },
  session:      { label: "Навчальні",  color: "#7c3aed", emoji: "🎓" },
  methodology:  { label: "Методички",  color: "#7c3aed", emoji: "📋" },
  booking:      { label: "Розклад",    color: "#0369a1", emoji: "📅" },
  access:       { label: "Доступ",     color: "#be123c", emoji: "🚪" },
  equipment:    { label: "Прилади",    color: "#d97706", emoji: "🔬" },
  inventory:    { label: "Склад",      color: "#dc2626", emoji: "🧪" },
  experiment:   { label: "Експерим.",  color: "#7c3aed", emoji: "🧬" },
  safety:       { label: "Безпека",    color: "#059669", emoji: "🛡" },
  other:        { label: "Інше",       color: colors.muted, emoji: "•" },
};

export function ActivityFeedModule() {
  const { labActivity, clearActivity, user } = useMobileStore();
  const [filter, setFilter] = useState<LabActivityCategory | "all">("all");
  const [scope, setScope] = useState<"team" | "mine">("team");

  const filtered = useMemo(() => {
    return labActivity.filter(a => {
      if (scope === "mine" && a.actorId !== user?._id) return false;
      if (filter !== "all" && a.category !== filter) return false;
      return true;
    });
  }, [labActivity, filter, scope, user?._id]);

  // Group by day
  const grouped = useMemo(() => {
    const groups: { day: string; label: string; items: LabActivity[] }[] = [];
    const map = new Map<string, LabActivity[]>();
    filtered.forEach(a => {
      const d = a.timestamp.split("T")[0];
      const arr = map.get(d) || [];
      arr.push(a);
      map.set(d, arr);
    });
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .forEach(([day, items]) => {
        let label = new Date(day).toLocaleDateString("uk-UA", { day: "numeric", month: "long", weekday: "long" });
        if (day === today) label = "Сьогодні";
        else if (day === yesterday) label = "Вчора";
        groups.push({ day, label, items });
      });
    return groups;
  }, [filtered]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: labActivity.length };
    labActivity.forEach(a => { c[a.category] = (c[a.category] || 0) + 1; });
    return c;
  }, [labActivity]);

  function handleClear() {
    Alert.alert("Очистити стрічку?", "Усі записи активності будуть видалені.", [
      { text: "Скасувати", style: "cancel" },
      { text: "Очистити", style: "destructive", onPress: () => clearActivity() },
    ]);
  }

  const filterCats: (LabActivityCategory | "all")[] = ["all", "run", "session", "methodology", "booking", "access", "equipment", "inventory"];

  return (
    <View style={{ gap: 12 }}>
      <LinearGradient colors={["#0f766e", "#0f5c50"]} style={s.hero}>
        <View style={s.heroLeft}>
          <View style={s.pulseDotLive} />
          <View>
            <Text style={s.heroTitle}>Lab Activity Feed</Text>
            <Text style={s.heroSub}>{labActivity.length} подій у журналі</Text>
          </View>
        </View>
        <Pressable onPress={handleClear} hitSlop={8} style={s.clearBtn}>
          <Icons.Trash2 size={14} color="#fff" />
        </Pressable>
      </LinearGradient>

      {/* Scope toggle */}
      <View style={s.scopeRow}>
        {(["team", "mine"] as const).map(sc => (
          <Pressable
            key={sc}
            onPress={() => { Haptics.selectionAsync(); setScope(sc); }}
            style={[s.scopeTab, scope === sc && s.scopeTabActive]}
          >
            <Icons.Users size={12} color={scope === sc ? colors.ink : colors.muted} />
            <Text style={[s.scopeText, scope === sc && s.scopeTextActive]}>
              {sc === "team" ? "Уся команда" : "Тільки я"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Category filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
        {filterCats.map(c => {
          const meta = CATEGORY_META[c];
          const count = counts[c] || 0;
          const active = filter === c;
          return (
            <Pressable
              key={c}
              onPress={() => { Haptics.selectionAsync(); setFilter(c); }}
              style={[s.filterChip, active && { backgroundColor: meta.color, borderColor: meta.color }]}
            >
              <Text style={[s.filterEmoji, active && { color: "#fff" }]}>{meta.emoji}</Text>
              <Text style={[s.filterText, active && { color: "#fff" }]}>{meta.label}</Text>
              {count > 0 && (
                <View style={[s.filterCount, active && { backgroundColor: "rgba(255,255,255,0.25)" }]}>
                  <Text style={[s.filterCountText, active && { color: "#fff" }]}>{count}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Feed */}
      {grouped.length === 0 ? (
        <View style={s.emptyBox}>
          <Icons.Inbox size={24} color={colors.mutedSoft} />
          <Text style={s.emptyText}>Стрічка порожня. Дії з'являться тут автоматично.</Text>
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          {grouped.map(g => (
            <View key={g.day} style={{ gap: 8 }}>
              <Text style={s.daySep}>{g.label.toUpperCase()}</Text>
              {g.items.map((a, idx) => (
                <ActivityRow key={a.id} activity={a} delay={Math.min(idx * 40, 300)} />
              ))}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function ActivityRow({ activity, delay }: { activity: LabActivity; delay: number }) {
  const meta = CATEGORY_META[activity.category] || CATEGORY_META.other;
  const time = new Date(activity.timestamp).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
  const initial = (activity.actorName || "?").slice(0, 1).toUpperCase();
  return (
    <MotiView from={{ opacity: 0, translateX: -12 }} animate={{ opacity: 1, translateX: 0 }} transition={{ delay }} style={s.row}>
      <View style={[s.avatar, { backgroundColor: meta.color + "20" }]}>
        <Text style={[s.avatarText, { color: meta.color }]}>{initial}</Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={s.rowHeader}>
          <Text style={s.actorName} numberOfLines={1}>{activity.actorName || "Анонім"}</Text>
          <Text style={s.rowTime}>{time}</Text>
        </View>
        <Text style={s.rowDesc} numberOfLines={2}>
          {activity.emoji ? `${activity.emoji} ` : ""}{activity.description || "Дія в лабораторії"}
        </Text>
        {activity.metadata?.score !== undefined && (
          <View style={[s.metaBadge, { backgroundColor: meta.color + "12" }]}>
            <Text style={[s.metaBadgeText, { color: meta.color }]}>
              {activity.metadata.score}/{activity.metadata.maxScore} балів
            </Text>
          </View>
        )}
      </View>
    </MotiView>
  );
}

const s = StyleSheet.create({
  hero:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 16, padding: 14 },
  heroLeft:    { flexDirection: "row", alignItems: "center", gap: 10 },
  pulseDotLive:{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#dc2626", borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" },
  heroTitle:   { fontSize: 14, fontFamily: fonts.bold, color: "#fff", letterSpacing: 0.5 },
  heroSub:     { fontSize: 11, color: "rgba(208,250,245,0.8)", marginTop: 1 },
  clearBtn:    { width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },

  scopeRow:    { flexDirection: "row", backgroundColor: "#f1f5f9", borderRadius: 10, padding: 3 },
  scopeTab:    { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, borderRadius: 7 },
  scopeTabActive: { backgroundColor: "#fff", elevation: 1, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 2 },
  scopeText:   { fontSize: 12, fontWeight: "700", color: colors.muted },
  scopeTextActive: { color: colors.ink },

  filterRow:   { gap: 6, paddingVertical: 2 },
  filterChip:  { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "#fff" },
  filterEmoji: { fontSize: 11 },
  filterText:  { fontSize: 11, fontWeight: "800", color: colors.ink },
  filterCount: { backgroundColor: "#f1f5f9", paddingHorizontal: 6, borderRadius: 6 },
  filterCountText: { fontSize: 10, fontWeight: "900", color: colors.muted },

  emptyBox:    { alignItems: "center", gap: 8, padding: 32, backgroundColor: "#f8fafc", borderRadius: 14 },
  emptyText:   { fontSize: 12, color: colors.muted, textAlign: "center", lineHeight: 16 },

  daySep:      { fontSize: 10, fontWeight: "900", letterSpacing: 1.5, color: colors.mutedSoft },
  row:         { flexDirection: "row", gap: 10, padding: 10, borderRadius: 10, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border },
  avatar:      { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  avatarText:  { fontSize: 13, fontWeight: "900" },
  rowHeader:   { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  actorName:   { flex: 1, fontSize: 12, fontFamily: fonts.bold, color: colors.ink },
  rowTime:     { fontSize: 10, color: colors.mutedSoft, fontWeight: "700" },
  rowDesc:     { fontSize: 12, color: colors.ink, lineHeight: 16 },
  metaBadge:   { alignSelf: "flex-start", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, marginTop: 4 },
  metaBadgeText: { fontSize: 10, fontWeight: "800" },
});
