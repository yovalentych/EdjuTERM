import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View, Pressable, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Screen } from "@/components/screen";
import { ActionButton, Body, Card, Eyebrow, Title } from "@/components/ui";
import { colors } from "@/constants/theme";
import { useMobileStore } from "@/lib/mobile-store";

const entryTypes = [
  { id: "note", label: "Нотатка", icon: "file-text" },
  { id: "meeting", label: "Зустріч", icon: "users" },
  { id: "task_done", label: "Завдання", icon: "check-circle" },
  { id: "event", label: "Подія", icon: "calendar" },
] as const;

export default function CaptureScreen() {
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<typeof entryTypes[number]["id"]>("note");
  const [syncing, setSyncing] = useState(false);
  const { addDiaryDraft, clearDrafts, drafts, syncDiaryEntry } = useMobileStore();

  async function handleSync() {
    if (!title || !body) {
      Alert.alert("Заповніть поля", "Вкажіть назву та опис для синхронізації.");
      return;
    }

    setSyncing(true);
    try {
      await syncDiaryEntry({
        type,
        title,
        body,
        date: new Date().toISOString().split("T")[0],
      });
      Alert.alert("Успіх", "Запис синхронізовано з хмарою.");
      setBody("");
      setTitle("");
    } catch (error) {
      Alert.alert("Помилка синхронізації", "Запис збережено як локальну чернетку.");
      addDiaryDraft(`${title}: ${body}`);
    } finally {
      setSyncing(false);
    }
  }

  function saveDraft() {
    if (body.trim().length < 3) {
      Alert.alert("Запис закороткий", "Додай хоча б кілька слів перед збереженням.");
      return;
    }
    addDiaryDraft(title ? `${title}: ${body}` : body);
    setBody("");
    setTitle("");
    Alert.alert("Збережено", "Чернетку збережено локально.");
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Title>Щоденник діяльності</Title>
        <Body>Фіксуйте результати дня миттєво</Body>
      </View>

      <View style={styles.typeSelector}>
        {entryTypes.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => setType(t.id)}
            style={[styles.typeButton, type === t.id && styles.typeButtonActive]}
          >
            <Feather name={t.icon as any} size={18} color={type === t.id ? "white" : colors.muted} />
            <Text style={[styles.typeLabel, type === t.id && styles.typeLabelActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      <Card>
        <TextInput
          onChangeText={setTitle}
          placeholder="Назва події або задачі"
          placeholderTextColor={colors.mutedSoft}
          style={styles.titleInput}
          value={title}
        />
        <TextInput
          multiline
          onChangeText={setBody}
          placeholder="Деталі: що було зроблено, ключові тези..."
          placeholderTextColor={colors.mutedSoft}
          style={styles.note}
          textAlignVertical="top"
          value={body}
        />
        
        <View style={styles.actions}>
          <View style={{ flex: 1 }}>
            <ActionButton 
              label={syncing ? "Синхронізація..." : "Надіслати в хмару"} 
              onPress={handleSync} 
              disabled={syncing}
            />
          </View>
          <Pressable onPress={saveDraft} style={styles.draftButton}>
            <Feather name="save" size={20} color={colors.primary} />
          </Pressable>
        </View>
        {syncing && <ActivityIndicator color={colors.primary} style={{ marginTop: 10 }} />}
      </Card>

      <Card>
        <View style={styles.sectionHeader}>
          <Eyebrow>Локальні чернетки</Eyebrow>
          {drafts.length > 0 && (
            <Text onPress={clearDrafts} style={styles.clear}>
              Очистити
            </Text>
          )}
        </View>
        {drafts.length === 0 ? (
          <Body>Немає несинхронізованих чернеток.</Body>
        ) : (
          drafts.map((draft) => (
            <View key={draft.id} style={styles.draft}>
              <Text style={styles.draftBody}>{draft.body}</Text>
              <Text style={styles.draftMeta}>
                {new Date(draft.createdAt).toLocaleString("uk-UA")}
              </Text>
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 16,
  },
  typeSelector: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.muted,
  },
  typeLabelActive: {
    color: "white",
  },
  titleInput: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
    marginBottom: 12,
  },
  note: {
    minHeight: 120,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    padding: 14,
    color: colors.ink,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  draftButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  clear: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "800",
  },
  draft: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 4,
    paddingTop: 12,
  },
  draftBody: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  draftMeta: {
    color: colors.mutedSoft,
    fontSize: 12,
  },
});
