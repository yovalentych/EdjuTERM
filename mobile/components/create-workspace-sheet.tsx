import { useEffect, useRef, useState } from "react";
import {
  StyleSheet, View, Text, Pressable, Animated, Dimensions, ScrollView, TextInput, Platform, Alert,
} from "react-native";
import * as Icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { colors, fonts } from "@/constants/theme";
import {
  useMobileStore,
  type WorkspaceTemplate, type Workspace,
  WORKSPACE_TEMPLATES,
} from "@/lib/mobile-store";

const { height: SCREEN_H } = Dimensions.get("window");
const SHEET_H = Math.min(SCREEN_H * 0.85, 700);

const EMOJI_PALETTE = ["🏠", "🎓", "🔬", "🧪", "📚", "💼", "🎨", "🚀", "🌍", "📖", "💡", "⚡", "🌱", "🔭", "📊"];
const COLOR_PALETTE = ["#0f766e", "#0369a1", "#7c3aed", "#be123c", "#d97706", "#059669", "#0891b2", "#eab308"];

export function CreateWorkspaceSheet({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated?: (ws: Workspace) => void;
}) {
  const { createWorkspace, setActiveWorkspace } = useMobileStore();

  const slideAnim = useRef(new Animated.Value(SHEET_H)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const [step, setStep] = useState<"template" | "form">("template");
  const [template, setTemplate] = useState<WorkspaceTemplate | null>(null);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🏠");
  const [color, setColor] = useState("#0f766e");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (visible) {
      // Reset
      setStep("template");
      setTemplate(null);
      setName(""); setDescription("");
      setEmoji("🏠"); setColor("#0f766e");

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

  function handlePickTemplate(t: WorkspaceTemplate) {
    Haptics.selectionAsync();
    const meta = WORKSPACE_TEMPLATES[t];
    setTemplate(t);
    setEmoji(meta.emoji);
    setColor(meta.color);
    if (t !== "empty") {
      // Pre-fill suggested name
      setName(suggestedName(t));
    }
    setStep("form");
  }

  function handleCreate() {
    if (!name.trim()) {
      Alert.alert("Заповніть назву простору");
      return;
    }
    const ws = createWorkspace({
      name: name.trim(),
      emoji,
      color,
      template: template || undefined,
      description: description.trim() || undefined,
    });
    setActiveWorkspace(ws.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onCreated?.(ws);
    onClose();
  }

  function handleBack() {
    if (step === "form") { setStep("template"); setTemplate(null); }
    else onClose();
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

        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={handleBack} hitSlop={8} style={s.headerBackBtn}>
            <Icons.ArrowLeft size={18} color={colors.ink} />
          </Pressable>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={s.headerTitle}>
              {step === "template" && "Новий простір"}
              {step === "form" && (template ? WORKSPACE_TEMPLATES[template].label : "Налаштування")}
            </Text>
            <Text style={s.headerSub}>
              {step === "template" && "Оберіть шаблон"}
              {step === "form" && "Заповніть основне"}
            </Text>
          </View>
          <View style={s.headerBackBtn} />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 18, paddingBottom: 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {step === "template" && (
            <View style={{ gap: 10 }}>
              {(Object.keys(WORKSPACE_TEMPLATES) as WorkspaceTemplate[]).map(t => {
                const meta = WORKSPACE_TEMPLATES[t];
                return (
                  <Pressable
                    key={t}
                    onPress={() => handlePickTemplate(t)}
                    style={({ pressed }) => [s.tplCard, { borderColor: meta.color + "30" }, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
                  >
                    <LinearGradient
                      colors={[meta.color + "18", meta.color + "04"]}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={[s.tplEmojiWrap, { backgroundColor: meta.color + "25" }]}>
                      <Text style={s.tplEmoji}>{meta.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.tplLabel}>{meta.label}</Text>
                      <Text style={s.tplDesc} numberOfLines={3}>{meta.description}</Text>
                    </View>
                    <Icons.ChevronRight size={18} color={meta.color} />
                  </Pressable>
                );
              })}
            </View>
          )}

          {step === "form" && (
            <View style={{ gap: 14 }}>
              {/* Preview */}
              <View style={[s.preview, { backgroundColor: color + "12", borderColor: color + "30" }]}>
                <View style={[s.previewEmojiWrap, { backgroundColor: color + "25" }]}>
                  <Text style={s.previewEmoji}>{emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.previewLabel, { color }]}>{name || "Без назви"}</Text>
                  <Text style={s.previewSub}>0 проєктів</Text>
                </View>
              </View>

              <Field label="Назва *">
                <TextInput
                  style={s.input}
                  placeholder="Напр., Магістратура 2025-2026"
                  placeholderTextColor={colors.mutedSoft}
                  value={name}
                  onChangeText={setName}
                  autoFocus
                />
              </Field>

              <Field label="Опис (опційно)">
                <TextInput
                  style={[s.input, { minHeight: 60, textAlignVertical: "top" }]}
                  placeholder="Що тут зберігати"
                  placeholderTextColor={colors.mutedSoft}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                />
              </Field>

              <Field label="Емодзі">
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {EMOJI_PALETTE.map(e => (
                    <Pressable
                      key={e}
                      onPress={() => { Haptics.selectionAsync(); setEmoji(e); }}
                      style={[s.emojiBtn, emoji === e && { borderColor: color, backgroundColor: color + "15" }]}
                    >
                      <Text style={s.emojiBtnText}>{e}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </Field>

              <Field label="Колір акценту">
                <View style={s.colorRow}>
                  {COLOR_PALETTE.map(c => (
                    <Pressable
                      key={c}
                      onPress={() => { Haptics.selectionAsync(); setColor(c); }}
                      style={[s.colorDot, { backgroundColor: c }, color === c && s.colorDotActive]}
                    >
                      {color === c && <Icons.Check size={14} color="#fff" strokeWidth={3} />}
                    </Pressable>
                  ))}
                </View>
              </Field>

              <Pressable
                onPress={handleCreate}
                style={({ pressed }) => [s.createBtn, { backgroundColor: color }, pressed && { opacity: 0.9 }]}
              >
                <Icons.Plus size={16} color="#fff" />
                <Text style={s.createBtnText}>Створити простір</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function suggestedName(t: WorkspaceTemplate): string {
  switch (t) {
    case "bachelor":  return "Бакалаврат";
    case "master":    return "Магістратура";
    case "phd":       return "Аспірантура";
    case "grant":     return "Грантовий проєкт";
    case "research":  return "Дослідження";
    case "education": return "Навчання";
    case "work":      return "Робота";
    case "personal":  return "Особистий";
    case "empty":     return "Новий простір";
    default:          return "Новий простір";
  }
}

const s = StyleSheet.create({
  root:         { ...StyleSheet.absoluteFillObject, zIndex: 1500 },
  backdrop:     { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(15,23,42,0.45)" },
  sheet:        { position: "absolute", left: 0, right: 0, bottom: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.18, shadowRadius: 24, elevation: 16 },
  handle:       { alignSelf: "center", marginTop: 10, marginBottom: 4, width: 44, height: 5, borderRadius: 3, backgroundColor: "#cbd5e1" },

  header:       { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingBottom: 6 },
  headerBackBtn:{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(100,116,139,0.12)", alignItems: "center", justifyContent: "center" },
  headerTitle:  { fontSize: 17, fontFamily: fonts.title, color: colors.ink, letterSpacing: -0.3 },
  headerSub:    { fontSize: 11, color: colors.muted, marginTop: 1 },

  // Template card
  tplCard:      { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 18, borderWidth: 1, overflow: "hidden" },
  tplEmojiWrap: { width: 50, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  tplEmoji:     { fontSize: 28 },
  tplLabel:     { fontSize: 15, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.2 },
  tplDesc:      { fontSize: 11, color: colors.muted, marginTop: 4, lineHeight: 15 },

  // Form
  preview:      { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  previewEmojiWrap: { width: 50, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  previewEmoji: { fontSize: 28 },
  previewLabel: { fontSize: 15, fontFamily: fonts.bold, letterSpacing: -0.2 },
  previewSub:   { fontSize: 11, color: colors.muted, marginTop: 2 },

  fieldLabel:   { fontSize: 10, fontFamily: fonts.bold, letterSpacing: 1, color: colors.muted, textTransform: "uppercase" },
  input:        { borderWidth: 1, borderColor: "rgba(15,23,42,0.1)", borderRadius: 12, padding: 11, fontSize: 14, color: colors.ink, backgroundColor: "rgba(255,255,255,0.85)" },

  emojiBtn:     { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.7)", borderWidth: 1.5, borderColor: "transparent" },
  emojiBtnText: { fontSize: 22 },

  colorRow:     { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  colorDot:     { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "transparent" },
  colorDotActive: { borderColor: "#fff", elevation: 4, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 6 },

  createBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14, marginTop: 6 },
  createBtnText:{ fontSize: 14, color: "#fff", fontFamily: fonts.bold, letterSpacing: -0.2 },
});
