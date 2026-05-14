import { useMemo, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View, ScrollView, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Screen } from "@/components/screen";
import { ActionButton, Body, Card, Eyebrow, Metric, Title } from "@/components/ui";
import { colors } from "@/constants/theme";
import { mockProjects } from "@/lib/mock-data";
import { useMobileStore } from "@/lib/mobile-store";

function money(value: number | undefined) {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export default function BudgetScreen() {
  const { addPurchaseDraft, clearPurchaseDrafts, purchaseDrafts, projects, activeProjectId } = useMobileStore();
  
  const currentProject = useMemo(() => {
    const found = projects.find(p => String(p.id) === String(activeProjectId));
    return found || mockProjects[0];
  }, [projects, activeProjectId]);

  // Defensive check for budget
  const budget = currentProject?.budget || { planned: 0, committed: 0, spent: 0, remaining: 0 };

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Реактиви");
  const [title, setTitle] = useState("");
  const [vendor, setVendor] = useState("");
  
  const draftTotal = useMemo(
    () => purchaseDrafts.reduce((sum, draft) => sum + draft.amount, 0),
    [purchaseDrafts],
  );

  function savePurchaseDraft() {
    const parsedAmount = Number(amount.replace(",", "."));
    if (title.trim().length < 3) {
      Alert.alert("Немає назви", "Додай коротку назву заявки.");
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Некоректна сума", "Вкажи орієнтовну суму більше нуля.");
      return;
    }

    addPurchaseDraft({
      amount: parsedAmount,
      category,
      title,
      vendor,
    });
    setAmount("");
    setTitle("");
    setVendor("");
    Alert.alert("Успіх", "Чернетку заявки додано.");
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Title>Фінанси проєкту</Title>
        <Body>Бюджет, закупівлі та витрати</Body>
      </View>

      <Card tone="dark">
        <Eyebrow inverse>Доступний залишок</Eyebrow>
        <Title inverse style={styles.largeAmount}>{money(budget.remaining)}</Title>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${Math.min(100, (budget.spent / budget.planned) * 100 || 0)}%` }]} />
        </View>
        <Body inverse>Використано {money(budget.spent)} з {money(budget.planned)} запланованих.</Body>
      </Card>

      <View style={styles.metrics}>
        <Metric label="План" value={money(budget.planned)} icon="target" />
        <Metric label="Витрачено" value={money(budget.spent)} icon="shopping-bag" />
        <Metric label="Резерв" value={money(budget.committed)} icon="lock" />
        <Metric label="Чернетки" value={money(draftTotal)} icon="clock" />
      </View>

      <Card>
        <Eyebrow>Нова заявка на закупівлю</Eyebrow>
        <TextInput
          onChangeText={setTitle}
          placeholder="Що саме купуємо? (напр. Набір піпеток)"
          placeholderTextColor={colors.mutedSoft}
          style={styles.input}
          value={title}
        />
        <View style={styles.formRow}>
          <TextInput
            keyboardType="decimal-pad"
            onChangeText={setAmount}
            placeholder="Сума, грн"
            placeholderTextColor={colors.mutedSoft}
            style={[styles.input, styles.formField]}
            value={amount}
          />
          <TextInput
            onChangeText={setCategory}
            placeholder="Категорія"
            placeholderTextColor={colors.mutedSoft}
            style={[styles.input, styles.formField]}
            value={category}
          />
        </View>
        <TextInput
          onChangeText={setVendor}
          placeholder="Постачальник / Магазин"
          placeholderTextColor={colors.mutedSoft}
          style={styles.input}
          value={vendor}
        />
        <ActionButton 
          label="Зберегти чернетку заявки" 
          onPress={savePurchaseDraft} 
          icon="plus-circle"
        />
      </Card>

      <View style={styles.sectionHeader}>
        <Eyebrow>Мобільні чернетки ({purchaseDrafts.length})</Eyebrow>
        {purchaseDrafts.length > 0 && (
          <Pressable onPress={clearPurchaseDrafts}>
            <Text style={styles.clear}>Очистити все</Text>
          </Pressable>
        )}
      </View>

      {purchaseDrafts.length === 0 ? (
        <Card>
          <Body style={{ textAlign: "center", paddingVertical: 10 }}>
            Поки немає збережених заявок. Створіть нову вище.
          </Body>
        </Card>
      ) : (
        purchaseDrafts.map((draft) => (
          <View key={draft.id} style={styles.draftItem}>
            <View style={styles.draftIcon}>
              <Feather name="shopping-cart" size={16} color={colors.primary} />
            </View>
            <View style={styles.draftContent}>
              <Text style={styles.draftTitle}>{draft.title}</Text>
              <Text style={styles.draftMeta}>
                {draft.category}{draft.vendor ? ` · ${draft.vendor}` : ""}
              </Text>
            </View>
            <Text style={styles.draftAmount}>{money(draft.amount)}</Text>
          </View>
        ))
      )}
      
      <View style={styles.bottomSpacer} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 16,
  },
  largeAmount: {
    fontSize: 32,
    marginVertical: 4,
  },
  progressContainer: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    marginVertical: 10,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 2,
  },
  metrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.ink,
    fontSize: 15,
    marginBottom: 12,
  },
  formRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 0,
  },
  formField: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  clear: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "800",
  },
  draftItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  draftIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  draftContent: {
    flex: 1,
  },
  draftTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
  },
  draftMeta: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  draftAmount: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.ink,
  },
  bottomSpacer: {
    height: 100,
  },
});
