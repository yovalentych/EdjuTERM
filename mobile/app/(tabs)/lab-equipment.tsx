import { useState, useEffect } from "react";
import {
  StyleSheet, View, Text, Pressable, ScrollView,
  TextInput, Modal, Alert, RefreshControl, KeyboardAvoidingView, Platform,
} from "react-native";
import {
  CATALOG_CATEGORIES, CATALOG_ITEMS, searchCatalog, calIntervalLabel,
  type CatalogItem, type CatalogCategory,
} from "@/lib/equipment-catalog";
import { Feather } from "@expo/vector-icons";
import * as Icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { Screen } from "@/components/screen";
import { GlassCard } from "@/components/glass";
import { colors, fonts } from "@/constants/theme";
import { useMobileStore, type LabEquipment, type LabEquipmentStatus } from "@/lib/mobile-store";

const lab = {
  dark: "#073d35", mid: "#0f5c50", accent: "#0f766e", soft: "#d0faf5",
  amber: "#d97706", danger: "#be123c", ok: "#047857", neutral: "#64748b",
};

const STATUS_CFG: Record<LabEquipmentStatus, { label: string; color: string; Icon: any }> = {
  operational:    { label: "Працює",         color: lab.ok,      Icon: Icons.CircleCheck },
  maintenance:    { label: "Обслуговування", color: lab.amber,   Icon: Icons.Wrench },
  out_of_order:   { label: "Несправний",     color: lab.danger,  Icon: Icons.OctagonAlert },
  decommissioned: { label: "Списаний",       color: lab.neutral, Icon: Icons.CircleMinus },
};

const LOG_TYPE_CFG = {
  usage:          { label: "USE",  color: lab.accent },
  maintenance:    { label: "MNT",  color: lab.amber },
  calibration:    { label: "CAL",  color: "#0369a1" },
  failure_report: { label: "ERR",  color: lab.danger },
};

function emptyForm(): Partial<LabEquipment> {
  return {
    name: "", manufacturer: "", model: "", serialNumber: "",
    location: "", description: "", status: "operational",
    nextCalibrationDate: "",
  };
}

