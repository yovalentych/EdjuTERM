import { View, Text, Pressable, ScrollView, TextInput, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { ActionButton } from "@/components/ui";
import { colors } from "@/constants/theme";
import { lab } from "./constants";
import { s } from "./styles";

const GLP_ENTRY_TYPES = [
  { id: "observation",       label: "Спостереження", icon: "eye",           color: "#0369a1" },
  { id: "protocol",          label: "Протокол",      icon: "file-text",     color: lab.mid   },
  { id: "result",            label: "Результат",     icon: "bar-chart-2",   color: lab.ok    },
  { id: "anomaly",           label: "Аномалія",      icon: "alert-triangle", color: lab.amber },
  { id: "technical_failure", label: "Тех. збій",     icon: "alert-octagon", color: lab.danger },
  { id: "note",              label: "Нотатка",       icon: "edit-3",        color: lab.neutral },
] as const;

export function GlpJournalModule({ drafts, entries, onSync, onAddDraft, onClear, labEquipment, labInventory }: any) {
  const [tab, setTab]               = useState<"new" | "history">("new");
  const [body, setBody]             = useState("");
  const [title, setTitle]           = useState("");
  const [entryType, setEntryType]   = useState<string>("observation");
  const [linkedEq, setLinkedEq]     = useState<string | null>(null);
  const [linkedInv, setLinkedInv]   = useState<string | null>(null);

  const handleSave = async () => {
    if (!body.trim()) { Alert.alert("Помилка", "Заповніть опис запису"); return; }
    try {
      await onSync({
        type: entryType,
        title: title.trim() || GLP_ENTRY_TYPES.find(t => t.id === entryType)?.label || "Запис",
        body: body.trim(),
        date: new Date().toISOString().split("T")[0],
        tags: [entryType, linkedEq ? `eq:${linkedEq}` : "", linkedInv ? `inv:${linkedInv}` : ""].filter(Boolean),
      });
      setBody(""); setTitle(""); setLinkedEq(null); setLinkedInv(null);
      Alert.alert("GLP", "Запис збережено у журналі.");
    } catch {
      onAddDraft(body, title || "GLP запис", entryType);
      setBody(""); setTitle("");
      Alert.alert("Офлайн", "Збережено як чернетку.");
    }
  };

  const glpEntries = entries.filter((e: any) =>
    GLP_ENTRY_TYPES.some(t => t.id === e.type)
  );

  return (
    <View style={{ gap: 14 }}>
      <View style={s.moduleHeader}>
        <View style={[s.moduleIconWrap, { backgroundColor: lab.mid + "18" }]}>
          <Feather name="file-text" size={20} color={lab.mid} />
        </View>
        <View>
          <Text style={s.moduleTitle}>GLP-Журнал</Text>
          <Text style={s.moduleSub}>{glpEntries.length} записів · Стандарт GLP</Text>
        </View>
      </View>

      <View style={s.filterRow}>
        <Pressable onPress={() => setTab("new")} style={[s.filterTab, tab === "new" && s.filterTabActive]}>
          <Text style={[s.filterTabText, tab === "new" && s.filterTabTextActive]}>Новий запис</Text>
        </Pressable>
        <Pressable onPress={() => setTab("history")} style={[s.filterTab, tab === "history" && s.filterTabActive]}>
          <Text style={[s.filterTabText, tab === "history" && s.filterTabTextActive]}>Журнал ({glpEntries.length})</Text>
        </Pressable>
      </View>

      {tab === "new" ? (
        <View style={{ gap: 12 }}>
          <Text style={s.sectionLabel}>ТИП ЗАПИСУ</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {GLP_ENTRY_TYPES.map(t => (
                <Pressable key={t.id} onPress={() => setEntryType(t.id)}
                  style={[s.glpTypeChip, entryType === t.id && { backgroundColor: t.color + "20", borderColor: t.color }]}>
                  <Feather name={t.icon as any} size={13} color={entryType === t.id ? t.color : colors.mutedSoft} />
                  <Text style={[s.glpTypeChipText, entryType === t.id && { color: t.color }]}>{t.label}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <TextInput value={title} onChangeText={setTitle} placeholder="Заголовок (необов'язково)" style={s.fieldInput} />
          <TextInput
            value={body} onChangeText={setBody}
            placeholder="Детальний опис спостереження, результати, відхилення..."
            style={[s.fieldInput, { minHeight: 120 }]} multiline
          />

          {labEquipment.length > 0 && (
            <>
              <Text style={s.sectionLabel}>ПРИВ'ЯЗАТИ ДО ПРИЛАДУ</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Pressable onPress={() => setLinkedEq(null)} style={[s.chip, !linkedEq && { backgroundColor: lab.accent + "15", borderColor: lab.accent }]}>
                    <Text style={[s.chipText, !linkedEq && { color: lab.accent }]}>Без прив'язки</Text>
                  </Pressable>
                  {labEquipment.map((eq: any) => (
                    <Pressable key={eq._id} onPress={() => setLinkedEq(eq._id === linkedEq ? null : eq._id)}
                      style={[s.chip, linkedEq === eq._id && { backgroundColor: lab.amber + "15", borderColor: lab.amber }]}>
                      <Feather name="cpu" size={11} color={linkedEq === eq._id ? lab.amber : colors.mutedSoft} />
                      <Text style={[s.chipText, linkedEq === eq._id && { color: lab.amber }]} numberOfLines={1}>{eq.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </>
          )}

          {labInventory.length > 0 && (
            <>
              <Text style={s.sectionLabel}>ПРИВ'ЯЗАТИ ДО РЕАГЕНТУ</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Pressable onPress={() => setLinkedInv(null)} style={[s.chip, !linkedInv && { backgroundColor: lab.accent + "15", borderColor: lab.accent }]}>
                    <Text style={[s.chipText, !linkedInv && { color: lab.accent }]}>Без прив'язки</Text>
                  </Pressable>
                  {labInventory.slice(0, 8).map((inv: any) => (
                    <Pressable key={inv._id} onPress={() => setLinkedInv(inv._id === linkedInv ? null : inv._id)}
                      style={[s.chip, linkedInv === inv._id && { backgroundColor: lab.danger + "15", borderColor: lab.danger }]}>
                      <Feather name="package" size={11} color={linkedInv === inv._id ? lab.danger : colors.mutedSoft} />
                      <Text style={[s.chipText, linkedInv === inv._id && { color: lab.danger }]} numberOfLines={1}>{inv.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </>
          )}

          <ActionButton label="Зберегти у журнал GLP" icon="save" onPress={handleSave} />
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {glpEntries.length === 0 ? (
            <View style={s.emptyWrap}>
              <Feather name="file-text" size={36} color={colors.mutedSoft} />
              <Text style={s.emptyText}>Журнал порожній</Text>
            </View>
          ) : (
            glpEntries.map((e: any) => {
              const typeConf = GLP_ENTRY_TYPES.find(t => t.id === e.type) || GLP_ENTRY_TYPES[5];
              return (
                <View key={e._id} style={[s.glpEntryCard, { borderLeftColor: typeConf.color }]}>
                  <View style={s.glpEntryTop}>
                    <View style={[s.glpTypeChip, { backgroundColor: typeConf.color + "18", borderColor: typeConf.color + "40" }]}>
                      <Feather name={typeConf.icon as any} size={11} color={typeConf.color} />
                      <Text style={[s.glpTypeChipText, { color: typeConf.color }]}>{typeConf.label}</Text>
                    </View>
                    <Text style={s.glpEntryDate}>{e.date}</Text>
                  </View>
                  <Text style={s.glpEntryTitle}>{e.title}</Text>
                  <Text style={s.glpEntryBody} numberOfLines={3}>{e.body}</Text>
                </View>
              );
            })
          )}
        </View>
      )}
    </View>
  );
}
