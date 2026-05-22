import { useState, useEffect } from "react";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, TextInput, View, Pressable, RefreshControl } from "react-native";
import { Feather } from "@expo/vector-icons";
import { MotiView, AnimatePresence } from "moti";
import { Screen } from "@/components/screen";
import { ActionButton, Body, Card, Eyebrow, Title } from "@/components/ui";
import { GlassCard, GlassTabs } from "@/components/glass";
import { colors, fonts } from "@/constants/theme";
import {
  useMobileStore,
  type ResearchStage, type Task, type Milestone, type ResearchEvent,
  type BudgetSummary, type TaskStatus, type TaskPriority, type AlmanacEvent
} from "@/lib/mobile-store";

function money(value: number | undefined) {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgent: "Терміново", high: "Високий", medium: "Середній", low: "Низький",
};

export default function ManagementScreen() {
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();
  const {
    activeProjectId, activeWorkspaceItem, projects,
    stages, tasks, milestones, budgetSummary,
    almanacEvents, fetchAlmanac,
    fetchProjectDetails, loading, updateProjectTaskStatus,
    addPurchaseDraft, clearPurchaseDrafts, purchaseDrafts
  } = useMobileStore();

  const validTabs = ["stages", "planning", "budget", "almanac"] as const;
  type ManTab = typeof validTabs[number];
  const initialTab: ManTab = validTabs.includes(tabParam as ManTab) ? (tabParam as ManTab) : "stages";

  const [tab, setTab] = useState<ManTab>(initialTab);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);

  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam as ManTab)) {
      setTab(tabParam as ManTab);
    }
  }, [tabParam]);

  useEffect(() => {
    if (activeProjectId) {
      fetchProjectDetails();
      if (tab === "almanac") fetchAlmanac();
    }
  }, [activeProjectId, tab]);

  const onRefresh = () => {
    fetchProjectDetails();
    if (tab === "almanac") fetchAlmanac();
  };

  // Метадані з активного WorkspaceItem (нове) з fallback на legacy MobileProject.
  const legacyProject = projects.find(p => String(p.id) === String(activeProjectId));
  const isLab     = activeWorkspaceItem?.type === "laboratory" || legacyProject?.projectType === "laboratory";
  const title     = activeWorkspaceItem?.title ?? legacyProject?.title ?? "Деталі";
  const acronym   = activeWorkspaceItem?.tags[0] ?? legacyProject?.acronym ?? (isLab ? "Лабораторія" : "Керування");
  const roomNumber = (activeWorkspaceItem?.fields as any)?.roomNumber ?? legacyProject?.roomNumber;

  return (
    <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={colors.primary} />}>
      <GlassCard accent={isLab ? "#0f766e" : "#0369a1"}>
        <View style={styles.headerRow}>
          <View style={[styles.headerIconWrap, { backgroundColor: (isLab ? "#0f766e" : "#0369a1") + "18" }]}>
            <Feather name={isLab ? "tool" : "briefcase"} size={20} color={isLab ? "#0f766e" : "#0369a1"} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>{acronym}</Text>
            <Text style={styles.headerSub} numberOfLines={1}>{title}</Text>
          </View>
          {isLab && roomNumber && (
            <View style={styles.roomTag}>
              <Feather name="map-pin" size={10} color={colors.primary} />
              <Text style={styles.roomText}>{roomNumber}</Text>
            </View>
          )}
        </View>
      </GlassCard>

      <GlassTabs
        tabs={[
          { id: "stages",   label: isLab ? "Фази" : "План", badge: stages.length },
          { id: "planning", label: "Задачі",                badge: tasks.filter(t => t.status !== "done").length },
          { id: "budget",   label: "Бюджет" },
          { id: "almanac",  label: "Альманах" },
        ]}
        active={tab}
        onChange={setTab}
        color={isLab ? "#0f766e" : "#0369a1"}
      />

      <AnimatePresence exitBeforeEnter>
        {tab === "stages" && (
          <MotiView key="stages" from={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {selectedStageId ? (
              <StageDetailView stage={stages.find(s => s._id === selectedStageId)!} onBack={() => setSelectedStageId(null)} isLab={isLab} />
            ) : (
              <StagesView stages={stages} onSelect={setSelectedStageId} isLab={isLab} />
            )}
          </MotiView>
        )}
        {tab === "planning" && (
          <MotiView key="planning" from={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <PlanningView tasks={tasks} milestones={milestones} onToggleTask={updateProjectTaskStatus} />
          </MotiView>
        )}
        {tab === "budget" && (
          <MotiView key="budget" from={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <BudgetView summary={budgetSummary} drafts={purchaseDrafts} onAddDraft={addPurchaseDraft} onClearDrafts={clearPurchaseDrafts} />
          </MotiView>
        )}
        {tab === "almanac" && (
          <MotiView key="almanac" from={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <AlmanacView events={almanacEvents} />
          </MotiView>
        )}
      </AnimatePresence>

      <View style={styles.bottomSpacer} />
    </Screen>
  );
}

// --- Stages View ---

function StagesView({ stages, onSelect, isLab }: { stages: ResearchStage[], onSelect: (id: string) => void, isLab: boolean }) {
  return (
    <View style={styles.container}>
      <Eyebrow>{isLab ? "Фази організації лабораторії" : "Науковий план (Етапи)"}</Eyebrow>
      {stages.length === 0 ? (
        <Card><Body>План ще не завантажений.</Body></Card>
      ) : (
        stages.map((stage) => (
          <Pressable key={stage._id} onPress={() => onSelect(stage._id)}>
            <Card style={styles.stageCard}>
              <View style={styles.stageHeader}>
                <View style={styles.stageNumber}><Text style={styles.stageNumberText}>{stage.stageNumber}</Text></View>
                <View style={{ flex: 1 }}><Text style={styles.stageTitle} numberOfLines={1}>{stage.title}</Text></View>
                <Feather name="chevron-right" size={20} color={colors.border} />
              </View>
              <View style={styles.progressRow}>
                <View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: `${stage.progress}%`, backgroundColor: colors.primary }]} /></View>
                <Text style={styles.progressText}>{stage.progress}%</Text>
              </View>
            </Card>
          </Pressable>
        ))
      )}
    </View>
  );
}