export default function LabEquipmentScreen() {
  const {
    labEquipment, fetchLabEquipment,
    labEquipmentLogs, fetchLabEquipmentLogs, addEquipmentLog,
    createEquipment, updateEquipment, deleteEquipment,
    loading,
  } = useMobileStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<LabEquipment | null>(null);
  const [form, setForm] = useState<Partial<LabEquipment>>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [catalogVisible, setCatalogVisible] = useState(false);

  function openFromCatalog(item: CatalogItem) {
    setCatalogVisible(false);
    setEditing(null);
    const nextCal = item.calibrationDays > 0
      ? new Date(Date.now() + item.calibrationDays * 24 * 3600 * 1000).toISOString().slice(0, 10)
      : "";
    setForm({
      name:                item.name,
      manufacturer:        item.manufacturers[0] ?? "",
      description:         item.description,
      nextCalibrationDate: nextCal,
      status:              "operational",
      model: "", serialNumber: "", location: "",
    });
    setModalVisible(true);
  }

  const selected = labEquipment.find(e => e._id === selectedId);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setModalVisible(true);
  }

  function openEdit(eq: LabEquipment) {
    setEditing(eq);
    setForm({ ...eq });
    setModalVisible(true);
  }

  async function handleSave() {
    if (!form.name?.trim()) { Alert.alert("Помилка", "Вкажіть назву приладу."); return; }
    setSaving(true);
    try {
      if (editing) {
        await updateEquipment(editing._id, form);
      } else {
        await createEquipment(form);
      }
      setModalVisible(false);
    } catch {
      Alert.alert("Помилка", "Не вдалося зберегти. Перевірте з'єднання.");
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(eq: LabEquipment) {
    Alert.alert(
      "Видалити?",
      `«${eq.name}» буде видалено назавжди.`,
      [
        { text: "Скасувати", style: "cancel" },
        {
          text: "Видалити",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteEquipment(eq._id);
              if (selectedId === eq._id) setSelectedId(null);
            } catch {
              Alert.alert("Помилка", "Не вдалося видалити.");
            }
          },
        },
      ]
    );
  }

  // ── Detail view ──────────────────────────────────────────────────────────
  if (selected) {
    const cfg = STATUS_CFG[selected.status];
    const cal = selected.nextCalibrationDate ? new Date(selected.nextCalibrationDate) : null;
    const calDays = cal ? Math.floor((cal.getTime() - Date.now()) / (24 * 3600 * 1000)) : null;
    const logs = labEquipmentLogs[selected._id] || [];

    return (
      <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={() => fetchLabEquipmentLogs(selected._id)} tintColor={lab.accent} />}>
        <Pressable onPress={() => setSelectedId(null)} style={s.backBtn}>
          <Icons.ArrowLeft size={18} color={lab.accent} strokeWidth={2.5} />
          <Text style={s.backBtnText}>До списку</Text>
        </Pressable>

        {/* Banner */}
        <LinearGradient colors={["#040e0c", lab.dark, lab.mid]} style={s.detailBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={s.detailStatusRow}>
            <View style={[s.statusDot, { backgroundColor: cfg.color }]} />
            <Text style={[s.detailStatusLabel, { color: cfg.color }]}>{cfg.label.toUpperCase()}</Text>
            <Pressable onPress={() => openEdit(selected)} style={s.editBtn}>
              <Icons.Pencil size={13} color={lab.soft + "cc"} strokeWidth={2.5} />
              <Text style={s.editBtnText}>Редагувати</Text>
            </Pressable>
          </View>
          <Text style={s.detailName}>{selected.name}</Text>
          <Text style={s.detailModel}>{[selected.manufacturer, selected.model].filter(Boolean).join(" · ")}</Text>
          {selected.serialNumber ? (
            <Text style={s.detailSN}>S/N: <Text style={s.mono}>{selected.serialNumber}</Text></Text>
          ) : null}
          {selected.location ? (
            <View style={s.detailMeta}>
              <Icons.MapPin size={11} color={lab.soft + "70"} strokeWidth={2} />
              <Text style={s.detailMetaText}>{selected.location}</Text>
            </View>
          ) : null}
        </LinearGradient>

        {/* Calibration alert */}
        {calDays !== null && calDays < 60 && (
          <View style={[s.calAlert, { borderColor: calDays < 14 ? lab.danger + "50" : lab.amber + "50", backgroundColor: calDays < 14 ? lab.danger + "0a" : lab.amber + "0a" }]}>
            <Icons.Clock size={14} color={calDays < 14 ? lab.danger : lab.amber} strokeWidth={2.5} />
            <Text style={[s.calAlertText, { color: calDays < 14 ? lab.danger : lab.amber }]}>
              {calDays < 0 ? "Калібрування прострочено!" : `Наступне калібрування через ${calDays} дн. (${cal!.toLocaleDateString("uk-UA")})`}
            </Text>
          </View>
        )}

        {/* GLP log actions */}
        <Text style={s.sectionLabel}>GLP — ЖУРНАЛ</Text>
        <View style={s.logActions}>
          {(["usage", "maintenance", "calibration", "failure_report"] as const).map(type => {
            const lcfg = LOG_TYPE_CFG[type];
            return (
              <Pressable key={type} style={[s.logActionBtn, { borderColor: lcfg.color + "50", backgroundColor: lcfg.color + "10" }]}
                onPress={() => {
                  addEquipmentLog(selected._id, { type, description: `${lcfg.label} — мобільний запис` });
                  Alert.alert("GLP", `Запис "${lcfg.label}" додано до журналу.`);
                }}>
                <Text style={[s.logActionText, { color: lcfg.color }]}>{lcfg.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Log entries */}
        {logs.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyText}>Журнал порожній</Text>
          </View>
        ) : (
          logs.map(log => {
            const lcfg = LOG_TYPE_CFG[log.type] || LOG_TYPE_CFG.usage;
            return (
              <View key={log._id} style={s.logItem}>
                <View style={[s.logTypeBadge, { backgroundColor: lcfg.color + "18" }]}>
                  <Text style={[s.logTypeText, { color: lcfg.color }]}>{lcfg.label}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.logDesc}>{log.description}</Text>
                  <Text style={s.logDate}>{new Date(log.createdAt).toLocaleString("uk-UA", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</Text>
                </View>
              </View>
            );
          })
        )}

        {/* Danger zone */}
        <View style={s.dangerZone}>
          <Text style={s.dangerTitle}>Зона небезпеки</Text>
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); confirmDelete(selected); }} style={s.dangerBtn}>
            <Icons.Trash2 size={16} color={lab.danger} strokeWidth={2} />
            <Text style={s.dangerBtnText}>Видалити прилад</Text>
          </Pressable>
        </View>

        <EquipmentModal
          visible={modalVisible} editing={editing} form={form} setForm={setForm}
          onSave={handleSave} onClose={() => setModalVisible(false)} saving={saving}
        />
      </Screen>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────
  return (
    <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchLabEquipment} tintColor={lab.accent} />}>
      <GlassCard padding={14} accent={lab.amber} style={{ marginBottom: 4 }}>
        <View style={s.header}>
          <View style={s.headerLeft}>
            <LinearGradient colors={[lab.amber + "25", lab.amber + "10"]} style={s.headerIcon}>
              <Icons.Microscope size={20} color={lab.amber} strokeWidth={1.8} />
            </LinearGradient>
            <View>
              <Text style={s.headerTitle}>Обладнання</Text>
              <Text style={s.headerSub}>{labEquipment.length} приладів · {labEquipment.filter(e => e.status === "operational").length} у роботі</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCatalogVisible(true); }} style={s.catalogBtn}>
              <Icons.BookMarked size={17} color={lab.amber} strokeWidth={2} />
              <Text style={s.catalogBtnText}>Каталог</Text>
            </Pressable>
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); openCreate(); }} style={s.addBtn}>
              <Icons.Plus size={18} color="white" strokeWidth={2.5} />
              <Text style={s.addBtnText}>Додати</Text>
            </Pressable>
          </View>
        </View>
      </GlassCard>

      {labEquipment.length === 0 ? (
        <View style={s.empty}>
          <Icons.Microscope size={40} color={colors.border} strokeWidth={1.2} />
          <Text style={s.emptyTitle}>Обладнання не додано</Text>
          <Text style={s.emptyBody}>Натисніть «Додати» щоб внести перший прилад</Text>
        </View>
      ) : (
        labEquipment.map((eq, i) => {
          const cfg = STATUS_CFG[eq.status];
          const EqIcon = cfg.Icon;
          const cal = eq.nextCalibrationDate ? new Date(eq.nextCalibrationDate) : null;
          const calDays = cal ? Math.floor((cal.getTime() - Date.now()) / (24 * 3600 * 1000)) : null;
          const isOperational = eq.status === "operational";
          return (
            <MotiView key={eq._id} from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: i * 30 }}>
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedId(eq._id); fetchLabEquipmentLogs(eq._id); }}
                style={({ pressed }) => [s.eqCard, pressed && { opacity: 0.75, transform: [{ scale: 0.985 }] }]}
              >
                <View style={[s.eqStatusStrip, { backgroundColor: cfg.color }]} />
                <LinearGradient colors={[cfg.color + "22", cfg.color + "08"]} style={s.eqIconWrap}>
                  <EqIcon size={18} color={cfg.color} strokeWidth={1.8} />
                </LinearGradient>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={s.eqName}>{eq.name}</Text>
                  {(eq.manufacturer || eq.model) ? (
                    <Text style={s.eqModel}>{[eq.manufacturer, eq.model].filter(Boolean).join(" ")}</Text>
                  ) : null}
                  {calDays !== null && calDays < 30 && (
                    <View style={s.calChip}>
                      <Icons.Clock size={10} color={calDays < 14 ? lab.danger : lab.amber} strokeWidth={2.5} />
                      <Text style={[s.calBadge, { color: calDays < 14 ? lab.danger : lab.amber }]}>
                        Калібрування через {calDays} дн.
                      </Text>
                    </View>
                  )}
                </View>
                <View style={s.eqRight}>
                  {/* Animated status indicator */}
                  <View style={s.eqStatusRow}>
                    {isOperational && (
                      <MotiView
                        from={{ scale: 1, opacity: 0.4 }}
                        animate={{ scale: 1.6, opacity: 0 }}
                        transition={{ type: "timing", duration: 1500, loop: true }}
                        style={[s.statusPulse, { backgroundColor: cfg.color }]}
                      />
                    )}
                    <View style={[s.statusDot, { backgroundColor: cfg.color }]} />
                  </View>
                  <View style={[s.eqStatusTag, { backgroundColor: cfg.color + "15" }]}>
                    <Text style={[s.eqStatusTagText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                  <Pressable onPress={() => { Haptics.selectionAsync(); openEdit(eq); }} style={[s.iconBtn, { marginTop: 4 }]}>
                    <Icons.Pencil size={13} color={lab.accent} strokeWidth={2.5} />
                  </Pressable>
                </View>
              </Pressable>
            </MotiView>
          );
        })
      )}

      <EquipmentModal
        visible={modalVisible} editing={editing} form={form} setForm={setForm}
        onSave={handleSave} onClose={() => setModalVisible(false)} saving={saving}
      />

      <CatalogModal
        visible={catalogVisible}
        onClose={() => setCatalogVisible(false)}
        onSelect={openFromCatalog}
      />
    </Screen>
  );
}

