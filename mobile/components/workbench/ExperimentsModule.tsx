import { View, Text, Pressable, ScrollView, TextInput, Alert, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useState, useMemo } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { ActionButton } from "@/components/ui";
import { colors } from "@/constants/theme";
import { type LabExperiment, type LabExperimentStatus } from "@/lib/mobile-store";
import { lab } from "./constants";
import { s } from "./styles";

const EXP_STATUS_CONFIG: Record<LabExperimentStatus, { color: string; label: string; icon: string }> = {
  planned:   { color: "#0369a1", label: "Заплановано", icon: "clock" },
  active:    { color: lab.ok,    label: "Активний",    icon: "play-circle" },
  completed: { color: "#047857", label: "Завершено",   icon: "check-circle" },
  failed:    { color: lab.danger,label: "Провалено",   icon: "x-circle" },
  paused:    { color: lab.amber, label: "Призупинено", icon: "pause-circle" },
};

const EXP_TYPES = ["Синтез", "Культивування", "Аналіз", "Вимірювання", "Скринінг", "Інше"];

// ─── Statistics view ───────────────────────────────────────────────────────────

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <View style={st.statBarRow}>
      <Text style={st.statBarLabel}>{label}</Text>
      <View style={st.statBarTrack}>
        <MotiView
          from={{ width: "0%" }}
          animate={{ width: `${pct}%` as any }}
          transition={{ type: "timing", duration: 600 }}
          style={[st.statBarFill, { backgroundColor: color }]}
        />
      </View>
      <Text style={[st.statBarValue, { color }]}>{value}</Text>
    </View>
  );
}

