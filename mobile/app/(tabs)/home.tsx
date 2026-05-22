import { useState, useEffect, useMemo } from "react";
import {
  StyleSheet, Text, View, TextInput, Pressable, Modal,
  ScrollView, ActivityIndicator, RefreshControl,
} from "react-native";
import * as Icons from "lucide-react-native";
import { LucideIcon } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { MotiView, AnimatePresence } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Screen } from "@/components/screen";
import {
  GlassCard, GlassEyebrow, GlassSectionHeader, GlassCTA,
} from "@/components/glass";
import { colors, fonts } from "@/constants/theme";
import {
  useMobileStore,
  type SearchResult,
  type LabRole,
  type LabBooking,
  type LabAccessLog,
  type LabExperiment,
  type LabRun,
  type LabCourseSession,
  type LabActivity,
  type Task as ProjectTask,
  type MySubject,
  type PhdPlan,
  type Milestone,
  type WorkspaceItem,
  LAB_ROLE_META,
} from "@/lib/mobile-store";
import { scheduleNotification } from "@/lib/notifications";

// ─── Lab palette ─────────────────────────────────────────────────────────────
const lab = {
  dark:   "#073d35",
  mid:    "#0f5c50",
  accent: "#0f766e",
  soft:   "#d0faf5",
  amber:  "#d97706",
  danger: "#be123c",
  ok:     "#047857",
  bio:    "#7c3aed",
};

const BSL_RULES: Record<string, { color: string; label: string; tip: string }> = {
  "BSL-1": { color: lab.ok,     label: "BSL-1", tip: "Безпечний рівень. Стандартні ЗІЗ." },
  "BSL-2": { color: lab.amber,  label: "BSL-2", tip: "Помірний ризик. Рукавички та окуляри." },
  "BSL-3": { color: lab.danger, label: "BSL-3", tip: "Підвищений ризик. Суворе дотримання протоколів." },
  "BSL-4": { color: "#7c3aed",  label: "BSL-4", tip: "Максимальна безпека. Авторизований персонал." },
};