function StageDetailView({ stage, onBack, isLab }: { stage: ResearchStage, onBack: () => void, isLab: boolean }) {
  return (
    <View style={styles.container}>
      <ActionButton label="Назад" variant="ghost" icon="arrow-left" onPress={onBack} />
      <Card tone="dark">
        <Eyebrow inverse>{isLab ? "Фаза" : "Етап"} {stage.stageNumber}</Eyebrow>
        <Title inverse>{stage.title}</Title>
        <Body inverse>{stage.startDate && stage.endDate ? `${stage.startDate} — ${stage.endDate}` : "Стаціонарний об'єкт"}</Body>
      </Card>
      <Card><Eyebrow>{isLab ? "Опис фази" : "Цілі"}</Eyebrow><Body>{stage.goals}</Body></Card>
      <Card><Eyebrow>Завдання</Eyebrow><Body>{stage.tasksText}</Body></Card>
    </View>
  );
}

// --- Planning View ---

function PlanningView({ tasks, milestones, onToggleTask }: any) {
  const [filter, setFilter] = useState<"tasks" | "milestones">("tasks");
  const openTasks = tasks.filter((t: any) => t.status !== "done").length;
  return (
    <View style={styles.container}>
      <GlassTabs<"tasks" | "milestones">
        tabs={[
          { id: "tasks",      label: "Задачі", badge: openTasks },
          { id: "milestones", label: "Віхи",   badge: milestones.length },
        ]}
        active={filter}
        onChange={setFilter}
      />
      {filter === "tasks" ? (
        tasks.length > 0 ? tasks.map((t: any) => (
          <Pressable key={t._id} style={styles.itemRow} onPress={() => onToggleTask(t._id, t.status === "done" ? "todo" : "done")}>
            <Feather name={t.status === "done" ? "check-circle" : "circle"} size={20} color={t.status === "done" ? colors.success : colors.border} />
            <View style={{ flex: 1 }}><Text style={[styles.itemTitle, t.status === "done" && styles.itemDone]}>{t.title}</Text></View>
          </Pressable>
        )) : <Card><Body>Задач немає.</Body></Card>
      ) : (
        milestones.length > 0 ? milestones.map((m: any) => (
          <View key={m._id} style={styles.itemRow}>
            <Feather name="flag" size={20} color={m.status === "reached" ? colors.amber : colors.border} />
            <View style={{ flex: 1 }}><Text style={styles.itemTitle}>{m.title}</Text></View>
          </View>
        )) : <Card><Body>Віх немає.</Body></Card>
      )}
    </View>
  );
}

