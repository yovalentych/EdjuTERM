import { useMemo, useState } from "react";
import {
  StyleSheet, View, Text, Pressable, RefreshControl,
} from "react-native";
import * as Icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";
import { router } from "expo-router";
import { Screen } from "@/components/screen";
import {
  GlassCard, GlassStatTile, GlassSwitcher, GlassCTA,
  GlassSectionHeader, GlassItemCard, GlassEyebrow,
} from "@/components/glass";
import { CreateItemSheet } from "@/components/create-item-sheet";
import { WorkspaceSwitcherSheet } from "@/components/workspace-switcher-sheet";
import { CreateWorkspaceSheet } from "@/components/create-workspace-sheet";
import { SpaceOnboarding } from "@/components/space-onboarding";
import { InfoBubble } from "@/components/info-bubble";
import { colors, fonts } from "@/constants/theme";
import {
  useMobileStore,
  type WorkspaceItem, type ItemKind,
  type ItemStatus,
  ITEM_TYPE_REGISTRY, LEARNING_TYPES, PROJECT_TYPES,
} from "@/lib/mobile-store";

export default function SpaceScreen() {
  const {
    user, workspaces, activeWorkspaceId, getItemsForWorkspace, pinnedItemIds,
    setItemPinned, setActiveWorkspaceItem, fetchProjects, loading,
  } = useMobileStore();

  const [sheetOpen, setSheetOpen]     = useState(false);
  const [createKind, setCreateKind]   = useState<ItemKind | undefined>(undefined);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [createWsOpen, setCreateWsOpen] = useState(false);

  const activeWs = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];
  const items    = activeWs ? getItemsForWorkspace(activeWs.id) : [];
  const accent   = activeWs?.color || colors.primary;

  const learningItems = useMemo(
    () => items.filter(i => (LEARNING_TYPES as string[]).includes(i.type)),
    [items]
  );
  const projectItems = useMemo(
    () => items.filter(i => (PROJECT_TYPES as string[]).includes(i.type)),
    [items]
  );

  function openCreate(kind?: ItemKind) {
    setCreateKind(kind);
    setSheetOpen(true);
  }

  function handleOpenItem(item: WorkspaceItem) {
    Haptics.selectionAsync();
    // Item-first: спочатку встановлюємо активний WorkspaceItem,
    // потім обираємо найрелевантніший таб за типом.
    setActiveWorkspaceItem(item.id, true);
    switch (item.type) {
      case "laboratory":
        router.push("/workbench");
        return;
      case "course":
      case "phd":
      case "bachelor":
      case "master":
        router.push("/learning");
        return;
      default:
        router.push(`/item/${item.id}` as any);
    }
  }

  const userName = user?.firstName || "Дослідник";
  const hasWorkspaces = workspaces.length > 0;

  // ── No-workspaces state: показуємо welcome картку замість основного flow ──
  if (!hasWorkspaces) {
    return (
      <Screen
        tintColor={colors.primary}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchProjects} tintColor={colors.primary} />}
      >
        <View style={s.welcomeHeader}>
          <Text style={s.greetEyebrow}>Привіт, {userName} 👋</Text>
          <Text style={s.greetTitle}>Створімо ваш перший Простір</Text>
        </View>

        <GlassCard padding={20}>
          <MotiView
            from={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 16 }}
            style={{ alignItems: "center", gap: 12 }}
          >
            <Text style={{ fontSize: 56 }}>🗂</Text>
            <Text style={s.welcomeTitle}>Простір — це етап</Text>
            <Text style={s.welcomeBody}>
              Аспірантура, магістратура, робота, особисті ідеї — кожен етап у власному просторі.
              Усередині — проєкти: дисертація, курси, лабораторії.
            </Text>

            <View style={s.welcomeFeatures}>
              <FeatureRow icon={<Icons.GraduationCap size={14} color="#0369a1" strokeWidth={2.2} />}
                          color="#0369a1"
                          label="Навчання: бакалаврат, магістратура, аспірантура" />
              <FeatureRow icon={<Icons.FlaskConical size={14} color="#0f766e" strokeWidth={2.2} />}
                          color="#0f766e"
                          label="Проєкти: лабораторії, гранти, дослідження" />
              <FeatureRow icon={<Icons.Rocket size={14} color="#7c3aed" strokeWidth={2.2} />}
                          color="#7c3aed"
                          label="Ініціативи: колаборації, open science, ідеї" />
            </View>

            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setCreateWsOpen(true); }}
              style={({ pressed }) => [s.welcomeCTA, pressed && { opacity: 0.92, transform: [{ scale: 0.985 }] }]}
            >
              <Icons.Plus size={16} color="#fff" strokeWidth={2.6} />
              <Text style={s.welcomeCTAText}>Створити перший Простір</Text>
            </Pressable>
          </MotiView>
        </GlassCard>

        <CreateWorkspaceSheet
          visible={createWsOpen}
          onClose={() => setCreateWsOpen(false)}
          onCreated={() => setCreateWsOpen(false)}
        />
      </Screen>
    );
  }

  return (
    <Screen
      tintColor={accent}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchProjects} tintColor={colors.primary} />}
    >
      {/* ── Greeting ─────────────────────────────────────────────────── */}
      <View style={s.greetRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.greetEyebrow}>Привіт, {userName} 👋</Text>
          <Text style={s.greetTitle}>Мої простори</Text>
        </View>
        <View style={s.greetCounter}>
          <Text style={[s.greetCounterValue, { color: accent }]}>{workspaces.length}</Text>
          <Text style={s.greetCounterLabel}>
            {plural(workspaces.length, "простір", "простори", "просторів")}
          </Text>
        </View>
      </View>

      {/* ── Workspace switcher ───────────────────────────────────────── */}
      <GlassSwitcher
        emoji={activeWs?.emoji || "🏠"}
        label="АКТИВНИЙ ПРОСТІР"
        name={activeWs?.name || "Без простору"}
        counter={items.length}
        color={accent}
        onPress={() => { Haptics.selectionAsync(); setSwitcherOpen(true); }}
        right={
          <InfoBubble
            title="Що таке Простір?"
            body="Простір — глобальний етап у житті дослідника (Аспірантура, Робота…). Проєкти — точкові частини етапу: Навчання, Дисертація, Лабораторія."
            color={accent}
          />
        }
      />

      {/* ── Primary CTA ──────────────────────────────────────────────── */}
      <GlassCTA
        label="Новий проєкт"
        icon="Plus"
        color={accent}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setSheetOpen(true); }}
      />

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <View style={s.statsRow}>
        <GlassStatTile
          icon={<Icons.GraduationCap size={14} color="#0369a1" strokeWidth={2.4} />}
          label="Навчання"
          value={String(learningItems.length)}
          color="#0369a1"
          delay={0}
        />
        <GlassStatTile
          icon={<Icons.FlaskConical size={14} color="#0f766e" strokeWidth={2.4} />}
          label="Проєкти"
          value={String(projectItems.length)}
          color="#0f766e"
          delay={50}
        />
        <GlassStatTile
          icon={<Icons.LayoutGrid size={14} color={accent} strokeWidth={2.4} />}
          label="Всього"
          value={String(items.length)}
          color={accent}
          delay={100}
        />
      </View>

      {/* ── Empty state ──────────────────────────────────────────────── */}
      {items.length === 0 && (
        <GlassCard padding={24}>
          <MotiView
            from={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 14 }}
            style={{ alignItems: "center", gap: 10 }}
          >
            <Text style={{ fontSize: 48 }}>{activeWs?.emoji || "📭"}</Text>
            <Text style={s.emptyTitle}>Простір порожній</Text>
            <Text style={s.emptyText}>Додайте навчальний запис або перший проєкт</Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
              <Pressable onPress={() => openCreate("learning")}
                style={({ pressed }) => [s.emptyBtn, { backgroundColor: "#0369a1" }, pressed && { opacity: 0.9 }]}>
                <Icons.GraduationCap size={14} color="#fff" strokeWidth={2.5} />
                <Text style={s.emptyBtnText}>Навчання</Text>
              </Pressable>
              <Pressable onPress={() => openCreate("project")}
                style={({ pressed }) => [s.emptyBtn, { backgroundColor: "#0f766e" }, pressed && { opacity: 0.9 }]}>
                <Icons.FlaskConical size={14} color="#fff" strokeWidth={2.5} />
                <Text style={s.emptyBtnText}>Проєкт</Text>
              </Pressable>
            </View>
          </MotiView>
        </GlassCard>
      )}

      {/* ── Two concept sections ─────────────────────────────────────── */}
      {items.length > 0 && (
        <View style={{ gap: 16 }}>
          <ConceptSection
            kind="learning"
            title="Навчання"
            color="#0369a1"
            icon={<Icons.GraduationCap size={14} color="#0369a1" strokeWidth={2.2} />}
            items={learningItems}
            pinnedItemIds={pinnedItemIds}
            onOpen={handleOpenItem}
            onPin={setItemPinned}
            onAdd={() => openCreate("learning")}
          />
          <ConceptSection
            kind="project"
            title="Проєкти"
            color="#0f766e"
            icon={<Icons.FlaskConical size={14} color="#0f766e" strokeWidth={2.2} />}
            items={projectItems}
            pinnedItemIds={pinnedItemIds}
            onOpen={handleOpenItem}
            onPin={setItemPinned}
            onAdd={() => openCreate("project")}
          />
        </View>
      )}

      <CreateItemSheet
        visible={sheetOpen}
        defaultKind={createKind}
        onClose={() => { setSheetOpen(false); setCreateKind(undefined); }}
        onCreated={(item) => { setSheetOpen(false); setCreateKind(undefined); handleOpenItem(item); }}
      />
      <WorkspaceSwitcherSheet
        visible={switcherOpen}
        onClose={() => setSwitcherOpen(false)}
        onCreateNew={() => setCreateWsOpen(true)}
      />
      <CreateWorkspaceSheet
        visible={createWsOpen}
        onClose={() => setCreateWsOpen(false)}
        onCreated={() => setCreateWsOpen(false)}
      />

      <SpaceOnboarding onDone={() => {}} />
    </Screen>
  );
}

