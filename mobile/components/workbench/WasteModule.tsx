import { View, Text, Pressable, TextInput, Alert, ScrollView } from "react-native";
import * as Icons from "lucide-react-native";
import { useState } from "react";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import { colors, fonts } from "@/constants/theme";
import { type WasteRecord, type WasteCategory } from "@/lib/mobile-store";
import { s } from "./styles";

const WASTE_CATEGORIES: { value: WasteCategory; label: string; icon: any; color: string }[] = [
  { value: "chemical",    label: "Хімічні",        icon: Icons.FlaskConical, color: "#dc2626" },
  { value: "biological",  label: "Біологічні",     icon: Icons.Biohazard,    color: "#7c3aed" },
  { value: "sharp",       label: "Гострі предмети",icon: Icons.Syringe,      color: "#d97706" },
  { value: "radioactive", label: "Радіоактивні",   icon: Icons.Radiation,    color: "#0369a1" },
  { value: "other",       label: "Інші",           icon: Icons.Package,      color: "#64748b" },
];

const WASTE_UNITS = ["мг", "г", "кг", "мкл", "мл", "л", "шт", "уп", "контейнер"];
const DISPOSAL_METHODS = [
  "Автоклавування",
  "Хімічна інактивація",
  "Спалення",
  "Контейнер для гострих",
  "Захоронення (ліцензія)",
  "Нейтралізація",
  "Інший метод",
];

