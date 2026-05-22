import { useEffect, useRef } from "react";
import {
  StyleSheet, View, Text, Pressable, Animated, Dimensions, ScrollView, Platform, Alert,
} from "react-native";
import * as Icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { colors, fonts } from "@/constants/theme";
import { useMobileStore, type Workspace } from "@/lib/mobile-store";

const { height: SCREEN_H } = Dimensions.get("window");
const SHEET_H = Math.min(SCREEN_H * 0.7, 560);

export function WorkspaceSwitcherSheet({
  visible,
  onClose,
  onCreateNew,
  onManage,
}: {
  visible: boolean;
  onClose: () => void;
  onCreateNew: () => void;
  onManage?: (ws: Workspace) => void;
}) {
  const { workspaces, activeWorkspaceId, setActiveWorkspace, getItemsForWorkspace, deleteWorkspace } = useMobileStore();

  const slideAnim = useRef(new Animated.Value(SHEET_H)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 6, speed: 13 }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: SHEET_H, useNativeDriver: true, bounciness: 0, speed: 14 }),
        Animated.timing(backdropAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  function handlePick(ws: Workspace) {
    Haptics.selectionAsync();
    setActiveWorkspace(ws.id);
    setTimeout(onClose, 80);
  }

  function handleDelete(ws: Workspace) {
    if (ws.isDefault) {
      Alert.alert("Неможливо", "Простір за замовчуванням не можна видалити.");
      return;
    }
    Alert.alert("Видалити простір?", `Усі проєкти переміщуються в "${workspaces.find(w => w.isDefault)?.name}".`, [
      { text: "Скасувати", style: "cancel" },
      { text: "Видалити", style: "destructive", onPress: () => {
        deleteWorkspace(ws.id);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }},
    ]);
  }

  if (!visible && (slideAnim as any).__getValue?.() === SHEET_H) return null;

  return (
    <View style={s.root} pointerEvents={visible ? "auto" : "none"}>
      <Animated.View style={[s.backdrop, { opacity: backdropAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }], height: SHEET_H }]}>
        <BlurView intensity={Platform.OS === "ios" ? 80 : 100} tint="light" style={StyleSheet.absoluteFill}>
          <LinearGradient
            colors={["rgba(255,255,255,0.92)", "rgba(238,243,248,0.95)"]}
            style={StyleSheet.absoluteFill}
          />
        </BlurView>

        <View style={s.handle} />

        <View style={s.header}>
          <View>
            <Text style={s.title}>Мої простори</Text>
            <Text style={s.sub}>{workspaces.length} {workspaces.length === 1 ? "простір" : "простори"}</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={8} style={s.closeBtn}>
            <Icons.X size={18} color={colors.muted} />
          </Pressable>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 14, gap: 8 }} showsVerticalScrollIndicator={false}>
          {workspaces.map(ws => {
            const isActive = ws.id === activeWorkspaceId;
            const itemCount = getItemsForWorkspace(ws.id).length;
            return (
              <Pressable
                key={ws.id}
                onPress={() => handlePick(ws)}
                onLongPress={() => handleDelete(ws)}
                style={({ pressed }) => [
                  s.wsRow,
                  isActive && { borderColor: ws.color, backgroundColor: ws.color + "12" },
                  pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                ]}
              >
                <View style={[s.wsEmojiWrap, { backgroundColor: ws.color + "20" }]}>
                  <Text style={s.wsEmoji}>{ws.emoji}</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={[s.wsName, isActive && { color: ws.color }]} numberOfLines={1}>{ws.name}</Text>
                    {ws.isDefault && (
                      <View style={s.defaultBadge}>
                        <Text style={s.defaultBadgeText}>За замовч.</Text>
                      </View>
                    )}
                  </View>
                  <Text style={s.wsMeta}>{itemCount} {itemCount === 1 ? "проєкт" : itemCount < 5 ? "проєкти" : "проєктів"}</Text>
                </View>
                {isActive && <Icons.CircleCheck size={20} color={ws.color} fill={ws.color + "20"} strokeWidth={2} />}
              </Pressable>
            );
          })}

          {/* + Новий простір */}
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onClose(); setTimeout(onCreateNew, 200); }}
            style={({ pressed }) => [s.addRow, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
          >
            <View style={s.addIconWrap}>
              <Icons.Plus size={18} color={colors.primary} strokeWidth={2.4} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.addLabel}>Новий простір</Text>
              <Text style={s.addSub}>Створити окремий простір з шаблоном</Text>
            </View>
            <Icons.ChevronRight size={16} color={colors.muted} />
          </Pressable>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root:        { ...StyleSheet.absoluteFillObject, zIndex: 1500 },
  backdrop:    { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(15,23,42,0.45)" },
  sheet:       { position: "absolute", left: 0, right: 0, bottom: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.18, shadowRadius: 24, elevation: 16 },
  handle:      { alignSelf: "center", marginTop: 10, marginBottom: 4, width: 44, height: 5, borderRadius: 3, backgroundColor: "#cbd5e1" },

  header:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingBottom: 14 },
  title:       { fontSize: 18, fontFamily: fonts.title, color: colors.ink, letterSpacing: -0.4 },
  sub:         { fontSize: 11, color: colors.muted, marginTop: 1 },
  closeBtn:    { width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(100,116,139,0.12)", alignItems: "center", justifyContent: "center" },

  wsRow:       { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 14, borderWidth: 1.5, borderColor: "transparent", backgroundColor: "rgba(255,255,255,0.65)" },
  wsEmojiWrap: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  wsEmoji:     { fontSize: 22 },
  wsName:      { fontSize: 14, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.2, flexShrink: 1 },
  wsMeta:      { fontSize: 11, color: colors.muted },
  defaultBadge:{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, backgroundColor: "rgba(100,116,139,0.15)" },
  defaultBadgeText: { fontSize: 9, fontWeight: "900", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.3 },

  addRow:      { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 14, borderWidth: 1.5, borderColor: colors.primary + "33", backgroundColor: colors.primary + "0a", borderStyle: "dashed", marginTop: 4 },
  addIconWrap: { width: 42, height: 42, borderRadius: 13, backgroundColor: colors.primary + "18", alignItems: "center", justifyContent: "center" },
  addLabel:    { fontSize: 14, fontFamily: fonts.bold, color: colors.primary, letterSpacing: -0.2 },
  addSub:      { fontSize: 11, color: colors.muted, marginTop: 2 },
});
