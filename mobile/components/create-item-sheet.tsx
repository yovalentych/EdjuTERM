import { useEffect, useRef, useState } from "react";
import {
  StyleSheet, View, Text, Pressable, Animated, PanResponder, Dimensions, TextInput, ScrollView, Platform, Alert,
} from "react-native";
import * as Icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { colors, fonts } from "@/constants/theme";
import {
  useMobileStore,
  type ItemType, type ItemKind, type WorkspaceItem,
  ITEM_TYPE_REGISTRY, LEARNING_TYPES, PROJECT_TYPES,
} from "@/lib/mobile-store";

const { height: SCREEN_H } = Dimensions.get("window");
const SNAP_FULL = SCREEN_H * 0.92;
const SNAP_CLOSED = 0;

type Step = "kind" | "type" | "form";

const KIND_TYPES: Record<ItemKind, ItemType[]> = {
  learning: LEARNING_TYPES,
  project:  PROJECT_TYPES,
};

const KIND_META: Record<ItemKind, { label: string; hint: string; color: string; emoji: string }> = {
  learning: { label: "Навчання", hint: "Бакалаврат, магістратура, аспірантура", color: "#0369a1", emoji: "🎓" },
  project:  { label: "Проєкт",  hint: "Гранти, лабораторії, дослідження",      color: "#0f766e", emoji: "🔬" },
};

