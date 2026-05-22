import { useLocalSearchParams, router } from "expo-router";
import { useMemo, useEffect, useState } from "react";
import { StyleSheet, View, Text, Pressable, Alert, Modal, TextInput, FlatList, ActivityIndicator } from "react-native";
import * as Icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Screen } from "@/components/screen";
import { GlassCard, GlassPill } from "@/components/glass";
import { colors, fonts } from "@/constants/theme";
import {
  useMobileStore,
  ITEM_TYPE_REGISTRY,
  type ItemType,
} from "@/lib/mobile-store";

const PROJECT_TILES: Record<string, { id: string; icon: keyof typeof Icons; label: string }[]> = {
  individual_research: [
    { id: "stages",   icon: "ClipboardList", label: "Етапи" },
    { id: "planning", icon: "Target",        label: "Задачі" },
    { id: "budget",   icon: "DollarSign",    label: "Бюджет" },
  ],
  grant: [
    { id: "stages",   icon: "ClipboardList", label: "Етапи" },
    { id: "planning", icon: "Target",        label: "Задачі" },
    { id: "budget",   icon: "DollarSign",    label: "Бюджет" },
  ],
  collaboration: [
    { id: "planning", icon: "Target",        label: "Задачі" },
    { id: "stages",   icon: "ClipboardList", label: "Етапи" },
  ],
  study_group: [
    { id: "planning", icon: "Target",        label: "Задачі" },
  ],
  seminar: [
    { id: "planning", icon: "Target",        label: "Задачі" },
  ],
  open_science: [
    { id: "planning", icon: "Target",        label: "Задачі" },
  ],
  idea: [
    { id: "planning", icon: "Target",        label: "Задачі" },
  ],
};

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    getAllItems, deleteWorkspaceItem, archiveWorkspaceItem, setItemPinned, pinnedItemIds,
    workspaces, addItemToWorkspace, removeItemFromWorkspace,
    setActiveWorkspaceItem,
    linkedItemsMap, fetchLinkedItems, linkItemViaApi, unlinkItemViaApi,
  } = useMobileStore();

  const allItems = getAllItems();
  const item = useMemo(() => allItems.find(i => i.id === id), [allItems, id]);

  // Hooks — до будь-яких умовних return
  const [linkSearchVisible, setLinkSearchVisible] = useState(false);
  const [linkQuery, setLinkQuery] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);

  const linkedItems = linkedItemsMap[item?.id ?? ""] ?? [];

  useEffect(() => {
    if (item?.id) fetchLinkedItems(item.id);
  }, [item?.id]);

  const linkCandidates = useMemo(() => {
    if (!item) return [];
    return allItems.filter(
      (it) =>
        it.id !== item.id &&
        !linkedItems.some((li) => li.id === it.id) &&
        (linkQuery.length === 0 || it.title.toLowerCase().includes(linkQuery.toLowerCase())),
    );
  }, [allItems, item, linkedItems, linkQuery]);

  if (!item) {
    return (
      <Screen>
        <GlassCard>
          <Text style={s.notFoundText}>Проєкт не знайдено</Text>
          <GlassPill label="Назад до Простору" icon="ArrowLeft" tone="tinted" color={colors.primary} onPress={() => router.replace("/space")} />
        </GlassCard>
      </Screen>
    );
  }

  const meta = ITEM_TYPE_REGISTRY[item.type];
  const isPinned = pinnedItemIds.includes(item.id);
  const isLegacy = !!item.legacyProjectId;
  const goBackToSpace = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/space");
  };

  function handleDelete() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("Видалити проєкт?", "Цю дію не можна скасувати.", [
      { text: "Скасувати", style: "cancel" },
      { text: "Видалити", style: "destructive", onPress: () => {
        if (item) {
          deleteWorkspaceItem(item.id);
          router.replace("/space");
        }
      }},
    ]);
  }

  return (
    <Screen>
      {/* Back row */}
      <Pressable onPress={goBackToSpace} style={s.backRow}>
        <Icons.ArrowLeft size={18} color={meta.color} strokeWidth={2.4} />
        <Text style={[s.backText, { color: meta.color }]}>Простір</Text>
      </Pressable>

      {/* Hero */}
      <LinearGradient
        colors={[meta.color + "20", meta.color + "06"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={s.hero}
      >
        <View style={s.heroTopRow}>
          <View style={[s.heroEmojiWrap, { backgroundColor: meta.color + "20" }]}>
            <Text style={s.heroEmoji}>{item.emoji || meta.emoji}</Text>
          </View>
          <Pressable
            onPress={() => { Haptics.selectionAsync(); setItemPinned(item.id, !isPinned); }}
            hitSlop={8}
            style={s.heroPin}
          >
            <Icons.Pin size={16} color={isPinned ? "#d97706" : colors.muted} fill={isPinned ? "#d97706" : "none"} strokeWidth={1.8} />
          </Pressable>
        </View>
        <Text style={s.heroType}>{meta.label.toUpperCase()}</Text>
        <Text style={s.heroTitle}>{item.title}</Text>
        {item.description ? <Text style={s.heroDesc}>{item.description}</Text> : null}

        <View style={s.heroMetaRow}>
          <View style={[s.statusPill, { backgroundColor: statusColor(item.status) + "20" }]}>
            <View style={[s.statusDot, { backgroundColor: statusColor(item.status) }]} />
            <Text style={[s.statusText, { color: statusColor(item.status) }]}>{statusLabel(item.status)}</Text>
          </View>
          <View style={s.visBadge}>
            <Icons.Globe size={10} color={colors.muted} />
            <Text style={s.visText}>{visibilityLabel(item.visibility)}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Quick actions — deep UI by type */}
      {item.type === "laboratory" && (
        <View style={s.actionsRow}>
          <GlassPill
            label="Дослідна панель"
            icon="FlaskConical"
            tone="filled"
            color={meta.color}
            onPress={() => { setActiveWorkspaceItem(item.id, true); router.push("/workbench"); }}
          />
          <GlassPill
            label="Менеджмент"
            icon="Layers"
            tone="tinted"
            color={meta.color}
            onPress={() => { setActiveWorkspaceItem(item.id, true); router.push("/management"); }}
          />
        </View>
      )}

      {(item.type === "course" || item.type === "phd" || item.type === "bachelor" || item.type === "master") && (
        <View style={s.actionsRow}>
          <GlassPill
            label={item.type === "phd" ? "PhD план" : "Курси та оцінки"}
            icon="GraduationCap"
            tone="filled"
            color={meta.color}
            onPress={() => { setActiveWorkspaceItem(item.id, true); router.push("/learning"); }}
          />
          <GlassPill
            label="Наукова складова"
            icon="FlaskConical"
            tone="tinted"
            color={meta.color}
            onPress={() => { setActiveWorkspaceItem(item.id, true); router.push("/management?tab=stages"); }}
          />
        </View>
      )}

      {PROJECT_TILES[item.type] && (
        <ProjectTilesRow
          tiles={PROJECT_TILES[item.type]}
          color={meta.color}
          onPress={(tabId) => { setActiveWorkspaceItem(item.id, true); router.push(`/management?tab=${tabId}` as any); }}
        />
      )}

      <View style={s.actionsRow}>
        {isLegacy && (
          <GlassPill
            label="Старий дашборд"
            icon="ExternalLink"
            tone="light"
            color={colors.muted}
            onPress={() => { setActiveWorkspaceItem(item.id, true); router.push("/home" as any); }}
          />
        )}
        <GlassPill
          label="Архівувати"
          icon="Archive"
          tone="light"
          color={colors.muted}
          onPress={() => { archiveWorkspaceItem(item.id); goBackToSpace(); }}
        />
      </View>

      {/* Overview */}
      <GlassCard delay={100}>
        <Text style={s.sectionLabel}>ОГЛЯД</Text>
        {item.supervisor && (
          <DetailRow Icon={Icons.User} label="Науковий керівник" value={item.supervisor} />
        )}
        {item.startDate && (
          <DetailRow Icon={Icons.Calendar} label="Старт" value={item.startDate} />
        )}
        {item.plannedEndDate && (
          <DetailRow Icon={Icons.Flag} label="Плановане завершення" value={item.plannedEndDate} />
        )}
        {item.ownerName && (
          <DetailRow Icon={Icons.UserCheck} label="Власник" value={item.ownerName} />
        )}
        {item.members.length > 0 && (
          <DetailRow Icon={Icons.Users} label="Учасники" value={`${item.members.length} осіб`} />
        )}
        {item.tags.length > 0 && (
          <View style={s.tagsRow}>
            {item.tags.map(tag => (
              <View key={tag} style={s.tag}><Text style={s.tagText}>{tag}</Text></View>
            ))}
          </View>
        )}
        {!item.supervisor && !item.startDate && !item.plannedEndDate && item.members.length === 0 && (
          <Text style={s.emptyHint}>Деталей поки немає — додайте в редакторі.</Text>
        )}
      </GlassCard>

      {/* Workspaces */}
      <GlassCard delay={140}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionLabel}>ПРОСТОРИ ({item.workspaceIds.length})</Text>
        </View>
        <View style={s.wsChipsRow}>
          {workspaces.map(ws => {
            const isIn = item.workspaceIds.includes(ws.id);
            return (
              <Pressable
                key={ws.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  if (isIn) {
                    if (item.workspaceIds.length === 1) {
                      Alert.alert("Не можна", "Проєкт має бути хоча б в одному просторі.");
                      return;
                    }
                    removeItemFromWorkspace(item.id, ws.id);
                  } else {
                    addItemToWorkspace(item.id, ws.id);
                  }
                }}
                style={[s.wsChip, isIn && { backgroundColor: ws.color + "20", borderColor: ws.color }]}
              >
                <Text style={s.wsChipEmoji}>{ws.emoji}</Text>
                <Text style={[s.wsChipName, isIn && { color: ws.color }]}>{ws.name}</Text>
                {isIn && <Icons.Check size={12} color={ws.color} strokeWidth={3} />}
              </Pressable>
            );
          })}
        </View>
        {item.workspaceIds.length > 1 && (
          <Text style={s.sharedNote}>🔗 Цей проєкт спільний для {item.workspaceIds.length} просторів</Text>
        )}
      </GlassCard>

      {/* Linked items */}
      <GlassCard delay={170}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionLabel}>ПОВ'ЯЗАНЕ ({linkedItems.length})</Text>
          <Pressable onPress={() => setLinkSearchVisible(true)}>
            <Text style={s.linkText}>+ Зв'язати</Text>
          </Pressable>
        </View>
        {linkedItems.length === 0 ? (
          <Text style={s.emptyHint}>Зв'язаних елементів ще немає.</Text>
        ) : (
          linkedItems.map((li) => {
            const liMeta = ITEM_TYPE_REGISTRY[li.type as ItemType] ?? ITEM_TYPE_REGISTRY["individual_research"];
            return (
              <View key={li.id} style={s.linkedRow}>
                <View style={[s.linkedEmoji, { backgroundColor: liMeta.color + "18" }]}>
                  <Text style={{ fontSize: 16 }}>{li.emoji || liMeta.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.linkedTitle} numberOfLines={1}>{li.title}</Text>
                  <Text style={s.linkedType}>{liMeta.label}</Text>
                </View>
                <Pressable
                  hitSlop={8}
                  onPress={async () => {
                    Haptics.selectionAsync();
                    setLinkLoading(true);
                    await unlinkItemViaApi(item.id, li.id);
                    setLinkLoading(false);
                  }}
                >
                  <Icons.X size={14} color={colors.muted} />
                </Pressable>
              </View>
            );
          })
        )}
      </GlassCard>

      {/* Link search modal */}
      <Modal visible={linkSearchVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setLinkSearchVisible(false)}>
        <View style={s.modalWrap}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Зв'язати з елементом</Text>
            <Pressable onPress={() => { setLinkSearchVisible(false); setLinkQuery(""); }}>
              <Icons.X size={20} color={colors.ink} />
            </Pressable>
          </View>
          <View style={s.modalSearch}>
            <Icons.Search size={15} color={colors.muted} />
            <TextInput
              style={s.modalInput}
              placeholder="Пошук за назвою…"
              placeholderTextColor={colors.muted}
              value={linkQuery}
              onChangeText={setLinkQuery}
              autoFocus
            />
          </View>
          <FlatList
            data={linkCandidates.slice(0, 20)}
            keyExtractor={(it) => it.id}
            renderItem={({ item: candidate }) => {
              const cMeta = ITEM_TYPE_REGISTRY[candidate.type as ItemType] ?? ITEM_TYPE_REGISTRY["individual_research"];
              return (
                <Pressable
                  style={s.candidateRow}
                  onPress={async () => {
                    Haptics.selectionAsync();
                    setLinkLoading(true);
                    await linkItemViaApi(item.id, candidate.id);
                    setLinkLoading(false);
                    setLinkSearchVisible(false);
                    setLinkQuery("");
                  }}
                >
                  <View style={[s.linkedEmoji, { backgroundColor: cMeta.color + "18" }]}>
                    <Text style={{ fontSize: 16 }}>{candidate.emoji || cMeta.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.linkedTitle} numberOfLines={1}>{candidate.title}</Text>
                    <Text style={s.linkedType}>{cMeta.label}</Text>
                  </View>
                  <Icons.Plus size={16} color={cMeta.color} />
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <Text style={[s.emptyHint, { textAlign: "center", marginTop: 24 }]}>
                {linkQuery ? "Нічого не знайдено" : "Введіть назву для пошуку"}
              </Text>
            }
          />
          {linkLoading && (
            <View style={s.modalLoader}>
              <ActivityIndicator color={meta.color} />
            </View>
          )}
        </View>
      </Modal>

      {/* Type-specific hint */}
      {isLegacy && (
        <GlassCard accent={meta.color} delay={200}>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <Icons.Info size={16} color={meta.color} />
            <View style={{ flex: 1 }}>
              <Text style={s.legacyTitle}>Legacy проєкт</Text>
              <Text style={s.legacyText}>
                Цей проєкт з попередньої версії. Натисніть "Відкрити робочий простір" — побачите усі дані ({meta.label.toLowerCase()} dashboard).
              </Text>
            </View>
          </View>
        </GlassCard>
      )}

      {/* Danger zone */}
      {!isLegacy && (
        <Pressable onPress={handleDelete} style={s.deleteBtn}>
          <Icons.Trash2 size={14} color="#be123c" />
          <Text style={s.deleteText}>Видалити проєкт</Text>
        </Pressable>
      )}
    </Screen>
  );
}

