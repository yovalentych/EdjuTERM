import { useState, useEffect } from "react";
import {
  StyleSheet, View, Text, Pressable, ScrollView,
  TextInput, Modal, Alert, RefreshControl, KeyboardAvoidingView, Platform, Linking, Dimensions,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { CameraView, useCameraPermissions } from "expo-camera";
import { searchByCas, type PubChemResult } from "@/lib/pubchem";
import {
  REAGENT_CATEGORIES, REAGENT_ITEMS, searchReagentCatalog,
  type ReagentCatalogItem,
} from "@/lib/reagent-catalog";
import { Feather } from "@expo/vector-icons";
import * as Icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { Screen } from "@/components/screen";
import { GlassCard } from "@/components/glass";
import { colors, fonts } from "@/constants/theme";
import { useMobileStore, type LabInventoryItem, type LabInventoryCategory, type LabHazardClass, type LabInventoryStatus, type LabReagentRequest } from "@/lib/mobile-store";

// ─── Lab colours ──────────────────────────────────────────────────────────────
const lab = {
  dark: "#073d35", mid: "#0f5c50", accent: "#0f766e", soft: "#d0faf5",
  amber: "#d97706", danger: "#be123c", ok: "#047857", neutral: "#64748b",
};

const CATEGORIES: { value: LabInventoryCategory; label: string }[] = [
  { value: "reagent",     label: "Реагент" },
  { value: "consumable",  label: "Витратний матеріал" },
  { value: "sample",      label: "Зразок" },
  { value: "standard",    label: "Стандарт" },
  { value: "other",       label: "Інше" },
];
const HAZARDS: { value: LabHazardClass; label: string; icon: string; color: string }[] = [
  { value: "none",       label: "Без класу",   icon: "•",  color: lab.neutral },
  { value: "flammable",  label: "Займисте",    icon: "🔥", color: lab.amber },
  { value: "toxic",      label: "Токсичне",    icon: "☠",  color: lab.danger },
  { value: "corrosive",  label: "Корозійне",   icon: "⚗",  color: "#b45309" },
  { value: "biohazard",  label: "Біонебезпечне",icon: "☣", color: "#7c3aed" },
  { value: "oxidizing",  label: "Окисник",     icon: "🔵", color: "#0369a1" },
  { value: "radioactive",label: "Радіоактивне",icon: "☢",  color: lab.danger },
];
const STATUSES: { value: LabInventoryStatus; label: string; color: string }[] = [
  { value: "in_stock",   label: "В наявності",  color: lab.ok },
  { value: "low_stock",  label: "Залишок",       color: lab.amber },
  { value: "depleted",   label: "Відсутній",     color: lab.danger },
  { value: "expired",    label: "Прострочено",   color: "#9ca3af" },
];
const UNITS = ["мг", "г", "кг", "мкл", "мл", "л", "мкМ", "мМ", "М", "шт", "уп", "аліквот"];
const URGENCY_OPTIONS: { value: LabReagentRequest["urgency"]; label: string; color: string }[] = [
  { value: "low",    label: "Низька",   color: lab.neutral },
  { value: "normal", label: "Нормальна", color: "#0369a1" },
  { value: "urgent", label: "Термінова", color: lab.danger },
];

function hazardColor(h: string) {
  return HAZARDS.find(x => x.value === h)?.color || lab.neutral;
}
function hazardIcon(h: string) {
  return HAZARDS.find(x => x.value === h)?.icon || "•";
}

// ─── Empty form ───────────────────────────────────────────────────────────────
function emptyForm(): Partial<LabInventoryItem> {
  return {
    name: "", casNumber: "", catalogNumber: "", manufacturer: "",
    category: "reagent", quantity: 0, unit: "мл", location: "",
    storageConditions: "", expirationDate: "", lotNumber: "",
    hazardClass: "none", status: "in_stock", notes: "",
    sdsUrl: "", sdsFirstAid: "", sdsDisposal: "",
  };
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function LabInventoryScreen() {
  const {
    labInventory, fetchLabInventory,
    createInventoryItem, updateInventoryItem, deleteInventoryItem,
    reagentRequests, addReagentRequest, removeReagentRequest, clearReagentRequests,
    loading,
  } = useMobileStore();

  const [filter, setFilter] = useState<"all" | "warning" | "requests">("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [requestModalItem, setRequestModalItem] = useState<LabInventoryItem | null>(null);
  const [sdsItem, setSdsItem] = useState<LabInventoryItem | null>(null);
  const [qrItem, setQrItem] = useState<LabInventoryItem | null>(null);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [catalogVisible, setCatalogVisible] = useState(false);

  function openFromCatalog(item: ReagentCatalogItem) {
    setCatalogVisible(false);
    setEditing(null);
    setForm({
      name:              item.name,
      casNumber:         item.casNumber ?? "",
      category:          item.invCategory,
      hazardClass:       item.hazardClass,
      storageConditions: item.storageConditions,
      unit:              item.defaultUnit,
      manufacturer:      item.manufacturers[0] ?? "",
      status:            "in_stock",
      notes:             item.notes ?? "",
      quantity:          0,
      catalogNumber: "", location: "", expirationDate: "", lotNumber: "",
      sdsUrl: "", sdsFirstAid: "", sdsDisposal: "",
    });
    setModalVisible(true);
  }
  const [editing, setEditing] = useState<LabInventoryItem | null>(null);
  const [form, setForm] = useState<Partial<LabInventoryItem>>(emptyForm());
  const [saving, setSaving] = useState(false);

  const displayed = filter === "warning"
    ? labInventory.filter(i => {
        const exp = i.expirationDate ? new Date(i.expirationDate).getTime() - Date.now() : Infinity;
        return exp < 30 * 24 * 3600 * 1000 || i.status !== "in_stock";
      })
    : labInventory;

  const warnCount = labInventory.filter(i => {
    const exp = i.expirationDate ? new Date(i.expirationDate).getTime() - Date.now() : Infinity;
    return exp < 30 * 24 * 3600 * 1000 || i.status !== "in_stock";
  }).length;

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setModalVisible(true);
  }

  function openEdit(item: LabInventoryItem) {
    setEditing(item);
    setForm({ ...item });
    setModalVisible(true);
  }

  async function handleSave() {
    if (!form.name?.trim()) { Alert.alert("Помилка", "Вкажіть назву речовини."); return; }
    setSaving(true);
    try {
      if (editing) {
        await updateInventoryItem(editing._id, form);
      } else {
        await createInventoryItem(form);
      }
      setModalVisible(false);
    } catch {
      Alert.alert("Помилка", "Не вдалося зберегти. Перевірте з'єднання.");
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(item: LabInventoryItem) {
    Alert.alert(
      "Видалити?",
      `«${item.name}» буде видалено зі складу.`,
      [
        { text: "Скасувати", style: "cancel" },
        {
          text: "Видалити",
          style: "destructive",
          onPress: async () => {
            try { await deleteInventoryItem(item._id); }
            catch { Alert.alert("Помилка", "Не вдалося видалити."); }
          },
        },
      ]
    );
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchLabInventory} tintColor={lab.accent} />}>
      {/* ── Header (glass) ── */}
      <GlassCard padding={14} accent={lab.accent} style={{ marginBottom: 4 }}>
        <View style={s.header}>
          <View style={s.headerLeft}>
            <LinearGradient colors={[lab.accent + "25", lab.accent + "10"]} style={s.headerIcon}>
              <Icons.Package size={20} color={lab.accent} strokeWidth={1.8} />
            </LinearGradient>
            <View>
              <Text style={s.headerTitle}>Склад реагентів</Text>
              <Text style={s.headerSub}>{labInventory.length} позицій</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setScannerVisible(true); }} style={s.scanHeaderBtn}>
              <Icons.ScanBarcode size={20} color={lab.accent} strokeWidth={1.8} />
            </Pressable>
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCatalogVisible(true); }} style={s.catalogBtn}>
              <Icons.BookMarked size={17} color="#7c3aed" strokeWidth={2} />
              <Text style={s.catalogBtnText}>Каталог</Text>
            </Pressable>
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); openCreate(); }} style={s.addBtn}>
              <Icons.Plus size={18} color="white" strokeWidth={2.5} />
              <Text style={s.addBtnText}>Додати</Text>
            </Pressable>
          </View>
        </View>
      </GlassCard>

      {/* ── Filter ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        <View style={[s.filterRow, { marginBottom: 0 }]}>
          <Pressable onPress={() => setFilter("all")} style={[s.filterTab, filter === "all" && s.filterTabActive]}>
            <Text style={[s.filterTabText, filter === "all" && s.filterTabTextActive]}>Всі ({labInventory.length})</Text>
          </Pressable>
          <Pressable onPress={() => setFilter("warning")} style={[s.filterTab, filter === "warning" && s.filterTabActive]}>
            <Icons.AlertTriangle size={11} color={filter === "warning" ? lab.amber : colors.mutedSoft} strokeWidth={2.5} />
            <Text style={[s.filterTabText, filter === "warning" && { color: lab.amber }]}>Увага ({warnCount})</Text>
          </Pressable>
          <Pressable onPress={() => setFilter("requests")} style={[s.filterTab, filter === "requests" && s.filterTabActive]}>
            <Icons.ShoppingCart size={11} color={filter === "requests" ? lab.accent : colors.mutedSoft} strokeWidth={2.5} />
            <Text style={[s.filterTabText, filter === "requests" && { color: lab.accent }]}>Замовлення ({reagentRequests.length})</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* ── Requests list ── */}
      {filter === "requests" ? (
        reagentRequests.length === 0 ? (
          <View style={s.empty}>
            <Icons.ShoppingCart size={40} color={colors.border} strokeWidth={1.5} />
            <Text style={s.emptyTitle}>Замовлень немає</Text>
            <Text style={s.emptyBody}>Натисніть «Замовити» на картці реагенту з низьким залишком</Text>
          </View>
        ) : (
          <>
            {reagentRequests.map((req, i) => (
              <MotiView key={req.id} from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: i * 30 }}>
                <ReagentRequestCard req={req} onRemove={() => removeReagentRequest(req.id)} />
              </MotiView>
            ))}
            <Pressable onPress={() => Alert.alert("Очистити?", "Видалити всі замовлення?", [
              { text: "Скасувати", style: "cancel" },
              { text: "Очистити", style: "destructive", onPress: clearReagentRequests },
            ])} style={s.clearBtn}>
              <Icons.Trash2 size={13} color={colors.mutedSoft} strokeWidth={2} />
              <Text style={s.clearBtnText}>Очистити список</Text>
            </Pressable>
          </>
        )
      ) : (
        /* ── Inventory list ── */
        displayed.length === 0 ? (
          <View style={s.empty}>
            <Icons.Package size={40} color={colors.border} strokeWidth={1.5} />
            <Text style={s.emptyTitle}>{filter === "warning" ? "Проблем немає" : "Склад порожній"}</Text>
            <Text style={s.emptyBody}>{filter === "warning" ? "Всі реагенти в нормі" : "Натисніть «Додати» щоб внести першу позицію"}</Text>
          </View>
        ) : (
          displayed.map((item, i) => (
            <MotiView key={item._id} from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: i * 30 }}>
              <InventoryCard
                item={item}
                onEdit={() => openEdit(item)}
                onDelete={() => confirmDelete(item)}
                onOrder={() => setRequestModalItem(item)}
                onSds={() => setSdsItem(item)}
                onQr={() => setQrItem(item)}
              />
            </MotiView>
          ))
        )
      )}

      {/* ── Create/Edit Modal ── */}
      <InventoryModal
        visible={modalVisible}
        editing={editing}
        form={form}
        setForm={setForm}
        onSave={handleSave}
        onClose={() => setModalVisible(false)}
        saving={saving}
      />

      {/* ── Order Request Modal ── */}
      <ReagentRequestModal
        item={requestModalItem}
        onClose={() => setRequestModalItem(null)}
        onSubmit={(data) => {
          addReagentRequest(data);
          setRequestModalItem(null);
          Alert.alert("Замовлення", "Запит на замовлення збережено.");
        }}
      />

      {/* ── SDS Modal ── */}
      <SdsModal
        item={sdsItem}
        onClose={() => setSdsItem(null)}
        onOpenEdit={() => { setSdsItem(null); if (sdsItem) openEdit(sdsItem); }}
      />

      {/* ── QR Modal ── */}
      <QrModal
        item={qrItem}
        onClose={() => setQrItem(null)}
      />

      {/* ── Scanner Modal ── */}
      <ScannerModal
        visible={scannerVisible}
        labInventory={labInventory}
        onFound={(found) => { setScannerVisible(false); setQrItem(found); }}
        onClose={() => setScannerVisible(false)}
      />

      {/* ── Reagent Catalog Modal ── */}
      <ReagentCatalogModal
        visible={catalogVisible}
        onClose={() => setCatalogVisible(false)}
        onSelect={openFromCatalog}
      />
    </Screen>
  );
}

