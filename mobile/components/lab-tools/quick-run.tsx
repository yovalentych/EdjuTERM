import { useState, useMemo } from "react";
import {
  View, Text, StyleSheet, Pressable, ScrollView, TextInput, Modal, Alert,
} from "react-native";
import * as Icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import { colors, fonts } from "@/constants/theme";
import {
  useMobileStore,
  type LabRun,
  type LabRunInput,
  type LabInventoryItem,
  type LabEquipment,
} from "@/lib/mobile-store";
import { RUN_PRESETS, getRunPreset, type RunPreset, type RunFieldSpec } from "@/lib/run-presets";

export function QuickRunModule() {
  const {
    labRuns, startLabRun, addRunMeasurement, addRunInput, removeRunInput,
    updateRunNotes, completeLabRun, abortLabRun, deleteLabRun,
    labInventory, labEquipment,
  } = useMobileStore();

  const activeRun = labRuns.find(r => r.status === "in_progress");
  const recentRuns = labRuns.filter(r => r.status !== "in_progress").slice(0, 8);

  const [pickerOpen, setPickerOpen] = useState<null | "reagent" | "equipment" | "sample">(null);
  const [measureOpen, setMeasureOpen] = useState<RunFieldSpec | null>(null);
  const [customField, setCustomField] = useState(false);
  const [completionOpen, setCompletionOpen] = useState(false);
  const [detailRun, setDetailRun] = useState<LabRun | null>(null);

  function handleStart(preset: RunPreset) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startLabRun({ presetId: preset.id, presetLabel: preset.label, emoji: preset.emoji });
  }

  function handleComplete(result: string) {
    if (!activeRun) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completeLabRun(activeRun.id, result || undefined);
    setCompletionOpen(false);
  }

  function handleAbort() {
    if (!activeRun) return;
    Alert.alert("Скасувати аналіз?", "Дані не будуть збережені у журнал.", [
      { text: "Назад", style: "cancel" },
      { text: "Скасувати", style: "destructive", onPress: () => { abortLabRun(activeRun.id); } },
    ]);
  }

  if (activeRun) {
    const preset = getRunPreset(activeRun.presetId);
    return (
      <View style={{ gap: 14 }}>
        <ActiveRunHeader run={activeRun} onAbort={handleAbort} />

        <Section title="ЩО ВИКОРИСТАНО" actionLabel="+ Реагент" actionColor="#dc2626" onAction={() => setPickerOpen("reagent")} secondary={[
          { label: "+ Прилад",  color: "#0369a1", onPress: () => setPickerOpen("equipment") },
          { label: "+ Зразок",  color: "#7c3aed", onPress: () => setPickerOpen("sample") },
        ]}>
          {activeRun.inputs.length === 0 ? (
            <Text style={s.emptyText}>Скануйте QR на контейнері або додайте вручну</Text>
          ) : activeRun.inputs.map(input => (
            <View key={`${input.kind}_${input.refId}`} style={s.inputRow}>
              <View style={[s.inputKindBadge, { backgroundColor: inputColor(input.kind) + "15" }]}>
                {inputIcon(input.kind, inputColor(input.kind))}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.inputName} numberOfLines={1}>{input.name}</Text>
                {input.hint ? <Text style={s.inputHint}>{input.hint}</Text> : null}
              </View>
              <Pressable onPress={() => removeRunInput(activeRun.id, input.refId)} hitSlop={8}>
                <Icons.X size={14} color={colors.muted} />
              </Pressable>
            </View>
          ))}
        </Section>

        <Section title="ВИМІРЮВАННЯ" actionLabel="+ Своє поле" actionColor={colors.primary} onAction={() => setCustomField(true)} secondary={preset && preset.measurements.length > 0 ? preset.measurements.map(f => ({
          label: f.label, color: preset.color, onPress: () => setMeasureOpen(f),
        })) : []}>
          {activeRun.measurements.length === 0 ? (
            <Text style={s.emptyText}>Запишіть вимірювання у міру виконання аналізу</Text>
          ) : activeRun.measurements.map(m => (
            <View key={m.id} style={s.measureRow}>
              <Icons.Activity size={12} color={colors.primary} />
              <Text style={s.measureLabel}>{m.label}</Text>
              <Text style={s.measureValue}>{m.value}{m.unit ? ` ${m.unit}` : ""}</Text>
            </View>
          ))}
        </Section>

        <Section title="НОТАТКИ">
          <TextInput
            style={s.notesInput}
            multiline
            placeholder="Спостереження, відхилення, висновки…"
            placeholderTextColor={colors.mutedSoft}
            value={activeRun.notes}
            onChangeText={txt => updateRunNotes(activeRun.id, txt)}
          />
        </Section>

        <Pressable style={s.completeBtn} onPress={() => setCompletionOpen(true)}>
          <Icons.Check size={18} color="#fff" />
          <Text style={s.completeBtnText}>Завершити аналіз</Text>
        </Pressable>

        <InputPickerModal
          kind={pickerOpen}
          inventory={labInventory}
          equipment={labEquipment}
          onPick={(input) => { addRunInput(activeRun.id, input); setPickerOpen(null); }}
          onClose={() => setPickerOpen(null)}
        />
        <MeasurementModal
          field={measureOpen}
          custom={false}
          onSubmit={(m) => { addRunMeasurement(activeRun.id, m); setMeasureOpen(null); }}
          onClose={() => setMeasureOpen(null)}
        />
        <MeasurementModal
          field={null}
          custom={customField}
          onSubmit={(m) => { addRunMeasurement(activeRun.id, m); setCustomField(false); }}
          onClose={() => setCustomField(false)}
        />
        <CompletionModal
          visible={completionOpen}
          onClose={() => setCompletionOpen(false)}
          onSubmit={handleComplete}
        />
      </View>
    );
  }

  // No active run — preset gallery + history
  return (
    <View style={{ gap: 16 }}>
      <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }}>
        <LinearGradient colors={["#0f766e", "#0f5c50"]} style={s.heroCard}>
          <View style={s.heroIconWrap}>
            <Icons.Zap size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.heroTitle}>Швидкий аналіз</Text>
            <Text style={s.heroSub}>Один тап → виконуйте → авто-журнал. Без планування.</Text>
          </View>
        </LinearGradient>
      </MotiView>

      <Text style={s.sectionLabel}>ОБЕРІТЬ ТИП</Text>
      <View style={s.presetGrid}>
        {RUN_PRESETS.map(p => (
          <Pressable
            key={p.id}
            onPress={() => handleStart(p)}
            style={({ pressed }) => [s.presetTile, { borderColor: p.color + "30" }, pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] }]}
          >
            <View style={[s.presetEmojiWrap, { backgroundColor: p.color + "15" }]}>
              <Text style={s.presetEmoji}>{p.emoji}</Text>
            </View>
            <Text style={s.presetLabel}>{p.shortLabel}</Text>
            {p.durationHint ? <Text style={s.presetSub}>{p.durationHint}</Text> : null}
            <View style={[s.presetBar, { backgroundColor: p.color }]} />
          </Pressable>
        ))}
      </View>

      {recentRuns.length > 0 && (
        <>
          <Text style={s.sectionLabel}>ОСТАННІ АНАЛІЗИ</Text>
          <View style={{ gap: 8 }}>
            {recentRuns.map(r => (
              <Pressable key={r.id} onPress={() => setDetailRun(r)} style={s.historyRow}>
                <Text style={s.historyEmoji}>{r.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.historyLabel}>{r.presetLabel}</Text>
                  <Text style={s.historyMeta}>
                    {new Date(r.completedAt || r.startedAt).toLocaleString("uk-UA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    {r.durationSec ? `  ·  ${Math.max(1, Math.round(r.durationSec / 60))} хв` : ""}
                    {`  ·  ${r.measurements.length} замірів`}
                  </Text>
                </View>
                <View style={[s.statusDot, { backgroundColor: r.status === "completed" ? "#059669" : "#94a3b8" }]} />
              </Pressable>
            ))}
          </View>
        </>
      )}

      <RunDetailModal run={detailRun} onClose={() => setDetailRun(null)} onDelete={(id) => { deleteLabRun(id); setDetailRun(null); }} />
    </View>
  );
}