function ExperimentStats({ experiments }: { experiments: LabExperiment[] }) {
  const stats = useMemo(() => {
    const total = experiments.length;
    const byStatus: Record<string, number> = {};
    const byType: Record<string, { total: number; completed: number; failed: number }> = {};
    let sopTotal = 0, sopDone = 0, sopCount = 0;
    let totalDuration = 0, durationCount = 0;

    for (const e of experiments) {
      byStatus[e.status] = (byStatus[e.status] ?? 0) + 1;

      const typeKey = e.type || "Інше";
      if (!byType[typeKey]) byType[typeKey] = { total: 0, completed: 0, failed: 0 };
      byType[typeKey].total++;
      if (e.status === "completed") byType[typeKey].completed++;
      if (e.status === "failed")    byType[typeKey].failed++;

      if (e.steps && e.steps.length > 0) {
        const done = e.steps.filter(st => st.completed).length;
        sopTotal += e.steps.length;
        sopDone  += done;
        sopCount++;
      }

      if (e.startDate && e.endDate && e.status === "completed") {
        const ms = new Date(e.endDate).getTime() - new Date(e.startDate).getTime();
        if (ms > 0) { totalDuration += ms / (1000 * 3600 * 24); durationCount++; }
      }
    }

    const completed  = byStatus["completed"] ?? 0;
    const failed     = byStatus["failed"]    ?? 0;
    const active     = byStatus["active"]    ?? 0;
    const planned    = byStatus["planned"]   ?? 0;
    const successRate = completed + failed > 0 ? Math.round((completed / (completed + failed)) * 100) : null;
    const avgSop     = sopCount > 0 ? Math.round((sopDone / sopTotal) * 100) : null;
    const avgDuration = durationCount > 0 ? Math.round(totalDuration / durationCount) : null;

    return { total, byStatus, byType, completed, failed, active, planned, successRate, avgSop, avgDuration };
  }, [experiments]);

  if (stats.total === 0) {
    return (
      <View style={s.emptyWrap}>
        <Feather name="bar-chart-2" size={34} color={colors.mutedSoft} />
        <Text style={s.emptyText}>Недостатньо даних для статистики</Text>
      </View>
    );
  }

  const typeEntries = Object.entries(stats.byType).sort((a, b) => b[1].total - a[1].total);

  return (
    <View style={{ gap: 18 }}>
      {/* KPI cards */}
      <View style={st.kpiRow}>
        <View style={st.kpiCard}>
          <Text style={st.kpiValue}>{stats.total}</Text>
          <Text style={st.kpiLabel}>Всього</Text>
        </View>
        <View style={[st.kpiCard, { borderColor: EXP_STATUS_CONFIG.completed.color + "40" }]}>
          <Text style={[st.kpiValue, { color: EXP_STATUS_CONFIG.completed.color }]}>{stats.completed}</Text>
          <Text style={st.kpiLabel}>Завершено</Text>
        </View>
        <View style={[st.kpiCard, { borderColor: EXP_STATUS_CONFIG.failed.color + "40" }]}>
          <Text style={[st.kpiValue, { color: EXP_STATUS_CONFIG.failed.color }]}>{stats.failed}</Text>
          <Text style={st.kpiLabel}>Провалено</Text>
        </View>
        <View style={[st.kpiCard, { borderColor: "#7c3aed40" }]}>
          <Text style={[st.kpiValue, { color: "#7c3aed" }]}>{stats.successRate !== null ? `${stats.successRate}%` : "—"}</Text>
          <Text style={st.kpiLabel}>Успішність</Text>
        </View>
      </View>

      {/* Додаткові показники */}
      <View style={st.metricsRow}>
        {stats.avgSop !== null && (
          <View style={st.metricChip}>
            <Feather name="check-square" size={13} color={lab.ok} />
            <Text style={st.metricText}>SOP: {stats.avgSop}% виконано</Text>
          </View>
        )}
        {stats.avgDuration !== null && (
          <View style={st.metricChip}>
            <Feather name="clock" size={13} color="#0369a1" />
            <Text style={st.metricText}>Сер. тривалість: {stats.avgDuration} дн.</Text>
          </View>
        )}
      </View>

      {/* Розподіл по статусах */}
      <View style={st.section}>
        <Text style={s.sectionLabel}>ПО СТАТУСАХ</Text>
        <View style={{ gap: 8, marginTop: 8 }}>
          {(Object.keys(EXP_STATUS_CONFIG) as LabExperimentStatus[]).map(st_key => (
            <StatBar
              key={st_key}
              label={EXP_STATUS_CONFIG[st_key].label}
              value={stats.byStatus[st_key] ?? 0}
              max={stats.total}
              color={EXP_STATUS_CONFIG[st_key].color}
            />
          ))}
        </View>
      </View>

      {/* По типах */}
      {typeEntries.length > 0 && (
        <View style={st.section}>
          <Text style={s.sectionLabel}>ПО ТИПАХ</Text>
          <View style={{ gap: 8, marginTop: 8 }}>
            {typeEntries.map(([type, counts]) => {
              const rate = counts.completed + counts.failed > 0
                ? Math.round((counts.completed / (counts.completed + counts.failed)) * 100)
                : null;
              return (
                <View key={type} style={st.typeRow}>
                  <Text style={st.typeName} numberOfLines={1}>{type}</Text>
                  <View style={st.typeBarTrack}>
                    <MotiView
                      from={{ width: "0%" }}
                      animate={{ width: `${(counts.total / stats.total) * 100}%` as any }}
                      transition={{ type: "timing", duration: 600 }}
                      style={[st.typeBarFill, { backgroundColor: lab.bio + "80" }]}
                    />
                  </View>
                  <View style={{ alignItems: "flex-end", minWidth: 64 }}>
                    <Text style={st.typeCount}>{counts.total} досл.</Text>
                    {rate !== null && (
                      <Text style={[st.typeRate, { color: rate >= 70 ? lab.ok : rate >= 40 ? lab.amber : lab.danger }]}>
                        {rate}% успіх
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  kpiRow:       { flexDirection: "row", gap: 8 },
  kpiCard:      { flex: 1, borderRadius: 10, borderWidth: 1.5, borderColor: "#e2e8f0", backgroundColor: "#f8fafc", padding: 10, alignItems: "center", gap: 2 },
  kpiValue:     { fontSize: 20, fontWeight: "700", color: "#1e293b" },
  kpiLabel:     { fontSize: 10, color: "#64748b" },
  metricsRow:   { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metricChip:   { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: "#f1f5f9" },
  metricText:   { fontSize: 12, color: "#334155" },
  section:      { gap: 0 },
  statBarRow:   { flexDirection: "row", alignItems: "center", gap: 8 },
  statBarLabel: { fontSize: 12, color: "#475569", width: 100 },
  statBarTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: "#e2e8f0", overflow: "hidden" },
  statBarFill:  { height: "100%", borderRadius: 4 },
  statBarValue: { fontSize: 12, fontWeight: "600", width: 24, textAlign: "right" },
  typeRow:      { flexDirection: "row", alignItems: "center", gap: 8 },
  typeName:     { fontSize: 12, color: "#475569", width: 90 },
  typeBarTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: "#e2e8f0", overflow: "hidden" },
  typeBarFill:  { height: "100%", borderRadius: 4 },
  typeCount:    { fontSize: 11, color: "#64748b" },
  typeRate:     { fontSize: 11, fontWeight: "600" },
});

// ─── Main component ────────────────────────────────────────────────────────────

export function ExperimentsModule({ experiments, onCreate, onUpdate, onDelete, activeProjectId }: {
  experiments: LabExperiment[];
  onCreate: (data: Partial<LabExperiment>) => Promise<LabExperiment>;
  onUpdate: (id: string, data: Partial<LabExperiment>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  activeProjectId: string | null;
}) {
  const [view, setView]         = useState<"list" | "detail" | "create">("list");
  const [selectedExp, setSelectedExp] = useState<LabExperiment | null>(null);
  const [filter, setFilter]     = useState<"all" | "active" | "planned" | "stats">("all");

  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [hypothesis, setHypothesis]   = useState("");
  const [expType, setExpType]         = useState("Аналіз");
  const [startDate, setStartDate]     = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate]         = useState("");
  const [saving, setSaving]           = useState(false);

  const displayed = filter === "all" ? experiments : experiments.filter(e => e.status === filter);

  const handleCreate = async () => {
    if (!title.trim()) { Alert.alert("Помилка", "Введіть назву"); return; }
    setSaving(true);
    try {
      await onCreate({
        title: title.trim(), description: description.trim(), hypothesis: hypothesis.trim(),
        type: expType, status: "planned", startDate, endDate: endDate || "",
        steps: [], linkedEquipmentIds: [], linkedInventoryIds: [], tags: [],
        projectId: activeProjectId || "", createdBy: "",
      });
      setTitle(""); setDescription(""); setHypothesis(""); setEndDate("");
      setView("list");
      Alert.alert("Готово", "Експеримент створено");
    } catch {
      Alert.alert("Помилка", "Не вдалося зберегти");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStep = async (exp: LabExperiment, stepId: string) => {
    const steps = exp.steps.map(st =>
      st.id === stepId
        ? { ...st, completed: !st.completed, completedAt: !st.completed ? new Date().toISOString() : undefined }
        : st
    );
    await onUpdate(exp._id, { steps });
    setSelectedExp(prev => prev ? { ...prev, steps } : prev);
  };

  const handleStatusChange = async (exp: LabExperiment, status: LabExperimentStatus) => {
    await onUpdate(exp._id, { status });
    setSelectedExp(prev => prev ? { ...prev, status } : prev);
  };

  if (view === "create") {
    return (
      <View style={{ gap: 14 }}>
        <Pressable onPress={() => setView("list")} style={s.backBtn}>
          <Feather name="arrow-left" size={18} color={lab.bio} />
          <Text style={[s.backBtnText, { color: lab.bio }]}>До списку</Text>
        </Pressable>
        <Text style={[s.sectionLabel, { color: lab.bio }]}>НОВИЙ ЕКСПЕРИМЕНТ</Text>

        <View style={s.createForm}>
          <Text style={s.fieldLabel}>Назва *</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="Назва експерименту" style={s.fieldInput} />

          <Text style={s.fieldLabel}>Гіпотеза</Text>
          <TextInput value={hypothesis} onChangeText={setHypothesis} placeholder="Наукова гіпотеза..." style={[s.fieldInput, s.textArea]} multiline />

          <Text style={s.fieldLabel}>Опис / Протокол</Text>
          <TextInput value={description} onChangeText={setDescription} placeholder="Методологія, матеріали..." style={[s.fieldInput, s.textArea]} multiline />

          <Text style={s.fieldLabel}>Тип</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {EXP_TYPES.map(t => (
                <Pressable key={t} onPress={() => setExpType(t)} style={[s.chip, expType === t && { backgroundColor: lab.bio + "20", borderColor: lab.bio }]}>
                  <Text style={[s.chipText, expType === t && { color: lab.bio }]}>{t}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <Text style={s.fieldLabel}>Дата початку</Text>
          <TextInput value={startDate} onChangeText={setStartDate} placeholder="РРРР-ММ-ДД" style={s.fieldInput} />

          <Text style={s.fieldLabel}>Дата завершення (план)</Text>
          <TextInput value={endDate} onChangeText={setEndDate} placeholder="РРРР-ММ-ДД" style={s.fieldInput} />
        </View>

        <ActionButton label={saving ? "Збереження..." : "Створити експеримент"} icon="layers" onPress={handleCreate} />
      </View>
    );
  }

  if (view === "detail" && selectedExp) {
    const cfg = EXP_STATUS_CONFIG[selectedExp.status] || EXP_STATUS_CONFIG.planned;
    const completedSteps = selectedExp.steps.filter(st => st.completed).length;
    return (
      <View style={{ gap: 14 }}>
        <Pressable onPress={() => setView("list")} style={s.backBtn}>
          <Feather name="arrow-left" size={18} color={lab.bio} />
          <Text style={[s.backBtnText, { color: lab.bio }]}>До списку</Text>
        </Pressable>

        <LinearGradient colors={[lab.dark, "#1e3a5f"]} style={s.expDetailBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={s.expStatusRow}>
            <Feather name={cfg.icon as any} size={14} color={cfg.color} />
            <Text style={[s.expStatusText, { color: cfg.color }]}>{cfg.label.toUpperCase()}</Text>
            <View style={{ flex: 1 }} />
            <Text style={s.expType}>{selectedExp.type}</Text>
          </View>
          <Text style={s.expDetailTitle}>{selectedExp.title}</Text>
          {selectedExp.hypothesis ? (
            <Text style={s.expDetailHypo} numberOfLines={3}>"{selectedExp.hypothesis}"</Text>
          ) : null}
          <View style={s.expDateRow}>
            <Feather name="calendar" size={11} color={lab.soft + "80"} />
            <Text style={s.expDateText}>{selectedExp.startDate}{selectedExp.endDate ? ` → ${selectedExp.endDate}` : ""}</Text>
          </View>
        </LinearGradient>

        <Text style={s.sectionLabel}>ЗМІНИТИ СТАТУС</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {(Object.keys(EXP_STATUS_CONFIG) as LabExperimentStatus[]).map(st => {
              const c = EXP_STATUS_CONFIG[st];
              const active = selectedExp.status === st;
              return (
                <Pressable key={st} onPress={() => handleStatusChange(selectedExp, st)}
                  style={[s.chip, active && { backgroundColor: c.color + "20", borderColor: c.color }]}>
                  <Feather name={c.icon as any} size={12} color={active ? c.color : colors.mutedSoft} />
                  <Text style={[s.chipText, active && { color: c.color }]}>{c.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {selectedExp.description ? (
          <>
            <Text style={s.sectionLabel}>ПРОТОКОЛ / ОПИС</Text>
            <View style={s.expDescCard}>
              <Text style={s.expDescText}>{selectedExp.description}</Text>
            </View>
          </>
        ) : null}

        {selectedExp.steps.length > 0 && (
          <>
            <Text style={s.sectionLabel}>SOP-КРОКИ ({completedSteps}/{selectedExp.steps.length})</Text>
            <View style={s.stepsProgress}>
              <View style={[s.stepsProgressFill, { width: `${selectedExp.steps.length ? (completedSteps / selectedExp.steps.length) * 100 : 0}%` }]} />
            </View>
            {selectedExp.steps.map(step => (
              <Pressable key={step.id} onPress={() => handleToggleStep(selectedExp, step.id)} style={s.stepRow}>
                <Feather name={step.completed ? "check-square" : "square"} size={20} color={step.completed ? lab.ok : colors.border} />
                <Text style={[s.stepTitle, step.completed && s.stepDone]}>{step.title}</Text>
              </Pressable>
            ))}
          </>
        )}

        <View style={s.dangerZone}>
          <Text style={s.dangerTitle}>Небезпечна зона</Text>
          <ActionButton
            label="Видалити експеримент"
            variant="ghost"
            icon="trash-2"
            onPress={() => Alert.alert("Видалити?", `"${selectedExp.title}" буде видалено назавжди.`, [
              { text: "Скасувати", style: "cancel" },
              { text: "Видалити", style: "destructive", onPress: async () => {
                await onDelete(selectedExp._id);
                setView("list");
              }},
            ])}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{ gap: 14 }}>
      <View style={s.moduleHeader}>
        <View style={[s.moduleIconWrap, { backgroundColor: lab.bio + "18" }]}>
          <Feather name="layers" size={20} color={lab.bio} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.moduleTitle}>Експерименти</Text>
          <Text style={s.moduleSub}>{experiments.length} експериментів · {experiments.filter(e => e.status === "active").length} активних</Text>
        </View>
        <Pressable onPress={() => setView("create")} style={s.addBtn}>
          <Feather name="plus" size={18} color="white" />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={[s.filterRow, { flexWrap: "nowrap" }]}>
          {(["all", "active", "planned", "stats"] as const).map(f => (
            <Pressable key={f} onPress={() => setFilter(f)} style={[s.filterTab, filter === f && s.filterTabActive]}>
              <Text style={[s.filterTabText, filter === f && s.filterTabTextActive]}>
                {f === "all" ? `Всі (${experiments.length})` : f === "active" ? "Активні" : f === "planned" ? "Заплановані" : "Статистика"}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {filter === "stats" ? (
        <ExperimentStats experiments={experiments} />
      ) : displayed.length === 0 ? (
        <View style={s.emptyWrap}>
          <Feather name="layers" size={36} color={colors.mutedSoft} />
          <Text style={s.emptyText}>Немає експериментів</Text>
          <ActionButton label="Створити перший" icon="plus" onPress={() => setView("create")} />
        </View>
      ) : (
        displayed.map(exp => {
          const cfg  = EXP_STATUS_CONFIG[exp.status] || EXP_STATUS_CONFIG.planned;
          const done = exp.steps.filter(st => st.completed).length;
          return (
            <Pressable key={exp._id} onPress={() => { setSelectedExp(exp); setView("detail"); }}
              style={({ pressed }) => [s.expCard, { borderLeftColor: cfg.color }, pressed && { opacity: 0.75 }]}>
              <View style={s.expCardTop}>
                <View style={[s.expStatusChip, { backgroundColor: cfg.color + "18" }]}>
                  <Feather name={cfg.icon as any} size={11} color={cfg.color} />
                  <Text style={[s.expStatusChipText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
                <Text style={s.expTypeTag}>{exp.type}</Text>
              </View>
              <Text style={s.expCardTitle}>{exp.title}</Text>
              {exp.hypothesis ? <Text style={s.expCardHypo} numberOfLines={2}>{exp.hypothesis}</Text> : null}
              <View style={s.expCardMeta}>
                <Feather name="calendar" size={11} color={colors.mutedSoft} />
                <Text style={s.expCardMetaText}>{exp.startDate}</Text>
                {exp.steps.length > 0 && (
                  <>
                    <View style={s.bannerDot} />
                    <Feather name="check-square" size={11} color={done === exp.steps.length ? lab.ok : colors.mutedSoft} />
                    <Text style={s.expCardMetaText}>{done}/{exp.steps.length} кроків</Text>
                  </>
                )}
              </View>
            </Pressable>
          );
        })
      )}
    </View>
  );
}
