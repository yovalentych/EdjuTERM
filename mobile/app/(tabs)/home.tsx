import { StyleSheet, Text, View } from "react-native";
import { icons, LucideIcon } from "lucide-react-native";
import { router } from "expo-router";
import { Screen } from "@/components/screen";
import { Body, Card, Eyebrow, Metric, Title, ActionButton } from "@/components/ui";
import { colors } from "@/constants/theme";
import { recentActivity } from "@/lib/mock-data";
import { useMobileStore } from "@/lib/mobile-store";

export default function HomeScreen() {
  const { drafts, hydrated, purchaseDrafts, activeProjectId, projects } = useMobileStore();
  
  const project = projects.find(p => String(p.id) === String(activeProjectId));

  if (!project) {
    return (
      <Screen>
        <Card>
          <Title>Проєкт не обрано</Title>
          <Body>Будь ласка, оберіть проєкт для роботи.</Body>
          <ActionButton label="Обрати проєкт" onPress={() => router.replace("/projects")} />
        </Card>
      </Screen>
    );
  }

  const budget = project?.budget || { planned: 0, committed: 0, spent: 0, remaining: 0 };
  const budgetUsed = budget.planned > 0
    ? Math.round(((budget.spent + budget.committed) / budget.planned) * 100)
    : 0;

  return (
    <Screen>
      <Card tone="dark" delay={100}>
        <Eyebrow inverse>{project.acronym}</Eyebrow>
        <Title inverse>{project.title}</Title>
        <Body inverse>Оперативний мобільний центр: що треба зробити сьогодні.</Body>
      </Card>

      <View style={styles.metrics}>
        <Metric label="Записи" value={String(project.counters.records)} icon="Database" />
        <Metric label="Задачі" value={String(project.counters.tasks)} icon="CheckSquare" />
        <Metric label="Події" value={String(project.counters.events)} icon="Calendar" />
        <Metric label="Бюджет" value={`${budgetUsed}%`} icon="PieChart" />
        <Metric label="Нотатки" value={hydrated ? String(drafts.length) : "..."} icon="PenTool" />
        <Metric label="Заявки" value={hydrated ? String(purchaseDrafts.length) : "..."} icon="ShoppingCart" />
      </View>

      <Card delay={300}>
        <Eyebrow>Останні оновлення</Eyebrow>
        {recentActivity.map((item) => {
          const Icon = icons[toneToIcon[item.tone] as keyof typeof icons] as LucideIcon;
          return (
            <View key={item.id} style={styles.actionRow}>
              <View style={[styles.iconBox, { backgroundColor: colors[item.tone] + "15" }]}>
                {Icon && <Icon size={16} color={colors[item.tone]} strokeWidth={2.5} />}
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>{item.title}</Text>
                <Text style={styles.actionMeta}>{item.meta}</Text>
              </View>
            </View>
          );
        })}
      </Card>
      
      <View style={styles.bottomSpacer} />
    </Screen>
  );
}

const toneToIcon: Record<string, string> = {
  blue: "FileText",
  teal: "Zap",
  amber: "AlertCircle",
};

const styles = StyleSheet.create({
  metrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginVertical: 10,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 14,
    alignItems: "center",
  },
  iconBox: {
    height: 38,
    width: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800",
  },
  actionMeta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 80,
  },
});