// ─── Inventory Card ───────────────────────────────────────────────────────────
function InventoryCard({ item, onEdit, onDelete, onOrder, onSds, onQr }: { item: LabInventoryItem; onEdit: () => void; onDelete: () => void; onOrder: () => void; onSds: () => void; onQr: () => void }) {
  const hColor    = hazardColor(item.hazardClass);
  const hIcon     = hazardIcon(item.hazardClass);
  const hasSds    = !!(item.sdsUrl || item.sdsFirstAid || item.sdsDisposal);
  const exp       = item.expirationDate ? new Date(item.expirationDate) : null;
  const daysLeft  = exp ? Math.floor((exp.getTime() - Date.now()) / (24 * 3600 * 1000)) : null;
  const expWarn   = daysLeft !== null && daysLeft < 30;
  const expired   = daysLeft !== null && daysLeft < 0;
  const statusCfg = STATUSES.find(x => x.value === item.status) || STATUSES[0];
  const isAlert   = item.status === "low_stock" || item.status === "depleted";

  return (
    <Pressable
      onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onEdit(); }}
      style={({ pressed }) => [s.card, { borderLeftColor: hColor }, pressed && { opacity: 0.92 }]}
    >
      {/* Top row: hazard + status + actions */}
      <View style={s.cardTop}>
        <View style={[s.hazardBubble, { backgroundColor: hColor + "18" }]}>
          <Text style={s.hazardEmoji}>{hIcon}</Text>
          <Text style={[s.hazardLabel, { color: hColor }]}>{item.hazardClass.toUpperCase()}</Text>
        </View>
        <View style={[s.statusBadge, { backgroundColor: statusCfg.color + "18" }]}>
          <View style={[s.statusDot, { backgroundColor: statusCfg.color }]} />
          <Text style={[s.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
        </View>
        <View style={s.cardActions}>
          {hasSds && (
            <Pressable onPress={onSds} style={[s.iconBtn, s.sdsBtnActive]}>
              <Text style={s.sdsIconText}>SDS</Text>
            </Pressable>
          )}
          <Pressable onPress={onQr} style={s.iconBtn}>
            <Icons.QrCode size={13} color={lab.accent} strokeWidth={2} />
          </Pressable>
          <Pressable onPress={onEdit} style={s.iconBtn}>
            <Icons.Pencil size={13} color={lab.accent} strokeWidth={2.5} />
          </Pressable>
          <Pressable onPress={onDelete} style={s.iconBtn}>
            <Icons.Trash2 size={13} color={lab.danger} strokeWidth={2.5} />
          </Pressable>
        </View>
      </View>

      {/* Name */}
      <Text style={s.cardName}>{item.name}</Text>

      {/* Chips row */}
      <View style={s.chipRow}>
        {item.casNumber ? <Chip Icon={Icons.Hash} text={item.casNumber} mono /> : null}
        <Chip Icon={Icons.Beaker} text={`${item.quantity} ${item.unit}`} bold accent />
        {item.location ? <Chip Icon={Icons.MapPin} text={item.location} /> : null}
      </View>

      {/* Manufacturer / lot */}
      {(item.manufacturer || item.lotNumber) && (
        <View style={s.metaRow}>
          {item.manufacturer ? <Text style={s.metaText}>{item.manufacturer}</Text> : null}
          {item.lotNumber ? <Text style={s.metaText}>Лот: <Text style={s.mono}>{item.lotNumber}</Text></Text> : null}
        </View>
      )}

      {/* Expiry */}
      {exp && (
        <View style={[s.expRow, expired && s.expDanger, expWarn && !expired && s.expWarn]}>
          <Icons.Calendar size={11} color={expired ? lab.danger : expWarn ? lab.amber : lab.neutral} strokeWidth={2.5} />
          <Text style={[s.expText, { color: expired ? lab.danger : expWarn ? lab.amber : lab.neutral }]}>
            {expired ? `Прострочено ${Math.abs(daysLeft!)} дн. тому`
              : expWarn ? `Придатний ще ${daysLeft} дн.`
              : `Придатний до ${exp.toLocaleDateString("uk-UA")}`}
          </Text>
        </View>
      )}

      {/* Storage conditions */}
      {item.storageConditions ? (
        <View style={s.storageRow}>
          <Icons.Thermometer size={11} color={lab.neutral} strokeWidth={2} />
          <Text style={s.storage}>{item.storageConditions}</Text>
        </View>
      ) : null}

      {/* Order button */}
      {isAlert && (
        <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onOrder(); }} style={s.orderBtn}>
          <Icons.ShoppingCart size={13} color="white" strokeWidth={2.5} />
          <Text style={s.orderBtnText}>Замовити</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

function Chip({ Icon, text, mono, bold, accent }: any) {
  return (
    <View style={[s.chip, accent && s.chipAccent]}>
      <Icon size={10} color={accent ? lab.accent : lab.neutral} strokeWidth={2.5} />
      <Text style={[s.chipText, mono && s.mono, bold && { fontFamily: fonts.bold, color: accent ? lab.accent : colors.ink }]}>{text}</Text>
    </View>
  );
}

// ─── Inventory Modal ──────────────────────────────────────────────────────────
function InventoryModal({ visible, editing, form, setForm, onSave, onClose, saving }: any) {
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const [unitOpen, setUnitOpen] = useState(false);
  const [pubSearching, setPubSearching] = useState(false);
  const [pubResult, setPubResult] = useState<PubChemResult | null>(null);
  const [pubError, setPubError] = useState<string | null>(null);

  async function handlePubChemSearch() {
    const cas = form.casNumber?.trim();
    if (!cas) { Alert.alert("CAS номер", "Введіть CAS номер для пошуку."); return; }
    setPubSearching(true);
    setPubError(null);
    setPubResult(null);
    try {
      const result = await searchByCas(cas);
      setPubResult(result);
      // Auto-fill: name (only if empty), hazardClass, notes (formula + IUPAC)
      setForm((prev: any) => ({
        ...prev,
        name: prev.name?.trim() ? prev.name : result.name,
        hazardClass: result.hazardClass !== "none" ? result.hazardClass : prev.hazardClass,
      }));
    } catch (e: any) {
      setPubError(e?.message ?? "Помилка пошуку PubChem");
    } finally {
      setPubSearching(false);
    }
  }

  function applyPubName() {
    if (!pubResult) return;
    set("name", pubResult.name);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView style={s.modal} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          {/* Modal header */}
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{editing ? "Редагувати реагент" : "Новий реагент"}</Text>
            <Pressable onPress={onClose} style={s.closeBtn}>
              <Feather name="x" size={22} color={colors.ink} />
            </Pressable>
          </View>

          {/* Form */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Основне</Text>
            <Field label="Назва *">
              <TextInput style={s.input} value={form.name} onChangeText={v => set("name", v)} placeholder="н-р Трипан синій" />
            </Field>
            <Field label="CAS номер">
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TextInput
                  style={[s.input, s.mono, { flex: 1 }]}
                  value={form.casNumber}
                  onChangeText={v => { set("casNumber", v); setPubResult(null); setPubError(null); }}
                  placeholder="72-57-1"
                  keyboardType="ascii-capable"
                />
                <Pressable
                  onPress={handlePubChemSearch}
                  disabled={pubSearching}
                  style={[s.pubSearchBtn, pubSearching && { opacity: 0.6 }]}
                >
                  {pubSearching
                    ? <Icons.Loader size={15} color="white" strokeWidth={2.5} />
                    : <Icons.Search size={15} color="white" strokeWidth={2.5} />
                  }
                  <Text style={s.pubSearchBtnText}>{pubSearching ? "..." : "PubChem"}</Text>
                </Pressable>
              </View>
            </Field>

            {/* PubChem result card */}
            {pubError && (
              <View style={s.pubErrorBox}>
                <Icons.CircleAlert size={14} color={lab.danger} strokeWidth={2} />
                <Text style={s.pubErrorText}>{pubError}</Text>
              </View>
            )}
            {pubResult && (
              <View style={s.pubResultBox}>
                <View style={s.pubResultHeader}>
                  <Icons.FlaskConical size={14} color={lab.ok} strokeWidth={2} />
                  <Text style={s.pubResultTitle}>Знайдено в PubChem (CID {pubResult.cid})</Text>
                </View>
                <View style={s.pubResultRow}>
                  <Text style={s.pubResultLabel}>Назва:</Text>
                  <Text style={s.pubResultVal} numberOfLines={2}>{pubResult.name}</Text>
                  <Pressable onPress={applyPubName} style={s.pubApplyBtn}>
                    <Text style={s.pubApplyText}>→ Назва</Text>
                  </Pressable>
                </View>
                {pubResult.iupacName ? (
                  <View style={s.pubResultRow}>
                    <Text style={s.pubResultLabel}>IUPAC:</Text>
                    <Text style={[s.pubResultVal, { flex: 1, fontFamily: "monospace" as any }]} numberOfLines={2}>{pubResult.iupacName}</Text>
                  </View>
                ) : null}
                {pubResult.formula ? (
                  <View style={s.pubResultRow}>
                    <Text style={s.pubResultLabel}>Формула:</Text>
                    <Text style={[s.pubResultVal, { fontFamily: "monospace" as any }]}>{pubResult.formula}</Text>
                    {pubResult.weightStr ? <Text style={s.pubResultMw}>{pubResult.weightStr}</Text> : null}
                  </View>
                ) : null}
                {pubResult.hazardClass !== "none" ? (
                  <View style={[s.pubResultRow, { gap: 6 }]}>
                    <Text style={s.pubResultLabel}>GHS:</Text>
                    <Text style={[s.pubResultVal, { color: hazardColor(pubResult.hazardClass), fontFamily: fonts.bold }]}>
                      {HAZARDS.find(h => h.value === pubResult.hazardClass)?.label}
                    </Text>
                    <Text style={s.pubResultMw}>{pubResult.hCodes.slice(0, 4).join(", ")}</Text>
                  </View>
                ) : null}
                {pubResult.hCodes.length > 0 && (
                  <Text style={s.pubHCodes}>H-коди: {pubResult.hCodes.join(" · ")}</Text>
                )}
              </View>
            )}
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Field label="Виробник">
                  <TextInput style={s.input} value={form.manufacturer} onChangeText={v => set("manufacturer", v)} placeholder="Sigma-Aldrich" />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Кат. номер">
                  <TextInput style={s.input} value={form.catalogNumber} onChangeText={v => set("catalogNumber", v)} />
                </Field>
              </View>
            </View>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Кількість та зберігання</Text>
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Field label="Кількість">
                  <TextInput style={s.input} value={String(form.quantity || "")} onChangeText={v => set("quantity", Number(v) || 0)} keyboardType="numeric" placeholder="0" />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Одиниця">
                  <Pressable style={[s.input, s.picker]} onPress={() => setUnitOpen(!unitOpen)}>
                    <Text style={s.pickerText}>{form.unit || "мл"}</Text>
                    <Feather name={unitOpen ? "chevron-up" : "chevron-down"} size={14} color={colors.muted} />
                  </Pressable>
                  {unitOpen && (
                    <View style={s.dropdown}>
                      {UNITS.map(u => (
                        <Pressable key={u} style={s.dropdownItem} onPress={() => { set("unit", u); setUnitOpen(false); }}>
                          <Text style={[s.dropdownText, form.unit === u && { color: lab.accent, fontFamily: fonts.bold }]}>{u}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </Field>
              </View>
            </View>
            <Field label="Локація">
              <TextInput style={s.input} value={form.location} onChangeText={v => set("location", v)} placeholder="Холодильник А, полиця 2" />
            </Field>
            <Field label="Умови зберігання">
              <TextInput style={s.input} value={form.storageConditions} onChangeText={v => set("storageConditions", v)} placeholder="-20°C, захищати від світла" />
            </Field>
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Field label="Термін придатності">
                  <TextInput style={s.input} value={form.expirationDate} onChangeText={v => set("expirationDate", v)} placeholder="РРРР-ММ-ДД" />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Номер лоту">
                  <TextInput style={[s.input, s.mono]} value={form.lotNumber} onChangeText={v => set("lotNumber", v)} placeholder="LOT12345" />
                </Field>
              </View>
            </View>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Категорія та небезпека</Text>
            <Field label="Категорія">
              <View style={s.chipsRow}>
                {CATEGORIES.map(c => (
                  <Pressable key={c.value} onPress={() => set("category", c.value)} style={[s.selectChip, form.category === c.value && s.selectChipActive]}>
                    <Text style={[s.selectChipText, form.category === c.value && s.selectChipTextActive]}>{c.label}</Text>
                  </Pressable>
                ))}
              </View>
            </Field>
            <Field label="Клас небезпеки (GHS)">
              <View style={s.chipsRow}>
                {HAZARDS.map(h => (
                  <Pressable key={h.value} onPress={() => set("hazardClass", h.value)}
                    style={[s.hazardChip, form.hazardClass === h.value && { borderColor: h.color, backgroundColor: h.color + "15" }]}>
                    <Text style={s.hazardChipIcon}>{h.icon}</Text>
                    <Text style={[s.hazardChipText, form.hazardClass === h.value && { color: h.color }]}>{h.label}</Text>
                  </Pressable>
                ))}
              </View>
            </Field>
            <Field label="Статус">
              <View style={s.chipsRow}>
                {STATUSES.map(st => (
                  <Pressable key={st.value} onPress={() => set("status", st.value)}
                    style={[s.selectChip, form.status === st.value && { borderColor: st.color, backgroundColor: st.color + "15" }]}>
                    <Text style={[s.selectChipText, form.status === st.value && { color: st.color }]}>{st.label}</Text>
                  </Pressable>
                ))}
              </View>
            </Field>
          </View>

          <View style={s.section}>
            <Field label="Нотатки">
              <TextInput style={[s.input, { minHeight: 80, textAlignVertical: "top" }]} value={form.notes} onChangeText={v => set("notes", v)} multiline placeholder="Додаткова інформація..." />
            </Field>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>SDS — Паспорт безпеки</Text>
            <Field label="URL паспорту безпеки">
              <TextInput style={s.input} value={form.sdsUrl} onChangeText={v => set("sdsUrl", v)} placeholder="https://..." keyboardType="url" autoCapitalize="none" />
            </Field>
            <Field label="Перша допомога (коротко)">
              <TextInput style={[s.input, { minHeight: 70, textAlignVertical: "top" }]} value={form.sdsFirstAid} onChangeText={v => set("sdsFirstAid", v)} multiline placeholder="При контакті зі шкірою: промити водою 15 хв..." />
            </Field>
            <Field label="Утилізація">
              <TextInput style={[s.input, { minHeight: 60, textAlignVertical: "top" }]} value={form.sdsDisposal} onChangeText={v => set("sdsDisposal", v)} multiline placeholder="Утилізувати як хімічні відходи категорії..." />
            </Field>
          </View>

          <Pressable onPress={onSave} disabled={saving} style={[s.saveBtn, saving && { opacity: 0.6 }]}>
            <Feather name="save" size={18} color="white" />
            <Text style={s.saveBtnText}>{saving ? "Збереження..." : editing ? "Зберегти зміни" : "Додати на склад"}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── SDS Modal ────────────────────────────────────────────────────────────────
function SdsModal({ item, onClose, onOpenEdit }: { item: LabInventoryItem | null; onClose: () => void; onOpenEdit: () => void }) {
  if (!item) return null;

  const hColor = HAZARDS.find(h => h.value === item.hazardClass)?.color || lab.neutral;
  const hIcon  = HAZARDS.find(h => h.value === item.hazardClass)?.icon  || "•";
  const hasData = item.sdsUrl || item.sdsFirstAid || item.sdsDisposal;

  return (
    <Modal visible={!!item} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ScrollView style={s.modal} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Header */}
        <View style={s.modalHeader}>
          <View style={[s.sdsHeaderIcon, { backgroundColor: hColor + "18" }]}>
            <Text style={{ fontSize: 22 }}>{hIcon}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.modalTitle} numberOfLines={2}>{item.name}</Text>
            {item.casNumber ? <Text style={[s.storage, s.mono]}>CAS: {item.casNumber}</Text> : null}
          </View>
          <Pressable onPress={onClose} style={s.closeBtn}>
            <Feather name="x" size={22} color={colors.ink} />
          </Pressable>
        </View>

        {/* GHS hazard banner */}
        <View style={[s.sdsHazardBanner, { borderColor: hColor + "40", backgroundColor: hColor + "0c" }]}>
          <Text style={[s.sdsHazardTitle, { color: hColor }]}>
            {hIcon}  {HAZARDS.find(h => h.value === item.hazardClass)?.label?.toUpperCase() || "БЕЗ КЛАСУ"}
          </Text>
          <Text style={s.sdsHazardSub}>Клас небезпеки GHS</Text>
          {item.storageConditions ? (
            <View style={s.sdsStorageRow}>
              <Feather name="thermometer" size={13} color={hColor} />
              <Text style={[s.sdsStorageText, { color: hColor + "cc" }]}>{item.storageConditions}</Text>
            </View>
          ) : null}
        </View>

        {!hasData ? (
          <View style={s.sdsEmpty}>
            <Feather name="file-text" size={36} color={colors.border} />
            <Text style={s.emptyTitle}>Паспорт безпеки не заповнений</Text>
            <Text style={s.emptyBody}>Натисніть "Редагувати" щоб додати URL та критичні дані SDS</Text>
            <Pressable onPress={onOpenEdit} style={s.sdsEditBtn}>
              <Feather name="edit-2" size={14} color={lab.accent} />
              <Text style={s.sdsEditBtnText}>Заповнити SDS</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {/* SDS Link */}
            {item.sdsUrl ? (
              <View style={s.sdsSection}>
                <Text style={s.sdsSectionTitle}>📄 ОФІЦІЙНИЙ ПАСПОРТ БЕЗПЕКИ</Text>
                <Pressable onPress={() => Linking.openURL(item.sdsUrl).catch(() => Alert.alert("Помилка", "Не вдалося відкрити посилання"))}
                  style={s.sdsLinkBtn}>
                  <Feather name="external-link" size={16} color="white" />
                  <Text style={s.sdsLinkBtnText}>Відкрити SDS (PDF)</Text>
                </Pressable>
                <Text style={s.sdsUrl} numberOfLines={2}>{item.sdsUrl}</Text>
              </View>
            ) : null}

            {/* First aid */}
            {item.sdsFirstAid ? (
              <View style={s.sdsSection}>
                <View style={s.sdsSectionHeader}>
                  <View style={[s.sdsSectionIcon, { backgroundColor: "#dc262615" }]}>
                    <Text style={{ fontSize: 16 }}>🚑</Text>
                  </View>
                  <Text style={[s.sdsSectionTitle, { color: "#dc2626" }]}>ПЕРША ДОПОМОГА</Text>
                </View>
                <Text style={s.sdsBodyText}>{item.sdsFirstAid}</Text>
              </View>
            ) : null}

            {/* Disposal */}
            {item.sdsDisposal ? (
              <View style={s.sdsSection}>
                <View style={s.sdsSectionHeader}>
                  <View style={[s.sdsSectionIcon, { backgroundColor: "#71717a15" }]}>
                    <Text style={{ fontSize: 16 }}>♻️</Text>
                  </View>
                  <Text style={[s.sdsSectionTitle, { color: "#52525b" }]}>УТИЛІЗАЦІЯ</Text>
                </View>
                <Text style={s.sdsBodyText}>{item.sdsDisposal}</Text>
              </View>
            ) : null}

            <Pressable onPress={onOpenEdit} style={s.sdsEditBtn}>
              <Feather name="edit-2" size={14} color={lab.accent} />
              <Text style={s.sdsEditBtnText}>Редагувати SDS</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </Modal>
  );
}

// ─── Reagent Catalog Modal ────────────────────────────────────────────────────
const HAZARD_COLOR_MAP: Record<string, string> = {
  none: "#64748b", flammable: "#d97706", toxic: "#be123c",
  corrosive: "#b45309", biohazard: "#7c3aed", oxidizing: "#0369a1", radioactive: "#dc2626",
};
const HAZARD_EMOJI_MAP: Record<string, string> = {
  none: "•", flammable: "🔥", toxic: "☠", corrosive: "⚗", biohazard: "☣", oxidizing: "🔵", radioactive: "☢",
};

function ReagentCatalogModal({ visible, onClose, onSelect }: {
  visible: boolean;
  onClose: () => void;
  onSelect: (item: ReagentCatalogItem) => void;
}) {
  const [query, setQuery] = useState("");
  const [catId, setCatId] = useState("all");
  const [detail, setDetail] = useState<ReagentCatalogItem | null>(null);

  useEffect(() => {
    if (visible) { setQuery(""); setCatId("all"); setDetail(null); }
  }, [visible]);

  const filtered = query.trim()
    ? searchReagentCatalog(query)
    : catId === "all" ? REAGENT_ITEMS : REAGENT_ITEMS.filter(i => i.categoryId === catId);

  // ── Detail view ─────────────────────────────────────────────────────────────
  if (detail) {
    const category = REAGENT_CATEGORIES.find(c => c.id === detail.categoryId);
    const hColor = HAZARD_COLOR_MAP[detail.hazardClass] ?? "#64748b";
    const hEmoji = HAZARD_EMOJI_MAP[detail.hazardClass] ?? "•";
    const hLabel = HAZARDS.find(h => h.value === detail.hazardClass)?.label ?? "Без класу";

    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setDetail(null)}>
        <View style={rc.container}>
          <View style={rc.detailHeader}>
            <Pressable onPress={() => setDetail(null)} style={rc.backBtn}>
              <Icons.ArrowLeft size={20} color={lab.accent} strokeWidth={2.5} />
            </Pressable>
            <Text style={rc.detailHeaderTitle} numberOfLines={1}>{detail.name}</Text>
            <Pressable onPress={onClose} style={rc.closeBtn}>
              <Icons.X size={20} color={colors.ink} strokeWidth={2.5} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            {/* Hero */}
            <View style={[rc.hero, { borderColor: (category?.color ?? "#888") + "30" }]}>
              <View style={[rc.heroEmoji, { backgroundColor: (category?.color ?? "#888") + "15" }]}>
                <Text style={rc.heroEmojiText}>{detail.emoji}</Text>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={rc.heroName}>{detail.name}</Text>
                <Text style={rc.heroNameEn}>{detail.nameEn}</Text>
                {detail.casNumber ? (
                  <Text style={[rc.casBadge]}>CAS: {detail.casNumber}</Text>
                ) : null}
              </View>
            </View>

            {/* Hazard banner */}
            <View style={[rc.hazardBanner, { borderColor: hColor + "40", backgroundColor: hColor + "0c" }]}>
              <Text style={[rc.hazardBannerIcon]}>{hEmoji}</Text>
              <View>
                <Text style={[rc.hazardBannerTitle, { color: hColor }]}>{hLabel.toUpperCase()}</Text>
                <Text style={rc.hazardBannerSub}>Клас небезпеки GHS</Text>
              </View>
            </View>

            <Text style={rc.desc}>{detail.description}</Text>

            {detail.notes ? (
              <View style={rc.notesBox}>
                <Icons.Info size={13} color={lab.amber} strokeWidth={2} />
                <Text style={rc.notesText}>{detail.notes}</Text>
              </View>
            ) : null}

            {/* Storage & unit */}
            <View style={rc.section}>
              <Text style={rc.sectionTitle}>Зберігання та одиниці</Text>
              <View style={rc.infoRow}>
                <Icons.Thermometer size={15} color={lab.neutral} strokeWidth={2} />
                <Text style={rc.infoText}>{detail.storageConditions}</Text>
              </View>
              <View style={rc.infoRow}>
                <Icons.Beaker size={15} color={lab.neutral} strokeWidth={2} />
                <Text style={rc.infoText}>Одиниця за замовчуванням: <Text style={{ fontFamily: fonts.bold, color: colors.ink }}>{detail.defaultUnit}</Text></Text>
              </View>
            </View>

            {/* Manufacturers */}
            <View style={rc.section}>
              <Text style={rc.sectionTitle}>Постачальники / Виробники</Text>
              <View style={rc.mfgWrap}>
                {detail.manufacturers.map((m, i) => (
                  <View key={i} style={rc.mfgChip}>
                    <Text style={rc.mfgText}>{m}</Text>
                  </View>
                ))}
              </View>
            </View>

            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onSelect(detail); }}
              style={rc.addBtn}
            >
              <Icons.Plus size={20} color="white" strokeWidth={2.5} />
              <Text style={rc.addBtnText}>Додати до складу</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────────
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={rc.container}>
        <View style={rc.header}>
          <View style={{ flex: 1 }}>
            <Text style={rc.headerTitle}>Каталог реагентів</Text>
            <Text style={rc.headerSub}>{REAGENT_ITEMS.length} позицій · {REAGENT_CATEGORIES.length} категорій</Text>
          </View>
          <Pressable onPress={onClose} style={rc.closeBtn}>
            <Icons.X size={22} color={colors.ink} strokeWidth={2.5} />
          </Pressable>
        </View>

        <View style={rc.searchBox}>
          <Icons.Search size={16} color={colors.mutedSoft} strokeWidth={2} />
          <TextInput
            style={rc.searchInput}
            value={query}
            onChangeText={v => { setQuery(v); if (v) setCatId("all"); }}
            placeholder="Назва, CAS, призначення, виробник..."
            placeholderTextColor={colors.mutedSoft}
          />
          {query ? <Pressable onPress={() => setQuery("")}><Icons.X size={15} color={colors.mutedSoft} strokeWidth={2} /></Pressable> : null}
        </View>

        {!query && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={rc.catRow}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
            <Pressable onPress={() => setCatId("all")} style={[rc.catChip, catId === "all" && rc.catChipActive]}>
              <Text style={[rc.catChipText, catId === "all" && rc.catChipTextActive]}>Всі ({REAGENT_ITEMS.length})</Text>
            </Pressable>
            {REAGENT_CATEGORIES.map(c => {
              const count = REAGENT_ITEMS.filter(i => i.categoryId === c.id).length;
              const active = catId === c.id;
              return (
                <Pressable key={c.id} onPress={() => setCatId(c.id)}
                  style={[rc.catChip, active && { backgroundColor: c.color + "15", borderColor: c.color + "50" }]}>
                  <Text style={rc.catChipEmoji}>{c.emoji}</Text>
                  <Text style={[rc.catChipText, active && { color: c.color, fontFamily: fonts.bold }]}>
                    {c.labelShort} ({count})
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8, gap: 8 }} showsVerticalScrollIndicator={false}>
          {filtered.length === 0 && (
            <View style={rc.empty}>
              <Icons.Search size={36} color={colors.border} strokeWidth={1.5} />
              <Text style={rc.emptyText}>Нічого не знайдено</Text>
            </View>
          )}
          {filtered.map(item => {
            const itemCat = REAGENT_CATEGORIES.find(c => c.id === item.categoryId);
            const hColor = HAZARD_COLOR_MAP[item.hazardClass] ?? "#64748b";
            const hEmoji = HAZARD_EMOJI_MAP[item.hazardClass] ?? "•";
            return (
              <Pressable key={item.id} onPress={() => setDetail(item)}
                style={({ pressed }) => [rc.itemRow, pressed && { opacity: 0.75 }]}>
                <View style={[rc.itemEmoji, { backgroundColor: (itemCat?.color ?? "#888") + "14" }]}>
                  <Text style={rc.itemEmojiText}>{item.emoji}</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={rc.itemName}>{item.name}</Text>
                  <Text style={rc.itemNameEn} numberOfLines={1}>{item.nameEn}</Text>
                  {item.casNumber ? <Text style={rc.itemCas}>CAS {item.casNumber}</Text> : null}
                </View>
                <View style={{ alignItems: "flex-end", gap: 5 }}>
                  <View style={[rc.hazardBubble, { backgroundColor: hColor + "18" }]}>
                    <Text style={rc.hazardBubbleText}>{hEmoji}</Text>
                  </View>
                  {item.hazardClass !== "none" && (
                    <Text style={[rc.hazardCode, { color: hColor }]}>
                      {HAZARDS.find(h => h.value === item.hazardClass)?.label}
                    </Text>
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

// ─── QR Modal ─────────────────────────────────────────────────────────────────
function QrModal({ item, onClose }: { item: LabInventoryItem | null; onClose: () => void }) {
  const { width } = Dimensions.get("window");
  const qrSize = Math.min(width - 96, 220);

  return (
    <Modal visible={!!item} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={s.qrOverlay} onPress={onClose}>
        <Pressable style={s.qrSheet}>
          <View style={s.qrHeader}>
            <Text style={s.qrTitle}>QR-код реагенту</Text>
            <Pressable onPress={onClose} style={s.closeBtn}>
              <Feather name="x" size={22} color={colors.ink} />
            </Pressable>
          </View>

          {item && (() => {
            const hColor = HAZARDS.find(h => h.value === item.hazardClass)?.color || lab.neutral;
            const hIcon  = HAZARDS.find(h => h.value === item.hazardClass)?.icon  || "•";
            const hLabel = HAZARDS.find(h => h.value === item.hazardClass)?.label || "";
            const qrValue = `edjulab:${item._id}`;
            return (
              <>
                <Text style={s.qrItemName} numberOfLines={2}>{item.name}</Text>
                {item.casNumber ? <Text style={s.qrCas}>CAS: {item.casNumber}</Text> : null}

                <View style={[s.qrHazardBadge, { backgroundColor: hColor + "15", borderColor: hColor + "40" }]}>
                  <Text style={s.qrHazardEmoji}>{hIcon}</Text>
                  <Text style={[s.qrHazardLabel, { color: hColor }]}>{hLabel}</Text>
                </View>

                <View style={s.qrCodeBox}>
                  <QRCode
                    value={qrValue}
                    size={qrSize}
                    color="#073d35"
                    backgroundColor="white"
                  />
                </View>

                <Text style={s.qrIdText} numberOfLines={1}>ID: {item._id}</Text>

                {item.location ? (
                  <View style={s.qrLocRow}>
                    <Icons.MapPin size={13} color={lab.neutral} strokeWidth={2} />
                    <Text style={s.qrLocText}>{item.location}</Text>
                  </View>
                ) : null}

                <Text style={s.qrHint}>Відскануйте для швидкого доступу до картки</Text>
              </>
            );
          })()}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Scanner Modal ─────────────────────────────────────────────────────────────
function ScannerModal({ visible, labInventory, onFound, onClose }: {
  visible: boolean;
  labInventory: LabInventoryItem[];
  onFound: (item: LabInventoryItem) => void;
  onClose: () => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => { if (visible) setScanned(false); }, [visible]);

  function handleScan({ data }: { data: string }) {
    if (scanned) return;
    setScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const id = data.startsWith("edjulab:") ? data.slice(8) : data;
    const found = labInventory.find(i => i._id === id);
    if (found) {
      onFound(found);
    } else {
      Alert.alert("Не знайдено", "Реагент з таким QR-кодом відсутній у складі.", [
        { text: "OK", onPress: () => setScanned(false) },
      ]);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={s.scannerContainer}>
        <View style={s.scannerHeader}>
          <Pressable onPress={onClose} style={s.scannerCloseBtn}>
            <Feather name="x" size={22} color="white" />
          </Pressable>
          <Text style={s.scannerTitle}>Сканувати реагент</Text>
          <View style={{ width: 40 }} />
        </View>

        {!permission ? (
          <View style={s.scannerCenter}>
            <Text style={s.scannerHintCenter}>Завантаження...</Text>
          </View>
        ) : !permission.granted ? (
          <View style={s.scannerCenter}>
            <Icons.Camera size={56} color="rgba(255,255,255,0.35)" strokeWidth={1.5} />
            <Text style={s.scannerHintCenter}>Потрібен дозвіл на камеру</Text>
            <Pressable onPress={requestPermission} style={s.scannerPermBtn}>
              <Text style={s.scannerPermBtnText}>Надати дозвіл</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={scanned ? undefined : handleScan}
            />
            <View style={s.scannerViewfinder} pointerEvents="none">
              <View style={s.finderFrame}>
                <View style={[s.finderCorner, { top: -2, left: -2, borderRightWidth: 0, borderBottomWidth: 0 }]} />
                <View style={[s.finderCorner, { top: -2, right: -2, borderLeftWidth: 0, borderBottomWidth: 0 }]} />
                <View style={[s.finderCorner, { bottom: -2, left: -2, borderRightWidth: 0, borderTopWidth: 0 }]} />
                <View style={[s.finderCorner, { bottom: -2, right: -2, borderLeftWidth: 0, borderTopWidth: 0 }]} />
              </View>
            </View>
            <Text style={s.scannerHintBottom}>
              {scanned ? "Розпізнано! Шукаємо реагент..." : "Наведіть на QR-код реагенту"}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

// ─── Reagent Request Card ──────────────────────────────────────────────────────
function ReagentRequestCard({ req, onRemove }: { req: LabReagentRequest; onRemove: () => void }) {
  const urgCfg = URGENCY_OPTIONS.find(u => u.value === req.urgency) || URGENCY_OPTIONS[1];
  return (
    <View style={[s.reqCard, { borderLeftColor: urgCfg.color }]}>
      <View style={s.reqTop}>
        <View style={[s.reqUrgBadge, { backgroundColor: urgCfg.color + "18" }]}>
          <Text style={[s.reqUrgText, { color: urgCfg.color }]}>{urgCfg.label.toUpperCase()}</Text>
        </View>
        <Text style={s.reqDate}>{new Date(req.createdAt).toLocaleDateString("uk-UA")}</Text>
        <Pressable onPress={onRemove} style={s.iconBtn}>
          <Feather name="x" size={14} color={colors.mutedSoft} />
        </Pressable>
      </View>
      <Text style={s.reqName}>{req.reagentName}</Text>
      <View style={s.chipRow}>
        {req.casNumber ? <Chip icon="hash" text={req.casNumber} mono /> : null}
        <Chip icon="layers" text={`${req.quantity} ${req.unit}`} bold />
        {req.supplier ? <Chip icon="truck" text={req.supplier} /> : null}
      </View>
      {req.budgetCode ? <Text style={s.storage}>Бюджетний код: <Text style={s.mono}>{req.budgetCode}</Text></Text> : null}
      {req.notes ? <Text style={s.storage}>{req.notes}</Text> : null}
    </View>
  );
}

// ─── Reagent Request Modal ─────────────────────────────────────────────────────
function ReagentRequestModal({ item, onClose, onSubmit }: {
  item: LabInventoryItem | null;
  onClose: () => void;
  onSubmit: (data: Omit<LabReagentRequest, "id" | "createdAt" | "projectId">) => void;
}) {
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("мл");
  const [supplier, setSupplier] = useState("");
  const [urgency, setUrgency] = useState<LabReagentRequest["urgency"]>("normal");
  const [budgetCode, setBudgetCode] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (item) {
      setUnit(item.unit || "мл");
      setQuantity("");
      setSupplier(item.manufacturer || "");
      setUrgency("normal");
      setBudgetCode("");
      setNotes("");
    }
  }, [item]);

  if (!item) return null;

  const handleSubmit = () => {
    if (!quantity.trim()) { Alert.alert("Помилка", "Вкажіть кількість"); return; }
    onSubmit({
      inventoryItemId: item._id,
      reagentName: item.name,
      casNumber: item.casNumber,
      quantity: Number(quantity) || 1,
      unit,
      supplier: supplier.trim() || undefined,
      urgency,
      budgetCode: budgetCode.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Modal visible={!!item} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView style={s.modal} contentContainerStyle={{ paddingBottom: 60 }}>
          <View style={s.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={s.modalTitle}>Замовлення реагенту</Text>
              <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }} numberOfLines={1}>{item.name}</Text>
            </View>
            <Pressable onPress={onClose} style={s.closeBtn}>
              <Feather name="x" size={22} color={colors.ink} />
            </Pressable>
          </View>

          {/* CAS + current status */}
          <View style={[s.reqInfoBar, { marginBottom: 24 }]}>
            {item.casNumber ? <Text style={[s.storage, s.mono]}>CAS: {item.casNumber}</Text> : null}
            <Text style={[s.storage, { color: item.status === "depleted" ? lab.danger : lab.amber }]}>
              Поточний залишок: {item.quantity} {item.unit} ({item.status === "depleted" ? "Відсутній" : "Малий залишок"})
            </Text>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Кількість</Text>
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Field label="Кількість *">
                  <TextInput style={s.input} value={quantity} onChangeText={setQuantity} placeholder="100" keyboardType="numeric" />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Одиниця">
                  <View style={[s.input, { justifyContent: "center" }]}>
                    <Text style={{ fontSize: 14, color: colors.ink }}>{unit}</Text>
                  </View>
                </Field>
              </View>
            </View>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Постачальник</Text>
            <Field label="Назва постачальника">
              <TextInput style={s.input} value={supplier} onChangeText={setSupplier} placeholder="Sigma-Aldrich, VWR, BioRad..." />
            </Field>
            <Field label="Бюджетний код">
              <TextInput style={s.input} value={budgetCode} onChangeText={setBudgetCode} placeholder="н-р 2510/3" />
            </Field>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Терміновість</Text>
            <View style={s.chipsRow}>
              {URGENCY_OPTIONS.map(opt => (
                <Pressable key={opt.value} onPress={() => setUrgency(opt.value)}
                  style={[s.selectChip, urgency === opt.value && { borderColor: opt.color, backgroundColor: opt.color + "15" }]}>
                  <Text style={[s.selectChipText, urgency === opt.value && { color: opt.color, fontFamily: fonts.bold }]}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={s.section}>
            <Field label="Нотатки">
              <TextInput style={[s.input, { minHeight: 70, textAlignVertical: "top" }]} value={notes} onChangeText={setNotes} multiline placeholder="Причина замовлення, особливі вимоги..." />
            </Field>
          </View>

          <Pressable onPress={handleSubmit} style={s.saveBtn}>
            <Feather name="shopping-cart" size={18} color="white" />
            <Text style={s.saveBtnText}>Створити замовлення</Text>
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
  header:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  headerTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.ink },
  headerSub:   { fontSize: 12, color: colors.muted },
  addBtn:      { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: lab.accent, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  addBtnText:  { fontSize: 14, fontFamily: fonts.bold, color: "white" },

  filterRow:         { flexDirection: "row", gap: 0, backgroundColor: "#f1f5f9", borderRadius: 10, padding: 3, marginBottom: 16 },
  filterTab:         { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 8, borderRadius: 8 },
  filterTabActive:   { backgroundColor: "white", elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4 },
  filterTabText:     { fontSize: 13, fontFamily: fonts.bold, color: colors.mutedSoft },
  filterTabTextActive: { color: colors.ink },

  empty:     { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 16, fontFamily: fonts.bold, color: colors.muted },
  emptyBody:  { fontSize: 13, color: colors.mutedSoft, textAlign: "center", paddingHorizontal: 24 },

  card:    { backgroundColor: "white", borderRadius: 18, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 5, padding: 16, gap: 10, marginBottom: 12, elevation: 3, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  hazardBubble: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  hazardEmoji: { fontSize: 12 },
  hazardLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusDot:   { width: 6, height: 6, borderRadius: 3 },
  statusText:  { fontSize: 10, fontWeight: "900" },
  cardActions: { marginLeft: "auto", flexDirection: "row", gap: 7 },
  iconBtn:     { width: 30, height: 30, borderRadius: 8, backgroundColor: "#f8fafc", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border },
  cardName:    { fontSize: 16, fontFamily: fonts.bold, color: colors.ink, lineHeight: 22 },
  chipRow:     { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip:        { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#f8fafc", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: colors.border },
  chipAccent:  { backgroundColor: lab.accent + "10", borderColor: lab.accent + "30" },
  chipText:    { fontSize: 11, color: colors.muted },
  mono:        { fontFamily: "monospace" } as any,
  metaRow:     { flexDirection: "row", gap: 12 },
  metaText:    { fontSize: 11, color: colors.muted },
  expRow:      { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#f8fafc", borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6 },
  expWarn:     { backgroundColor: lab.amber + "12" },
  expDanger:   { backgroundColor: lab.danger + "12" },
  expText:     { fontSize: 11, fontFamily: fonts.bold },
  storageRow:  { flexDirection: "row", alignItems: "center", gap: 5 },
  storage:     { fontSize: 11, color: colors.muted },

  modal:       { flex: 1, backgroundColor: "white", padding: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  modalTitle:  { fontSize: 20, fontFamily: fonts.bold, color: colors.ink },
  closeBtn:    { width: 38, height: 38, borderRadius: 10, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" },

  section:      { marginBottom: 24, gap: 14 },
  sectionTitle: { fontSize: 11, fontWeight: "900", letterSpacing: 1.5, color: colors.mutedSoft, textTransform: "uppercase", marginBottom: 4 },
  field:        { gap: 6 },
  fieldLabel:   { fontSize: 13, fontFamily: fonts.bold, color: colors.ink },
  input:        { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.ink, backgroundColor: "#fafafa" },
  row:          { flexDirection: "row", gap: 12 },
  picker:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pickerText:   { fontSize: 14, color: colors.ink },
  dropdown:     { position: "absolute", top: 44, left: 0, right: 0, backgroundColor: "white", borderRadius: 10, borderWidth: 1, borderColor: colors.border, zIndex: 100, elevation: 10, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8 },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  dropdownText: { fontSize: 14, color: colors.ink },
  chipsRow:     { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  selectChip:   { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: "#f8fafc" },
  selectChipActive: { borderColor: lab.accent, backgroundColor: lab.accent + "12" },
  selectChipText:   { fontSize: 12, color: colors.muted },
  selectChipTextActive: { color: lab.accent, fontFamily: fonts.bold },
  hazardChip:      { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: "#f8fafc" },
  hazardChipIcon:  { fontSize: 14 },
  hazardChipText:  { fontSize: 11, color: colors.muted },
  saveBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: lab.accent, borderRadius: 14, paddingVertical: 16, marginTop: 8 },
  saveBtnText: { fontSize: 16, fontFamily: fonts.bold, color: "white" },

  orderBtn:    { flexDirection: "row" as const, alignItems: "center" as const, gap: 6, alignSelf: "flex-start" as const, backgroundColor: lab.accent, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, marginTop: 4 },
  orderBtnText: { fontSize: 12, fontFamily: fonts.bold, color: "white" },

  sdsBtnActive: { backgroundColor: "#0369a110", borderWidth: 1, borderColor: "#0369a1" },
  sdsIconText:  { fontSize: 8, fontWeight: "900" as const, color: "#0369a1", letterSpacing: 0.5 },

  sdsHeaderIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center" as const, justifyContent: "center" as const },
  sdsHazardBanner: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 6, marginBottom: 16 },
  sdsHazardTitle: { fontSize: 16, fontWeight: "900" as const, letterSpacing: 1 },
  sdsHazardSub:   { fontSize: 11, color: colors.muted },
  sdsStorageRow:  { flexDirection: "row" as const, alignItems: "center" as const, gap: 6, marginTop: 4 },
  sdsStorageText: { fontSize: 12 },
  sdsEmpty:       { alignItems: "center" as const, paddingVertical: 40, gap: 12 },
  sdsSection:     { backgroundColor: "#f8fafc", borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: colors.border },
  sdsSectionHeader: { flexDirection: "row" as const, alignItems: "center" as const, gap: 10 },
  sdsSectionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center" as const, justifyContent: "center" as const },
  sdsSectionTitle:{ fontSize: 11, fontWeight: "900" as const, letterSpacing: 1, textTransform: "uppercase" as const, color: colors.muted },
  sdsBodyText:    { fontSize: 14, color: colors.ink, lineHeight: 21 },
  sdsLinkBtn:     { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 8, backgroundColor: "#0369a1", borderRadius: 12, paddingVertical: 12 },
  sdsLinkBtnText: { fontSize: 14, fontFamily: fonts.bold, color: "white" },
  sdsUrl:         { fontSize: 11, color: colors.mutedSoft, textDecorationLine: "underline" as const },
  sdsEditBtn:     { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 6, borderWidth: 1, borderColor: lab.accent, borderRadius: 12, paddingVertical: 12 },
  sdsEditBtnText: { fontSize: 14, fontFamily: fonts.bold, color: lab.accent },

  reqCard: { backgroundColor: "white", borderRadius: 16, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 5, padding: 16, gap: 10, marginBottom: 12, elevation: 2, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6 },
  reqTop:  { flexDirection: "row" as const, alignItems: "center" as const, gap: 8 },
  reqUrgBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7 },
  reqUrgText:  { fontSize: 9, fontWeight: "900" as const, letterSpacing: 0.5 },
  reqDate:     { flex: 1, fontSize: 11, color: colors.mutedSoft, textAlign: "right" as const },
  reqName:     { fontSize: 16, fontFamily: fonts.bold, color: colors.ink },
  reqInfoBar:  { backgroundColor: "#f8fafc", borderRadius: 10, padding: 12, gap: 4 },
  clearBtn:    { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 6, paddingVertical: 12 },
  clearBtnText: { fontSize: 13, color: colors.mutedSoft },

  // ── Catalog button ─────────────────────────────────────────────────────────
  catalogBtn:     { flexDirection: "row" as const, alignItems: "center" as const, gap: 5, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1.5, borderColor: "#7c3aed" + "60", backgroundColor: "#7c3aed" + "10" },
  catalogBtnText: { fontSize: 13, fontFamily: fonts.bold, color: "#7c3aed" },

  // ── PubChem ────────────────────────────────────────────────────────────────
  pubSearchBtn:     { flexDirection: "row" as const, alignItems: "center" as const, gap: 5, backgroundColor: "#0369a1", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  pubSearchBtnText: { fontSize: 11, fontFamily: fonts.bold, color: "white" },
  pubErrorBox:      { flexDirection: "row" as const, alignItems: "center" as const, gap: 8, backgroundColor: lab.danger + "12", borderRadius: 10, padding: 10, borderWidth: 1, borderColor: lab.danger + "30" },
  pubErrorText:     { fontSize: 12, color: lab.danger, flex: 1 },
  pubResultBox:     { backgroundColor: lab.ok + "0c", borderRadius: 12, padding: 12, gap: 8, borderWidth: 1, borderColor: lab.ok + "30" },
  pubResultHeader:  { flexDirection: "row" as const, alignItems: "center" as const, gap: 7 },
  pubResultTitle:   { fontSize: 11, fontWeight: "700" as const, color: lab.ok },
  pubResultRow:     { flexDirection: "row" as const, alignItems: "center" as const, gap: 6, flexWrap: "wrap" as const },
  pubResultLabel:   { fontSize: 11, color: colors.mutedSoft, minWidth: 48 },
  pubResultVal:     { fontSize: 12, color: colors.ink },
  pubResultMw:      { fontSize: 10, color: colors.mutedSoft },
  pubApplyBtn:      { backgroundColor: lab.ok + "18", borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: lab.ok + "40" },
  pubApplyText:     { fontSize: 11, fontFamily: fonts.bold, color: lab.ok },
  pubHCodes:        { fontSize: 10, color: colors.mutedSoft, fontFamily: "monospace" as any },

  // ── Scan header button ──────────────────────────────────────────────────────
  scanHeaderBtn: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, borderColor: lab.accent + "40", backgroundColor: lab.accent + "10", alignItems: "center" as const, justifyContent: "center" as const },

  // ── QR Modal ───────────────────────────────────────────────────────────────
  qrOverlay:    { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center" as const, alignItems: "center" as const, padding: 24 },
  qrSheet:      { backgroundColor: "white", borderRadius: 24, padding: 24, width: "100%", gap: 12, alignItems: "center" as const },
  qrHeader:     { flexDirection: "row" as const, justifyContent: "space-between" as const, alignItems: "center" as const, width: "100%", marginBottom: 4 },
  qrTitle:      { fontSize: 18, fontFamily: fonts.bold, color: colors.ink },
  qrItemName:   { fontSize: 17, fontFamily: fonts.bold, color: colors.ink, textAlign: "center" as const, lineHeight: 24 },
  qrCas:        { fontSize: 12, color: colors.muted, fontFamily: "monospace" as any },
  qrHazardBadge: { flexDirection: "row" as const, alignItems: "center" as const, gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  qrHazardEmoji: { fontSize: 14 },
  qrHazardLabel: { fontSize: 12, fontWeight: "700" as const, letterSpacing: 0.3 },
  qrCodeBox:    { backgroundColor: "white", borderRadius: 16, padding: 12, borderWidth: 1, borderColor: colors.border, elevation: 3, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8 },
  qrIdText:     { fontSize: 10, color: colors.mutedSoft, fontFamily: "monospace" as any, textAlign: "center" as const, maxWidth: "100%" },
  qrLocRow:     { flexDirection: "row" as const, alignItems: "center" as const, gap: 5 },
  qrLocText:    { fontSize: 12, color: colors.muted },
  qrHint:       { fontSize: 11, color: colors.mutedSoft, textAlign: "center" as const, paddingHorizontal: 16 },

  // ── Scanner Modal ──────────────────────────────────────────────────────────
  scannerContainer:  { flex: 1, backgroundColor: "#000" },
  scannerHeader:     { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, paddingTop: Platform.OS === "ios" ? 56 : 20, paddingBottom: 16, paddingHorizontal: 20, zIndex: 10 },
  scannerCloseBtn:   { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center" as const, justifyContent: "center" as const },
  scannerTitle:      { fontSize: 17, fontFamily: fonts.bold, color: "white" },
  scannerCenter:     { flex: 1, alignItems: "center" as const, justifyContent: "center" as const, gap: 16, paddingHorizontal: 32 },
  scannerHintCenter: { fontSize: 16, color: "rgba(255,255,255,0.7)", textAlign: "center" as const },
  scannerPermBtn:    { backgroundColor: lab.accent, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 },
  scannerPermBtnText: { fontSize: 15, fontFamily: fonts.bold, color: "white" },
  scannerViewfinder: { ...StyleSheet.absoluteFillObject, alignItems: "center" as const, justifyContent: "center" as const },
  finderFrame:       { width: 240, height: 240, borderRadius: 16 },
  finderCorner:      { position: "absolute" as const, width: 28, height: 28, borderWidth: 3, borderColor: lab.soft, borderRadius: 4 },
  scannerHintBottom: { position: "absolute" as const, bottom: Platform.OS === "ios" ? 80 : 48, left: 0, right: 0, textAlign: "center" as const, fontSize: 14, color: "rgba(255,255,255,0.85)", fontFamily: fonts.bold },
});

// ─── Reagent Catalog styles ────────────────────────────────────────────────────
const rc = StyleSheet.create({
  container:       { flex: 1, backgroundColor: "white" },
  header:          { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, gap: 12 },
  headerTitle:     { fontSize: 19, fontFamily: fonts.bold, color: colors.ink },
  headerSub:       { fontSize: 12, color: colors.muted, marginTop: 2 },
  closeBtn:        { width: 38, height: 38, borderRadius: 10, backgroundColor: "#f1f5f9", alignItems: "center" as const, justifyContent: "center" as const },
  detailHeader:    { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 18, paddingBottom: 14, gap: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn:         { width: 38, height: 38, borderRadius: 10, backgroundColor: lab.accent + "12", alignItems: "center" as const, justifyContent: "center" as const },
  detailHeaderTitle: { flex: 1, fontSize: 16, fontFamily: fonts.bold, color: colors.ink },

  searchBox:       { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: "#fafafa" },
  searchInput:     { flex: 1, fontSize: 14, color: colors.ink },

  catRow:          { marginBottom: 10 },
  catChip:         { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: "#f8fafc" },
  catChipActive:   { backgroundColor: lab.accent + "14", borderColor: lab.accent + "50" },
  catChipText:     { fontSize: 12, color: colors.muted },
  catChipTextActive: { color: lab.accent, fontFamily: fonts.bold },
  catChipEmoji:    { fontSize: 13 },

  itemRow:         { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "white", borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, elevation: 1, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 4 },
  itemEmoji:       { width: 44, height: 44, borderRadius: 13, alignItems: "center" as const, justifyContent: "center" as const },
  itemEmojiText:   { fontSize: 22 },
  itemName:        { fontSize: 14, fontFamily: fonts.bold, color: colors.ink },
  itemNameEn:      { fontSize: 11, color: colors.muted },
  itemCas:         { fontSize: 10, color: colors.mutedSoft, fontFamily: "monospace" as any },
  hazardBubble:    { width: 28, height: 28, borderRadius: 8, alignItems: "center" as const, justifyContent: "center" as const },
  hazardBubbleText: { fontSize: 14 },
  hazardCode:      { fontSize: 9, fontWeight: "700" as const, textAlign: "right" as const },

  empty:           { alignItems: "center" as const, paddingVertical: 48, gap: 12 },
  emptyText:       { fontSize: 15, color: colors.mutedSoft },

  hero:            { flexDirection: "row", gap: 14, alignItems: "flex-start", borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 16 },
  heroEmoji:       { width: 56, height: 56, borderRadius: 16, alignItems: "center" as const, justifyContent: "center" as const },
  heroEmojiText:   { fontSize: 30 },
  heroName:        { fontSize: 17, fontFamily: fonts.bold, color: colors.ink, lineHeight: 24 },
  heroNameEn:      { fontSize: 12, color: colors.muted, marginTop: 2 },
  casBadge:        { fontSize: 11, color: colors.muted, fontFamily: "monospace" as any, marginTop: 4 },

  hazardBanner:    { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 14 },
  hazardBannerIcon:  { fontSize: 28 },
  hazardBannerTitle: { fontSize: 13, fontWeight: "900" as const, letterSpacing: 1 },
  hazardBannerSub:   { fontSize: 11, color: colors.muted, marginTop: 2 },

  desc:            { fontSize: 14, color: colors.ink, lineHeight: 22, marginBottom: 12 },
  notesBox:        { flexDirection: "row", gap: 8, alignItems: "flex-start", backgroundColor: lab.amber + "0e", borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: lab.amber + "30" },
  notesText:       { flex: 1, fontSize: 12, color: "#92400e", lineHeight: 18 },

  section:         { marginBottom: 20 },
  sectionTitle:    { fontSize: 10, fontWeight: "900" as const, letterSpacing: 1.5, color: colors.mutedSoft, textTransform: "uppercase" as const, marginBottom: 10 },
  infoRow:         { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  infoText:        { flex: 1, fontSize: 13, color: colors.ink, lineHeight: 20 },

  mfgWrap:         { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  mfgChip:         { backgroundColor: "#f1f5f9", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  mfgText:         { fontSize: 12, color: colors.ink },

  addBtn:          { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: lab.accent, borderRadius: 16, paddingVertical: 18, marginTop: 8 },
  addBtnText:      { fontSize: 16, fontFamily: fonts.bold, color: "white" },
});
