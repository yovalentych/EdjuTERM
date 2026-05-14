import { useEffect, useState } from "react";
import { StyleSheet, View, Text, ActivityIndicator, Pressable, TextInput, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Screen } from "@/components/screen";
import { Title, Body, Card, Eyebrow } from "@/components/ui";
import { colors } from "@/constants/theme";
import { useMobileStore } from "@/lib/mobile-store";

export default function LearningScreen() {
  const { sessions, assignments, fetchLearningData, loading, activeProjectId } = useMobileStore();
  const [tab, setTab] = useState<"schedule" | "phd">("schedule");
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [sessionNote, setSessionNote] = useState("");

  useEffect(() => {
    fetchLearningData();
  }, [activeProjectId]);

  return (
    <Screen>
      <View style={styles.header}>
        <Title>Навчання та PhD</Title>
        <Body>Ваш розклад, журнал та індивідуальний план</Body>
      </View>

      <View style={styles.tabs}>
        <Pressable 
          onPress={() => setTab("schedule")}
          style={[styles.tab, tab === "schedule" && styles.tabActive]}
        >
          <Text style={[styles.tabText, tab === "schedule" && styles.tabTextActive]}>Розклад</Text>
        </Pressable>
        <Pressable 
          onPress={() => setTab("phd")}
          style={[styles.tab, tab === "phd" && styles.tabActive]}
        >
          <Text style={[styles.tabText, tab === "phd" && styles.tabTextActive]}>PhD План</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Завантаження даних...</Text>
        </View>
      ) : tab === "schedule" ? (
        <>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Eyebrow>Журнал занять</Eyebrow>
            </View>
            
            {sessions.length === 0 ? (
              <Card>
                <Body>На сьогодні занять не заплановано.</Body>
              </Card>
            ) : (
              sessions.map((session) => (
                <Card key={session.id} style={styles.sessionCard}>
                  <Pressable onPress={() => {
                    setExpandedSession(expandedSession === session.id ? null : session.id);
                    setSessionNote(session.notes || "");
                  }}>
                    <View style={styles.sessionTop}>
                      <View style={styles.sessionType}>
                        <View style={[styles.typeIndicator, { backgroundColor: typeColors[session.type] || colors.primary }]} />
                        <Text style={styles.typeText}>{session.type}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusColors[session.status] + "20" }]}>
                          <Text style={[styles.statusText, { color: statusColors[session.status] }]}>
                            {statusLabels[session.status]}
                          </Text>
                        </View>
                      </View>
                      <Feather name={expandedSession === session.id ? "chevron-up" : "chevron-down"} size={20} color={colors.muted} />
                    </View>
                    
                    <Title style={styles.sessionTitle}>{session.title}</Title>
                    
                    <View style={styles.sessionInfo}>
                      <View style={styles.infoItem}>
                        <Feather name="clock" size={14} color={colors.muted} />
                        <Text style={styles.infoText}>{session.time}</Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Feather name="map-pin" size={14} color={colors.muted} />
                        <Text style={styles.infoText}>{session.location}</Text>
                      </View>
                    </View>
                  </Pressable>

                  {expandedSession === session.id && (
                    <View style={styles.sessionDetails}>
                      <View style={styles.divider} />
                      <Text style={styles.detailLabel}>Тези заняття / Нотатки:</Text>
                      <TextInput
                        multiline
                        style={styles.noteInput}
                        placeholder="Додайте короткі тези або висновки..."
                        value={sessionNote}
                        onChangeText={setSessionNote}
                        textAlignVertical="top"
                      />
                      <View style={styles.detailActions}>
                        <Pressable 
                          style={[styles.miniButton, { backgroundColor: colors.success + "15" }]}
                          onPress={() => Alert.alert("Збережено", "Вашу присутність відмічено, нотатки збережено.")}
                        >
                          <Feather name="check" size={14} color={colors.success} />
                          <Text style={[styles.miniButtonText, { color: colors.success }]}>Присутній</Text>
                        </Pressable>
                        <Pressable 
                          style={[styles.miniButton, { backgroundColor: colors.danger + "15" }]}
                          onPress={() => Alert.alert("Відмічено", "Вас відмічено як відсутнього.")}
                        >
                          <Feather name="x" size={14} color={colors.danger} />
                          <Text style={[styles.miniButtonText, { color: colors.danger }]}>Відсутній</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </Card>
              ))
            )}
          </View>

          <View style={styles.section}>
            <Eyebrow style={styles.sectionTitle}>Найближчі дедлайни</Eyebrow>
            {assignments.length === 0 ? (
              <Card>
                <Body>У вас немає активних дедлайнів.</Body>
              </Card>
            ) : (
              assignments.map((assignment) => (
                <View key={assignment.id} style={styles.assignmentRow}>
                  <View style={[styles.priorityDot, { backgroundColor: priorityColors[assignment.priority] || colors.success }]} />
                  <View style={styles.assignmentContent}>
                    <Text style={styles.assignmentTitle}>{assignment.title}</Text>
                    <Text style={styles.assignmentMeta}>
                      {assignment.course} · <Text style={styles.dateText}>до {assignment.dueDate}</Text>
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.border} />
                </View>
              ))
            )}
          </View>
        </>
      ) : (
        <PhdPlanView />
      )}

      <View style={styles.bottomSpacer} />
    </Screen>
  );
}