// --- Budget View ---

function BudgetView({ summary, drafts, onAddDraft, onClearDrafts }: any) {
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  return (
    <View style={styles.container}>
      <Card tone="dark">
        <Eyebrow inverse>Залишок</Eyebrow>
        <Title inverse style={{ fontSize: 32 }}>{money(summary?.totalRemaining)}</Title>
        <Body inverse>Використано {money(summary?.totalSpent)} з {money(summary?.totalPlanned)}</Body>
      </Card>
      <Card>
        <Eyebrow>Нова чернетка</Eyebrow>
        <TextInput value={title} onChangeText={setTitle} placeholder="Назва" style={styles.input} />
        <TextInput value={amount} onChangeText={setAmount} placeholder="Сума" keyboardType="decimal-pad" style={styles.input} />
        <ActionButton label="Додати" icon="plus" onPress={() => { onAddDraft({ title, amount: parseFloat(amount) }); setTitle(""); setAmount(""); }} />
      </Card>
      {drafts.map((d: any) => (
        <View key={d.id} style={styles.draftRow}><Text>{d.title}</Text><Text style={{ fontWeight: "800" }}>{money(d.amount)}</Text></View>
      ))}
    </View>
  );
}

// --- Almanac View ---

function AlmanacView({ events }: { events: AlmanacEvent[] }) {
  return (
    <View style={styles.container}>
      <Eyebrow>Стрічка активності проєкту</Eyebrow>
      {events.length > 0 ? events.map(event => (
        <View key={event._id} style={styles.almanacItem}>
          <View style={styles.almanacDot} />
          <View style={styles.almanacContent}>
            <Text style={styles.almanacAction}>{event.action.replace('.', ' ')}</Text>
            <Text style={styles.almanacActor}>від {event.actorEmail}</Text>
            <Text style={styles.almanacDate}>{new Date(event.createdAt).toLocaleString('uk-UA')}</Text>
          </View>
        </View>
      )) : <Card><Body>Активність відсутня.</Body></Card>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: fonts.title, color: colors.ink, letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  roomTag: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.primary + "10", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  roomText: { fontSize: 10, fontFamily: fonts.bold, color: colors.primary, textTransform: "uppercase" },
  container: { gap: 16 },
  stageCard: { padding: 16 },
  stageHeader: { flexDirection: "row", gap: 12, marginBottom: 12, alignItems: "center" },
  stageNumber: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
  stageNumberText: { color: "white", fontSize: 11, fontWeight: "900" },
  stageTitle: { fontFamily: fonts.bold, fontSize: 15 },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  progressBarBg: { flex: 1, height: 6, backgroundColor: "#f1f5f9", borderRadius: 3, overflow: "hidden" },
  progressBarFill: { height: "100%" },
  progressText: { fontSize: 11, fontWeight: "800", width: 30 },
  itemRow: { flexDirection: "row", gap: 12, alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  itemTitle: { fontSize: 15, fontFamily: fonts.semiBold },
  itemDone: { textDecorationLine: "line-through", color: colors.muted },
  input: { backgroundColor: "#f8fafc", borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  draftRow: { flexDirection: "row", justifyContent: "space-between", padding: 12, backgroundColor: "white", borderRadius: 10, borderLeftWidth: 4, borderLeftColor: colors.primary },
  almanacItem: { flexDirection: "row", gap: 16, paddingLeft: 4 },
  almanacDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginTop: 6 },
  almanacContent: { flex: 1, paddingBottom: 20, borderLeftWidth: 1, borderLeftColor: colors.border, paddingLeft: 20, marginLeft: -25 },
  almanacAction: { fontSize: 14, fontFamily: fonts.bold, textTransform: "capitalize" },
  almanacActor: { fontSize: 12, color: colors.muted },
  almanacDate: { fontSize: 10, color: colors.mutedSoft, marginTop: 4 },
  bottomSpacer: { height: 80 }
});