export function CreateItemSheet({
  visible,
  defaultKind,
  onClose,
  onCreated,
}: {
  visible: boolean;
  defaultKind?: ItemKind;
  onClose: () => void;
  onCreated?: (item: WorkspaceItem) => void;
}) {
  const { createWorkspaceItem, workspaces, activeWorkspaceId } = useMobileStore();

  const heightAnim = useRef(new Animated.Value(SNAP_CLOSED)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const currentSnap = useRef(SNAP_CLOSED);

  const [step, setStep] = useState<Step>(defaultKind ? "type" : "kind");
  const [kind, setKind]   = useState<ItemKind | null>(defaultKind || null);
  const [type, setType]   = useState<ItemType | null>(null);

  // Form fields
  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [supervisor, setSupervisor]   = useState("");
  const [institution, setInstitution] = useState("");
  const [specialty, setSpecialty]     = useState("");
  const [plannedEndDate, setPlannedEndDate] = useState("");
  const [selectedWsIds, setSelectedWsIds]   = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      setStep(defaultKind ? "type" : "kind");
      setKind(defaultKind || null);
      setType(null);
      setTitle(""); setDescription(""); setSupervisor(""); setInstitution(""); setSpecialty(""); setPlannedEndDate("");
      setSelectedWsIds(activeWorkspaceId ? [activeWorkspaceId] : []);

      Animated.parallel([
        Animated.spring(heightAnim, { toValue: SNAP_FULL, useNativeDriver: false, bounciness: 6, speed: 12 }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start(() => { currentSnap.current = SNAP_FULL; });
    } else {
      Animated.parallel([
        Animated.spring(heightAnim, { toValue: SNAP_CLOSED, useNativeDriver: false, bounciness: 0, speed: 14 }),
        Animated.timing(backdropAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start(() => { currentSnap.current = SNAP_CLOSED; });
    }
  }, [visible]);

  const dragStart = useRef(0);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 8 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderGrant: () => {
        // @ts-ignore
        dragStart.current = (heightAnim as any).__getValue ? (heightAnim as any).__getValue() : currentSnap.current;
        heightAnim.stopAnimation();
      },
      onPanResponderMove: (_, g) => {
        const next = Math.max(SNAP_CLOSED, Math.min(SNAP_FULL, dragStart.current - g.dy));
        heightAnim.setValue(next);
      },
      onPanResponderRelease: (_, g) => {
        const current = Math.max(SNAP_CLOSED, Math.min(SNAP_FULL, dragStart.current - g.dy));
        const shouldClose = g.vy > 0.7 || current < SNAP_FULL * 0.5;
        if (shouldClose) {
          Animated.timing(backdropAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start();
          Animated.spring(heightAnim, { toValue: SNAP_CLOSED, useNativeDriver: false }).start(() => onClose());
        } else {
          Animated.spring(heightAnim, { toValue: SNAP_FULL, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  function handlePickKind(k: ItemKind) {
    Haptics.selectionAsync();
    setKind(k);
    setStep("type");
  }

  function handlePickType(t: ItemType) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setType(t);
    setStep("form");
    // pre-fill nothing
  }

  function handleCreate() {
    if (!type || !title.trim()) {
      Alert.alert("Заповніть назву");
      return;
    }
    const meta = ITEM_TYPE_REGISTRY[type];
    const wsIds = selectedWsIds.length > 0 ? selectedWsIds : (activeWorkspaceId ? [activeWorkspaceId] : []);
    const item = createWorkspaceItem({
      type,
      title: title.trim(),
      description: description.trim(),
      supervisor: supervisor.trim() || undefined,
      plannedEndDate: plannedEndDate.trim() || undefined,
      status: "active",
      visibility: meta.defaultVisibility,
      workspaceIds: wsIds,
      fields: {
        ...(institution.trim() ? { institution: institution.trim() } : {}),
        ...(specialty.trim()   ? { specialty:   specialty.trim()   } : {}),
      },
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onCreated?.(item);
    onClose();
  }

  function handleBack() {
    if (step === "form") { setStep("type"); setType(null); }
    else if (step === "type") {
      if (defaultKind) onClose();
      else { setStep("kind"); setKind(null); }
    }
    else onClose();
  }

  if (!visible && currentSnap.current === SNAP_CLOSED) return null;

  const meta          = type ? ITEM_TYPE_REGISTRY[type] : null;
  const isLearning    = kind === "learning";
  const kindTypes     = kind ? KIND_TYPES[kind].map(t => ITEM_TYPE_REGISTRY[t]) : [];

  return (
    <View style={s.root} pointerEvents={visible ? "auto" : "none"}>
      <Animated.View style={[s.backdrop, { opacity: backdropAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[s.sheet, { height: heightAnim }]}>
        <BlurView intensity={Platform.OS === "ios" ? 80 : 100} tint="light" style={StyleSheet.absoluteFill}>
          <LinearGradient
            colors={["rgba(255,255,255,0.92)", "rgba(238,243,248,0.95)"]}
            style={StyleSheet.absoluteFill}
          />
        </BlurView>

        {/* Handle */}
        <View {...panResponder.panHandlers} style={s.handleArea}>
          <View style={s.handle} />
        </View>

        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={handleBack} hitSlop={8} style={s.headerBackBtn}>
            <Icons.ArrowLeft size={18} color={colors.ink} />
          </Pressable>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={s.headerTitle}>
              {step === "kind" && "Новий запис"}
              {step === "type" && kind && KIND_META[kind].label}
              {step === "form" && meta?.label}
            </Text>
            <Text style={s.headerSub}>
              {step === "kind" && "Навчання або проєкт?"}
              {step === "type" && "Оберіть тип"}
              {step === "form" && "Заповніть основне"}
            </Text>
          </View>
          <View style={s.headerBackBtn} />
        </View>

        {/* Progress dots */}
        <View style={s.dots}>
          {(["kind", "type", "form"] as Step[]).map(stepName => (
            <View
              key={stepName}
              style={[
                s.dot,
                step === stepName && s.dotActive,
                (step === "type" && stepName === "kind") && s.dotDone,
                (step === "form" && (stepName === "kind" || stepName === "type")) && s.dotDone,
              ]}
            />
          ))}
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 18, paddingBottom: 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Step 1: Kind (Навчання / Проєкт) */}
          {step === "kind" && (
            <View style={{ gap: 14 }}>
              {(["learning", "project"] as ItemKind[]).map(k => {
                const m = KIND_META[k];
                return (
                  <Pressable
                    key={k}
                    onPress={() => handlePickKind(k)}
                    style={({ pressed }) => [s.catCard, { borderColor: m.color + "30" }, pressed && { transform: [{ scale: 0.98 }], opacity: 0.85 }]}
                  >
                    <LinearGradient colors={[m.color + "1a", m.color + "06"]} style={StyleSheet.absoluteFill} />
                    <Text style={s.catEmoji}>{m.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.catLabel, { color: m.color }]}>{m.label}</Text>
                      <Text style={s.catDesc}>{m.hint}</Text>
                    </View>
                    <Icons.ChevronRight size={18} color={m.color} />
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Step 2: Type */}
          {step === "type" && kind && (
            <View style={{ gap: 10 }}>
              {kindTypes.map(t => (
                <Pressable
                  key={t.type}
                  onPress={() => handlePickType(t.type)}
                  style={({ pressed }) => [s.typeRow, pressed && { backgroundColor: "rgba(15,23,42,0.04)" }]}
                >
                  <View style={[s.typeIcon, { backgroundColor: t.color + "15" }]}>
                    <Text style={s.typeEmoji}>{t.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.typeLabel}>{t.label}</Text>
                    <Text style={s.typeDesc} numberOfLines={2}>{t.description}</Text>
                  </View>
                  <Icons.ChevronRight size={16} color={colors.muted} />
                </Pressable>
              ))}
            </View>
          )}

          {/* Step 3: Form */}
          {step === "form" && meta && (
            <View style={{ gap: 14 }}>
              <View style={[s.typeHero, { backgroundColor: meta.color + "12" }]}>
                <Text style={s.typeHeroEmoji}>{meta.emoji}</Text>
                <View>
                  <Text style={[s.typeHeroLabel, { color: meta.color }]}>{meta.label}</Text>
                  <Text style={s.typeHeroSub}>{meta.description}</Text>
                </View>
              </View>

              {isLearning ? (
                /* ── LEARNING FORM ─────────────────────────────── */
                <>
                  <Field label="Тема роботи *">
                    <TextInput
                      style={s.input}
                      placeholder={`Напр., ${exampleTitle(meta.type)}`}
                      placeholderTextColor={colors.mutedSoft}
                      value={title}
                      onChangeText={setTitle}
                      autoFocus
                    />
                  </Field>

                  <Field label="Заклад освіти">
                    <TextInput
                      style={s.input}
                      placeholder="КНУ імені Тараса Шевченка"
                      placeholderTextColor={colors.mutedSoft}
                      value={institution}
                      onChangeText={setInstitution}
                    />
                  </Field>

                  <Field label="Спеціальність / кафедра">
                    <TextInput
                      style={s.input}
                      placeholder="Напр., 091 Біологія, хімічний факультет"
                      placeholderTextColor={colors.mutedSoft}
                      value={specialty}
                      onChangeText={setSpecialty}
                    />
                  </Field>

                  <Field label="Науковий керівник">
                    <TextInput
                      style={s.input}
                      placeholder="ПІБ наукового керівника"
                      placeholderTextColor={colors.mutedSoft}
                      value={supervisor}
                      onChangeText={setSupervisor}
                    />
                  </Field>

                  <Field label={meta.type === "phd" ? "Плановий захист" : "Плановане завершення"}>
                    <TextInput
                      style={s.input}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.mutedSoft}
                      value={plannedEndDate}
                      onChangeText={setPlannedEndDate}
                    />
                  </Field>
                </>
              ) : (
                /* ── PROJECT FORM ──────────────────────────────── */
                <>
                  <Field label="Назва *">
                    <TextInput
                      style={s.input}
                      placeholder={`Напр., ${exampleTitle(meta.type)}`}
                      placeholderTextColor={colors.mutedSoft}
                      value={title}
                      onChangeText={setTitle}
                      autoFocus
                    />
                  </Field>

                  <Field label="Опис">
                    <TextInput
                      style={[s.input, { minHeight: 70, textAlignVertical: "top" }]}
                      placeholder="Коротко про проєкт (опціонально)"
                      placeholderTextColor={colors.mutedSoft}
                      value={description}
                      onChangeText={setDescription}
                      multiline
                    />
                  </Field>

                  <Field label="Плановане завершення">
                    <TextInput
                      style={s.input}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.mutedSoft}
                      value={plannedEndDate}
                      onChangeText={setPlannedEndDate}
                    />
                  </Field>

                  <Field label={`Простори (${selectedWsIds.length} обрано)`}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 2 }}>
                      {workspaces.map(ws => {
                        const isPicked = selectedWsIds.includes(ws.id);
                        return (
                          <Pressable
                            key={ws.id}
                            onPress={() => {
                              Haptics.selectionAsync();
                              setSelectedWsIds(prev => prev.includes(ws.id) ? prev.filter(x => x !== ws.id) : [...prev, ws.id]);
                            }}
                            style={[s.wsPickChip, isPicked && { backgroundColor: ws.color + "20", borderColor: ws.color }]}
                          >
                            <Text style={s.wsPickEmoji}>{ws.emoji}</Text>
                            <Text style={[s.wsPickName, isPicked && { color: ws.color }]}>{ws.name}</Text>
                            {isPicked && <Icons.Check size={12} color={ws.color} strokeWidth={3} />}
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </Field>
                </>
              )}

              <Pressable
                onPress={handleCreate}
                style={({ pressed }) => [s.createBtn, { backgroundColor: meta.color }, pressed && { opacity: 0.9 }]}
              >
                <Icons.Plus size={16} color="#fff" />
                <Text style={s.createBtnText}>{isLearning ? "Додати до навчання" : "Створити проєкт"}</Text>
              </Pressable>
              <Text style={s.formNote}>
                {isLearning
                  ? "Предмети та розклад — у вкладці «Навчання»."
                  : "Решту полів можна додати в деталях проєкту."}
              </Text>
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

function exampleTitle(t: ItemType): string {
  switch (t) {
    case "bachelor":  return "Аналіз стійкості нанокатализаторів";
    case "master":    return "Молекулярна динаміка білка X";
    case "phd":       return "Нові методи редагування геному";
    case "individual_research": return "Дослідження впливу pH на швидкість реакції";
    case "laboratory": return "Лабораторія молекулярної біології";
    case "course":    return "Біохімія, осінь 2025";
    case "grant":     return "Horizon Europe — Project XYZ";
    case "collaboration": return "Спільний проєкт КНУ × НТУУ";
    case "study_group":   return "Reading group: Cell biology";
    case "seminar":   return "Інтродукція до machine learning";
    case "open_science": return "Open Dataset: Ukrainian Plant Species";
    case "idea":      return "Платформа моніторингу повітря";
  }
}

const s = StyleSheet.create({
  root:         { ...StyleSheet.absoluteFillObject, zIndex: 1500 },
  backdrop:     { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(15,23,42,0.45)" },
  sheet:        { position: "absolute", left: 0, right: 0, bottom: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.18, shadowRadius: 24, elevation: 16 },

  handleArea:   { paddingTop: 10, paddingBottom: 6, alignItems: "center" },
  handle:       { width: 44, height: 5, borderRadius: 3, backgroundColor: "#cbd5e1" },

  header:       { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingBottom: 6 },
  headerBackBtn:{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(100,116,139,0.12)", alignItems: "center", justifyContent: "center" },
  headerTitle:  { fontSize: 17, fontFamily: fonts.title, color: colors.ink, letterSpacing: -0.3 },
  headerSub:    { fontSize: 11, color: colors.muted, marginTop: 1 },

  dots:         { flexDirection: "row", justifyContent: "center", gap: 6, paddingBottom: 10 },
  dot:          { width: 18, height: 4, borderRadius: 2, backgroundColor: "#e2e8f0" },
  dotActive:    { width: 28, backgroundColor: colors.primary },
  dotDone:      { backgroundColor: colors.primary + "60" },

  // Category step
  catCard:      { flexDirection: "row", alignItems: "center", gap: 14, padding: 18, borderRadius: 18, borderWidth: 1, overflow: "hidden" },
  catEmoji:     { fontSize: 36 },
  catLabel:     { fontSize: 16, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.3 },
  catDesc:      { fontSize: 12, color: colors.muted, marginTop: 2, lineHeight: 16 },

  // Type step
  typeRow:      { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.7)", borderWidth: 0.5, borderColor: "rgba(255,255,255,0.7)" },
  typeIcon:     { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  typeEmoji:    { fontSize: 22 },
  typeLabel:    { fontSize: 14, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.2 },
  typeDesc:     { fontSize: 11, color: colors.muted, marginTop: 2, lineHeight: 14 },

  // Form
  typeHero:     { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 14 },
  typeHeroEmoji:{ fontSize: 30 },
  typeHeroLabel:{ fontSize: 14, fontFamily: fonts.bold, letterSpacing: -0.2 },
  typeHeroSub:  { fontSize: 11, color: colors.muted, marginTop: 2 },
  fieldLabel:   { fontSize: 10, fontFamily: fonts.bold, letterSpacing: 1, color: colors.muted, textTransform: "uppercase" },
  input:        { borderWidth: 1, borderColor: "rgba(15,23,42,0.1)", borderRadius: 12, padding: 11, fontSize: 14, color: colors.ink, backgroundColor: "rgba(255,255,255,0.85)" },
  createBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14, marginTop: 4 },
  createBtnText:{ fontSize: 14, color: "#fff", fontFamily: fonts.bold, letterSpacing: -0.2 },
  formNote:     { fontSize: 11, color: colors.muted, textAlign: "center", marginTop: 2 },
  wsPickChip:   { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: "rgba(15,23,42,0.1)", backgroundColor: "rgba(255,255,255,0.7)" },
  wsPickEmoji:  { fontSize: 14 },
  wsPickName:   { fontSize: 12, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.1 },
});