function PhdPlanView() {
  return (
    <View style={styles.phdContainer}>
      <Card tone="dark">
        <Eyebrow inverse>Прогрес дисертації</Eyebrow>
        <Title inverse>65%</Title>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: "65%" }]} />
        </View>
        <Body inverse>3-й рік навчання, стадія: експериментальна частина.</Body>
      </Card>

      <View style={styles.section}>
        <Eyebrow>Ключові етапи (Milestones)</Eyebrow>
        <MilestoneItem title="Затвердження теми" status="done" date="15.10.2023" />
        <MilestoneItem title="Складання канд. іспитів" status="done" date="20.05.2024" />
        <MilestoneItem title="Публікація статті (Scopus)" status="doing" date="В процесі" />
        <MilestoneItem title="Попередня експертиза" status="todo" date="06.2026" />
      </View>

      <View style={styles.section}>
        <Eyebrow>Освітня складова (ECTS)</Eyebrow>
        <Card>
          <View style={styles.ectsRow}>
            <View style={styles.ectsItem}>
              <Text style={styles.ectsValue}>45 / 60</Text>
              <Text style={styles.ectsLabel}>Кредитів</Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.ectsItem}>
              <Text style={styles.ectsValue}>92.4</Text>
              <Text style={styles.ectsLabel}>Сер. бал</Text>
            </View>
          </View>
        </Card>
      </View>
    </View>
  );
}

function MilestoneItem({ title, status, date }: { title: string, status: "done" | "doing" | "todo", date: string }) {
  const icon = status === "done" ? "check-circle" : status === "doing" ? "clock" : "circle";
  const color = status === "done" ? colors.success : status === "doing" ? colors.primary : colors.muted;
  
  return (
    <View style={styles.milestone}>
      <Feather name={icon} size={20} color={color} />
      <View style={styles.milestoneContent}>
        <Text style={styles.milestoneTitle}>{title}</Text>
        <Text style={styles.milestoneDate}>{date}</Text>
      </View>
    </View>
  );
}

const typeColors = {
  lecture: colors.blue,
  seminar: colors.primary,
  workshop: colors.amber,
};

const statusColors = {
  scheduled: colors.muted,
  completed: colors.success,
  cancelled: colors.danger,
  absent: colors.danger,
};

const statusLabels = {
  scheduled: "Заплановано",
  completed: "Завершено",
  cancelled: "Скасовано",
  absent: "Відсутній",
};

const priorityColors = {
  high: colors.danger,
  medium: colors.amber,
  low: colors.success,
};

const styles = StyleSheet.create({
  center: {
    paddingVertical: 40,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 14,
  },
  header: {
    marginBottom: 16,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.muted,
  },
  tabTextActive: {
    color: colors.primary,
  },
  section: {
    gap: 12,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  sessionCard: {
    padding: 14,
  },
  sessionTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  sessionType: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  typeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  sessionTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  sessionInfo: {
    flexDirection: "row",
    gap: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "600",
  },
  sessionDetails: {
    marginTop: 12,
    gap: 10,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.ink,
  },
  noteInput: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 10,
    minHeight: 80,
    fontSize: 14,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailActions: {
    flexDirection: "row",
    gap: 10,
  },
  miniButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  miniButtonText: {
    fontSize: 12,
    fontWeight: "800",
  },
  assignmentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  assignmentContent: {
    flex: 1,
    gap: 2,
  },
  assignmentTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
  },
  assignmentMeta: {
    fontSize: 13,
    color: colors.muted,
  },
  dateText: {
    fontWeight: "700",
    color: colors.ink,
  },
  phdContainer: {
    gap: 20,
  },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 3,
    marginVertical: 12,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "white",
    borderRadius: 3,
  },
  milestone: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
  },
  milestoneDate: {
    fontSize: 12,
    color: colors.muted,
  },
  ectsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ectsItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  ectsValue: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.primary,
  },
  ectsLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.muted,
    textTransform: "uppercase",
  },
  dividerVertical: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  bottomSpacer: {
    height: 100,
  },
});