export function WasteModule({ records, onAdd, onRemove, handlerName }: {
  records: WasteRecord[];
  onAdd: (data: any) => void;
  onRemove: (id: string) => void;
  handlerName?: string;
}) {
  const [view, setView]               = useState<"journal" | "add" | "report">("journal");
  const [category, setCategory]       = useState<WasteCategory>("chemical");
  const [reagentName, setReagentName] = useState("");
  const [quantity, setQuantity]       = useState("");
  const [unit, setUnit]               = useState("мл");
  const [disposalMethod, setDisposalMethod] = useState("");
  const [handledBy, setHandledBy]     = useState(handlerName || "");
  const [notes, setNotes]             = useState("");
  const [unitOpen, setUnitOpen]       = useState(false);
  const [methodOpen, setMethodOpen]   = useState(false);

  const today = new Date().toISOString().split("T")[0];

  function resetForm() {
    setReagentName(""); setQuantity(""); setUnit("мл");
    setDisposalMethod(""); setNotes(""); setUnitOpen(false); setMethodOpen(false);
    setCategory("chemical");
  }

  function handleAdd() {
    if (!reagentName.trim()) { Alert.alert("Помилка", "Вкажіть назву відходу."); return; }
    if (!disposalMethod.trim()) { Alert.alert("Помилка", "Вкажіть метод утилізації."); return; }
    onAdd({
      date: today,
      category,
      reagentName: reagentName.trim(),
      quantity: parseFloat(quantity) || 0,
      unit,
      disposalMethod: disposalMethod.trim(),
      handledBy: handledBy.trim(),
      notes: notes.trim(),
    });
    resetForm();
    setView("journal");
    Alert.alert("Записано", "Запис про утилізацію збережено.");
  }

  const reportByCategory = WASTE_CATEGORIES.map(cat => ({
    ...cat,
    count: records.filter(r => r.category === cat.value).length,
  })).filter(c => c.count > 0);

  return (
    <View style={{ gap: 16 }}>
      <View style={s.moduleHeader}>
        <View style={[s.moduleIconWrap, { backgroundColor: "#0d948818" }]}>
          <Icons.Recycle size={20} color="#0d9488" strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.moduleTitle}>Утилізація відходів</Text>
          <Text style={s.moduleSub}>{records.length} записів · GLP-відповідний журнал</Text>
        </View>
      </View>

      <View style={s.filterRow}>
        <Pressable onPress={() => setView("journal")} style={[s.filterTab, view === "journal" && s.filterTabActive]}>
          <Icons.ClipboardList size={11} color={view === "journal" ? "#0d9488" : colors.mutedSoft} strokeWidth={2.5} />
          <Text style={[s.filterTabText, view === "journal" && { color: "#0d9488" }]}>Журнал ({records.length})</Text>
        </Pressable>
        <Pressable onPress={() => setView("add")} style={[s.filterTab, view === "add" && s.filterTabActive]}>
          <Icons.Plus size={11} color={view === "add" ? "#0d9488" : colors.mutedSoft} strokeWidth={2.5} />
          <Text style={[s.filterTabText, view === "add" && { color: "#0d9488" }]}>Новий запис</Text>
        </Pressable>
        <Pressable onPress={() => setView("report")} style={[s.filterTab, view === "report" && s.filterTabActive]}>
          <Icons.ChartBarBig size={11} color={view === "report" ? "#0d9488" : colors.mutedSoft} strokeWidth={2.5} />
          <Text style={[s.filterTabText, view === "report" && { color: "#0d9488" }]}>Звіт</Text>
        </Pressable>
      </View>

      {view === "journal" && (
        records.length === 0 ? (
          <View style={s.emptyWrap}>
            <Icons.Recycle size={38} color={colors.border} strokeWidth={1.2} />
            <Text style={s.emptyText}>Журнал відходів порожній</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {records.map((rec, i) => {
              const cat = WASTE_CATEGORIES.find(c => c.value === rec.category) || WASTE_CATEGORIES[4];
              const CatIcon = cat.icon;
              return (
                <MotiView key={rec.id} from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: i * 25 }}>
                  <View style={[s.wasteCard, { borderLeftColor: cat.color }]}>
                    <View style={s.wasteCardTop}>
                      <View style={[s.wasteIconWrap, { backgroundColor: cat.color + "18" }]}>
                        <CatIcon size={16} color={cat.color} strokeWidth={1.8} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.wasteName}>{rec.reagentName}</Text>
                        <Text style={s.wasteMeta}>{cat.label} · {rec.quantity > 0 ? `${rec.quantity} ${rec.unit}` : rec.unit}</Text>
                      </View>
                      <View style={{ alignItems: "flex-end", gap: 4 }}>
                        <Text style={s.wasteDate}>{rec.date}</Text>
                        <Pressable onPress={() => Alert.alert("Видалити?", `Видалити запис «${rec.reagentName}»?`, [
                          { text: "Скасувати", style: "cancel" },
                          { text: "Видалити", style: "destructive", onPress: () => onRemove(rec.id) },
                        ])}>
                          <Icons.Trash2 size={14} color={colors.mutedSoft} strokeWidth={2} />
                        </Pressable>
                      </View>
                    </View>
                    <View style={s.wasteDetails}>
                      <View style={s.wasteDetailRow}>
                        <Icons.Trash size={11} color={colors.muted} strokeWidth={2} />
                        <Text style={s.wasteDetailText}>{rec.disposalMethod}</Text>
                      </View>
                      {!!rec.handledBy && (
                        <View style={s.wasteDetailRow}>
                          <Icons.User size={11} color={colors.muted} strokeWidth={2} />
                          <Text style={s.wasteDetailText}>{rec.handledBy}</Text>
                        </View>
                      )}
                      {!!rec.notes && <Text style={s.wasteNotes}>{rec.notes}</Text>}
                    </View>
                  </View>
                </MotiView>
              );
            })}
          </View>
        )
      )}

      {view === "add" && (
        <View style={s.createForm}>
          <Text style={s.fieldLabel}>Категорія відходу</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {WASTE_CATEGORIES.map(cat => {
                const CatIcon = cat.icon;
                const active = category === cat.value;
                return (
                  <Pressable key={cat.value} onPress={() => setCategory(cat.value)}
                    style={[s.wasteCatChip, active && { borderColor: cat.color, backgroundColor: cat.color + "15" }]}>
                    <CatIcon size={14} color={active ? cat.color : colors.mutedSoft} strokeWidth={1.8} />
                    <Text style={[s.wasteCatText, active && { color: cat.color, fontFamily: fonts.bold }]}>{cat.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <Text style={s.fieldLabel}>Назва речовини / відходу *</Text>
          <TextInput style={s.fieldInput} value={reagentName} onChangeText={setReagentName}
            placeholder="н-р Натрій азид, інфікована культура..." placeholderTextColor={colors.mutedSoft} />

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>Кількість</Text>
              <TextInput style={s.fieldInput} value={quantity} onChangeText={setQuantity}
                keyboardType="numeric" placeholder="0" placeholderTextColor={colors.mutedSoft} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>Одиниця</Text>
              <Pressable style={[s.fieldInput, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}
                onPress={() => setUnitOpen(!unitOpen)}>
                <Text style={{ fontSize: 14, color: colors.ink }}>{unit}</Text>
                <Icons.ChevronDown size={14} color={colors.muted} />
              </Pressable>
              {unitOpen && (
                <View style={s.dropdown}>
                  {WASTE_UNITS.map(u => (
                    <Pressable key={u} style={s.dropdownItem} onPress={() => { setUnit(u); setUnitOpen(false); }}>
                      <Text style={[s.dropdownText, unit === u && { color: "#0d9488", fontFamily: fonts.bold }]}>{u}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>

          <Text style={s.fieldLabel}>Метод утилізації *</Text>
          <Pressable style={[s.fieldInput, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}
            onPress={() => setMethodOpen(!methodOpen)}>
            <Text style={{ fontSize: 14, color: disposalMethod ? colors.ink : "#9ca3af" }} numberOfLines={1}>
              {disposalMethod || "Оберіть метод..."}
            </Text>
            <Icons.ChevronDown size={14} color={colors.muted} />
          </Pressable>
          {methodOpen && (
            <View style={s.dropdown}>
              {DISPOSAL_METHODS.map(m => (
                <Pressable key={m} style={s.dropdownItem} onPress={() => { setDisposalMethod(m); setMethodOpen(false); }}>
                  <Text style={[s.dropdownText, disposalMethod === m && { color: "#0d9488", fontFamily: fonts.bold }]}>{m}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <Text style={s.fieldLabel}>Відповідальний</Text>
          <TextInput style={s.fieldInput} value={handledBy} onChangeText={setHandledBy}
            placeholder="Прізвище Ім'я" placeholderTextColor={colors.mutedSoft} />

          <Text style={s.fieldLabel}>Нотатки</Text>
          <TextInput style={[s.fieldInput, s.textArea]} value={notes} onChangeText={setNotes}
            multiline placeholder="Особливості утилізації, номер акту..." placeholderTextColor={colors.mutedSoft} />

          <Pressable onPress={handleAdd} style={s.wasteSubmitBtn}>
            <Icons.CheckCircle size={18} color="white" strokeWidth={2} />
            <Text style={s.wasteSubmitBtnText}>Записати утилізацію</Text>
          </Pressable>
        </View>
      )}

      {view === "report" && (
        <View style={{ gap: 12 }}>
          <LinearGradient colors={["#0d9488", "#0f766e"]} style={s.wasteReportBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={s.wasteReportBannerTitle}>Зведений звіт</Text>
            <Text style={s.wasteReportBannerSub}>{records.length} записів з {today.slice(0, 7)}</Text>
            <View style={{ flexDirection: "row", gap: 24, marginTop: 10 }}>
              <View>
                <Text style={s.wasteReportBigNum}>{records.length}</Text>
                <Text style={s.wasteReportBigLabel}>Всього актів</Text>
              </View>
              <View>
                <Text style={s.wasteReportBigNum}>{reportByCategory.length}</Text>
                <Text style={s.wasteReportBigLabel}>Категорій</Text>
              </View>
            </View>
          </LinearGradient>

          <Text style={s.sectionLabel}>ПО КАТЕГОРІЯХ</Text>
          {reportByCategory.length === 0 ? (
            <View style={s.emptyWrap}>
              <Text style={s.emptyText}>Записів ще немає</Text>
            </View>
          ) : (
            reportByCategory.map(cat => {
              const CatIcon = cat.icon;
              const pct = records.length > 0 ? Math.round((cat.count / records.length) * 100) : 0;
              return (
                <View key={cat.value} style={s.wasteCatReportCard}>
                  <View style={[s.wasteIconWrap, { backgroundColor: cat.color + "18" }]}>
                    <CatIcon size={18} color={cat.color} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1, gap: 6 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={s.wasteCatReportName}>{cat.label}</Text>
                      <Text style={[s.wasteCatReportCount, { color: cat.color }]}>{cat.count} акт(ів)</Text>
                    </View>
                    <View style={s.wasteProgBar}>
                      <MotiView
                        from={{ width: "0%" }}
                        animate={{ width: `${pct}%` as any }}
                        transition={{ type: "timing", duration: 600 }}
                        style={[s.wasteProgFill, { backgroundColor: cat.color }]}
                      />
                    </View>
                  </View>
                </View>
              );
            })
          )}

          <View style={s.wasteComplianceCard}>
            <Icons.ShieldCheck size={16} color="#0d9488" strokeWidth={2} />
            <Text style={s.wasteComplianceText}>
              Всі записи збережено згідно вимог GLP. Для формування офіційного звіту надайте дані відповідальній особі закладу.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