function ConceptSection({ kind, title, color, icon, items, pinnedItemIds, onOpen, onPin, onAdd }: {
  kind: ItemKind;
  title: string;
  color: string;
  icon: React.ReactNode;
  items: WorkspaceItem[];
  pinnedItemIds: string[];
  onOpen: (i: WorkspaceItem) => void;
  onPin: (id: string, pinned: boolean) => void;
  onAdd: () => void;
}) {
  const pinned = items.filter(i => pinnedItemIds.includes(i.id));
  const rest   = items.filter(i => !pinnedItemIds.includes(i.id));

  return (
    <View style={[s.conceptSection, { borderColor: color + "30" }]}>
      {/* section header */}
      <View style={[s.conceptHeader, { backgroundColor: color + "0d", borderBottomColor: color + "25" }]}>
        <View style={[s.conceptIconWrap, { backgroundColor: color + "18" }]}>{icon}</View>
        <Text style={[s.conceptTitle, { color }]}>{title}</Text>
        <View style={[s.conceptCount, { backgroundColor: "rgba(255,255,255,0.7)" }]}>
          <Text style={s.conceptCountText}>{items.length}</Text>
        </View>
        <Pressable onPress={onAdd} style={[s.conceptAddBtn, { backgroundColor: color }]}>
          <Icons.Plus size={11} color="#fff" strokeWidth={2.8} />
          <Text style={s.conceptAddBtnText}>Додати</Text>
        </Pressable>
      </View>

      {/* items */}
      <View style={{ padding: 10, gap: 6 }}>
        {pinned.length > 0 && (
          <>
            <GlassEyebrow>Закріплені</GlassEyebrow>
            {pinned.map((it, i) => (
              <ItemRow key={it.id} item={it} onOpen={() => onOpen(it)}
                onPin={() => onPin(it.id, false)} isPinned delay={i * 30} />
            ))}
          </>
        )}
        {rest.map((it, i) => (
          <ItemRow key={it.id} item={it} onOpen={() => onOpen(it)}
            onPin={() => onPin(it.id, true)} delay={(pinned.length + i) * 30} />
        ))}
        {items.length === 0 && (
          <Pressable onPress={onAdd} style={[s.emptySlot, { borderColor: color + "40" }]}>
            <View style={[s.conceptIconWrap, { backgroundColor: color + "12" }]}>{icon}</View>
            <Text style={[s.emptySlotText, { color: color + "99" }]}>
              {kind === "learning" ? "Додайте освітній запис" : "Додайте перший проєкт"}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function ItemRow({ item, onOpen, onPin, isPinned, dimmed, delay }: {
  item: WorkspaceItem;
  onOpen: () => void;
  onPin: () => void;
  isPinned?: boolean;
  dimmed?: boolean;
  delay?: number;
}) {
  const meta = ITEM_TYPE_REGISTRY[item.type];
  const isShared = item.workspaceIds.length > 1;
  const isLegacy = !!item.legacyProjectId;

  return (
    <GlassItemCard
      emoji={item.emoji || meta.emoji}
      emojiColor={meta.color}
      title={item.title}
      typeLabel={meta.label}
      delay={delay}
      dimmed={dimmed}
      onPress={onOpen}
      badges={isLegacy ? (
        <View style={s.legacyBadge}>
          <Text style={s.legacyBadgeText}>legacy</Text>
        </View>
      ) : null}
      meta={
        <>
          <View style={[s.statusDot, { backgroundColor: statusColor(item.status) }]} />
          <Text style={s.itemMetaText}>{statusLabel(item.status)}</Text>
          {item.members.length > 0 && (
            <>
              <Text style={s.itemMetaSep}>·</Text>
              <Icons.Users size={11} color={colors.muted} />
              <Text style={s.itemMetaText}>{item.members.length}</Text>
            </>
          )}
          {isShared && (
            <>
              <Text style={s.itemMetaSep}>·</Text>
              <Icons.Link size={11} color="#7c3aed" />
              <Text style={[s.itemMetaText, { color: "#7c3aed", fontFamily: fonts.bold }]}>
                у {item.workspaceIds.length}
              </Text>
            </>
          )}
          {item.supervisor && (
            <>
              <Text style={s.itemMetaSep}>·</Text>
              <Text style={s.itemMetaText} numberOfLines={1}>{item.supervisor}</Text>
            </>
          )}
        </>
      }
      rightAction={
        <Pressable onPress={(e) => { e.stopPropagation(); onPin(); }} hitSlop={8} style={s.pinBtn}>
          <Icons.Pin
            size={14}
            color={isPinned ? "#d97706" : colors.mutedSoft}
            fill={isPinned ? "#d97706" : "none"}
            strokeWidth={1.8}
          />
        </Pressable>
      }
    />
  );
}

function FeatureRow({ icon, color, label }: { icon: React.ReactNode; color: string; label: string }) {
  return (
    <View style={s.featRow}>
      <View style={[s.featIcon, { backgroundColor: color + "1a", borderColor: color + "33" }]}>
        {icon}
      </View>
      <Text style={s.featText}>{label}</Text>
    </View>
  );
}

function statusColor(state: ItemStatus): string {
  switch (state) {
    case "active":    return "#10b981";
    case "draft":     return "#94a3b8";
    case "paused":    return "#d97706";
    case "completed": return "#0369a1";
    case "archived":  return "#64748b";
  }
}
function statusLabel(state: ItemStatus): string {
  switch (state) {
    case "active":    return "Активний";
    case "draft":     return "Чернетка";
    case "paused":    return "Пауза";
    case "completed": return "Завершено";
    case "archived":  return "Архів";
  }
}

function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return few;
  return many;
}

const s = StyleSheet.create({
  greetRow:           { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 2, marginTop: 2, gap: 12 },
  greetEyebrow:       { fontSize: 11, fontFamily: fonts.semiBold, color: colors.muted, letterSpacing: -0.1 },
  greetTitle:         { fontSize: 22, fontFamily: fonts.title, color: colors.ink, letterSpacing: -0.5, marginTop: 2 },
  greetCounter:       { alignItems: "flex-end" },
  greetCounterValue:  { fontSize: 22, fontFamily: fonts.title, letterSpacing: -0.5 },
  greetCounterLabel:  { fontSize: 10, fontFamily: fonts.bold, color: colors.mutedSoft, textTransform: "uppercase", letterSpacing: 0.6 },

  statsRow:           { flexDirection: "row", gap: 8 },

  emptyTitle:     { fontSize: 16, fontFamily: fonts.bold, color: colors.ink, textAlign: "center" },
  emptyText:      { fontSize: 13, color: colors.muted, textAlign: "center", lineHeight: 18, paddingHorizontal: 8 },
  emptyBtn:       { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  emptyBtnText:   { fontSize: 13, color: "#fff", fontFamily: fonts.bold, letterSpacing: -0.2 },

  // Concept sections
  conceptSection: { borderRadius: 18, borderWidth: 1, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.55)" },
  conceptHeader:  { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1 },
  conceptIconWrap:{ width: 24, height: 24, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  conceptTitle:   { fontSize: 13, fontFamily: fonts.bold, letterSpacing: -0.1, flex: 1 },
  conceptCount:   { borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 0.5, borderColor: "rgba(15,23,42,0.1)" },
  conceptCountText: { fontSize: 11, fontFamily: fonts.bold, color: colors.muted },
  conceptAddBtn:  { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  conceptAddBtnText: { fontSize: 11, fontFamily: fonts.bold, color: "#fff" },

  emptySlot:      { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1.5, borderStyle: "dashed", borderRadius: 12, padding: 14 },
  emptySlotText:  { fontSize: 12, fontFamily: fonts.semiBold },

  // Item row
  statusDot:      { width: 6, height: 6, borderRadius: 3 },
  itemMetaText:   { fontSize: 11, color: colors.muted, flexShrink: 1 },
  itemMetaSep:    { fontSize: 11, color: colors.mutedSoft },
  pinBtn:         { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  legacyBadge:    { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, backgroundColor: "rgba(217,119,6,0.15)", borderWidth: 0.5, borderColor: "rgba(217,119,6,0.3)" },
  legacyBadgeText:{ fontSize: 8, fontWeight: "900", color: "#d97706", letterSpacing: 0.2 },

  // No-workspaces welcome state
  welcomeHeader:  { paddingHorizontal: 2, gap: 4, marginBottom: 6 },
  welcomeTitle:   { fontSize: 18, fontFamily: fonts.title, color: colors.ink, letterSpacing: -0.4, textAlign: "center" },
  welcomeBody:    { fontSize: 13, color: colors.muted, textAlign: "center", lineHeight: 19, paddingHorizontal: 4 },
  welcomeFeatures:{ alignSelf: "stretch", gap: 10, marginTop: 8 },
  featRow:        { flexDirection: "row", alignItems: "center", gap: 10 },
  featIcon:       { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  featText:       { flex: 1, fontSize: 12.5, color: colors.ink, fontFamily: fonts.semiBold, letterSpacing: -0.1, lineHeight: 17 },
  welcomeCTA:     { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 22, paddingVertical: 13, borderRadius: 14, backgroundColor: colors.primary, marginTop: 6, shadowColor: colors.primary, shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  welcomeCTAText: { color: "#fff", fontFamily: fonts.bold, fontSize: 14, letterSpacing: -0.2 },
});
