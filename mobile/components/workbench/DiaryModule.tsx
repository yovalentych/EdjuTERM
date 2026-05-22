import { View, Text, Pressable, TextInput, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { colors, fonts } from "@/constants/theme";
import { s } from "./styles";

export function DiaryModule({ drafts, entries, onSync, onAddDraft, onClear }: {
  drafts: any[];
  entries: any[];
  onSync: (data: any) => Promise<void>;
  onAddDraft: (body: string, title: string, type: string) => void;
  onClear: () => void;
}) {
  const [tab, setTab]     = useState<"new" | "history">("new");
  const [title, setTitle] = useState("");
  const [body, setBody]   = useState("");

  const handleSave = async () => {
    try {
      await onSync({ type: "note", title, body, date: new Date().toISOString().split("T")[0] });
      setBody(""); setTitle("");
      Alert.alert("Збережено", "Запис синхронізовано.");
    } catch {
      onAddDraft(body, title, "note");
      setBody(""); setTitle("");
      Alert.alert("Офлайн", "Збережено як чернетку.");
    }
  };

  return (
    <View style={{ gap: 14 }}>
      <View style={s.moduleHeader}>
        <View style={[s.moduleIconWrap, { backgroundColor: "#0f766e18" }]}>
          <Feather name="edit-3" size={20} color="#0f766e" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.moduleTitle}>Щоденник</Text>
          <Text style={s.moduleSub}>{entries.length} записів</Text>
        </View>
      </View>

      <View style={s.filterRow}>
        <Pressable onPress={() => setTab("new")} style={[s.filterTab, tab === "new" && s.filterTabActive]}>
          <Text style={[s.filterTabText, tab === "new" && s.filterTabTextActive]}>Новий запис</Text>
        </Pressable>
        <Pressable onPress={() => setTab("history")} style={[s.filterTab, tab === "history" && s.filterTabActive]}>
          <Text style={[s.filterTabText, tab === "history" && s.filterTabTextActive]}>Історія ({entries.length})</Text>
        </Pressable>
      </View>

      {tab === "new" ? (
        <View style={{ gap: 12 }}>
          <View style={s.createForm}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Назва"
              placeholderTextColor={colors.mutedSoft}
              style={s.inputTitle}
            />
            <TextInput
              value={body}
              onChangeText={setBody}
              multiline
              placeholder="Опис..."
              placeholderTextColor={colors.mutedSoft}
              style={[s.inputText, { minHeight: 100, textAlignVertical: "top" }]}
            />
            <Pressable onPress={handleSave} style={[s.notifActionBtn, { backgroundColor: "#0f766e" }]}>
              <Feather name="upload-cloud" size={17} color="white" />
              <Text style={s.notifActionBtnText}>Синхронізувати</Text>
            </Pressable>
          </View>

          {drafts.length > 0 && (
            <View style={{ gap: 8 }}>
              <Text style={s.sectionLabel}>ЧЕРНЕТКИ ({drafts.length})</Text>
              {drafts.map((d: any) => (
                <View key={d.id} style={s.historyItem}>
                  <View style={[s.historyAccent, { backgroundColor: "#0f766e" }]} />
                  <View style={s.historyContent}>
                    <Text style={s.historyTitle}>{d.title || "Без назви"}</Text>
                    <Text style={s.historyBody} numberOfLines={1}>{d.body}</Text>
                  </View>
                  <Feather name="refresh-cw" size={16} color={colors.muted} />
                </View>
              ))}
              <Pressable onPress={onClear} style={[s.notifActionBtn, { backgroundColor: "white", borderWidth: 1.5, borderColor: colors.border }]}>
                <Text style={[s.notifActionBtnText, { color: colors.muted }]}>Очистити чернетки</Text>
              </Pressable>
            </View>
          )}
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {entries.length === 0 ? (
            <View style={s.emptyWrap}>
              <Feather name="book" size={30} color={colors.mutedSoft} />
              <Text style={s.emptyText}>Записів ще немає</Text>
            </View>
          ) : (
            entries.map((e: any) => (
              <View key={e._id} style={s.historyItem}>
                <View style={[s.historyAccent, { backgroundColor: "#0f766e" }]} />
                <View style={s.historyContent}>
                  <Text style={s.historyTitle}>{e.title}</Text>
                  <Text style={s.historyBody}>{e.body}</Text>
                  <Text style={s.historyDate}>{e.date}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
}