// ─── HomeScreen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const {
    hydrated, activeProjectId, activeWorkspaceItem, projects,
    unreadCount, search, notifications, fetchNotifications, markNotificationsRead, loading,
    fetchLabInventory, fetchLabEquipment,
    fetchDiaryEntries,
    labBookings, labExperiments, fetchLabExperiments,
    tasks, fetchProjectDetails,
    userRole, setUserRole, user,
    labRuns, labCourseSessions, labActivity, labAccessLogs,
    mySubjects, phdPlan, milestones, workspaceItems,
  } = useMobileStore();

  const [searchQuery, setSearchQuery]     = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching]         = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Item-first: метадані беремо з активного WorkspaceItem, fallback на legacy MobileProject.
  const legacyProject = projects.find(p => String(p.id) === String(activeProjectId));
  const isLabProject  = activeWorkspaceItem?.type === "laboratory"
                     || legacyProject?.projectType === "laboratory";
  // Уніфікований "project" об'єкт для решти home.tsx (зберігаємо forma legacy форми).
  const project = activeWorkspaceItem
    ? {
        id: activeWorkspaceItem.legacyProjectId || activeWorkspaceItem.id,
        title: activeWorkspaceItem.title,
        acronym: activeWorkspaceItem.tags[0] || legacyProject?.acronym || "",
        roomNumber: (activeWorkspaceItem.fields as any)?.roomNumber || legacyProject?.roomNumber,
        safetyLevel: (activeWorkspaceItem.fields as any)?.bslLevel || (legacyProject as any)?.safetyLevel,
        projectType: activeWorkspaceItem.type === "laboratory" ? "laboratory" : "other",
        counters: legacyProject?.counters || { records: 0, tasks: 0, events: 0, warnings: 0 },
        budget: legacyProject?.budget,
        memberCount: activeWorkspaceItem.members.length || legacyProject?.memberCount || 0,
      }
    : legacyProject;

  useEffect(() => {
    fetchNotifications();
    if (isLabProject) {
      fetchLabInventory();
      fetchLabEquipment();
      fetchDiaryEntries();
      fetchLabExperiments();
      fetchProjectDetails();
    }
  }, [activeProjectId]);

  const onRefresh = () => {
    fetchNotifications();
    if (isLabProject) {
      fetchLabInventory();
      fetchLabEquipment();
      fetchDiaryEntries();
      fetchLabExperiments();
      fetchProjectDetails();
    }
  };

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length > 1) {
      setSearching(true);
      const results = await search(q);
      setSearchResults(results);
      setSearching(false);
    } else {
      setSearchResults([]);
    }
  };

  const handleSearchResultPress = (res: SearchResult) => {
    setSearchQuery("");
    setSearchResults([]);
    if (res.type === "task" || res.type === "milestone" || res.type === "stage") {
      router.push("/management");
    } else if (res.type === "record") {
      router.push("/workbench");
    }
  };

  const handleMarkRead = async () => {
    await markNotificationsRead();
    setShowNotifications(false);
    scheduleNotification("Успіх", "Всі сповіщення позначено як прочитані!");
  };

  if (!project) {
    return (
      <Screen>
        <GlassCard padding={24}>
          <View style={{ alignItems: "center", gap: 12 }}>
            <Icons.FolderOpen size={36} color={colors.mutedSoft} strokeWidth={1.6} />
            <Text style={s.emptyTitle}>Проєкт не обрано</Text>
            <Text style={s.emptyText}>Поверніться у Простір, щоб обрати проєкт.</Text>
            <GlassCTA label="До Простору" icon="ArrowLeft" onPress={() => router.replace("/space")} />
          </View>
        </GlassCard>
      </Screen>
    );
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={colors.primary} />}>
      {/* ── Top bar: search + bell ─────────────────────────────────── */}
      <View style={s.topBar}>
        <View style={s.searchContainer}>
          <Icons.Search size={16} color={colors.muted} />
          <TextInput
            style={s.searchInput}
            placeholder="Пошук у проєкті..."
            placeholderTextColor={colors.mutedSoft}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => handleSearch("")} hitSlop={8}>
              <Icons.X size={15} color={colors.muted} />
            </Pressable>
          )}
        </View>
        <Pressable
          style={({ pressed }) => [s.notifButton, pressed && { opacity: 0.8 }]}
          onPress={() => { Haptics.selectionAsync(); setShowNotifications(!showNotifications); }}
        >
          <Icons.Bell size={20} color={showNotifications ? colors.primary : colors.ink} strokeWidth={2.1} />
          {unreadCount > 0 && (
            <View style={s.badge}>
              <Text style={s.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* ── Search overlay ─────────────────────────────────────────── */}
      <AnimatePresence>
        {searchQuery.length > 1 && (
          <MotiView
            from={{ opacity: 0, translateY: -8 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -8 }}
            style={s.searchOverlay}
          >
            <GlassEyebrow>Результати пошуку</GlassEyebrow>
            {searching ? (
              <ActivityIndicator color={colors.primary} style={{ margin: 20 }} />
            ) : searchResults.length === 0 ? (
              <Text style={s.searchEmpty}>Нічого не знайдено.</Text>
            ) : (
              searchResults.map(res => (
                <Pressable key={res.id} style={s.searchItem} onPress={() => handleSearchResultPress(res)}>
                  <View style={[s.resIcon, { backgroundColor: getSearchColor(res.type) + "15" }]}>
                    {getSearchIcon(res.type, 14, getSearchColor(res.type))}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.resTitle} numberOfLines={1}>{res.title}</Text>
                    <Text style={s.resExcerpt} numberOfLines={1}>{res.excerpt}</Text>
                  </View>
                </Pressable>
              ))
            )}
          </MotiView>
        )}
      </AnimatePresence>

      {/* ── Notifications panel ─────────────────────────────────────── */}
      <AnimatePresence>
        {showNotifications && (
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={s.notifPanel}
          >
            <View style={s.notifHeader}>
              <GlassEyebrow>Сповіщення</GlassEyebrow>
              <Pressable onPress={handleMarkRead}>
                <Text style={s.notifAction}>Прочитано</Text>
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              {notifications.length === 0 ? (
                <View style={s.emptyNotifs}>
                  <Icons.Inbox size={36} color={colors.border} strokeWidth={1.5} />
                  <Text style={s.emptyText}>Сповіщень немає.</Text>
                </View>
              ) : (
                notifications.map(n => (
                  <View key={n._id} style={[s.notifItem, !n.read && s.notifUnread]}>
                    <View style={s.notifIcon}>{getNotifIcon(n.type)}</View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.notifTitle} numberOfLines={1}>{n.title}</Text>
                      <Text style={s.notifBody} numberOfLines={2}>{n.body}</Text>
                      <Text style={s.notifTime}>{new Date(n.createdAt).toLocaleString("uk-UA")}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
            <Pressable onPress={() => setShowNotifications(false)} style={s.notifCloseBtn}>
              <Text style={s.notifCloseText}>Закрити</Text>
            </Pressable>
          </MotiView>
        )}
      </AnimatePresence>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      {isLabProject ? (
        <LabHome
          project={project}
          labBookings={labBookings}
          labAccessLogs={labAccessLogs}
          labExperiments={labExperiments}
          tasks={tasks}
          userRole={userRole}
          setUserRole={setUserRole}
          currentUser={user}
          labRuns={labRuns}
          labCourseSessions={labCourseSessions}
          userId={user?._id}
          labActivity={labActivity}
        />
      ) : (
        <GenericHome
          project={project}
          hydrated={hydrated}
          mySubjects={mySubjects}
          tasks={tasks}
          phdPlan={phdPlan}
          milestones={milestones}
          workspaceItems={workspaceItems}
          user={user}
        />
      )}
    </Screen>
  );
}

// ─── Lab Home ────────────────────────────────────────────────────────────────
function LabHome({
  project, labBookings, labAccessLogs, labExperiments, tasks,
  userRole, setUserRole, currentUser, labRuns, labCourseSessions, userId, labActivity,
}: any) {
  const [roleModalOpen, setRoleModalOpen] = useState(false);

  useEffect(() => {
    if (!userRole) setRoleModalOpen(true);
  }, [userRole]);

  const bsl    = project.safetyLevel || "BSL-1";
  const bslCfg = BSL_RULES[bsl] || BSL_RULES["BSL-1"];

  const todayStr = new Date().toISOString().split("T")[0];

  const myBookingsToday: LabBooking[] = useMemo(() => (
    (labBookings || [])
      .filter((b: LabBooking) => b.status === "confirmed" && b.date === todayStr)
      .sort((a: LabBooking, b: LabBooking) => a.startTime.localeCompare(b.startTime))
  ), [labBookings, todayStr]);

  const activeExperiments: LabExperiment[] = useMemo(() => (
    (labExperiments || []).filter((e: LabExperiment) => e.status === "active")
  ), [labExperiments]);

  const myPendingTasks: ProjectTask[] = useMemo(() => (
    (tasks || [])
      .filter((t: ProjectTask) => t.status !== "done")
      .sort((a: ProjectTask, b: ProjectTask) => {
        const order = { urgent: 0, high: 1, medium: 2, low: 3 } as const;
        return (order[a.priority] ?? 4) - (order[b.priority] ?? 4);
      })
      .slice(0, 3)
  ), [tasks]);

  const activeRun: LabRun | undefined = useMemo(() => (
    (labRuns || []).find((r: LabRun) => r.status === "in_progress")
  ), [labRuns]);

  const mySessions: LabCourseSession[] = useMemo(() => {
    if (!userId) return [];
    return (labCourseSessions || []).filter((s: LabCourseSession) => s.studentId === userId);
  }, [labCourseSessions, userId]);

  const activeSession: LabCourseSession | undefined = useMemo(() => (
    mySessions.find(ses => ses.status === "in_progress" || ses.status === "assigned" || ses.status === "returned")
  ), [mySessions]);

  const labPulse = useMemo(() => {
    const todayLogs = (labAccessLogs || [])
      .filter((l: LabAccessLog) => l.timestamp.startsWith(todayStr))
      .slice()
      .sort((a: LabAccessLog, b: LabAccessLog) => a.timestamp.localeCompare(b.timestamp));
    const lastByUser = new Map<string, LabAccessLog>();
    for (const l of todayLogs) {
      const key = l.userId || l.userName || "anon";
      lastByUser.set(key, l);
    }
    const inLab = Array.from(lastByUser.values()).filter(l => l.action === "enter");
    return { inLab, entries: todayLogs.length };
  }, [labAccessLogs, todayStr]);

  return (
    <View style={{ gap: 14 }}>
      {/* ── Hero banner ─────────────────────────────────────────────── */}
      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "spring", damping: 18 }}
      >
        <LinearGradient
          colors={["#040e0c", lab.dark, lab.mid]}
          style={s.labHero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={s.heroCircle1} />
          <View style={s.heroCircle2} />

          <View style={s.labHeroTop}>
            <View style={s.labHeroIconWrap}>
              <Icons.FlaskConical size={20} color={lab.soft} strokeWidth={1.6} />
            </View>
            <View style={[s.bslBadge, { borderColor: bslCfg.color }]}>
              <Icons.Shield size={10} color={bslCfg.color} />
              <Text style={[s.bslText, { color: bslCfg.color }]}>{bslCfg.label}</Text>
            </View>
          </View>

          <Text style={s.labHeroAcro}>{project.acronym}</Text>
          <Text style={s.labHeroName} numberOfLines={2}>{project.title}</Text>

          <View style={s.labHeroMeta}>
            {project.roomNumber && (
              <>
                <Icons.DoorOpen size={11} color={lab.soft + "90"} />
                <Text style={s.labHeroMetaText}>кімн. {project.roomNumber}</Text>
                <View style={s.heroDot} />
              </>
            )}
            <View style={[s.onlineDot, { backgroundColor: lab.ok }]} />
            <Text style={s.labHeroMetaText}>Активна</Text>
          </View>

          <BlurView intensity={20} tint="light" style={s.bslTip}>
            <Icons.Info size={11} color={bslCfg.color} />
            <Text style={s.bslTipText}>{bslCfg.tip}</Text>
          </BlurView>

          <Pressable onPress={() => setRoleModalOpen(true)} style={s.roleChip}>
            {userRole ? (
              <>
                <Text style={s.roleChipEmoji}>{LAB_ROLE_META[userRole as LabRole].emoji}</Text>
                <Text style={s.roleChipText}>{LAB_ROLE_META[userRole as LabRole].label}</Text>
                <Icons.ChevronDown size={11} color="rgba(255,255,255,0.7)" />
              </>
            ) : (
              <>
                <Icons.UserPlus size={11} color="rgba(255,255,255,0.85)" />
                <Text style={s.roleChipText}>Обрати роль</Text>
              </>
            )}
          </Pressable>
        </LinearGradient>
      </MotiView>

      {/* ── My Day ──────────────────────────────────────────────────── */}
      <MyDayCard
        bookings={myBookingsToday}
        experiments={activeExperiments}
        pendingTasks={myPendingTasks}
        userName={currentUser?.firstName || "Колего"}
        activeRun={activeRun}
        activeSession={activeSession}
      />

      {/* ── Lab Pulse ───────────────────────────────────────────────── */}
      <LabPulseCard inLab={labPulse.inLab} entries={labPulse.entries} />

      {/* ── Activity feed ───────────────────────────────────────────── */}
      {labActivity && labActivity.length > 0 && (
        <ActivityMiniFeed items={labActivity.slice(0, 5)} />
      )}

      <RoleSelectModal
        visible={roleModalOpen}
        current={userRole as LabRole | null}
        onSelect={(r) => { setUserRole(r); setRoleModalOpen(false); }}
        onClose={() => setRoleModalOpen(false)}
      />
    </View>
  );
}

// ─── Generic Home ────────────────────────────────────────────────────────────
function GenericHome({
  project, hydrated, mySubjects, tasks, phdPlan, milestones, workspaceItems, user,
}: {
  project: any; hydrated: boolean;
  mySubjects: MySubject[]; tasks: ProjectTask[];
  phdPlan: PhdPlan | null; milestones: Milestone[];
  workspaceItems: WorkspaceItem[]; user: any;
}) {
  const todayStr = new Date().toISOString().split("T")[0];
  const todayLabel = new Date().toLocaleDateString("uk-UA", { weekday: "long", day: "numeric", month: "long" });
  const userName = user?.firstName || "Вітаємо";

  // Upcoming exams (within 45 days, sorted by date)
  const upcomingExams = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + 45);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    return mySubjects
      .filter(s => s.examDate && s.examDate >= todayStr && s.examDate <= cutoffStr)
      .sort((a, b) => (a.examDate || "").localeCompare(b.examDate || ""))
      .slice(0, 4);
  }, [mySubjects, todayStr]);

  // Active tasks sorted by priority
  const activeTasks = useMemo(() => {
    const order: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    return (tasks || [])
      .filter(t => t.status !== "done" && t.status !== "blocked")
      .sort((a, b) => (order[a.priority] ?? 4) - (order[b.priority] ?? 4))
      .slice(0, 3);
  }, [tasks]);

  // Upcoming milestones
  const upcomingMilestones = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + 30);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    return (milestones || [])
      .filter(m => m.status === "upcoming" && m.dueDate >= todayStr && m.dueDate <= cutoffStr)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 2);
  }, [milestones, todayStr]);

  // PhD credit progress
  const phdCredits = useMemo(() => {
    if (!phdPlan) return null;
    const earned = (phdPlan.curriculumCourses || [])
      .filter((c: any) => c.credited)
      .reduce((s: number, c: any) => s + Number(c.credits || 0), 0);
    const target = phdPlan.totalCredits || 60;
    return { earned, target, pct: Math.round((earned / target) * 100) };
  }, [phdPlan]);

  // Stats
  const activeSubjects = mySubjects.filter(s => s.status === "active").length;
  const isEmpty = upcomingExams.length === 0 && activeTasks.length === 0 && upcomingMilestones.length === 0 && !phdCredits;

  return (
    <View style={{ gap: 14 }}>

      {/* ── Hero banner ────────────────────────────────────────────── */}
      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "spring", damping: 18 }}
      >
        <LinearGradient
          colors={["#0b1626", "#102033", "#2e1065"]}
          style={s.genericHero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={s.heroCircle1} />
          <View style={s.heroCircle2} />
          {/* greeting + date */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={s.genericHeroEyebrow}>{project?.acronym || "МІЙ ПРОСТІР"}</Text>
              <Text style={s.genericHeroTitle} numberOfLines={2}>
                Привіт, {userName}!
              </Text>
              <Text style={s.genericHeroSub} numberOfLines={1}>{todayLabel}</Text>
            </View>
            <View style={{ alignItems: "center", gap: 3 }}>
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(167,139,250,0.18)", alignItems: "center", justifyContent: "center" }}>
                <Icons.Sparkles size={18} color="#c4b5fd" strokeWidth={1.8} />
              </View>
            </View>
          </View>
          {/* stats strip */}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
            <View style={s.heroStatPill}>
              <Icons.BookOpen size={10} color="#a5b4fc" strokeWidth={2.2} />
              <Text style={s.heroStatText}>{activeSubjects} активних</Text>
            </View>
            <View style={s.heroStatPill}>
              <Icons.CheckSquare size={10} color="#6ee7b7" strokeWidth={2.2} />
              <Text style={s.heroStatText}>{activeTasks.length} задач</Text>
            </View>
            {upcomingExams.length > 0 && (
              <View style={[s.heroStatPill, { backgroundColor: "rgba(251,191,36,0.18)", borderColor: "rgba(251,191,36,0.3)" }]}>
                <Icons.CalendarCheck size={10} color="#fde68a" strokeWidth={2.2} />
                <Text style={[s.heroStatText, { color: "#fde68a" }]}>{upcomingExams.length} іспитів</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </MotiView>

      {/* ── Мій день: exams + tasks ─────────────────────────────────── */}
      {isEmpty ? (
        <GlassCard padding={18}>
          <View style={{ alignItems: "center", gap: 8, paddingVertical: 6 }}>
            <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: "#7c3aed18", alignItems: "center", justifyContent: "center" }}>
              <Icons.Coffee size={20} color="#7c3aed" strokeWidth={1.6} />
            </View>
            <Text style={s.actionTitle}>Сьогодні вільний день</Text>
            <Text style={[s.actionMeta, { textAlign: "center" }]}>
              Додайте предмети у "Навчання" або задачі у проєкті, щоб бачити їх тут.
            </Text>
          </View>
        </GlassCard>
      ) : (
        <>
          {/* Upcoming exams */}
          {upcomingExams.length > 0 && (
            <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "spring", damping: 20, delay: 60 }}>
              <GlassCard padding={14}>
                <View style={s.cardHeaderRow}>
                  <View style={[s.iconBox, { backgroundColor: "#d97706" + "18" }]}>
                    <Icons.CalendarCheck size={13} color="#d97706" strokeWidth={2.2} />
                  </View>
                  <Text style={s.cardHeaderTitle}>Найближчі іспити</Text>
                  <Pressable onPress={() => router.push("/learning")} hitSlop={10}>
                    <Text style={s.cardHeaderLink}>Всі →</Text>
                  </Pressable>
                </View>
                <View style={{ gap: 6, marginTop: 10 }}>
                  {upcomingExams.map(sub => {
                    const daysLeft = Math.ceil(
                      (new Date(sub.examDate!).getTime() - Date.now()) / 86400000
                    );
                    const urgent = daysLeft <= 7;
                    return (
                      <View key={sub.id} style={[s.examRow, urgent && s.examRowUrgent]}>
                        <View style={{ flex: 1, gap: 1 }}>
                          <Text style={s.examTitle} numberOfLines={1}>{sub.title}</Text>
                          <Text style={s.examMeta}>
                            {sub.examType === "zalik" ? "Залік" : "Іспит"} · {sub.credits} кр.
                          </Text>
                        </View>
                        <View style={[s.daysChip, { backgroundColor: urgent ? "#be123c18" : "#d9770618" }]}>
                          <Text style={[s.daysChipText, { color: urgent ? "#be123c" : "#d97706" }]}>
                            {daysLeft === 0 ? "Сьогодні!" : `за ${daysLeft} дн.`}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </GlassCard>
            </MotiView>
          )}

          {/* Active tasks */}
          {activeTasks.length > 0 && (
            <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "spring", damping: 20, delay: 120 }}>
              <GlassCard padding={14}>
                <View style={s.cardHeaderRow}>
                  <View style={[s.iconBox, { backgroundColor: colors.primary + "18" }]}>
                    <Icons.CheckSquare size={13} color={colors.primary} strokeWidth={2.2} />
                  </View>
                  <Text style={s.cardHeaderTitle}>Активні задачі</Text>
                  <Pressable onPress={() => router.push("/management")} hitSlop={10}>
                    <Text style={s.cardHeaderLink}>Всі →</Text>
                  </Pressable>
                </View>
                <View style={{ gap: 6, marginTop: 10 }}>
                  {activeTasks.map(t => (
                    <View key={t._id} style={s.taskRow}>
                      <View style={[s.taskPriorityDot, { backgroundColor: priorityColor(t.priority) }]} />
                      <View style={{ flex: 1, gap: 1 }}>
                        <Text style={s.examTitle} numberOfLines={1}>{t.title}</Text>
                        <Text style={s.examMeta}>{priorityLabel(t.priority)}{t.dueDate ? ` · до ${t.dueDate}` : ""}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </GlassCard>
            </MotiView>
          )}

          {/* Milestones */}
          {upcomingMilestones.length > 0 && (
            <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "spring", damping: 20, delay: 160 }}>
              <GlassCard padding={14}>
                <View style={s.cardHeaderRow}>
                  <View style={[s.iconBox, { backgroundColor: "#0369a1" + "18" }]}>
                    <Icons.Flag size={13} color="#0369a1" strokeWidth={2.2} />
                  </View>
                  <Text style={s.cardHeaderTitle}>Майбутні віхи</Text>
                </View>
                <View style={{ gap: 6, marginTop: 10 }}>
                  {upcomingMilestones.map(m => {
                    const daysLeft = Math.ceil((new Date(m.dueDate).getTime() - Date.now()) / 86400000);
                    return (
                      <View key={m._id} style={s.taskRow}>
                        <Icons.Flag size={12} color="#0369a1" strokeWidth={2.2} />
                        <View style={{ flex: 1, gap: 1 }}>
                          <Text style={s.examTitle} numberOfLines={1}>{m.title}</Text>
                          <Text style={s.examMeta}>за {daysLeft} дн. · {m.dueDate}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </GlassCard>
            </MotiView>
          )}

          {/* PhD credits */}
          {phdCredits && (
            <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "spring", damping: 20, delay: 200 }}>
              <GlassCard padding={14}>
                <View style={s.cardHeaderRow}>
                  <View style={[s.iconBox, { backgroundColor: "#7c3aed18" }]}>
                    <Icons.GraduationCap size={13} color="#7c3aed" strokeWidth={2.2} />
                  </View>
                  <Text style={s.cardHeaderTitle}>Прогрес PhD</Text>
                  <Text style={s.cardHeaderLink}>{phdCredits.earned}/{phdCredits.target} кр.</Text>
                </View>
                <View style={s.creditBarBg}>
                  <MotiView
                    from={{ width: "0%" as any }}
                    animate={{ width: `${phdCredits.pct}%` as any }}
                    transition={{ type: "spring", damping: 20, delay: 300 }}
                    style={[s.creditBarFill, { backgroundColor: "#7c3aed" }]}
                  />
                </View>
                <Text style={[s.examMeta, { marginTop: 4 }]}>{phdCredits.pct}% виконано навчального плану</Text>
              </GlassCard>
            </MotiView>
          )}
        </>
      )}

      {/* ── Quick navigation tiles ─────────────────────────────────── */}
      <GlassSectionHeader title="ПЕРЕХОДИ" />
      <View style={s.navGrid}>
        <NavTile icon={<Icons.LayoutGrid size={20} color={lab.accent} strokeWidth={1.8} />}   label="Простір"    sub="Навчання, проєкти" color={lab.accent}      onPress={() => router.push("/space")} />
        <NavTile icon={<Icons.GraduationCap size={20} color="#7c3aed" strokeWidth={1.8} />}  label="Навчання"   sub="Курси, іспити"    color="#7c3aed"         onPress={() => router.push("/learning")} />
        <NavTile icon={<Icons.Layers size={20} color={colors.primary} strokeWidth={1.8} />}  label="Проєкт"     sub="Задачі, план"     color={colors.primary}  onPress={() => router.push("/management")} />
        <NavTile icon={<Icons.User size={20} color={colors.muted} strokeWidth={1.8} />}      label="Профіль"    sub="Налаштування"     color={colors.muted}    onPress={() => router.push("/profile")} />
      </View>

    </View>
  );
}

function NavTile({ icon, label, sub, color, onPress }: {
  icon: React.ReactNode; label: string; sub: string; color: string; onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
      style={({ pressed }) => [s.navTile, pressed && { opacity: 0.78, transform: [{ scale: 0.97 }] }]}
    >
      <LinearGradient
        colors={[color + "18", color + "06"]}
        style={s.navIcon}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        {icon}
      </LinearGradient>
      <Text style={s.navLabel} numberOfLines={1}>{label}</Text>
      <Text style={s.navSub} numberOfLines={1}>{sub}</Text>
      <View style={[s.navBar, { backgroundColor: color }]} />
    </Pressable>
  );
}

// ─── My Day Card ─────────────────────────────────────────────────────────────
function MyDayCard({
  bookings, experiments, pendingTasks, userName, activeRun, activeSession,
}: {
  bookings: LabBooking[]; experiments: LabExperiment[]; pendingTasks: ProjectTask[];
  userName: string; activeRun?: LabRun; activeSession?: LabCourseSession;
}) {
  const isEmpty = !activeRun && !activeSession && bookings.length === 0 && experiments.length === 0 && pendingTasks.length === 0;
  const todayLabel = new Date().toLocaleDateString("uk-UA", { weekday: "long", day: "numeric", month: "long" });

  return (
    <GlassCard padding={16} delay={100}>
      <View style={s.myDayHeader}>
        <View>
          <Text style={s.myDayGreet}>Привіт, {userName}!</Text>
          <Text style={s.myDaySub}>Мій день · {todayLabel}</Text>
        </View>
        <View style={s.myDaySunIcon}>
          <Icons.Sun size={18} color={lab.amber} strokeWidth={1.8} />
        </View>
      </View>

      {isEmpty ? (
        <View style={s.myDayEmpty}>
          <Icons.Coffee size={20} color={colors.mutedSoft} strokeWidth={1.6} />
          <Text style={s.myDayEmptyText}>Сьогодні вільний день — час спланувати тиждень.</Text>
        </View>
      ) : (
        <View style={{ gap: 8, marginTop: 10 }}>
          {activeSession && (
            <Pressable
              onPress={() => router.push("/workbench")}
              style={[s.myDayItem, s.activeSessionRow]}
            >
              <View style={[s.activeRunPulse, { backgroundColor: lab.bio }]} />
              <Text style={s.myDayEmoji}>{activeSession.methodologyEmoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.myDayItemTitle} numberOfLines={1}>{activeSession.methodologyTitle}</Text>
                <Text style={s.myDayItemSub} numberOfLines={1}>
                  Лабораторна · {activeSession.stepProgress.filter(p => p.completed).length}/{activeSession.stepProgress.length} кроків
                  {activeSession.status === "returned" ? "  ·  на доопрацюванні" : ""}
                </Text>
              </View>
              <Icons.ChevronRight size={14} color={lab.bio} />
            </Pressable>
          )}
          {activeRun && (
            <Pressable
              onPress={() => router.push("/workbench")}
              style={[s.myDayItem, s.activeRunRow]}
            >
              <View style={s.activeRunPulse} />
              <Text style={s.myDayEmoji}>{activeRun.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.myDayItemTitle} numberOfLines={1}>{activeRun.presetLabel}</Text>
                <Text style={s.myDayItemSub} numberOfLines={1}>
                  Активний аналіз · {activeRun.measurements.length} замірів · {activeRun.inputs.length} inputs
                </Text>
              </View>
              <Icons.ChevronRight size={14} color={lab.accent} />
            </Pressable>
          )}
          {bookings.slice(0, 2).map(b => (
            <Pressable key={b.id} onPress={() => router.push("/workbench")} style={s.myDayItem}>
              <View style={[s.myDayDot, { backgroundColor: lab.accent }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.myDayItemTitle} numberOfLines={1}>{b.equipmentName || "Прилад"}</Text>
                <Text style={s.myDayItemSub} numberOfLines={1}>
                  {b.startTime}–{b.endTime} · {b.purpose || "бронювання"}
                </Text>
              </View>
              <Icons.Calendar size={14} color={lab.accent} />
            </Pressable>
          ))}
          {experiments.slice(0, 2).map(e => {
            const total = e.steps?.length || 0;
            const done = (e.steps || []).filter(st => st.completed).length;
            return (
              <Pressable key={e._id} onPress={() => router.push("/workbench")} style={s.myDayItem}>
                <View style={[s.myDayDot, { backgroundColor: lab.bio }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.myDayItemTitle} numberOfLines={1}>{e.title}</Text>
                  <Text style={s.myDayItemSub} numberOfLines={1}>
                    Активний експеримент · {done}/{total} кроків
                  </Text>
                </View>
                <Icons.FlaskConical size={14} color={lab.bio} />
              </Pressable>
            );
          })}
          {pendingTasks.slice(0, 2).map(t => (
            <Pressable key={t._id} onPress={() => router.push("/management")} style={s.myDayItem}>
              <View style={[s.myDayDot, { backgroundColor: priorityColor(t.priority) }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.myDayItemTitle} numberOfLines={1}>{t.title}</Text>
                <Text style={s.myDayItemSub} numberOfLines={1}>
                  {priorityLabel(t.priority)}{t.dueDate ? ` · до ${new Date(t.dueDate).toLocaleDateString("uk-UA", { day: "numeric", month: "short" })}` : ""}
                </Text>
              </View>
              <Icons.CheckSquare size={14} color={priorityColor(t.priority)} />
            </Pressable>
          ))}
        </View>
      )}
    </GlassCard>
  );
}

// ─── Lab Pulse Card ──────────────────────────────────────────────────────────
function LabPulseCard({ inLab, entries }: { inLab: LabAccessLog[]; entries: number }) {
  return (
    <GlassCard padding={14} delay={200}>
      <View style={s.pulseHeader}>
        <View style={s.pulseHeaderLeft}>
          <View style={s.pulseDotLive} />
          <Text style={s.pulseTitle}>Lab Pulse</Text>
        </View>
        <Text style={s.pulseMeta}>{entries} входів сьогодні</Text>
      </View>
      {inLab.length === 0 ? (
        <Text style={s.pulseEmpty}>Зараз у лабораторії порожньо</Text>
      ) : (
        <View style={{ gap: 8, marginTop: 8 }}>
          {inLab.slice(0, 4).map(l => {
            const bslColor = BSL_RULES[l.zone]?.color || lab.ok;
            const initial = (l.userName || "??").slice(0, 1).toUpperCase();
            return (
              <View key={l.id} style={s.pulseRow}>
                <View style={[s.pulseAvatar, { backgroundColor: bslColor + "22", borderColor: bslColor }]}>
                  <Text style={[s.pulseAvatarText, { color: bslColor }]}>{initial}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.pulseName} numberOfLines={1}>{l.userName || "Без імені"}</Text>
                  <Text style={s.pulseSub} numberOfLines={1}>
                    {l.zone} · з {new Date(l.timestamp).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </View>
                <View style={[s.pulseStatus, { backgroundColor: bslColor }]} />
              </View>
            );
          })}
          {inLab.length > 4 && <Text style={s.pulseMore}>+{inLab.length - 4} ще</Text>}
        </View>
      )}
    </GlassCard>
  );
}

// ─── Activity Mini Feed ──────────────────────────────────────────────────────
function ActivityMiniFeed({ items }: { items: LabActivity[] }) {
  return (
    <GlassCard padding={14} delay={250}>
      <View style={s.miniFeedHeader}>
        <View style={s.miniFeedHeadLeft}>
          <Icons.Activity size={13} color={lab.accent} />
          <Text style={s.miniFeedTitle}>Активність</Text>
        </View>
        <Pressable onPress={() => router.push("/workbench")} hitSlop={8}>
          <Text style={s.miniFeedLink}>Усі →</Text>
        </Pressable>
      </View>
      <View style={{ gap: 8, marginTop: 8 }}>
        {items.map(a => {
          const initial = (a.actorName || "?").slice(0, 1).toUpperCase();
          const time = new Date(a.timestamp);
          const diffMin = Math.round((Date.now() - time.getTime()) / 60000);
          const timeLabel = diffMin < 1 ? "щойно"
            : diffMin < 60 ? `${diffMin} хв тому`
            : diffMin < 1440 ? `${Math.round(diffMin / 60)} год тому`
            : `${Math.round(diffMin / 1440)} д тому`;
          return (
            <View key={a.id} style={s.miniFeedRow}>
              <View style={s.miniAvatar}>
                <Text style={s.miniAvatarText}>{initial}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.miniFeedDesc} numberOfLines={1}>
                  {a.emoji ? `${a.emoji} ` : ""}{a.description || "Дія в лабораторії"}
                </Text>
                <Text style={s.miniFeedMeta} numberOfLines={1}>
                  {a.actorName} · {timeLabel}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </GlassCard>
  );
}

// ─── Role Select Modal ───────────────────────────────────────────────────────
function RoleSelectModal({
  visible, current, onSelect, onClose,
}: {
  visible: boolean; current: LabRole | null;
  onSelect: (r: LabRole) => void; onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.modalBackdrop} onPress={onClose}>
        <Pressable style={s.roleSheet} onPress={() => {}}>
          <View style={s.roleSheetHandle} />
          <Text style={s.roleSheetTitle}>Ваша роль у лабораторії</Text>
          <Text style={s.roleSheetSub}>Інтерфейс підлаштується. Можна змінити пізніше.</Text>
          <View style={{ gap: 10, marginTop: 14 }}>
            {(Object.keys(LAB_ROLE_META) as LabRole[]).map(r => {
              const meta = LAB_ROLE_META[r];
              const selected = current === r;
              return (
                <Pressable
                  key={r}
                  onPress={() => { Haptics.selectionAsync(); onSelect(r); }}
                  style={[s.roleOption, selected && { borderColor: meta.color, backgroundColor: meta.color + "0d" }]}
                >
                  <Text style={s.roleOptionEmoji}>{meta.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.roleOptionLabel}>{meta.label}</Text>
                    <Text style={s.roleOptionDesc}>{meta.description}</Text>
                  </View>
                  {selected && <Icons.CircleCheck size={20} color={meta.color} />}
                </Pressable>
              );
            })}
          </View>
          <Pressable onPress={onClose} style={s.roleCloseBtn}>
            <Text style={s.roleCloseText}>Закрити</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Priority helpers ────────────────────────────────────────────────────────
function priorityColor(p: string) {
  switch (p) {
    case "urgent": return lab.danger;
    case "high":   return lab.amber;
    case "medium": return lab.accent;
    default:       return colors.muted;
  }
}
function priorityLabel(p: string) {
  switch (p) {
    case "urgent": return "Терміново";
    case "high":   return "Високий";
    case "medium": return "Середній";
    case "low":    return "Низький";
    default:       return "Задача";
  }
}

// ─── Search/notification helpers ─────────────────────────────────────────────
function getSearchIcon(type: string, size: number, color: string) {
  const map: Record<string, string> = {
    task: "CheckSquare", milestone: "Flag", stage: "Layers", record: "FileText",
  };
  const Icon = (Icons as any)[map[type] || "Search"] as LucideIcon;
  return <Icon size={size} color={color} strokeWidth={2.2} />;
}
function getNotifIcon(type: string) {
  const map: Record<string, { icon: string; color: string }> = {
    success: { icon: "CheckCircle", color: lab.ok },
    warning: { icon: "AlertTriangle", color: lab.amber },
    danger:  { icon: "AlertOctagon",  color: lab.danger },
    info:    { icon: "Info",          color: lab.accent },
  };
  const conf = map[type] || map.info;
  const Icon = (Icons as any)[conf.icon] as LucideIcon;
  return <Icon size={14} color={conf.color} strokeWidth={2.2} />;
}
function getSearchColor(type: string): string {
  switch (type) {
    case "task":      return lab.accent;
    case "milestone": return lab.amber;
    case "stage":     return "#0369a1";
    case "record":    return lab.bio;
    default:          return colors.muted;
  }
}

const toneToIcon: Record<string, string> = {
  primary: "FileText", teal: "FlaskConical", amber: "AlertTriangle",
  blue: "Database",    success: "CheckCircle", danger: "AlertOctagon",
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // Top bar
  topBar:           { flexDirection: "row", alignItems: "center", gap: 10 },
  searchContainer:  { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.78)", borderWidth: 0.5, borderColor: "rgba(255,255,255,0.7)", shadowColor: "#0b1626", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8 },
  searchInput:      { flex: 1, fontFamily: fonts.regular, fontSize: 14, color: colors.ink, padding: 0 },
  notifButton:      { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.78)", borderWidth: 0.5, borderColor: "rgba(255,255,255,0.7)", shadowColor: "#0b1626", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8 },
  badge:            { position: "absolute", top: 6, right: 6, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, backgroundColor: colors.danger, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "#fff" },
  badgeText:        { color: "#fff", fontSize: 9, fontWeight: "900" },

  searchOverlay:    { padding: 14, borderRadius: 16, gap: 8, backgroundColor: "rgba(255,255,255,0.92)", borderWidth: 0.5, borderColor: "rgba(255,255,255,0.7)", shadowColor: "#0b1626", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 14 },
  searchEmpty:      { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, padding: 10 },
  searchItem:       { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  resIcon:          { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  resTitle:         { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
  resExcerpt:       { fontFamily: fonts.regular, fontSize: 11, color: colors.muted, marginTop: 1 },

  // Notif panel
  notifPanel:       { padding: 14, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.94)", borderWidth: 0.5, borderColor: "rgba(255,255,255,0.7)", shadowColor: "#0b1626", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 16, gap: 10 },
  notifHeader:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  notifAction:      { fontFamily: fonts.bold, fontSize: 11, color: colors.primary },
  notifItem:        { flexDirection: "row", gap: 10, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  notifUnread:      { backgroundColor: colors.primary + "08", marginHorizontal: -8, paddingHorizontal: 8, borderRadius: 10, borderBottomWidth: 0 },
  notifIcon:        { width: 24, height: 24, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(15,23,42,0.05)" },
  notifTitle:       { fontFamily: fonts.bold, fontSize: 12, color: colors.ink },
  notifBody:        { fontFamily: fonts.regular, fontSize: 11, color: colors.muted, marginTop: 1 },
  notifTime:        { fontFamily: fonts.regular, fontSize: 10, color: colors.mutedSoft, marginTop: 2 },
  emptyNotifs:      { alignItems: "center", gap: 8, paddingVertical: 24 },
  notifCloseBtn:    { alignSelf: "stretch", paddingVertical: 10, borderRadius: 10, backgroundColor: "rgba(15,23,42,0.05)", alignItems: "center" },
  notifCloseText:   { fontFamily: fonts.bold, fontSize: 12, color: colors.muted },

  // Generic empty
  emptyTitle:       { fontFamily: fonts.bold, fontSize: 16, color: colors.ink, textAlign: "center" },
  emptyText:        { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, textAlign: "center", lineHeight: 18 },

  // Lab hero
  labHero:          { position: "relative", overflow: "hidden", padding: 20, borderRadius: 22, gap: 6 },
  heroCircle1:      { position: "absolute", top: -40, right: -40, width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(208,250,245,0.06)" },
  heroCircle2:      { position: "absolute", bottom: -60, left: -50, width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(15,118,110,0.12)" },
  labHeroTop:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  labHeroIconWrap:  { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(208,250,245,0.12)", borderWidth: 0.5, borderColor: "rgba(208,250,245,0.2)" },
  bslBadge:         { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1, backgroundColor: "rgba(255,255,255,0.06)" },
  bslText:          { fontSize: 10, fontWeight: "900", letterSpacing: 0.4 },
  labHeroAcro:      { fontFamily: fonts.titleBlack, fontSize: 11, color: lab.soft + "80", letterSpacing: 2, textTransform: "uppercase" },
  labHeroName:      { fontFamily: fonts.title, color: "#fff", fontSize: 22, letterSpacing: -0.5, lineHeight: 28 },
  labHeroMeta:      { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  labHeroMetaText:  { fontFamily: fonts.regular, color: lab.soft + "90", fontSize: 11 },
  heroDot:          { width: 3, height: 3, borderRadius: 1.5, backgroundColor: lab.soft + "40" },
  onlineDot:        { width: 6, height: 6, borderRadius: 3 },
  bslTip:           { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 11, marginTop: 12, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.08)" },
  bslTipText:       { color: "#fff", fontFamily: fonts.regular, fontSize: 11, flex: 1 },
  roleChip:         { position: "absolute", top: 18, right: 18, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 0.5, borderColor: "rgba(255,255,255,0.18)" },
  roleChipEmoji:    { fontSize: 12 },
  roleChipText:     { color: "#fff", fontFamily: fonts.bold, fontSize: 10, letterSpacing: -0.1 },

  // Generic hero
  genericHero:       { position: "relative", overflow: "hidden", padding: 22, borderRadius: 22, gap: 4 },
  genericHeroEyebrow:{ fontFamily: fonts.titleBlack, fontSize: 11, color: "rgba(196,181,253,0.7)", letterSpacing: 2, textTransform: "uppercase" },
  genericHeroTitle:  { fontFamily: fonts.title, color: "#fff", fontSize: 24, letterSpacing: -0.5, lineHeight: 30 },
  genericHeroSub:    { fontFamily: fonts.regular, color: "rgba(255,255,255,0.55)", fontSize: 12 },
  heroStatPill:      { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: "rgba(165,180,252,0.15)", borderWidth: 0.5, borderColor: "rgba(165,180,252,0.25)" },
  heroStatText:      { fontFamily: fonts.bold, fontSize: 10, color: "#a5b4fc", letterSpacing: 0.1 },

  // Generic "Мій день" cards
  cardHeaderRow:     { flexDirection: "row", alignItems: "center", gap: 8 },
  cardHeaderTitle:   { fontFamily: fonts.bold, fontSize: 13, color: colors.ink, letterSpacing: -0.2, flex: 1 },
  cardHeaderLink:    { fontFamily: fonts.bold, fontSize: 11, color: colors.primary },
  examRow:           { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 12, backgroundColor: "rgba(15,23,42,0.03)" },
  examRowUrgent:     { backgroundColor: "#be123c08", borderWidth: 1, borderColor: "#be123c20" },
  examTitle:         { fontFamily: fonts.bold, fontSize: 12.5, color: colors.ink, letterSpacing: -0.1 },
  examMeta:          { fontFamily: fonts.regular, fontSize: 10.5, color: colors.muted, marginTop: 1 },
  daysChip:          { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  daysChipText:      { fontFamily: fonts.bold, fontSize: 10.5 },
  taskRow:           { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 12, backgroundColor: "rgba(15,23,42,0.03)" },
  taskPriorityDot:   { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  creditBarBg:       { height: 7, borderRadius: 4, backgroundColor: "rgba(15,23,42,0.06)", overflow: "hidden", marginTop: 10 },
  creditBarFill:     { height: "100%", borderRadius: 4 },

  // Nav grid (generic)
  navGrid:          { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  navTile:          { flexBasis: "47%", flexGrow: 1, padding: 14, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.78)", borderWidth: 0.5, borderColor: "rgba(255,255,255,0.7)", gap: 6, position: "relative", overflow: "hidden", shadowColor: "#0b1626", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
  navIcon:          { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  navLabel:         { fontFamily: fonts.bold, fontSize: 13, color: colors.ink, letterSpacing: -0.2 },
  navSub:           { fontFamily: fonts.regular, fontSize: 11, color: colors.muted },
  navBar:           { position: "absolute", left: 0, top: 0, bottom: 0, width: 3, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },

  // Recent activity rows
  actionRow:        { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  iconBox:          { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  actionTitle:      { fontFamily: fonts.bold, fontSize: 12, color: colors.ink },
  actionMeta:       { fontFamily: fonts.regular, fontSize: 11, color: colors.muted, marginTop: 1 },

  // My Day
  myDayHeader:      { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  myDayGreet:       { fontFamily: fonts.title, fontSize: 18, color: colors.ink, letterSpacing: -0.4 },
  myDaySub:         { fontFamily: fonts.regular, fontSize: 11, color: colors.muted, marginTop: 2, textTransform: "capitalize" },
  myDaySunIcon:     { width: 32, height: 32, borderRadius: 10, backgroundColor: lab.amber + "18", alignItems: "center", justifyContent: "center" },
  myDayEmpty:       { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, marginTop: 8, borderRadius: 12, backgroundColor: "rgba(15,23,42,0.04)" },
  myDayEmptyText:   { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, flex: 1 },
  myDayItem:        { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 12, backgroundColor: "rgba(15,23,42,0.03)" },
  activeRunRow:     { backgroundColor: lab.accent + "10", borderWidth: 1, borderColor: lab.accent + "30" },
  activeSessionRow: { backgroundColor: lab.bio + "10", borderWidth: 1, borderColor: lab.bio + "30" },
  activeRunPulse:   { width: 6, height: 6, borderRadius: 3, backgroundColor: lab.accent },
  myDayEmoji:       { fontSize: 16 },
  myDayDot:         { width: 6, height: 6, borderRadius: 3 },
  myDayItemTitle:   { fontFamily: fonts.bold, fontSize: 12.5, color: colors.ink, letterSpacing: -0.1 },
  myDayItemSub:     { fontFamily: fonts.regular, fontSize: 10.5, color: colors.muted, marginTop: 1 },

  // Lab Pulse
  pulseHeader:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pulseHeaderLeft:  { flexDirection: "row", alignItems: "center", gap: 6 },
  pulseDotLive:     { width: 8, height: 8, borderRadius: 4, backgroundColor: lab.ok },
  pulseTitle:       { fontFamily: fonts.bold, fontSize: 13, color: colors.ink, letterSpacing: -0.2 },
  pulseMeta:        { fontFamily: fonts.regular, fontSize: 10, color: colors.muted },
  pulseEmpty:       { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, paddingVertical: 8 },
  pulseRow:         { flexDirection: "row", alignItems: "center", gap: 10 },
  pulseAvatar:      { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  pulseAvatarText:  { fontFamily: fonts.bold, fontSize: 12 },
  pulseName:        { fontFamily: fonts.bold, fontSize: 12, color: colors.ink },
  pulseSub:         { fontFamily: fonts.regular, fontSize: 10, color: colors.muted, marginTop: 1 },
  pulseStatus:      { width: 6, height: 6, borderRadius: 3 },
  pulseMore:        { fontFamily: fonts.regular, fontSize: 10, color: colors.muted, textAlign: "center", marginTop: 2 },

  // Mini feed
  miniFeedHeader:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  miniFeedHeadLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  miniFeedTitle:    { fontFamily: fonts.bold, fontSize: 12, color: colors.ink, letterSpacing: -0.1 },
  miniFeedLink:     { fontFamily: fonts.bold, fontSize: 11, color: lab.accent },
  miniFeedRow:      { flexDirection: "row", alignItems: "center", gap: 10 },
  miniAvatar:       { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: lab.accent + "18" },
  miniAvatarText:   { fontFamily: fonts.bold, fontSize: 11, color: lab.accent },
  miniFeedDesc:     { fontFamily: fonts.semiBold, fontSize: 11.5, color: colors.ink },
  miniFeedMeta:     { fontFamily: fonts.regular, fontSize: 10, color: colors.muted, marginTop: 1 },

  // Role modal
  modalBackdrop:    { flex: 1, backgroundColor: "rgba(15,23,42,0.55)", justifyContent: "flex-end" },
  roleSheet:        { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  roleSheetHandle:  { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: "#cbd5e1", marginBottom: 14 },
  roleSheetTitle:   { fontFamily: fonts.title, fontSize: 18, color: colors.ink, letterSpacing: -0.4 },
  roleSheetSub:     { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, marginTop: 4 },
  roleOption:       { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 13, borderWidth: 1.5, borderColor: "transparent", backgroundColor: "rgba(15,23,42,0.03)" },
  roleOptionEmoji:  { fontSize: 22 },
  roleOptionLabel:  { fontFamily: fonts.bold, fontSize: 13, color: colors.ink, letterSpacing: -0.2 },
  roleOptionDesc:   { fontFamily: fonts.regular, fontSize: 11, color: colors.muted, marginTop: 1 },
  roleCloseBtn:     { marginTop: 16, paddingVertical: 12, borderRadius: 12, alignItems: "center", backgroundColor: "rgba(15,23,42,0.05)" },
  roleCloseText:    { fontFamily: fonts.bold, fontSize: 13, color: colors.muted },
});