// ─── Catalog Modal ────────────────────────────────────────────────────────────
const BSL_COLOR = ["", "#047857", "#0369a1", "#d97706", "#be123c"];

function CatalogModal({ visible, onClose, onSelect }: {
  visible: boolean;
  onClose: () => void;
  onSelect: (item: CatalogItem) => void;
}) {
  const [query, setQuery] = useState("");
  const [catId, setCatId] = useState("all");
  const [detail, setDetail] = useState<CatalogItem | null>(null);

  useEffect(() => {
    if (visible) { setQuery(""); setCatId("all"); setDetail(null); }
  }, [visible]);

  const filtered = query.trim()
    ? searchCatalog(query)
    : catId === "all" ? CATALOG_ITEMS : CATALOG_ITEMS.filter(i => i.categoryId === catId);

  const cat = CATALOG_CATEGORIES.find(c => c.id === catId);

  // ── Detail view ─────────────────────────────────────────────────────────────
  if (detail) {
    const category = CATALOG_CATEGORIES.find(c => c.id === detail.categoryId);
    const hasMaint = detail.maintenanceDays > 0;
    const hasCal   = detail.calibrationDays > 0;

    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setDetail(null)}>
        <View style={cs.container}>
          {/* Header */}
          <View style={cs.detailHeader}>
            <Pressable onPress={() => setDetail(null)} style={cs.backBtn}>
              <Icons.ArrowLeft size={20} color={lab.accent} strokeWidth={2.5} />
            </Pressable>
            <Text style={cs.detailHeaderTitle} numberOfLines={1}>{detail.name}</Text>
            <Pressable onPress={onClose} style={cs.closeBtn}>
              <Icons.X size={20} color={colors.ink} strokeWidth={2.5} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            {/* Hero */}
            <View style={[cs.hero, { borderColor: (category?.color ?? "#888") + "30" }]}>
              <View style={[cs.heroEmojiBox, { backgroundColor: (category?.color ?? "#888") + "15" }]}>
                <Text style={cs.heroEmoji}>{detail.emoji}</Text>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={cs.heroName}>{detail.name}</Text>
                <Text style={cs.heroNameEn}>{detail.nameEn}</Text>
                {category && (
                  <View style={[cs.catBadge, { backgroundColor: category.color + "18", borderColor: category.color + "40" }]}>
                    <Text style={cs.catBadgeEmoji}>{category.emoji}</Text>
                    <Text style={[cs.catBadgeText, { color: category.color }]}>{category.label}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Description */}
            <Text style={cs.desc}>{detail.description}</Text>
            {detail.usageNotes && (
              <View style={cs.notesBox}>
                <Icons.Info size={13} color={lab.amber} strokeWidth={2} />
                <Text style={cs.notesText}>{detail.usageNotes}</Text>
              </View>
            )}

            {/* Key specs */}
            {Object.keys(detail.specs).length > 0 && (
              <View style={cs.section}>
                <Text style={cs.sectionTitle}>Технічні характеристики</Text>
                {Object.entries(detail.specs).map(([k, v]) => (
                  <View key={k} style={cs.specRow}>
                    <Text style={cs.specKey}>{k}</Text>
                    <Text style={cs.specVal}>{v}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Maintenance info */}
            <View style={cs.section}>
              <Text style={cs.sectionTitle}>Обслуговування та вимоги</Text>
              <View style={cs.infoGrid}>
                <View style={cs.infoTile}>
                  <Icons.CalendarCheck size={18} color={hasCal ? "#0369a1" : lab.neutral} strokeWidth={1.8} />
                  <Text style={cs.infoTileLabel}>Калібрування</Text>
                  <Text style={[cs.infoTileVal, { color: hasCal ? "#0369a1" : lab.neutral }]}>{calIntervalLabel(detail.calibrationDays)}</Text>
                </View>
                <View style={cs.infoTile}>
                  <Icons.Wrench size={18} color={hasMaint ? lab.amber : lab.neutral} strokeWidth={1.8} />
                  <Text style={cs.infoTileLabel}>ТО</Text>
                  <Text style={[cs.infoTileVal, { color: hasMaint ? lab.amber : lab.neutral }]}>{calIntervalLabel(detail.maintenanceDays)}</Text>
                </View>
                <View style={cs.infoTile}>
                  <Icons.ShieldCheck size={18} color={detail.requiresCert ? lab.danger : lab.ok} strokeWidth={1.8} />
                  <Text style={cs.infoTileLabel}>Сертифікат</Text>
                  <Text style={[cs.infoTileVal, { color: detail.requiresCert ? lab.danger : lab.ok }]}>{detail.requiresCert ? "Так" : "Ні"}</Text>
                </View>
                <View style={cs.infoTile}>
                  <Icons.Biohazard size={18} color={BSL_COLOR[detail.bslMax]} strokeWidth={1.8} />
                  <Text style={cs.infoTileLabel}>BSL макс.</Text>
                  <Text style={[cs.infoTileVal, { color: BSL_COLOR[detail.bslMax] }]}>BSL-{detail.bslMax}</Text>
                </View>
              </View>
            </View>

            {/* Manufacturers */}
            <View style={cs.section}>
              <Text style={cs.sectionTitle}>Основні виробники</Text>
              <View style={cs.mfgWrap}>
                {detail.manufacturers.map((m, i) => (
                  <View key={i} style={cs.mfgChip}>
                    <Text style={cs.mfgText}>{m}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Add button */}
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onSelect(detail); }}
              style={cs.addFromCatalogBtn}
            >
              <Icons.Plus size={20} color="white" strokeWidth={2.5} />
              <Text style={cs.addFromCatalogBtnText}>Додати до лабораторії</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────────
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={cs.container}>
        {/* Header */}
        <View style={cs.header}>
          <View style={{ flex: 1 }}>
            <Text style={cs.headerTitle}>Каталог обладнання</Text>
            <Text style={cs.headerSub}>{CATALOG_ITEMS.length} типів · {CATALOG_CATEGORIES.length} категорій</Text>
          </View>
          <Pressable onPress={onClose} style={cs.closeBtn}>
            <Icons.X size={22} color={colors.ink} strokeWidth={2.5} />
          </Pressable>
        </View>

        {/* Search */}
        <View style={cs.searchBox}>
          <Icons.Search size={16} color={colors.mutedSoft} strokeWidth={2} />
          <TextInput
            style={cs.searchInput}
            value={query}
            onChangeText={v => { setQuery(v); if (v) setCatId("all"); }}
            placeholder="Назва, виробник, призначення..."
            placeholderTextColor={colors.mutedSoft}
          />
          {query ? (
            <Pressable onPress={() => setQuery("")}>
              <Icons.X size={15} color={colors.mutedSoft} strokeWidth={2} />
            </Pressable>
          ) : null}
        </View>

        {/* Category tabs */}
        {!query && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={cs.catRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
            <Pressable onPress={() => setCatId("all")} style={[cs.catChip, catId === "all" && cs.catChipActive]}>
              <Text style={[cs.catChipText, catId === "all" && cs.catChipTextActive]}>Всі ({CATALOG_ITEMS.length})</Text>
            </Pressable>
            {CATALOG_CATEGORIES.map(c => {
              const count = CATALOG_ITEMS.filter(i => i.categoryId === c.id).length;
              const active = catId === c.id;
              return (
                <Pressable key={c.id} onPress={() => setCatId(c.id)}
                  style={[cs.catChip, active && { backgroundColor: c.color + "15", borderColor: c.color + "50" }]}>
                  <Text style={cs.catChipEmoji}>{c.emoji}</Text>
                  <Text style={[cs.catChipText, active && { color: c.color, fontFamily: fonts.bold }]}>
                    {c.labelShort} ({count})
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {/* Category header */}
        {!query && catId !== "all" && cat && (
          <View style={[cs.catSectionHeader, { borderLeftColor: cat.color }]}>
            <Text style={cs.catSectionEmoji}>{cat.emoji}</Text>
            <Text style={[cs.catSectionLabel, { color: cat.color }]}>{cat.label}</Text>
            <Text style={cs.catSectionCount}>({filtered.length})</Text>
          </View>
        )}

        {/* List */}
        <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8, gap: 8 }} showsVerticalScrollIndicator={false}>
          {filtered.length === 0 && (
            <View style={cs.empty}>
              <Icons.Search size={36} color={colors.border} strokeWidth={1.5} />
              <Text style={cs.emptyText}>Нічого не знайдено</Text>
            </View>
          )}
          {filtered.map(item => {
            const itemCat = CATALOG_CATEGORIES.find(c => c.id === item.categoryId);
            return (
              <Pressable key={item.id} onPress={() => setDetail(item)}
                style={({ pressed }) => [cs.itemRow, pressed && { opacity: 0.75 }]}>
                <View style={[cs.itemEmoji, { backgroundColor: (itemCat?.color ?? "#888") + "14" }]}>
                  <Text style={cs.itemEmojiText}>{item.emoji}</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={cs.itemName}>{item.name}</Text>
                  <Text style={cs.itemNameEn} numberOfLines={1}>{item.nameEn}</Text>
                  <Text style={cs.itemMfg} numberOfLines={1}>{item.manufacturers.slice(0, 3).join(" · ")}</Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 5 }}>
                  {item.calibrationDays > 0 && (
                    <View style={cs.calBadge}>
                      <Icons.CalendarCheck size={9} color="#0369a1" strokeWidth={2.5} />
                      <Text style={cs.calBadgeText}>{calIntervalLabel(item.calibrationDays)}</Text>
                    </View>
                  )}
                  {item.requiresCert && (
                    <View style={cs.certBadge}>
                      <Text style={cs.certBadgeText}>СЕРТ</Text>
                    </View>
                  )}
                  <Icons.ChevronRight size={14} color={colors.border} strokeWidth={2.5} />
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Equipment Modal ──────────────────────────────────────────────────────────
function EquipmentModal({ visible, editing, form, setForm, onSave, onClose, saving }: any) {
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView style={s.modal} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{editing ? "Редагувати прилад" : "Новий прилад"}</Text>
            <Pressable onPress={onClose} style={s.closeBtn}>
              <Icons.X size={22} color={colors.ink} strokeWidth={2.5} />
            </Pressable>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Ідентифікація</Text>
            <Field label="Назва *">
              <TextInput style={s.input} value={form.name} onChangeText={v => set("name", v)} placeholder="н-р Центрифуга Eppendorf" />
            </Field>
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Field label="Виробник">
                  <TextInput style={s.input} value={form.manufacturer} onChangeText={v => set("manufacturer", v)} placeholder="Eppendorf" />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Модель">
                  <TextInput style={s.input} value={form.model} onChangeText={v => set("model", v)} placeholder="5424 R" />
                </Field>
              </View>
            </View>
            <Field label="Серійний номер">
              <TextInput style={[s.input, s.mono]} value={form.serialNumber} onChangeText={v => set("serialNumber", v)} placeholder="SN-12345678" />
            </Field>
            <Field label="Локація">
              <TextInput style={s.input} value={form.location} onChangeText={v => set("location", v)} placeholder="Кімн. 412, стіл 3" />
            </Field>
            <Field label="Опис">
              <TextInput style={[s.input, { minHeight: 60, textAlignVertical: "top" }]} value={form.description} onChangeText={v => set("description", v)} multiline placeholder="Призначення та особливості..." />
            </Field>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Статус та обслуговування</Text>
            <Field label="Статус">
              <View style={s.chipsRow}>
                {(Object.entries(STATUS_CFG) as [LabEquipmentStatus, any][]).map(([val, cfg]) => (
                  <Pressable key={val} onPress={() => set("status", val)}
                    style={[s.selectChip, form.status === val && { borderColor: cfg.color, backgroundColor: cfg.color + "15" }]}>
                    <Text style={[s.selectChipText, form.status === val && { color: cfg.color, fontFamily: fonts.bold }]}>{cfg.label}</Text>
                  </Pressable>
                ))}
              </View>
            </Field>
            <Field label="Наступне калібрування (РРРР-ММ-ДД)">
              <TextInput style={s.input} value={form.nextCalibrationDate} onChangeText={v => set("nextCalibrationDate", v)} placeholder="2025-12-31" />
            </Field>
          </View>

          <Pressable onPress={onSave} disabled={saving} style={[s.saveBtn, saving && { opacity: 0.6 }]}>
            <Icons.Save size={18} color="white" strokeWidth={2} />
            <Text style={s.saveBtnText}>{saving ? "Збереження..." : editing ? "Зберегти зміни" : "Додати прилад"}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  backBtn:     { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20, paddingVertical: 8 },
  backBtnText: { fontSize: 14, fontFamily: fonts.bold, color: lab.accent },
  header:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  headerLeft:  { flexDirection: "row", alignItems: "center", gap: 12 },
  headerIcon:  { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  headerTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.ink },
  headerSub:   { fontSize: 12, color: colors.muted },
  addBtn:       { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: lab.accent, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  addBtnText:   { fontSize: 14, fontFamily: fonts.bold, color: "white" },
  catalogBtn:   { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1.5, borderColor: lab.amber + "60", backgroundColor: lab.amber + "10" },
  catalogBtnText: { fontSize: 13, fontFamily: fonts.bold, color: lab.amber },

  empty:     { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 16, fontFamily: fonts.bold, color: colors.muted },
  emptyBody:  { fontSize: 13, color: colors.mutedSoft, textAlign: "center", paddingHorizontal: 24 },
  emptyText:  { fontSize: 14, color: colors.mutedSoft },

  eqCard:         { backgroundColor: "white", borderRadius: 18, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 12, overflow: "hidden", marginBottom: 12, elevation: 3, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8 },
  eqStatusStrip:  { width: 5, alignSelf: "stretch" },
  eqIconWrap:     { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  eqName:         { fontSize: 15, fontFamily: fonts.bold, color: colors.ink },
  eqModel:        { fontSize: 11, color: colors.muted },
  calChip:        { flexDirection: "row", alignItems: "center", gap: 4 },
  calBadge:       { fontSize: 10, fontWeight: "800" },
  eqRight:        { alignItems: "flex-end", paddingRight: 14, paddingVertical: 12, gap: 6 },
  eqStatusRow:    { position: "relative", alignItems: "center", justifyContent: "center", width: 16, height: 16 },
  statusPulse:    { position: "absolute", width: 10, height: 10, borderRadius: 5 },
  eqStatusTag:    { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  eqStatusTagText: { fontSize: 10, fontWeight: "900" },

  detailBanner:    { borderRadius: 22, padding: 22, marginBottom: 16 },
  detailStatusRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  statusDot:       { width: 9, height: 9, borderRadius: 5 },
  detailStatusLabel: { fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  editBtn:         { marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  editBtnText:     { fontSize: 12, color: lab.soft + "cc" },
  detailName:      { fontSize: 22, fontFamily: fonts.bold, color: "#fff", lineHeight: 28 },
  detailModel:     { fontSize: 13, color: lab.soft + "99", marginTop: 3 },
  detailSN:        { fontSize: 11, color: lab.soft + "70", marginTop: 4 },
  mono:            { fontFamily: "monospace" } as any,
  detailMeta:      { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 },
  detailMetaText:  { fontSize: 12, color: lab.soft + "80" },

  calAlert:     { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  calAlertText: { flex: 1, fontSize: 13, fontFamily: fonts.bold },

  sectionLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 1.5, color: colors.mutedSoft, textTransform: "uppercase", marginBottom: 10 },
  logActions:   { flexDirection: "row", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  logActionBtn: { flex: 1, minWidth: 60, alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  logActionText: { fontSize: 12, fontWeight: "900", letterSpacing: 0.5 },

  logItem:      { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  logTypeBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4, minWidth: 38, alignItems: "center" },
  logTypeText:  { fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  logDesc:      { fontSize: 13, color: colors.ink },
  logDate:      { fontSize: 10, color: colors.mutedSoft, marginTop: 2 },

  dangerZone:  { marginTop: 24, borderRadius: 14, borderWidth: 1, borderColor: lab.danger + "30", backgroundColor: lab.danger + "05", padding: 16 },
  dangerTitle: { fontSize: 11, fontWeight: "900", letterSpacing: 1.5, color: lab.danger, textTransform: "uppercase", marginBottom: 12 },
  dangerBtn:   { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: lab.danger + "10", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12 },
  dangerBtnText: { fontSize: 14, fontFamily: fonts.bold, color: lab.danger },

  iconBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: "#f8fafc", alignItems: "center", justifyContent: "center" },

  modal:       { flex: 1, backgroundColor: "white", padding: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  modalTitle:  { fontSize: 20, fontFamily: fonts.bold, color: colors.ink },
  closeBtn:    { width: 38, height: 38, borderRadius: 10, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" },
  section:     { marginBottom: 24, gap: 14 },
  sectionTitle: { fontSize: 11, fontWeight: "900", letterSpacing: 1.5, color: colors.mutedSoft, textTransform: "uppercase", marginBottom: 4 },
  field:       { gap: 6 },
  fieldLabel:  { fontSize: 13, fontFamily: fonts.bold, color: colors.ink },
  input:       { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.ink, backgroundColor: "#fafafa" },
  row:         { flexDirection: "row", gap: 12 },
  chipsRow:    { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  selectChip:      { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: "#f8fafc" },
  selectChipText:  { fontSize: 12, color: colors.muted },
  saveBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: lab.accent, borderRadius: 14, paddingVertical: 16, marginTop: 8 },
  saveBtnText: { fontSize: 16, fontFamily: fonts.bold, color: "white" },
});

// ─── Catalog styles ────────────────────────────────────────────────────────────
const cs = StyleSheet.create({
  container:   { flex: 1, backgroundColor: "white" },

  // List view header
  header:      { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, gap: 12 },
  headerTitle: { fontSize: 19, fontFamily: fonts.bold, color: colors.ink },
  headerSub:   { fontSize: 12, color: colors.muted, marginTop: 2 },
  closeBtn:    { width: 38, height: 38, borderRadius: 10, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" },

  // Search
  searchBox:   { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: "#fafafa" },
  searchInput: { flex: 1, fontSize: 14, color: colors.ink },

  // Category tabs
  catRow:      { marginBottom: 10 },
  catChip:     { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: "#f8fafc" },
  catChipActive: { backgroundColor: lab.accent + "14", borderColor: lab.accent + "50" },
  catChipText: { fontSize: 12, color: colors.muted },
  catChipTextActive: { color: lab.accent, fontFamily: fonts.bold },
  catChipEmoji: { fontSize: 13 },

  catSectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginBottom: 8, paddingLeft: 10, borderLeftWidth: 3 },
  catSectionEmoji: { fontSize: 16 },
  catSectionLabel: { fontSize: 13, fontFamily: fonts.bold },
  catSectionCount: { fontSize: 12, color: colors.mutedSoft },

  // Item row
  itemRow:     { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "white", borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, elevation: 1, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 4 },
  itemEmoji:   { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  itemEmojiText: { fontSize: 22 },
  itemName:    { fontSize: 14, fontFamily: fonts.bold, color: colors.ink },
  itemNameEn:  { fontSize: 11, color: colors.muted },
  itemMfg:     { fontSize: 10, color: colors.mutedSoft },
  calBadge:    { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#eff6ff", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  calBadgeText: { fontSize: 9, fontWeight: "700", color: "#0369a1" },
  certBadge:   { backgroundColor: lab.danger + "14", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  certBadgeText: { fontSize: 9, fontWeight: "900", color: lab.danger, letterSpacing: 0.3 },

  empty:       { alignItems: "center", paddingVertical: 48, gap: 12 },
  emptyText:   { fontSize: 15, color: colors.mutedSoft },

  // Detail view
  detailHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 18, paddingBottom: 14, gap: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn:     { width: 38, height: 38, borderRadius: 10, backgroundColor: lab.accent + "12", alignItems: "center", justifyContent: "center" },
  detailHeaderTitle: { flex: 1, fontSize: 16, fontFamily: fonts.bold, color: colors.ink },

  hero:        { flexDirection: "row", gap: 14, alignItems: "flex-start", borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 16 },
  heroEmojiBox: { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  heroEmoji:   { fontSize: 30 },
  heroName:    { fontSize: 17, fontFamily: fonts.bold, color: colors.ink, lineHeight: 24 },
  heroNameEn:  { fontSize: 12, color: colors.muted, marginTop: 2 },
  catBadge:    { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, marginTop: 8 },
  catBadgeEmoji: { fontSize: 12 },
  catBadgeText:  { fontSize: 11, fontWeight: "700" },

  desc:        { fontSize: 14, color: colors.ink, lineHeight: 22, marginBottom: 12 },
  notesBox:    { flexDirection: "row", gap: 8, alignItems: "flex-start", backgroundColor: lab.amber + "0e", borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: lab.amber + "30" },
  notesText:   { flex: 1, fontSize: 12, color: "#92400e", lineHeight: 18 },

  section:     { marginBottom: 20 },
  sectionTitle: { fontSize: 10, fontWeight: "900", letterSpacing: 1.5, color: colors.mutedSoft, textTransform: "uppercase", marginBottom: 10 },

  specRow:     { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  specKey:     { fontSize: 13, color: colors.muted, flex: 1 },
  specVal:     { fontSize: 13, color: colors.ink, fontFamily: fonts.bold, textAlign: "right", flex: 1 },

  infoGrid:    { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  infoTile:    { flex: 1, minWidth: "44%", backgroundColor: "#f8fafc", borderRadius: 14, padding: 14, alignItems: "center", gap: 6, borderWidth: 1, borderColor: colors.border },
  infoTileLabel: { fontSize: 10, fontWeight: "700", color: colors.mutedSoft, textTransform: "uppercase", letterSpacing: 0.5 },
  infoTileVal:   { fontSize: 13, fontFamily: fonts.bold },

  mfgWrap:     { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  mfgChip:     { backgroundColor: "#f1f5f9", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  mfgText:     { fontSize: 12, color: colors.ink },

  addFromCatalogBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: lab.accent, borderRadius: 16, paddingVertical: 18, marginTop: 8 },
  addFromCatalogBtnText: { fontSize: 16, fontFamily: fonts.bold, color: "white" },
});