// ─── Active Run Header ────────────────────────────────────────────────────────
function ActiveRunHeader({ run, onAbort }: { run: LabRun; onAbort: () => void }) {
  const elapsedMin = useMemo(() => {
    return Math.max(0, Math.round((Date.now() - new Date(run.startedAt).getTime()) / 60000));
  }, [run.startedAt]);
  return (
    <LinearGradient colors={["#0f5c50", "#073d35"]} style={s.activeHero}>
      <View style={s.activeRow}>
        <Text style={s.activeEmoji}>{run.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.activeLabel}>{run.presetLabel}</Text>
          <Text style={s.activeSub}>
            <Icons.Clock size={10} color="rgba(208,250,245,0.7)" />  {elapsedMin} хв тому
          </Text>
        </View>
        <Pressable onPress={onAbort} style={s.abortBtn} hitSlop={8}>
          <Icons.X size={16} color="#fff" />
        </Pressable>
      </View>
      <View style={s.activeMetrics}>
        <View style={s.activeMetric}>
          <Icons.Beaker size={11} color="rgba(208,250,245,0.6)" />
          <Text style={s.activeMetricText}>{run.inputs.length} inputs</Text>
        </View>
        <View style={s.activeMetric}>
          <Icons.Activity size={11} color="rgba(208,250,245,0.6)" />
          <Text style={s.activeMetricText}>{run.measurements.length} замірів</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, children, actionLabel, actionColor, onAction, secondary }: {
  title: string; children: React.ReactNode;
  actionLabel?: string; actionColor?: string; onAction?: () => void;
  secondary?: { label: string; color: string; onPress: () => void }[];
}) {
  return (
    <View style={s.section}>
      <View style={s.sectionHead}>
        <Text style={s.sectionTitle}>{title}</Text>
        {onAction && actionLabel && (
          <Pressable onPress={onAction}>
            <Text style={[s.sectionAction, { color: actionColor || colors.primary }]}>{actionLabel}</Text>
          </Pressable>
        )}
      </View>
      {secondary && secondary.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 6 }}>
          {secondary.map((b, i) => (
            <Pressable key={i} onPress={b.onPress} style={[s.secondaryChip, { borderColor: b.color + "55" }]}>
              <Text style={[s.secondaryChipText, { color: b.color }]}>{b.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
      <View style={{ gap: 8 }}>{children}</View>
    </View>
  );
}

// ─── Input Picker Modal ───────────────────────────────────────────────────────
function InputPickerModal({ kind, inventory, equipment, onPick, onClose }: {
  kind: "reagent" | "equipment" | "sample" | null;
  inventory: LabInventoryItem[];
  equipment: LabEquipment[];
  onPick: (input: LabRunInput) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  if (!kind) return null;

  const items: { id: string; name: string; sub?: string }[] = useMemo(() => {
    const q = query.toLowerCase();
    if (kind === "equipment") {
      return equipment
        .filter(e => e.status === "operational" && (!q || e.name.toLowerCase().includes(q)))
        .map(e => ({ id: e._id, name: e.name, sub: [e.manufacturer, e.model].filter(Boolean).join(" · ") }));
    }
    // reagent / sample обидва беруться з inventory
    return inventory
      .filter(i => {
        if (kind === "reagent" && i.category !== "reagent") return false;
        if (kind === "sample"  && i.category !== "sample") return false;
        return !q || i.name.toLowerCase().includes(q) || i.casNumber?.toLowerCase().includes(q);
      })
      .map(i => ({ id: i._id, name: i.name, sub: [i.casNumber, `${i.quantity} ${i.unit}`].filter(Boolean).join(" · ") }));
  }, [kind, query, inventory, equipment]);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={s.sheet} onPress={() => {}}>
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>Оберіть {kind === "reagent" ? "реагент" : kind === "equipment" ? "прилад" : "зразок"}</Text>
          <View style={s.searchWrap}>
            <Icons.Search size={14} color={colors.muted} />
            <TextInput
              style={s.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Пошук за назвою або CAS…"
              placeholderTextColor={colors.mutedSoft}
              autoFocus
            />
            {query.length > 0 && <Pressable onPress={() => setQuery("")}><Icons.X size={14} color={colors.muted} /></Pressable>}
          </View>
          <ScrollView style={{ maxHeight: 360 }}>
            {items.length === 0 ? (
              <Text style={s.emptyText}>Нічого не знайдено. Спочатку додайте у Склад/Прилади.</Text>
            ) : items.map(it => (
              <Pressable key={it.id} onPress={() => onPick({ refId: it.id, kind, name: it.name })} style={s.pickRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.pickName} numberOfLines={1}>{it.name}</Text>
                  {it.sub ? <Text style={s.pickSub} numberOfLines={1}>{it.sub}</Text> : null}
                </View>
                <Icons.ChevronRight size={14} color={colors.muted} />
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Measurement Modal ────────────────────────────────────────────────────────
function MeasurementModal({ field, custom, onSubmit, onClose }: {
  field: RunFieldSpec | null;
  custom: boolean;
  onSubmit: (m: { label: string; value: string; unit: string }) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState(field?.unit || "");
  const [label, setLabel] = useState("");

  const visible = !!field || custom;
  if (!visible) return null;

  const finalLabel = field ? field.label : label.trim();

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={s.measureSheet} onPress={() => {}}>
          <Text style={s.sheetTitle}>{field ? field.label : "Своє вимірювання"}</Text>
          {field?.hint && <Text style={s.fieldHint}>{field.hint}</Text>}
          {custom && (
            <TextInput
              style={s.measureInput}
              value={label}
              onChangeText={setLabel}
              placeholder="Назва параметра"
              placeholderTextColor={colors.mutedSoft}
            />
          )}
          <View style={s.measureRow2}>
            <TextInput
              style={[s.measureInput, { flex: 1 }]}
              value={value}
              onChangeText={setValue}
              placeholder="Значення"
              placeholderTextColor={colors.mutedSoft}
              keyboardType={field?.type === "text" ? "default" : "decimal-pad"}
              autoFocus
            />
            <TextInput
              style={[s.measureInput, { width: 78 }]}
              value={unit}
              onChangeText={setUnit}
              placeholder="одиниці"
              placeholderTextColor={colors.mutedSoft}
            />
          </View>
          <View style={s.modalActions}>
            <Pressable style={s.modalGhost} onPress={onClose}>
              <Text style={s.modalGhostText}>Скасувати</Text>
            </Pressable>
            <Pressable
              style={[s.modalPrimary, (!value || (custom && !finalLabel)) && { opacity: 0.4 }]}
              disabled={!value || (custom && !finalLabel)}
              onPress={() => { onSubmit({ label: finalLabel, value, unit }); setValue(""); setUnit(""); setLabel(""); }}
            >
              <Text style={s.modalPrimaryText}>Записати</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Completion Modal ─────────────────────────────────────────────────────────
function CompletionModal({ visible, onClose, onSubmit }: { visible: boolean; onClose: () => void; onSubmit: (result: string) => void }) {
  const [result, setResult] = useState("");
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={s.measureSheet} onPress={() => {}}>
          <Text style={s.sheetTitle}>Завершити аналіз</Text>
          <Text style={s.fieldHint}>Короткий висновок (необов'язково). Все запишеться у журнал автоматично.</Text>
          <TextInput
            style={[s.measureInput, { minHeight: 80, textAlignVertical: "top" }]}
            value={result}
            onChangeText={setResult}
            placeholder="Напр.: pH відповідає нормі, концентрація 1.25 мг/мл"
            placeholderTextColor={colors.mutedSoft}
            multiline
          />
          <View style={s.modalActions}>
            <Pressable style={s.modalGhost} onPress={onClose}>
              <Text style={s.modalGhostText}>Скасувати</Text>
            </Pressable>
            <Pressable style={s.modalPrimary} onPress={() => { onSubmit(result); setResult(""); }}>
              <Text style={s.modalPrimaryText}>Зберегти у журнал</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Run Detail Modal (read-only) ─────────────────────────────────────────────
function RunDetailModal({ run, onClose, onDelete }: { run: LabRun | null; onClose: () => void; onDelete: (id: string) => void }) {
  if (!run) return null;
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={s.sheet} onPress={() => {}}>
          <View style={s.sheetHandle} />
          <View style={s.detailHead}>
            <Text style={s.detailEmoji}>{run.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.sheetTitle}>{run.presetLabel}</Text>
              <Text style={s.detailMeta}>
                {new Date(run.startedAt).toLocaleString("uk-UA")}
                {run.durationSec ? `  ·  ${Math.max(1, Math.round(run.durationSec / 60))} хв` : ""}
              </Text>
            </View>
            <View style={[s.detailStatus, { backgroundColor: run.status === "completed" ? "#05966915" : "#94a3b815" }]}>
              <Text style={[s.detailStatusText, { color: run.status === "completed" ? "#059669" : "#64748b" }]}>
                {run.status === "completed" ? "Завершено" : "Скасовано"}
              </Text>
            </View>
          </View>
          <ScrollView style={{ maxHeight: 400 }} contentContainerStyle={{ gap: 12 }}>
            {run.result ? (
              <View style={s.detailBox}>
                <Text style={s.detailBoxLabel}>РЕЗУЛЬТАТ</Text>
                <Text style={s.detailBoxText}>{run.result}</Text>
              </View>
            ) : null}
            {run.inputs.length > 0 && (
              <View style={s.detailBox}>
                <Text style={s.detailBoxLabel}>ВИКОРИСТАНО</Text>
                {run.inputs.map(i => (
                  <Text key={i.refId} style={s.detailBoxText}>• {i.name} ({i.kind === "reagent" ? "реагент" : i.kind === "equipment" ? "прилад" : "зразок"})</Text>
                ))}
              </View>
            )}
            {run.measurements.length > 0 && (
              <View style={s.detailBox}>
                <Text style={s.detailBoxLabel}>ВИМІРЮВАННЯ</Text>
                {run.measurements.map(m => (
                  <Text key={m.id} style={s.detailBoxText}>• {m.label}: {m.value} {m.unit}</Text>
                ))}
              </View>
            )}
            {run.notes ? (
              <View style={s.detailBox}>
                <Text style={s.detailBoxLabel}>НОТАТКИ</Text>
                <Text style={s.detailBoxText}>{run.notes}</Text>
              </View>
            ) : null}
          </ScrollView>
          <Pressable
            style={s.deleteBtn}
            onPress={() => Alert.alert("Видалити запис?", "Це не вплине на журнал.", [
              { text: "Скасувати", style: "cancel" },
              { text: "Видалити", style: "destructive", onPress: () => onDelete(run.id) },
            ])}
          >
            <Icons.Trash2 size={14} color="#dc2626" />
            <Text style={s.deleteBtnText}>Видалити запис</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function inputColor(kind: string) {
  switch (kind) {
    case "reagent":   return "#dc2626";
    case "equipment": return "#0369a1";
    case "sample":    return "#7c3aed";
    default:          return "#64748b";
  }
}
function inputIcon(kind: string, color: string) {
  switch (kind) {
    case "reagent":   return <Icons.Beaker size={14} color={color} />;
    case "equipment": return <Icons.Microscope size={14} color={color} />;
    case "sample":    return <Icons.TestTube size={14} color={color} />;
    default:          return <Icons.Box size={14} color={color} />;
  }
}

const s = StyleSheet.create({
  heroCard:     { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 18, padding: 16 },
  heroIconWrap: { width: 44, height: 44, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.13)", alignItems: "center", justifyContent: "center" },
  heroTitle:    { fontSize: 16, fontFamily: fonts.bold, color: "#fff" },
  heroSub:      { fontSize: 12, color: "rgba(208,250,245,0.8)", marginTop: 2, lineHeight: 16 },

  sectionLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 1.5, color: colors.mutedSoft, textTransform: "uppercase" },

  presetGrid:   { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  presetTile:   { width: "31%", backgroundColor: "white", borderRadius: 14, padding: 12, alignItems: "center", gap: 4, borderWidth: 1, overflow: "hidden", elevation: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4 },
  presetEmojiWrap: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  presetEmoji:  { fontSize: 22 },
  presetLabel:  { fontSize: 12, fontFamily: fonts.bold, color: colors.ink },
  presetSub:    { fontSize: 9, color: colors.mutedSoft, textAlign: "center" },
  presetBar:    { position: "absolute", bottom: 0, left: 0, right: 0, height: 3 },

  historyRow:   { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "white", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border },
  historyEmoji: { fontSize: 22 },
  historyLabel: { fontSize: 13, fontFamily: fonts.bold, color: colors.ink },
  historyMeta:  { fontSize: 11, color: colors.muted, marginTop: 2 },
  statusDot:    { width: 8, height: 8, borderRadius: 4 },

  // Active run
  activeHero:   { borderRadius: 18, padding: 16, gap: 10 },
  activeRow:    { flexDirection: "row", alignItems: "center", gap: 12 },
  activeEmoji:  { fontSize: 32 },
  activeLabel:  { fontSize: 16, fontFamily: fonts.bold, color: "#fff" },
  activeSub:    { fontSize: 11, color: "rgba(208,250,245,0.75)", marginTop: 2 },
  abortBtn:     { width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  activeMetrics: { flexDirection: "row", gap: 12 },
  activeMetric:  { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.08)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  activeMetricText: { fontSize: 11, color: "rgba(208,250,245,0.85)" },

  section:      { backgroundColor: "white", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border, gap: 8 },
  sectionHead:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 10, fontWeight: "900", letterSpacing: 1, color: colors.muted, textTransform: "uppercase" },
  sectionAction:{ fontSize: 11, fontFamily: fonts.bold },
  secondaryChip:{ borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  secondaryChipText: { fontSize: 10, fontWeight: "800" },

  emptyText:    { fontSize: 12, color: colors.muted, fontStyle: "italic", paddingVertical: 4 },

  inputRow:     { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  inputKindBadge: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  inputName:    { fontSize: 13, fontFamily: fonts.bold, color: colors.ink },
  inputHint:    { fontSize: 11, color: colors.muted, marginTop: 1 },

  measureRow:   { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
  measureLabel: { flex: 1, fontSize: 12, color: colors.ink },
  measureValue: { fontSize: 13, fontFamily: fonts.bold, color: colors.primary },

  notesInput:   { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, minHeight: 60, fontSize: 13, color: colors.ink, textAlignVertical: "top" },

  completeBtn:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#059669", borderRadius: 14, padding: 14 },
  completeBtnText: { fontSize: 14, fontFamily: fonts.bold, color: "#fff" },

  // Modal common
  backdrop:     { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet:        { backgroundColor: "white", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18, paddingBottom: 28, gap: 12 },
  sheetHandle:  { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: "#e2e8f0" },
  sheetTitle:   { fontSize: 16, fontFamily: fonts.bold, color: colors.ink },
  searchWrap:   { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#f1f5f9", borderRadius: 10, paddingHorizontal: 10, height: 40 },
  searchInput:  { flex: 1, fontSize: 13, color: colors.ink },
  pickRow:      { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  pickName:     { fontSize: 13, fontFamily: fonts.bold, color: colors.ink },
  pickSub:      { fontSize: 11, color: colors.muted, marginTop: 1 },

  measureSheet: { backgroundColor: "white", borderRadius: 18, padding: 18, margin: 20, gap: 10, alignSelf: "center", width: "88%" },
  fieldHint:    { fontSize: 11, color: colors.muted, lineHeight: 14 },
  measureRow2:  { flexDirection: "row", gap: 8 },
  measureInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, fontSize: 14, color: colors.ink },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 6 },
  modalGhost:   { flex: 1, borderRadius: 10, padding: 12, alignItems: "center", backgroundColor: "#f1f5f9" },
  modalGhostText: { fontSize: 13, color: colors.muted, fontWeight: "700" },
  modalPrimary: { flex: 1, borderRadius: 10, padding: 12, alignItems: "center", backgroundColor: colors.primary },
  modalPrimaryText: { fontSize: 13, color: "#fff", fontWeight: "800" },

  // Detail
  detailHead:   { flexDirection: "row", alignItems: "center", gap: 10 },
  detailEmoji:  { fontSize: 28 },
  detailMeta:   { fontSize: 11, color: colors.muted, marginTop: 2 },
  detailStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  detailStatusText: { fontSize: 10, fontWeight: "900" },
  detailBox:    { backgroundColor: "#f8fafc", borderRadius: 10, padding: 12 },
  detailBoxLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 1, color: colors.mutedSoft, marginBottom: 4 },
  detailBoxText: { fontSize: 12, color: colors.ink, lineHeight: 17 },
  deleteBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, marginTop: 6 },
  deleteBtnText: { fontSize: 12, color: "#dc2626", fontWeight: "700" },
});