function ProjectTilesRow({
  tiles, color, onPress,
}: { tiles: { id: string; icon: keyof typeof Icons; label: string }[]; color: string; onPress: (id: string) => void }) {
  return (
    <View style={s.tilesGrid}>
      {tiles.map(({ id, icon, label }) => {
        const Icon = Icons[icon] as any;
        return (
          <Pressable
            key={id}
            onPress={() => { Haptics.selectionAsync(); onPress(id); }}
            style={[s.tile, { borderColor: color + "40", backgroundColor: color + "0C" }]}
          >
            <View style={[s.tileIconWrap, { backgroundColor: color + "18" }]}>
              <Icon size={18} color={color} strokeWidth={2} />
            </View>
            <Text style={[s.tileLabel, { color: color }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function DetailRow({ Icon, label, value }: { Icon: any; label: string; value: string }) {
  return (
    <View style={s.detailRow}>
      <View style={s.detailIcon}><Icon size={14} color={colors.muted} /></View>
      <Text style={s.detailLabel}>{label}</Text>
      <Text style={s.detailValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function statusColor(s: any): string {
  switch (s) {
    case "active":    return "#10b981";
    case "draft":     return "#94a3b8";
    case "paused":    return "#d97706";
    case "completed": return "#0369a1";
    case "archived":  return "#64748b";
    default: return "#94a3b8";
  }
}
function statusLabel(s: any): string {
  switch (s) {
    case "active":    return "Активний";
    case "draft":     return "Чернетка";
    case "paused":    return "Пауза";
    case "completed": return "Завершено";
    case "archived":  return "Архів";
    default: return s;
  }
}
function visibilityLabel(v: any): string {
  switch (v) {
    case "private":       return "Приватний";
    case "institutional": return "Інституційний";
    case "public":        return "Публічний";
    default: return v;
  }
}

const s = StyleSheet.create({
  backRow:     { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.75)", borderWidth: 0.5, borderColor: "rgba(255,255,255,0.65)" },
  backText:    { fontSize: 13, fontFamily: fonts.bold, letterSpacing: -0.2 },

  hero:        { borderRadius: 22, padding: 18, overflow: "hidden" },
  heroTopRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  heroEmojiWrap:{ width: 56, height: 56, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  heroEmoji:   { fontSize: 30 },
  heroPin:     { width: 36, height: 36, borderRadius: 11, backgroundColor: "rgba(255,255,255,0.5)", alignItems: "center", justifyContent: "center" },
  heroType:    { fontSize: 10, fontFamily: fonts.bold, letterSpacing: 1.4, color: colors.mutedSoft, textTransform: "uppercase" },
  heroTitle:   { fontSize: 22, fontFamily: fonts.title, color: colors.ink, letterSpacing: -0.5, marginTop: 4 },
  heroDesc:    { fontSize: 13, color: colors.muted, marginTop: 6, lineHeight: 18 },
  heroMetaRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  statusPill:  { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  statusDot:   { width: 6, height: 6, borderRadius: 3 },
  statusText:  { fontSize: 11, fontFamily: fonts.bold, letterSpacing: -0.1 },
  visBadge:    { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.5)" },
  visText:     { fontSize: 11, color: colors.muted, fontWeight: "700" },

  actionsRow:  { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  tilesGrid:   { flexDirection: "row", gap: 10 },
  tile:        { flex: 1, alignItems: "center", gap: 8, paddingVertical: 14, borderRadius: 16, borderWidth: 1 },
  tileIconWrap:{ width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  tileLabel:   { fontSize: 11, fontFamily: fonts.bold, letterSpacing: -0.1 },

  sectionLabel:{ fontSize: 10, fontFamily: fonts.bold, letterSpacing: 1.4, color: colors.mutedSoft, textTransform: "uppercase", marginBottom: 4 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  linkText:    { fontSize: 11, color: colors.primary, fontWeight: "800" },

  detailRow:   { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  detailIcon:  { width: 24, height: 24, borderRadius: 7, backgroundColor: "rgba(100,116,139,0.1)", alignItems: "center", justifyContent: "center" },
  detailLabel: { fontSize: 12, color: colors.muted, fontFamily: fonts.semiBold },
  detailValue: { flex: 1, textAlign: "right", fontSize: 12, color: colors.ink, fontFamily: fonts.bold },
  tagsRow:     { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  tag:         { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: "rgba(15,118,110,0.1)" },
  tagText:     { fontSize: 10, color: colors.primary, fontFamily: fonts.bold },

  emptyHint:   { fontSize: 12, color: colors.muted, fontStyle: "italic", marginTop: 4 },
  legacyTitle: { fontSize: 13, fontFamily: fonts.bold, color: colors.ink },
  legacyText:  { fontSize: 11, color: colors.muted, marginTop: 2, lineHeight: 15 },

  deleteBtn:   { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, padding: 12, marginTop: 6 },
  deleteText:  { fontSize: 12, color: "#be123c", fontFamily: fonts.bold },
  notFoundText:{ fontSize: 14, color: colors.muted, textAlign: "center", marginBottom: 12 },
  linkedRow:   { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: "rgba(15,23,42,0.06)" },
  linkedEmoji: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  linkedTitle: { fontSize: 13, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.1 },
  linkedType:  { fontSize: 10, color: colors.muted, marginTop: 1 },
  modalWrap:   { flex: 1, backgroundColor: "#f8fafc", paddingTop: 16 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingBottom: 12 },
  modalTitle:  { fontSize: 17, fontFamily: fonts.title, color: colors.ink },
  modalSearch: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, marginBottom: 8, backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: "rgba(15,23,42,0.08)" },
  modalInput:  { flex: 1, fontSize: 14, color: colors.ink, fontFamily: fonts.semiBold },
  candidateRow:{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: 0.5, borderBottomColor: "rgba(15,23,42,0.06)", backgroundColor: "#fff" },
  modalLoader: { position: "absolute", inset: 0, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.7)" } as any,

  wsChipsRow:  { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  wsChip:      { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: "rgba(15,23,42,0.1)", backgroundColor: "rgba(255,255,255,0.7)" },
  wsChipEmoji: { fontSize: 13 },
  wsChipName:  { fontSize: 11, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.1 },
  sharedNote:  { fontSize: 11, color: "#7c3aed", marginTop: 8, fontFamily: fonts.bold, textAlign: "center" },
});
