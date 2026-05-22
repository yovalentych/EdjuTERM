import { useEffect, useRef } from "react";
import {
  StyleSheet, View, Text, Pressable, ScrollView, Dimensions, Animated, PanResponder, Platform,
} from "react-native";
import * as Icons from "lucide-react-native";
import { LucideIcon } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { colors, fonts } from "@/constants/theme";
import { useMobileStore } from "@/lib/mobile-store";

const { height: SCREEN_H } = Dimensions.get("window");
const SNAP_MID  = SCREEN_H * 0.55;
const SNAP_FULL = SCREEN_H * 0.92;
const SNAP_CLOSED = 0;

type Item = { Icon: LucideIcon; label: string; sub: string; emoji: string; color: string; onPress: () => void; bgGradient: [string, string] };
type Group = { id: string; label: string; items: Item[] };

export function MoreMenuSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { activeWorkspaceItem, activeProjectId, projects } = useMobileStore();
  const legacyProject = projects.find(p => String(p.id) === String(activeProjectId));
  const isLab = activeWorkspaceItem?.type === "laboratory" || legacyProject?.projectType === "laboratory";

  // Animated height of the sheet (0 = closed)
  const heightAnim = useRef(new Animated.Value(SNAP_CLOSED)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const currentSnap = useRef(SNAP_CLOSED);

  // Mount-driven open/close
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(heightAnim, { toValue: SNAP_MID, useNativeDriver: false, bounciness: 6, speed: 12 }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start(() => { currentSnap.current = SNAP_MID; });
    } else {
      Animated.parallel([
        Animated.spring(heightAnim, { toValue: SNAP_CLOSED, useNativeDriver: false, bounciness: 0, speed: 14 }),
        Animated.timing(backdropAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start(() => { currentSnap.current = SNAP_CLOSED; });
    }
  }, [visible]);

  // Drag gesture
  const dragStart = useRef(0);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6,
      onPanResponderGrant: () => {
        // @ts-ignore — Animated.Value has __getValue in RN
        dragStart.current = (heightAnim as any).__getValue ? (heightAnim as any).__getValue() : currentSnap.current;
        heightAnim.stopAnimation();
      },
      onPanResponderMove: (_, g) => {
        const next = Math.max(SNAP_CLOSED, Math.min(SNAP_FULL, dragStart.current - g.dy));
        heightAnim.setValue(next);
      },
      onPanResponderRelease: (_, g) => {
        const current = Math.max(SNAP_CLOSED, Math.min(SNAP_FULL, dragStart.current - g.dy));
        let target = SNAP_MID;
        if (g.vy < -0.6) target = SNAP_FULL;
        else if (g.vy > 0.6) target = current < SNAP_MID ? SNAP_CLOSED : SNAP_MID;
        else {
          // proximity
          const opts = [SNAP_CLOSED, SNAP_MID, SNAP_FULL];
          target = opts.reduce((a, b) => Math.abs(b - current) < Math.abs(a - current) ? b : a);
        }
        if (target === SNAP_CLOSED) {
          Animated.timing(backdropAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start();
          Animated.spring(heightAnim, { toValue: SNAP_CLOSED, useNativeDriver: false, bounciness: 0, speed: 14 }).start(() => {
            onClose();
          });
        } else {
          Haptics.selectionAsync();
          Animated.spring(heightAnim, { toValue: target, useNativeDriver: false, bounciness: 6, speed: 14 }).start(() => {
            currentSnap.current = target;
          });
        }
      },
    })
  ).current;

  function navigate(href: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    setTimeout(() => router.push(href as any), 100);
  }

  // Categorised menu
  const groups: Group[] = isLab ? [
    {
      id: "space", label: "ПРОСТІР",
      items: [
        { Icon: Icons.LayoutGrid, emoji: "🗂", label: "Мій Простір", sub: "Усі проєкти різних типів", color: "#7c3aed", bgGradient: ["#7c3aed22", "#7c3aed08"], onPress: () => navigate("/space") },
      ],
    },
    {
      id: "lab", label: "ЛАБОРАТОРІЯ",
      items: [
        { Icon: Icons.Zap,           emoji: "⚡", label: "Швидкий аналіз",  sub: "1-тап → авто-журнал",  color: "#0f766e", bgGradient: ["#0f766e22", "#0f766e08"], onPress: () => navigate("/workbench") },
        { Icon: Icons.Package,       emoji: "🧪", label: "Склад",          sub: "Реагенти та SDS",       color: "#dc2626", bgGradient: ["#dc262622", "#dc262608"], onPress: () => navigate("/lab-inventory") },
        { Icon: Icons.Microscope,    emoji: "🔬", label: "Прилади",        sub: "GLP-журнал",             color: "#d97706", bgGradient: ["#d9770622", "#d9770608"], onPress: () => navigate("/lab-equipment") },
        { Icon: Icons.FlaskConical,  emoji: "🧬", label: "Експерименти",   sub: "Протоколи",              color: "#7c3aed", bgGradient: ["#7c3aed22", "#7c3aed08"], onPress: () => navigate("/workbench") },
      ],
    },
    {
      id: "edu", label: "НАВЧАННЯ",
      items: [
        { Icon: Icons.GraduationCap, emoji: "🎓", label: "Лабораторні",    sub: "Методички, сесії",       color: "#7c3aed", bgGradient: ["#7c3aed22", "#7c3aed08"], onPress: () => navigate("/workbench") },
        { Icon: Icons.BookOpen,      emoji: "📚", label: "Бібліотека",     sub: "Протоколи, статті",     color: "#1d4ed8", bgGradient: ["#1d4ed822", "#1d4ed808"], onPress: () => navigate("/workbench") },
      ],
    },
    {
      id: "safety", label: "БЕЗПЕКА",
      items: [
        { Icon: Icons.ShieldCheck,   emoji: "🛡", label: "Інспекції",      sub: "GLP перевірки",         color: "#059669", bgGradient: ["#05966922", "#05966908"], onPress: () => navigate("/workbench") },
        { Icon: Icons.Recycle,       emoji: "♻️", label: "Відходи",        sub: "Утилізація",            color: "#0d9488", bgGradient: ["#0d948822", "#0d948808"], onPress: () => navigate("/workbench") },
        { Icon: Icons.KeyRound,      emoji: "🔑", label: "Доступ BSL",     sub: "Вхід / вихід",          color: "#be123c", bgGradient: ["#be123c22", "#be123c08"], onPress: () => navigate("/workbench") },
      ],
    },
    {
      id: "tools", label: "ІНСТРУМЕНТИ",
      items: [
        { Icon: Icons.Activity,      emoji: "📡", label: "Стрічка",        sub: "Live активність",        color: "#0f766e", bgGradient: ["#0f766e22", "#0f766e08"], onPress: () => navigate("/workbench") },
        { Icon: Icons.CalendarDays,  emoji: "📅", label: "Розклад",        sub: "Бронювання",             color: "#0369a1", bgGradient: ["#0369a122", "#0369a108"], onPress: () => navigate("/workbench") },
        { Icon: Icons.Calculator,    emoji: "🧮", label: "Калькулятори",    sub: "Розведення/порошки",   color: "#0f766e", bgGradient: ["#0f766e22", "#0f766e08"], onPress: () => navigate("/workbench") },
        { Icon: Icons.BarChart3,     emoji: "📊", label: "Аналітика",      sub: "KPI, звіти",             color: "#7c3aed", bgGradient: ["#7c3aed22", "#7c3aed08"], onPress: () => navigate("/workbench") },
        { Icon: Icons.Bell,          emoji: "🔔", label: "Сповіщення",     sub: "Push, нагадування",      color: "#ea580c", bgGradient: ["#ea580c22", "#ea580c08"], onPress: () => navigate("/workbench") },
      ],
    },
  ] : [
    {
      id: "space", label: "ПРОСТІР",
      items: [
        { Icon: Icons.LayoutGrid, emoji: "🗂", label: "Мій Простір", sub: "Усі проєкти різних типів", color: "#7c3aed", bgGradient: ["#7c3aed22", "#7c3aed08"], onPress: () => navigate("/space") },
      ],
    },
    {
      id: "main", label: "ПРОЄКТ",
      items: [
        { Icon: Icons.Briefcase,     emoji: "💼", label: "Управління",     sub: "Задачі, milestones",    color: "#0f766e", bgGradient: ["#0f766e22", "#0f766e08"], onPress: () => navigate("/management") },
        { Icon: Icons.BookOpen,      emoji: "📚", label: "Бібліотека",     sub: "Протоколи, статті",     color: "#1d4ed8", bgGradient: ["#1d4ed822", "#1d4ed808"], onPress: () => navigate("/workbench") },
        { Icon: Icons.MessageSquare, emoji: "💬", label: "Чат команди",    sub: "Комунікація",            color: "#7c3aed", bgGradient: ["#7c3aed22", "#7c3aed08"], onPress: () => navigate("/workbench") },
      ],
    },
    {
      id: "edu", label: "НАВЧАННЯ",
      items: [
        { Icon: Icons.BookOpen,      emoji: "📖", label: "Курси",          sub: "Лекції, оцінки",         color: "#0369a1", bgGradient: ["#0369a122", "#0369a108"], onPress: () => navigate("/learning") },
        { Icon: Icons.GraduationCap, emoji: "🎓", label: "Лабораторні",    sub: "Методички, сесії",       color: "#7c3aed", bgGradient: ["#7c3aed22", "#7c3aed08"], onPress: () => navigate("/workbench") },
      ],
    },
    {
      id: "tools", label: "ІНСТРУМЕНТИ",
      items: [
        { Icon: Icons.Activity,      emoji: "📡", label: "Стрічка",        sub: "Live активність",        color: "#0f766e", bgGradient: ["#0f766e22", "#0f766e08"], onPress: () => navigate("/workbench") },
        { Icon: Icons.BarChart3,     emoji: "📊", label: "Аналітика",      sub: "Прогрес проєкту",        color: "#7c3aed", bgGradient: ["#7c3aed22", "#7c3aed08"], onPress: () => navigate("/workbench") },
        { Icon: Icons.Bell,          emoji: "🔔", label: "Сповіщення",     sub: "Нагадування",            color: "#ea580c", bgGradient: ["#ea580c22", "#ea580c08"], onPress: () => navigate("/workbench") },
        { Icon: Icons.Settings,      emoji: "⚙️", label: "Налаштування",    sub: "Профіль, тема",         color: colors.muted, bgGradient: ["#64748b22", "#64748b08"], onPress: () => navigate("/profile") },
      ],
    },
  ];

  if (!visible && currentSnap.current === SNAP_CLOSED) return null;

  return (
    <View style={s.root} pointerEvents={visible ? "auto" : "none"}>
      <Animated.View style={[s.backdrop, { opacity: backdropAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[s.sheet, { height: heightAnim }]}>
        {/* Glass background */}
        <BlurView intensity={Platform.OS === "ios" ? 80 : 100} tint="light" style={StyleSheet.absoluteFill}>
          <LinearGradient
            colors={["rgba(255,255,255,0.85)", "rgba(238,243,248,0.95)"]}
            style={StyleSheet.absoluteFill}
          />
        </BlurView>

        {/* Handle (drag area) */}
        <View {...panResponder.panHandlers} style={s.handleArea}>
          <View style={s.handle} />
        </View>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Більше</Text>
          <Pressable onPress={onClose} hitSlop={8} style={s.closeBtn}>
            <Icons.X size={18} color={colors.muted} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {groups.map(group => (
            <View key={group.id} style={{ marginBottom: 22 }}>
              <Text style={s.groupLabel}>{group.label}</Text>
              <View style={s.grid}>
                {group.items.map((it, idx) => (
                  <Pressable
                    key={idx}
                    onPress={it.onPress}
                    style={({ pressed }) => [s.tile, pressed && { transform: [{ scale: 0.96 }], opacity: 0.85 }]}
                  >
                    <LinearGradient
                      colors={it.bgGradient}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={s.tileBg}
                    />
                    <View style={[s.tileIcon, { backgroundColor: it.color + "18" }]}>
                      <it.Icon size={20} color={it.color} strokeWidth={1.8} />
                    </View>
                    <Text style={s.tileLabel} numberOfLines={1}>{it.label}</Text>
                    <Text style={s.tileSub} numberOfLines={1}>{it.sub}</Text>
                    <View style={[s.tileBar, { backgroundColor: it.color }]} />
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root:       { ...StyleSheet.absoluteFillObject, zIndex: 1000 },
  backdrop:   { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(15,23,42,0.45)" },
  sheet:      { position: "absolute", left: 0, right: 0, bottom: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.18, shadowRadius: 24, elevation: 16 },
  handleArea: { paddingTop: 10, paddingBottom: 6, alignItems: "center" },
  handle:     { width: 44, height: 5, borderRadius: 3, backgroundColor: "#cbd5e1" },

  header:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 8 },
  headerTitle:{ fontSize: 20, fontFamily: fonts.title, color: colors.ink, letterSpacing: -0.4 },
  closeBtn:   { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(100,116,139,0.12)" },

  scrollContent: { paddingHorizontal: 18, paddingTop: 6 },
  groupLabel: { fontSize: 11, fontFamily: fonts.bold, letterSpacing: 1.4, color: colors.mutedSoft, marginBottom: 12 },

  grid:       { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile:       { width: "31%", borderRadius: 18, padding: 12, paddingBottom: 14, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.6)", borderWidth: 0.5, borderColor: "rgba(255,255,255,0.7)" },
  tileBg:     { ...StyleSheet.absoluteFillObject, borderRadius: 18 },
  tileIcon:   { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  tileLabel:  { fontSize: 12, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.1 },
  tileSub:    { fontSize: 10, color: colors.muted, marginTop: 1 },
  tileBar:    { position: "absolute", bottom: 0, left: 0, right: 0, height: 3, opacity: 0.6 },
});
