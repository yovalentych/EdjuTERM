import { useState, useEffect } from "react";
import { StyleSheet, View, Pressable, ScrollView, Switch, Text, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Screen } from "@/components/screen";
import { Title, Body, Card, Eyebrow } from "@/components/ui";
import { colors } from "@/constants/theme";
import { useMobileStore } from "@/lib/mobile-store";

export default function ProjectSelectionScreen() {
  const { projects, setActiveProject, fetchProjects, loading } = useMobileStore();
  const [rememberChoice, setRememberChoice] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSelect = (projectId: string) => {
    setActiveProject(projectId, rememberChoice);
    router.replace("/home");
  };

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <Title>Ваші проєкти</Title>
        <Body>Оберіть робочий простір для поточної сесії</Body>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Завантаження проєктів...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {projects.length === 0 ? (
            <Card>
              <Body>У вас ще немає активних проєктів. Створіть проєкт у вебверсії застосунку.</Body>
            </Card>
          ) : (
            projects.map((project) => (
              <Pressable key={project.id} onPress={() => handleSelect(project.id)}>
                <Card>
                  <View style={styles.projectHeader}>
                    <Eyebrow>{project.acronym}</Eyebrow>
                    <View style={[styles.statusBadge, { backgroundColor: colors.primarySoft }]}>
                      <Text style={styles.statusText}>{project.status}</Text>
                    </View>
                  </View>
                  <Title style={styles.projectTitle}>{project.title}</Title>
                  <View style={styles.projectFooter}>
                    <View style={styles.stat}>
                      <Feather name="database" size={14} color={colors.muted} />
                      <Text style={styles.statText}>{project.counters.records} записів</Text>
                    </View>
                    <View style={styles.stat}>
                      <Feather name="check-square" size={14} color={colors.muted} />
                      <Text style={styles.statText}>{project.counters.tasks} задач</Text>
                    </View>
                  </View>
                </Card>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <View style={styles.rememberRow}>
          <Text style={styles.rememberText}>Запам'ятати мій вибір</Text>
          <Switch
            value={rememberChoice}
            onValueChange={setRememberChoice}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="white"
          />
        </View>
        <Body style={styles.footerNote}>
          Ви зможете змінити проєкт пізніше в налаштуваннях профілю.
        </Body>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 15,
  },
  header: {
    marginBottom: 24,
    paddingTop: 20,
  },
  scrollContent: {
    gap: 16,
    paddingBottom: 20,
  },
  projectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  projectTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  projectFooter: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.primary,
    textTransform: "uppercase",
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rememberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  rememberText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.ink,
  },
  footerNote: {
    fontSize: 13,
    textAlign: "center",
  },
});
