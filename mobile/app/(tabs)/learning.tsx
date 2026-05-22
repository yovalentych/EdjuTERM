import { useEffect, useState, useMemo } from "react";
import {
  StyleSheet, View, Text, Pressable, TextInput, Alert,
  ScrollView, RefreshControl, Modal, KeyboardAvoidingView, Platform,
} from "react-native";
import * as Icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { MotiView, AnimatePresence } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import { Screen } from "@/components/screen";
import { GlassCard, GlassTabs } from "@/components/glass";
import { colors, fonts } from "@/constants/theme";
import { useMobileStore, LEARNING_TYPES, type MySubject, type PhdPlan, type LearningSession, type LearningCourse, type LearningAssessment, type AssessmentStatus, type WorkspaceItem } from "@/lib/mobile-store";
import { PhdGanttChart } from "@/components/phd-gantt-chart";

// ─── helpers ─────────────────────────────────────────────────────────────────
function scoreToGrade(score?: number): string {
  if (score == null) return "—";
  if (score >= 90) return "A";
  if (score >= 82) return "B";
  if (score >= 74) return "C";
  if (score >= 64) return "D";
  if (score >= 60) return "E";
  if (score >= 35) return "FX";
  return "F";
}
function gradeToNational(g: string): string {
  if (g === "A") return "Відмінно";
  if (g === "B" || g === "C") return "Добре";
  if (g === "D" || g === "E") return "Задовільно";
  if (g === "FX" || g === "F") return "Незадовільно";
  return "";
}
function gradeColor(g: string): string {
  if (g === "A") return "#059669";
  if (["B", "C"].includes(g)) return "#0369a1";
  if (["D", "E"].includes(g)) return "#d97706";
  if (["FX", "F"].includes(g)) return "#be123c";
  return colors.muted;
}
function calcGpa(subjects: MySubject[]): string {
  const graded = subjects.filter(s => s.finalScore != null && s.status === "completed");
  if (graded.length === 0) return "—";
  const total = graded.reduce((acc, s) => acc + (s.finalScore! / 100) * 4 + (s.credits * (s.finalScore! / 100)), 0);
  const credits = graded.reduce((acc, s) => acc + s.credits, 0);
  return (credits > 0 ? (graded.reduce((a, s) => a + s.finalScore!, 0) / graded.length).toFixed(1) : "—");
}

const STATUS_COLORS: Record<MySubject["status"], string> = {
  planned:   "#94a3b8",
  active:    "#0f766e",
  completed: "#059669",
};
const STATUS_LABELS: Record<MySubject["status"], string> = {
  planned:   "Заплановано",
  active:    "Активний",
  completed: "Завершено",
};

type Tab = "program" | "schedule" | "assessments" | "deadlines" | "phd";

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function LearningScreen() {
  const {
    mySubjects, addMySubject, updateMySubject, deleteMySubject,
    phdPlan, fetchPhdPlan, fetchLearningData, updateAssessmentScore,
    courses, sessions, assessments, workspaceItems, loading,
  } = useMobileStore();

  const [tab, setTab] = useState<Tab>("program");
  const [modalOpen, setModalOpen] = useState(false);
  const [editSubject, setEditSubject] = useState<MySubject | null>(null);

  useEffect(() => {
    fetchPhdPlan();
    fetchLearningData();
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const totalCredits   = mySubjects.reduce((a, s) => a + s.credits, 0);
  const earnedCredits  = mySubjects.filter(s => s.status === "completed").reduce((a, s) => a + s.credits, 0);
  const avgScore       = calcGpa(mySubjects);
  const upcomingExams  = mySubjects.filter(s => s.examDate && s.examDate >= today).length;
  const upcomingSessionsCount = sessions.filter(s => s.date >= today && s.status !== "cancelled").length;

  function openAdd() { setEditSubject(null); setModalOpen(true); }
  function openEdit(s: MySubject) { setEditSubject(s); setModalOpen(true); }

  return (
    <Screen
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => { fetchPhdPlan(); fetchLearningData(); }} tintColor={colors.primary} />}
    >
      {/* ── Header ── */}
      <GlassCard accent={colors.primary}>
        <View style={s.headerRow}>
          <View style={[s.headerIcon, { backgroundColor: colors.primary + "18" }]}>
            <Icons.BookOpen size={20} color={colors.primary} strokeWidth={1.8} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Навчання</Text>
            <Text style={s.headerSub}>{mySubjects.length} предметів · {totalCredits} ECTS</Text>
          </View>
          <Pressable onPress={openAdd} style={s.addBtn}>
            <Icons.Plus size={16} color="#fff" strokeWidth={2.5} />
          </Pressable>
        </View>

        <View style={s.statsRow}>
          <StatChip label="Зараховано" value={`${earnedCredits} кр.`} color="#059669" />
          <StatChip label="Середній бал" value={avgScore} color="#0369a1" />
          <StatChip label="Іспитів" value={String(upcomingExams)} color="#d97706" />
        </View>
      </GlassCard>

      <GlassTabs<Tab>
        tabs={[
          { id: "program",     label: "Програма",    badge: mySubjects.length },
          { id: "schedule",    label: "Розклад",     badge: upcomingSessionsCount + upcomingExams || undefined },
          { id: "assessments", label: "Оцінювання",  badge: assessments.length || undefined },
          { id: "deadlines",   label: "Дедлайни",    badge: upcomingExams },
          { id: "phd",         label: "PhD" },
        ]}
        active={tab}
        onChange={setTab}
        color={colors.primary}
      />

      <AnimatePresence exitBeforeEnter>
        {tab === "program" && (
          <MotiView key="program" from={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ProgramView
              subjects={mySubjects}
              completedItems={workspaceItems.filter(
                (it) => (LEARNING_TYPES as string[]).includes(it.type) && it.status === "completed" && (it.fields as any)?.completion,
              )}
              onAdd={openAdd}
              onEdit={openEdit}
              onDelete={deleteMySubject}
              onUpdateScore={(id, score) => updateMySubject(id, { finalScore: score, status: "completed" })}
            />
          </MotiView>
        )}
        {tab === "schedule" && (
          <MotiView key="schedule" from={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ScheduleView subjects={mySubjects} sessions={sessions} courses={courses} />
          </MotiView>
        )}
        {tab === "assessments" && (
          <MotiView key="assessments" from={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AssessmentsView assessments={assessments} courses={courses} onSaveScore={updateAssessmentScore} />
          </MotiView>
        )}
        {tab === "deadlines" && (
          <MotiView key="deadlines" from={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <DeadlinesView subjects={mySubjects} />
          </MotiView>
        )}
        {tab === "phd" && (
          <MotiView key="phd" from={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PhdPlanView plan={phdPlan} />
          </MotiView>
        )}
      </AnimatePresence>

      <View style={{ height: 100 }} />

      <SubjectModal
        visible={modalOpen}
        subject={editSubject}
        onClose={() => setModalOpen(false)}
        onSave={(data) => {
          if (editSubject) updateMySubject(editSubject.id, data);
          else addMySubject(data);
          setModalOpen(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
      />
    </Screen>
  );
}

// ─── Program view ─────────────────────────────────────────────────────────────
function ProgramView({ subjects, completedItems, onAdd, onEdit, onDelete, onUpdateScore }: {
  subjects: MySubject[];
  completedItems: WorkspaceItem[];
  onAdd: () => void;
  onEdit: (s: MySubject) => void;
  onDelete: (id: string) => void;
  onUpdateScore: (id: string, score: number) => void;
}) {
  const groups = useMemo(() => {
    const map = new Map<string, MySubject[]>();
    subjects.forEach(s => {
      const key = `${s.year}-${s.semester}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, list]) => {
        const [year, sem] = key.split("-");
        return { year: Number(year), semester: Number(sem), subjects: list };
      });
  }, [subjects]);

  const totalCredits  = subjects.reduce((a, x) => a + x.credits, 0);
  const earnedCredits = subjects.filter(x => x.status === "completed").reduce((a, x) => a + x.credits, 0);
  const progress = totalCredits > 0 ? earnedCredits / totalCredits : 0;

  if (subjects.length === 0) {
    return (
      <GlassCard padding={28}>
        <MotiView
          from={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 14 }}
          style={{ alignItems: "center", gap: 12 }}
        >
          <Text style={{ fontSize: 52 }}>📚</Text>
          <Text style={s.emptyTitle}>Побудуйте свою програму</Text>
          <Text style={s.emptyBody}>
            Додайте предмети, які ви вивчаєте цього семестру. Відстежуйте оцінки, кредити та дедлайни — все в одному місці.
          </Text>
          <Pressable onPress={onAdd}
            style={({ pressed }) => [s.emptyAddBtn, pressed && { opacity: 0.85 }]}>
            <Icons.Plus size={15} color="#fff" strokeWidth={2.6} />
            <Text style={s.emptyAddBtnText}>Додати предмет</Text>
          </Pressable>
        </MotiView>
      </GlassCard>
    );
  }

  return (
    <View style={{ gap: 16 }}>
      {/* Progress banner */}
      <LinearGradient colors={["#0f766e", "#0369a1"]} style={s.progressBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Text style={s.progressBannerTitle}>Загальний прогрес</Text>
        <Text style={s.progressBannerValue}>{earnedCredits} / {totalCredits} ECTS</Text>
        <View style={s.progressBarBg}>
          <MotiView
            from={{ width: "0%" }}
            animate={{ width: `${Math.round(progress * 100)}%` as any }}
            transition={{ type: "timing", duration: 800 }}
            style={[s.progressBarFill]}
          />
        </View>
        <Text style={s.progressBannerSub}>{Math.round(progress * 100)}% зараховано</Text>
      </LinearGradient>

      {groups.map(({ year, semester, subjects: list }) => (
        <View key={`${year}-${semester}`} style={{ gap: 8 }}>
          <View style={s.semHeader}>
            <View style={s.semBadge}>
              <Text style={s.semBadgeText}>{year} рік · Семестр {semester}</Text>
            </View>
            <Text style={s.semCredits}>{list.reduce((a, x) => a + x.credits, 0)} ECTS</Text>
          </View>
          {list.map((subj, i) => (
            <SubjectCard
              key={subj.id}
              subject={subj}
              delay={i * 40}
              onEdit={() => onEdit(subj)}
              onDelete={() => Alert.alert("Видалити?", `Видалити «${subj.title}»?`, [
                { text: "Скасувати", style: "cancel" },
                { text: "Видалити", style: "destructive", onPress: () => onDelete(subj.id) },
              ])}
              onSetScore={(score) => onUpdateScore(subj.id, score)}
            />
          ))}
        </View>
      ))}

      {completedItems.length > 0 && (
        <View style={{ gap: 8 }}>
          <View style={s.semHeader}>
            <View style={[s.semBadge, { backgroundColor: "#7c3aed20" }]}>
              <Text style={[s.semBadgeText, { color: "#7c3aed" }]}>🎓 ОСВІТНІЙ ШЛЯХ</Text>
            </View>
          </View>
          {completedItems.map((it, i) => {
            const comp = (it.fields as any).completion as Record<string, any>;
            const typeLabel: Record<string, string> = { bachelor: "Бакалавр", master: "Магістр", phd: "PhD / Доктор" };
            return (
              <MotiView key={it.id} from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: i * 60 }}>
                <View style={cp.card}>
                  <View style={cp.topRow}>
                    <View style={cp.icon}>
                      <Icons.Medal size={16} color="#7c3aed" strokeWidth={1.8} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
                        <View style={cp.typeBadge}>
                          <Text style={cp.typeBadgeText}>{typeLabel[it.type] ?? it.type}</Text>
                        </View>
                        {comp.thesisGrade && (
                          <View style={[cp.typeBadge, { backgroundColor: "#d1fae5" }]}>
                            <Text style={[cp.typeBadgeText, { color: "#065f46" }]}>{comp.thesisGrade} · {comp.thesisGrade === "A" ? "Відмінно" : comp.thesisGrade === "B" || comp.thesisGrade === "C" ? "Добре" : "Задовільно"}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={cp.title}>{it.title}</Text>
                      {comp.degreeTitle && <Text style={cp.degree}>{comp.degreeTitle}</Text>}
                      {comp.institution && <Text style={cp.institution}>{comp.institution}</Text>}
                      {comp.completedAt && (
                        <Text style={cp.date}>
                          {it.startDate ? `${it.startDate} – ` : ""}{comp.completedAt}
                          {comp.diplomaNumber ? `  ·  Диплом №${comp.diplomaNumber}` : ""}
                        </Text>
                      )}
                      {comp.thesisTitle && (
                        <View style={cp.thesisBox}>
                          <Text style={cp.thesisText} numberOfLines={2}>«{comp.thesisTitle}»</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </MotiView>
            );
          })}
        </View>
      )}
    </View>
  );
}

function SubjectCard({ subject: s, delay, onEdit, onDelete, onSetScore }: {
  subject: MySubject;
  delay?: number;
  onEdit: () => void;
  onDelete: () => void;
  onSetScore: (score: number) => void;
}) {
  const [scoreInput, setScoreInput] = useState(String(s.finalScore ?? ""));
  const [editing, setEditing] = useState(false);
  const grade = scoreToGrade(s.finalScore);
  const statusColor = STATUS_COLORS[s.status];

  useEffect(() => {
    setScoreInput(String(s.finalScore ?? ""));
  }, [s.finalScore]);

  return (
    <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay }}>
      <View style={[ss.card, { borderLeftColor: statusColor }]}>
        <View style={ss.top}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={ss.title} numberOfLines={2}>{s.title}</Text>
            {s.instructor && (
              <View style={ss.metaRow}>
                <Icons.User size={10} color={colors.muted} strokeWidth={2} />
                <Text style={ss.meta}>{s.instructor}</Text>
              </View>
            )}
            <View style={ss.metaRow}>
              <View style={[ss.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[ss.meta, { color: statusColor }]}>{STATUS_LABELS[s.status]}</Text>
              <Text style={ss.metaSep}>·</Text>
              <Text style={ss.meta}>{s.credits} ECTS</Text>
              {s.examDate && (
                <>
                  <Text style={ss.metaSep}>·</Text>
                  <Icons.CalendarClock size={10} color={colors.muted} strokeWidth={2} />
                  <Text style={ss.meta}>{s.examDate}</Text>
                </>
              )}
            </View>
          </View>
          <View style={{ alignItems: "flex-end", gap: 6 }}>
            {s.finalScore != null ? (
              <Pressable onPress={() => setEditing(e => !e)} style={{ alignItems: "center", gap: 2 }}>
                <View style={[ss.gradeBadge, { borderColor: gradeColor(grade) + "50", backgroundColor: gradeColor(grade) + "14" }]}>
                  <Text style={[ss.gradeText, { color: gradeColor(grade) }]}>{grade}</Text>
                </View>
                <Text style={{ fontSize: 9, color: gradeColor(grade), fontFamily: fonts.semiBold, textAlign: "center", maxWidth: 60 }}>
                  {gradeToNational(grade)}
                </Text>
              </Pressable>
            ) : (
              <Pressable onPress={() => setEditing(e => !e)} style={ss.scoreBtn}>
                <Icons.Award size={13} color={colors.muted} strokeWidth={2} />
                <Text style={ss.scoreBtnText}>Оцінка</Text>
              </Pressable>
            )}
            <View style={{ flexDirection: "row", gap: 6 }}>
              <Pressable onPress={onEdit} hitSlop={8}><Icons.Pencil size={14} color={colors.muted} strokeWidth={2} /></Pressable>
              <Pressable onPress={onDelete} hitSlop={8}><Icons.Trash2 size={14} color={colors.mutedSoft} strokeWidth={2} /></Pressable>
            </View>
          </View>
        </View>
        {editing && (
          <MotiView from={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 50 }} style={{ overflow: "hidden" }}>
            <View style={ss.scoreRow}>
              <TextInput
                style={ss.scoreInput}
                value={scoreInput}
                onChangeText={setScoreInput}
                keyboardType="numeric"
                placeholder="0–100"
                placeholderTextColor={colors.mutedSoft}
                maxLength={3}
              />
              <Pressable onPress={() => {
                const n = parseInt(scoreInput);
                if (!isNaN(n) && n >= 0 && n <= 100) { onSetScore(n); setEditing(false); }
                else Alert.alert("Невірне значення", "Введіть число від 0 до 100");
              }} style={ss.scoreConfirm}>
                <Icons.Check size={16} color="#fff" strokeWidth={2.5} />
                <Text style={ss.scoreConfirmText}>Зберегти</Text>
              </Pressable>
            </View>
          </MotiView>
        )}
      </View>
    </MotiView>
  );
}

// ─── Schedule view ────────────────────────────────────────────────────────────
const SESSION_TYPE_LABELS: Record<string, string> = {
  lecture: "Лекція", seminar: "Семінар", practical: "Практична",
  lab: "Лаб. робота", self_study: "Сам. робота", consultation: "Консультація",
};

function ScheduleView({ subjects, sessions, courses }: {
  subjects: MySubject[];
  sessions: LearningSession[];
  courses: LearningCourse[];
}) {
  const today = new Date().toISOString().slice(0, 10);

  const upcomingSessions = useMemo(() =>
    sessions
      .filter(s => s.date >= today && s.status !== "cancelled")
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
      .slice(0, 20),
    [sessions, today]
  );

  const upcomingExams = useMemo(() =>
    subjects
      .filter(s => s.examDate && s.examDate >= today)
      .sort((a, b) => a.examDate!.localeCompare(b.examDate!))
      .slice(0, 10),
    [subjects, today]
  );

  const courseMap = useMemo(() => {
    const m = new Map<string, LearningCourse>();
    courses.forEach(c => m.set(c._id, c));
    return m;
  }, [courses]);

  if (upcomingSessions.length === 0 && upcomingExams.length === 0) {
    return (
      <GlassCard padding={24}>
        <View style={{ alignItems: "center", gap: 10 }}>
          <Text style={{ fontSize: 36 }}>📅</Text>
          <Text style={s.emptyTitle}>Розклад порожній</Text>
          <Text style={s.emptyBody}>Заняття та іспити з'являться тут автоматично після налаштування розкладу у веб-додатку</Text>
        </View>
      </GlassCard>
    );
  }

  return (
    <View style={{ gap: 16 }}>
      {upcomingSessions.length > 0 && (
        <View style={{ gap: 8 }}>
          <Text style={s.sectionLabel}>НАЙБЛИЖЧІ ЗАНЯТТЯ</Text>
          {upcomingSessions.map((sess, i) => {
            const course = courseMap.get(sess.courseId);
            const isToday = sess.date === today;
            const daysLeft = Math.ceil((new Date(sess.date).getTime() - Date.now()) / 86400000);
            const accentColor = isToday ? "#0f766e" : "#0369a1";
            return (
              <MotiView key={sess._id} from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: i * 30 }}>
                <View style={[ss.sessionCard, { borderLeftColor: accentColor }]}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      {isToday && (
                        <View style={{ backgroundColor: "#0f766e18", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: "#0f766e30" }}>
                          <Text style={{ fontSize: 9, fontFamily: fonts.bold, color: "#0f766e", textTransform: "uppercase", letterSpacing: 0.5 }}>Сьогодні</Text>
                        </View>
                      )}
                      <View style={{ backgroundColor: "#0369a118", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                        <Text style={{ fontSize: 9, fontFamily: fonts.semiBold, color: "#0369a1" }}>
                          {SESSION_TYPE_LABELS[sess.sessionType] ?? sess.sessionType}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 11, fontFamily: fonts.bold, color: accentColor }}>
                      {isToday ? "Сьогодні" : `${daysLeft} дн.`}
                    </Text>
                  </View>
                  <Text style={ss.title} numberOfLines={2}>{sess.title}</Text>
                  {course && <Text style={ss.meta}>{course.code ? `${course.code} · ` : ""}{course.title}</Text>}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                    {sess.startTime ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                        <Icons.Clock size={10} color={colors.muted} strokeWidth={2} />
                        <Text style={ss.meta}>{sess.startTime}{sess.endTime ? `–${sess.endTime}` : ""}</Text>
                      </View>
                    ) : null}
                    {sess.location ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                        <Icons.MapPin size={10} color={colors.muted} strokeWidth={2} />
                        <Text style={ss.meta}>{sess.location}</Text>
                      </View>
                    ) : null}
                    <Text style={{ marginLeft: "auto" as any, fontSize: 10, color: colors.mutedSoft }}>{sess.date}</Text>
                  </View>
                </View>
              </MotiView>
            );
          })}
        </View>
      )}

      {upcomingExams.length > 0 && (
        <View style={{ gap: 8 }}>
          <Text style={s.sectionLabel}>МАЙБУТНІ ІСПИТИ ТА ЗАЛІКИ</Text>
          {upcomingExams.map((subj, i) => {
            const daysLeft = Math.ceil((new Date(subj.examDate!).getTime() - Date.now()) / 86400000);
            const urgent = daysLeft <= 7;
            return (
              <MotiView key={subj.id} from={{ opacity: 0, translateX: -8 }} animate={{ opacity: 1, translateX: 0 }} transition={{ delay: i * 40 }}>
                <View style={[ss.examCard, { borderLeftColor: urgent ? "#be123c" : "#0f766e" }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={ss.title} numberOfLines={1}>{subj.title}</Text>
                    <Text style={ss.meta}>{subj.examType === "exam" ? "Іспит" : "Залік"} · {subj.credits} ECTS</Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 2 }}>
                    <Text style={[ss.examDate, { color: urgent ? "#be123c" : "#0f766e" }]}>{subj.examDate}</Text>
                    <Text style={[ss.examDays, { color: urgent ? "#be123c" : colors.muted }]}>
                      {daysLeft <= 0 ? "Сьогодні!" : `${daysLeft} дн.`}
                    </Text>
                  </View>
                </View>
              </MotiView>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ─── Assessments view ─────────────────────────────────────────────────────────

const ASSESSMENT_TYPE_ICONS: Record<string, string> = {
  exam: "📝", zalik: "✅", midterm: "📋", test: "✏️", colloquium: "🎓",
  seminar: "💬", practical_work: "🛠", essay: "📄", project: "🗂",
  coursework: "📓", lab_work: "🧪", notes_check: "📒", oral: "🗣",
  presentation: "🎤", other: "📌",
};
const ASSESSMENT_TYPE_LABELS: Record<string, string> = {
  exam: "Іспит", zalik: "Залік", midterm: "Модуль", test: "Тест",
  colloquium: "Колоквіум", seminar: "Семінар", practical_work: "Практична",
  essay: "Есе", project: "Проєкт", coursework: "Курсова",
  lab_work: "Лабораторна", notes_check: "Перевірка конспекту",
  oral: "Усне опитування", presentation: "Презентація", other: "Інше",
};
const ASSESSMENT_STATUS_COLORS: Record<AssessmentStatus, string> = {
  upcoming:      "#0369a1",
  in_progress:   "#d97706",
  completed:     "#059669",
  missed:        "#be123c",
  retake_needed: "#7c3aed",
  passed_retake: "#059669",
};
const ASSESSMENT_STATUS_LABELS: Record<AssessmentStatus, string> = {
  upcoming:      "Майбутнє",
  in_progress:   "Виконується",
  completed:     "Виконано",
  missed:        "Пропущено",
  retake_needed: "Потрібне перескладання",
  passed_retake: "Перескладено",
};
type AssessmentFilter = "all" | "pending" | "urgent" | "scored";

function AssessmentsView({ assessments, courses, onSaveScore }: {
  assessments: LearningAssessment[];
  courses: LearningCourse[];
  onSaveScore: (assessmentId: string, score: number | null) => Promise<void>;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [editingAssessment, setEditingAssessment] = useState<LearningAssessment | null>(null);
  const [filter, setFilter] = useState<AssessmentFilter>("all");

  const courseMap = useMemo(() => {
    const m = new Map<string, LearningCourse>();
    courses.forEach(c => m.set(c._id, c));
    return m;
  }, [courses]);

  const sorted = useMemo(() =>
    [...assessments].sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || "")),
    [assessments],
  );

  const completed = assessments.filter(a => a.status === "completed" || a.status === "passed_retake");
  const withScores = completed.filter(a => a.achievedScore != null && a.maxScore > 0);
  const avgPct = withScores.length > 0
    ? Math.round(withScores.reduce((acc, a) => acc + a.achievedScore! / a.maxScore * 100, 0) / withScores.length)
    : null;
  const pending = assessments.filter(a => a.achievedScore == null).length;
  const urgent = assessments.filter(a => {
    if (!a.dueDate || a.achievedScore != null) return false;
    const days = Math.ceil((new Date(a.dueDate).getTime() - Date.now()) / 86400000);
    return days <= 7;
  }).length;
  const upcoming = assessments.filter(a => a.dueDate && a.dueDate >= today && a.status === "upcoming").length;

  const filteredSorted = useMemo(() => {
    return sorted.filter(a => {
      if (filter === "pending") return a.achievedScore == null;
      if (filter === "scored") return a.achievedScore != null;
      if (filter === "urgent") {
        if (!a.dueDate || a.achievedScore != null) return false;
        const days = Math.ceil((new Date(a.dueDate).getTime() - Date.now()) / 86400000);
        return days <= 7;
      }
      return true;
    });
  }, [filter, sorted]);

  const byCourse = useMemo(() => {
    const map = new Map<string, LearningAssessment[]>();
    filteredSorted.forEach(a => {
      if (!map.has(a.courseId)) map.set(a.courseId, []);
      map.get(a.courseId)!.push(a);
    });
    return Array.from(map.entries());
  }, [filteredSorted]);

  if (sorted.length === 0) {
    return (
      <GlassCard padding={24}>
        <View style={{ alignItems: "center", gap: 10 }}>
          <Text style={{ fontSize: 36 }}>📊</Text>
          <Text style={s.emptyTitle}>Оцінювань немає</Text>
          <Text style={s.emptyBody}>Оцінювання з'являться тут після додавання у веб-застосунку</Text>
        </View>
      </GlassCard>
    );
  }

  return (
    <View style={{ gap: 16 }}>
      {/* Summary chips */}
      <View style={av.summaryGrid}>
        <View style={[av.chip, { borderColor: "#059669" + "30" }]}>
          <Text style={[av.chipValue, { color: "#059669" }]}>{completed.length}</Text>
          <Text style={av.chipLabel}>Виконано</Text>
        </View>
        <View style={[av.chip, { borderColor: "#0369a1" + "30" }]}>
          <Text style={[av.chipValue, { color: "#0369a1" }]}>{upcoming}</Text>
          <Text style={av.chipLabel}>Майбутніх</Text>
        </View>
        <View style={[av.chip, { borderColor: "#d97706" + "30" }]}>
          <Text style={[av.chipValue, { color: "#d97706" }]}>{pending}</Text>
          <Text style={av.chipLabel}>Без бала</Text>
        </View>
        {avgPct != null && (
          <View style={[av.chip, { borderColor: gradeColor(scoreToGrade(avgPct)) + "30", flex: 1 }]}>
            <Text style={[av.chipValue, { color: gradeColor(scoreToGrade(avgPct)) }]}>
              {scoreToGrade(avgPct)} · {avgPct}%
            </Text>
            <Text style={av.chipLabel}>Середній результат</Text>
          </View>
        )}
      </View>

      <View style={av.filterRow}>
        {([
          ["all", "Усі", assessments.length],
          ["pending", "Без бала", pending],
          ["urgent", "Скоро", urgent],
          ["scored", "Оцінені", withScores.length],
        ] as const).map(([id, label, count]) => {
          const active = filter === id;
          return (
            <Pressable
              key={id}
              onPress={() => setFilter(id)}
              style={({ pressed }) => [
                av.filterChip,
                active && av.filterChipActive,
                pressed && { opacity: 0.82 },
              ]}
            >
              <Text style={[av.filterText, active && av.filterTextActive]}>{label}</Text>
              <Text style={[av.filterCount, active && av.filterCountActive]}>{count}</Text>
            </Pressable>
          );
        })}
      </View>

      {filteredSorted.length === 0 && (
        <GlassCard padding={20}>
          <View style={{ alignItems: "center", gap: 8 }}>
            <Icons.FilterX size={24} color={colors.mutedSoft} strokeWidth={1.8} />
            <Text style={s.emptyTitle}>Нічого за цим фільтром</Text>
            <Text style={s.emptyBody}>Перемкніть фільтр або оновіть оцінювання у веб-журналі.</Text>
          </View>
        </GlassCard>
      )}

      {byCourse.map(([courseId, items]) => {
        const course = courseMap.get(courseId);
        const courseScored = items.filter(item => item.achievedScore != null).length;
        return (
          <View key={courseId} style={{ gap: 8 }}>
            <View style={s.semHeader}>
              <View style={[s.semBadge, { backgroundColor: "#0369a118", borderColor: "#0369a130" }]}>
                <Text style={[s.semBadgeText, { color: "#0369a1" }]} numberOfLines={1}>
                  {course ? (course.code ? `${course.code} · ${course.title}` : course.title) : "Без курсу"}
                </Text>
              </View>
              <Text style={s.semCredits}>{courseScored}/{items.length}</Text>
            </View>

            {items.map((a, i) => {
              const statusColor = ASSESSMENT_STATUS_COLORS[a.status] ?? "#94a3b8";
              const icon = ASSESSMENT_TYPE_ICONS[a.assessmentType] ?? "📌";
              const typeLbl = ASSESSMENT_TYPE_LABELS[a.assessmentType] ?? a.assessmentType;
              const daysLeft = a.dueDate
                ? Math.ceil((new Date(a.dueDate).getTime() - Date.now()) / 86400000)
                : null;
              const scorePct = a.achievedScore != null && a.maxScore > 0
                ? Math.round((a.achievedScore / a.maxScore) * 100)
                : null;
              const grade = scorePct != null ? scoreToGrade(scorePct) : null;

              return (
                <MotiView
                  key={a._id}
                  from={{ opacity: 0, translateY: 6 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: i * 30 }}
                >
                  <View style={[av.card, { borderLeftColor: statusColor }]}>
                    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                      {/* Icon */}
                      <View style={[av.iconWrap, { backgroundColor: statusColor + "14" }]}>
                        <Text style={{ fontSize: 16 }}>{icon}</Text>
                      </View>

                      {/* Content */}
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={av.title} numberOfLines={2}>{a.title}</Text>
                        <View style={av.badgeRow}>
                          <View style={[av.typeBadge, { backgroundColor: statusColor + "14", borderColor: statusColor + "30" }]}>
                            <Text style={[av.typeBadgeText, { color: statusColor }]}>{typeLbl}</Text>
                          </View>
                          <View style={[av.statusBadge, { backgroundColor: statusColor + "14" }]}>
                            <Text style={[av.statusBadgeText, { color: statusColor }]}>
                              {ASSESSMENT_STATUS_LABELS[a.status]}
                            </Text>
                          </View>
                        </View>
                        <View style={av.metaRow}>
                          {a.dueDate && (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                              <Icons.CalendarClock size={10} color={colors.muted} strokeWidth={2} />
                              <Text style={av.meta}>{a.dueDate}</Text>
                              {daysLeft !== null && a.status === "upcoming" && (
                                <Text style={[av.meta, { color: daysLeft <= 3 ? "#be123c" : daysLeft <= 7 ? "#d97706" : colors.muted, fontFamily: fonts.bold }]}>
                                  {daysLeft <= 0 ? "· Сьогодні!" : `· ${daysLeft} дн.`}
                                </Text>
                              )}
                            </View>
                          )}
                          {a.weight > 0 && (
                            <Text style={av.meta}>Вага: {a.weight}%</Text>
                          )}
                        </View>
                      </View>

                      {/* Score */}
                      <Pressable onPress={() => setEditingAssessment(a)} style={av.scoreAction}>
                        {grade ? (
                          <View style={{ alignItems: "center", gap: 2 }}>
                            <View style={[ss.gradeBadge, { borderColor: gradeColor(grade) + "50", backgroundColor: gradeColor(grade) + "14", width: 40, height: 40 }]}>
                              <Text style={[ss.gradeText, { color: gradeColor(grade) }]}>{grade}</Text>
                            </View>
                            <Text style={{ fontSize: 9, color: gradeColor(grade), fontFamily: fonts.semiBold }}>
                              {a.achievedScore}/{a.maxScore}
                            </Text>
                          </View>
                        ) : a.maxScore > 0 ? (
                          <View style={av.scoreCta}>
                            <Icons.Award size={13} color={colors.primary} strokeWidth={2.2} />
                            <Text style={av.scoreCtaText}>Оцінити</Text>
                            <Text style={av.scoreCtaSub}>/{a.maxScore}</Text>
                          </View>
                        ) : (
                          <Text style={av.scoreEmpty}>Оцінити</Text>
                        )}
                      </Pressable>
                    </View>

                    {a.notes ? (
                      <Text style={av.notes} numberOfLines={2}>{a.notes}</Text>
                    ) : null}
                  </View>
                </MotiView>
              );
            })}
          </View>
        );
      })}

      <AssessmentScoreModal
        assessment={editingAssessment}
        onClose={() => setEditingAssessment(null)}
        onSave={async (score) => {
          if (!editingAssessment) return;
          await onSaveScore(editingAssessment._id, score);
          setEditingAssessment(null);
        }}
      />
    </View>
  );
}

function AssessmentScoreModal({ assessment, onClose, onSave }: {
  assessment: LearningAssessment | null;
  onClose: () => void;
  onSave: (score: number | null) => Promise<void>;
}) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(assessment?.achievedScore == null ? "" : String(assessment.achievedScore));
  }, [assessment]);

  async function handleSave() {
    if (!assessment || saving) return;
    const trimmed = value.trim().replace(",", ".");
    const score = trimmed === "" ? null : Number(trimmed);

    if (score !== null && (!Number.isFinite(score) || score < 0 || (assessment.maxScore > 0 && score > assessment.maxScore))) {
      Alert.alert("Некоректний бал", assessment.maxScore > 0 ? `Введіть число від 0 до ${assessment.maxScore}.` : "Введіть число або очистіть поле.");
      return;
    }

    setSaving(true);
    try {
      await onSave(score);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Не вдалося зберегти", "Перевірте підключення і спробуйте ще раз.");
    } finally {
      setSaving(false);
    }
  }

  const inputScore = value.trim() === "" ? null : Number(value.trim().replace(",", "."));
  const pct = assessment && inputScore != null && Number.isFinite(inputScore) && assessment.maxScore > 0
    ? Math.round((inputScore / assessment.maxScore) * 100)
    : null;
  const grade = pct != null ? scoreToGrade(pct) : null;

  return (
    <Modal visible={Boolean(assessment)} animationType="slide" transparent onRequestClose={onClose}>
      <View style={av.modalBackdrop}>
        <Pressable style={av.modalScrim} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
          style={av.keyboardAvoider}
          pointerEvents="box-none"
        >
          <View style={av.modalSheet}>
            <View style={av.modalHandle} />
            <View style={av.modalHeader}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={av.modalLabel}>Оцінювання</Text>
                <Text style={av.modalTitle} numberOfLines={2}>{assessment?.title}</Text>
              </View>
              <Pressable onPress={onClose} style={sm.closeBtn}>
                <Icons.X size={18} color={colors.ink} strokeWidth={2} />
              </Pressable>
            </View>

            <View style={av.scorePanel}>
              <View style={{ flex: 1 }}>
                <Text style={av.scorePanelLabel}>Бали</Text>
                <TextInput
                  value={value}
                  onChangeText={setValue}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={colors.mutedSoft}
                  style={av.scoreInput}
                  autoFocus
                />
              </View>
              <View style={av.scoreDivider} />
              <View style={{ alignItems: "center", minWidth: 78 }}>
                <Text style={av.scorePanelLabel}>Максимум</Text>
                <Text style={av.scoreMax}>{assessment?.maxScore || "—"}</Text>
              </View>
            </View>

            {grade && (
              <View style={[av.resultPreview, { borderColor: gradeColor(grade) + "35", backgroundColor: gradeColor(grade) + "10" }]}>
                <Text style={[av.resultGrade, { color: gradeColor(grade) }]}>{grade}</Text>
                <Text style={av.resultText}>Поточний результат · {pct}%</Text>
              </View>
            )}

            {assessment && assessment.maxScore > 0 && (
              <View style={av.quickRow}>
                {[60, 74, 82, 90, 100].map((percent) => {
                  const quickScore = Math.round((assessment.maxScore * percent) / 100);
                  return (
                    <Pressable key={percent} onPress={() => setValue(String(quickScore))} style={av.quickChip}>
                      <Text style={av.quickValue}>{quickScore}</Text>
                      <Text style={av.quickLabel}>{scoreToGrade(percent)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            <View style={av.modalActions}>
              <Pressable onPress={() => setValue("")} style={av.clearBtn}>
                <Text style={av.clearBtnText}>Очистити</Text>
              </Pressable>
              <Pressable onPress={handleSave} disabled={saving} style={[av.saveScoreBtn, saving && { opacity: 0.7 }]}>
                <Icons.Check size={16} color="#fff" strokeWidth={2.4} />
                <Text style={av.saveScoreText}>{saving ? "Збереження..." : "Зберегти"}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── Deadlines view ───────────────────────────────────────────────────────────
function DeadlinesView({ subjects }: { subjects: MySubject[] }) {
  const withDeadlines = useMemo(() =>
    subjects
      .filter(s => s.examDate && s.status !== "completed")
      .sort((a, b) => a.examDate!.localeCompare(b.examDate!)),
    [subjects]
  );

  if (withDeadlines.length === 0) {
    return (
      <GlassCard padding={24}>
        <View style={{ alignItems: "center", gap: 10 }}>
          <Text style={{ fontSize: 36 }}>✅</Text>
          <Text style={s.emptyTitle}>Дедлайнів немає</Text>
          <Text style={s.emptyBody}>Усі завершено або дати ще не вказані</Text>
        </View>
      </GlassCard>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      {withDeadlines.map((subj, i) => {
        const daysLeft = Math.ceil((new Date(subj.examDate!).getTime() - Date.now()) / 86400000);
        const color = daysLeft <= 3 ? "#be123c" : daysLeft <= 7 ? "#d97706" : "#0f766e";
        return (
          <MotiView key={subj.id} from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: i * 40 }}>
            <View style={[ss.deadlineCard, { borderLeftColor: color }]}>
              <View style={[ss.deadlineIcon, { backgroundColor: color + "15" }]}>
                <Icons.CalendarClock size={18} color={color} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={ss.title}>{subj.title}</Text>
                <Text style={[ss.meta, { color }]}>{subj.examType === "exam" ? "Іспит" : "Залік"} · {subj.examDate}</Text>
              </View>
              <View style={[ss.daysChip, { backgroundColor: color + "14", borderColor: color + "40" }]}>
                <Text style={[ss.daysText, { color }]}>
                  {daysLeft <= 0 ? "Сьогодні" : `${daysLeft}д`}
                </Text>
              </View>
            </View>
          </MotiView>
        );
      })}
    </View>
  );
}

// ─── PhD plan view ────────────────────────────────────────────────────────────
function PhdPlanView({ plan }: { plan: PhdPlan | null }) {
  if (!plan) {
    return (
      <GlassCard padding={24}>
        <View style={{ alignItems: "center", gap: 10 }}>
          <Text style={{ fontSize: 36 }}>🎓</Text>
          <Text style={s.emptyTitle}>PhD-план відсутній</Text>
          <Text style={s.emptyBody}>Створіть PhD-план у веб-застосунку або через WorkspaceItem типу PhD</Text>
        </View>
      </GlassCard>
    );
  }

  const earnedCredits = plan.curriculumCourses?.filter(c => c.credited).reduce((acc, c) => acc + c.credits, 0) || 0;
  const targetCredits = plan.totalCredits || 60;
  const progress = Math.round((earnedCredits / targetCredits) * 100);

  return (
    <View style={{ gap: 16 }}>
      <LinearGradient colors={["#073d35", "#0f5c50"]} style={s.phdBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Text style={s.phdBannerLabel}>Прогрес дисертації</Text>
        <Text style={s.phdBannerValue}>{progress}%</Text>
        <View style={s.progressBarBg}>
          <View style={[s.progressBarFill, { width: `${progress}%` }]} />
        </View>
        <Text style={s.phdBannerSub}>{earnedCredits} з {targetCredits} кредитів ЄКТС</Text>
      </LinearGradient>

      <Text style={s.sectionLabel}>ГРАФІК ГАНТА</Text>
      <PhdGanttChart plan={plan} />

      {plan.milestones?.length > 0 && (
        <>
          <Text style={s.sectionLabel}>КЛЮЧОВІ ЕТАПИ</Text>
          {plan.milestones.map((m, i) => (
            <View key={m.mid} style={ss.milestoneRow}>
              <View style={[ss.milestoneDot, i === 0 && { backgroundColor: colors.primary }]} />
              <View style={{ flex: 1 }}>
                <Text style={ss.milestoneTitle}>{m.title}</Text>
                <Text style={ss.milestonePeriod}>{m.period}</Text>
              </View>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

// ─── Subject modal ────────────────────────────────────────────────────────────
function SubjectModal({ visible, subject, onClose, onSave }: {
  visible: boolean;
  subject: MySubject | null;
  onClose: () => void;
  onSave: (data: Omit<MySubject, "id">) => void;
}) {
  const [title, setTitle]       = useState("");
  const [instructor, setInstructor] = useState("");
  const [credits, setCredits]   = useState("3");
  const [year, setYear]         = useState("1");
  const [semester, setSemester] = useState("1");
  const [examDate, setExamDate] = useState("");
  const [examType, setExamType] = useState<"exam" | "zalik">("zalik");
  const [status, setStatus]     = useState<MySubject["status"]>("active");

  useEffect(() => {
    if (subject) {
      setTitle(subject.title);
      setInstructor(subject.instructor || "");
      setCredits(String(subject.credits));
      setYear(String(subject.year));
      setSemester(String(subject.semester));
      setExamDate(subject.examDate || "");
      setExamType(subject.examType || "zalik");
      setStatus(subject.status);
    } else {
      setTitle(""); setInstructor(""); setCredits("3");
      setYear("1"); setSemester("1"); setExamDate(""); setExamType("zalik"); setStatus("active");
    }
  }, [subject, visible]);

  function handleSave() {
    if (!title.trim()) { Alert.alert("Введіть назву предмету"); return; }
    onSave({
      title: title.trim(),
      instructor: instructor.trim() || undefined,
      credits: parseInt(credits) || 3,
      year: parseInt(year) || 1,
      semester: parseInt(semester) || 1,
      examDate: examDate.trim() || undefined,
      examType,
      status,
    });
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={sm.root}>
        <View style={sm.header}>
          <Pressable onPress={onClose} style={sm.closeBtn}>
            <Icons.X size={18} color={colors.ink} strokeWidth={2} />
          </Pressable>
          <Text style={sm.title}>{subject ? "Редагувати" : "Новий предмет"}</Text>
          <Pressable onPress={handleSave} style={sm.saveBtn}>
            <Text style={sm.saveBtnText}>Зберегти</Text>
          </Pressable>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
          <FormField label="Назва предмету *">
            <TextInput style={sm.input} value={title} onChangeText={setTitle}
              placeholder="н-р, Вища математика" placeholderTextColor={colors.mutedSoft} autoFocus />
          </FormField>

          <FormField label="Викладач">
            <TextInput style={sm.input} value={instructor} onChangeText={setInstructor}
              placeholder="ПІБ викладача" placeholderTextColor={colors.mutedSoft} />
          </FormField>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <FormField label="Рік" style={{ flex: 1 }}>
              <View style={sm.chipRow}>
                {["1","2","3","4","5","6"].map(v => (
                  <Pressable key={v} onPress={() => setYear(v)} style={[sm.chip, year === v && sm.chipActive]}>
                    <Text style={[sm.chipText, year === v && sm.chipTextActive]}>{v}</Text>
                  </Pressable>
                ))}
              </View>
            </FormField>
            <FormField label="Семестр" style={{ flex: 1 }}>
              <View style={sm.chipRow}>
                {["1","2","3","4","5","6","7","8"].map(v => (
                  <Pressable key={v} onPress={() => setSemester(v)} style={[sm.chip, semester === v && sm.chipActive]}>
                    <Text style={[sm.chipText, semester === v && sm.chipTextActive]}>{v}</Text>
                  </Pressable>
                ))}
              </View>
            </FormField>
          </View>

          <FormField label="Кредити ECTS">
            <View style={sm.chipRow}>
              {["1","2","3","4","5","6","7","8","9","10"].map(v => (
                <Pressable key={v} onPress={() => setCredits(v)} style={[sm.chip, credits === v && sm.chipActive]}>
                  <Text style={[sm.chipText, credits === v && sm.chipTextActive]}>{v}</Text>
                </Pressable>
              ))}
            </View>
          </FormField>

          <FormField label="Статус">
            <View style={{ flexDirection: "row", gap: 8 }}>
              {(["planned","active","completed"] as MySubject["status"][]).map(st => (
                <Pressable key={st} onPress={() => setStatus(st)}
                  style={[sm.statusChip, status === st && { borderColor: STATUS_COLORS[st], backgroundColor: STATUS_COLORS[st] + "18" }]}>
                  <Text style={[sm.statusText, status === st && { color: STATUS_COLORS[st], fontFamily: fonts.bold }]}>
                    {STATUS_LABELS[st]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </FormField>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <FormField label="Дата іспиту" style={{ flex: 2 }}>
              <TextInput style={sm.input} value={examDate} onChangeText={setExamDate}
                placeholder="YYYY-MM-DD" placeholderTextColor={colors.mutedSoft} />
            </FormField>
            <FormField label="Вид" style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", gap: 6 }}>
                {(["zalik","exam"] as const).map(t => (
                  <Pressable key={t} onPress={() => setExamType(t)}
                    style={[sm.chip, examType === t && sm.chipActive]}>
                    <Text style={[sm.chipText, examType === t && sm.chipTextActive]}>
                      {t === "zalik" ? "Залік" : "Іспит"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </FormField>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function FormField({ label, children, style }: { label: string; children: React.ReactNode; style?: any }) {
  return (
    <View style={[{ gap: 6 }, style]}>
      <Text style={sm.label}>{label}</Text>
      {children}
    </View>
  );
}

function StatChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[s.statChip, { borderColor: color + "30" }]}>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  headerRow:    { flexDirection: "row", alignItems: "center", gap: 12 },
  headerIcon:   { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  headerTitle:  { fontSize: 18, fontFamily: fonts.title, color: colors.ink, letterSpacing: -0.3 },
  headerSub:    { fontSize: 12, color: colors.muted, marginTop: 2 },
  addBtn:       { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  statsRow:     { flexDirection: "row", gap: 8, marginTop: 14 },
  statChip:     { flex: 1, borderRadius: 12, borderWidth: 1, padding: 10, alignItems: "center", gap: 2, backgroundColor: "rgba(255,255,255,0.5)" },
  statValue:    { fontSize: 16, fontFamily: fonts.title, letterSpacing: -0.4 },
  statLabel:    { fontSize: 10, color: colors.muted, textAlign: "center" },

  emptyTitle:   { fontSize: 17, fontFamily: fonts.bold, color: colors.ink, textAlign: "center" },
  emptyBody:    { fontSize: 13, color: colors.muted, textAlign: "center", lineHeight: 18, paddingHorizontal: 8 },
  emptyAddBtn:  { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, backgroundColor: colors.primary, marginTop: 6 },
  emptyAddBtnText: { color: "#fff", fontFamily: fonts.bold, fontSize: 14, letterSpacing: -0.2 },

  progressBanner:      { borderRadius: 18, padding: 18, gap: 6 },
  progressBannerTitle: { fontSize: 11, fontWeight: "900", color: "rgba(255,255,255,0.7)", letterSpacing: 1, textTransform: "uppercase" },
  progressBannerValue: { fontSize: 26, fontFamily: fonts.title, color: "#fff", letterSpacing: -0.5 },
  progressBannerSub:   { fontSize: 12, color: "rgba(255,255,255,0.65)" },
  progressBarBg:  { height: 6, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 3, overflow: "hidden", marginVertical: 4 },
  progressBarFill:{ height: "100%", backgroundColor: "#fff", borderRadius: 3 },

  semHeader:      { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "space-between" },
  semBadge:       { flex: 1, backgroundColor: "#7c3aed18", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: "#7c3aed30" },
  semBadgeText:   { fontSize: 11, fontFamily: fonts.bold, color: "#7c3aed", letterSpacing: 0.3 },
  semCredits:     { flexShrink: 0, fontSize: 11, fontFamily: fonts.bold, color: colors.muted },

  sectionLabel:   { fontSize: 10, fontWeight: "900", letterSpacing: 1.5, color: colors.mutedSoft, textTransform: "uppercase" },

  phdBanner:      { borderRadius: 18, padding: 18, gap: 6 },
  phdBannerLabel: { fontSize: 11, fontWeight: "900", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 1 },
  phdBannerValue: { fontSize: 30, fontFamily: fonts.title, color: "#fff", letterSpacing: -0.5 },
  phdBannerSub:   { fontSize: 12, color: "rgba(255,255,255,0.65)" },
});

const ss = StyleSheet.create({
  card:     { backgroundColor: "rgba(255,255,255,0.8)", borderRadius: 16, padding: 14, borderLeftWidth: 3, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, borderWidth: 1, borderColor: "rgba(15,23,42,0.06)" },
  top:      { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  title:    { fontSize: 14, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.2, lineHeight: 19 },
  metaRow:  { flexDirection: "row", alignItems: "center", gap: 4 },
  meta:     { fontSize: 11, color: colors.muted },
  metaSep:  { fontSize: 11, color: colors.mutedSoft },
  statusDot:{ width: 6, height: 6, borderRadius: 3 },
  gradeBadge:{ width: 36, height: 36, borderRadius: 18, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  gradeText:{ fontSize: 13, fontFamily: fonts.bold },
  scoreBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: "rgba(15,23,42,0.08)" },
  scoreBtnText: { fontSize: 11, fontFamily: fonts.bold, color: colors.muted },
  scoreRow:  { flexDirection: "row", gap: 8, marginTop: 10, alignItems: "center" },
  scoreInput:{ flex: 1, height: 38, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, fontSize: 14, fontFamily: fonts.bold, color: colors.ink, backgroundColor: "white" },
  scoreConfirm: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  scoreConfirmText: { color: "#fff", fontFamily: fonts.bold, fontSize: 13 },

  sessionCard: { backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 14, padding: 14, borderLeftWidth: 3, borderWidth: 1, borderColor: "rgba(15,23,42,0.06)", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6 },
  examCard:  { backgroundColor: "rgba(255,255,255,0.8)", borderRadius: 14, padding: 14, borderLeftWidth: 3, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: "rgba(15,23,42,0.06)" },
  examDate:  { fontSize: 13, fontFamily: fonts.bold },
  examDays:  { fontSize: 11, fontFamily: fonts.semiBold },

  deadlineCard:  { backgroundColor: "rgba(255,255,255,0.8)", borderRadius: 14, padding: 12, borderLeftWidth: 3, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: "rgba(15,23,42,0.06)" },
  deadlineIcon:  { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  daysChip:      { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  daysText:      { fontSize: 12, fontFamily: fonts.bold },

  milestoneRow:    { flexDirection: "row", gap: 14, alignItems: "flex-start", paddingVertical: 4 },
  milestoneDot:    { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.border, marginTop: 4 },
  milestoneTitle:  { fontSize: 14, fontFamily: fonts.bold, color: colors.ink },
  milestonePeriod: { fontSize: 12, color: colors.muted, marginTop: 2 },
});

const av = StyleSheet.create({
  summaryGrid:   { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip:         { flex: 1, borderRadius: 12, borderWidth: 1, padding: 10, alignItems: "center", gap: 2, backgroundColor: "rgba(255,255,255,0.5)" },
  chipValue:    { fontSize: 15, fontFamily: fonts.title, letterSpacing: -0.3 },
  chipLabel:    { fontSize: 10, color: colors.muted, textAlign: "center" },
  filterRow:    { flexDirection: "row", gap: 7, marginTop: -4 },
  filterChip:   { flex: 1, minHeight: 38, borderRadius: 12, borderWidth: 1, borderColor: "rgba(15,23,42,0.08)", backgroundColor: "rgba(255,255,255,0.65)", alignItems: "center", justifyContent: "center", paddingHorizontal: 6, gap: 1 },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText:   { fontSize: 10, fontFamily: fonts.bold, color: colors.muted, textAlign: "center" },
  filterTextActive: { color: "#fff" },
  filterCount:  { fontSize: 10, fontFamily: fonts.title, color: colors.mutedSoft },
  filterCountActive: { color: "rgba(255,255,255,0.82)" },

  card:         { backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 14, padding: 12, borderLeftWidth: 3, borderWidth: 1, borderColor: "rgba(15,23,42,0.06)", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, gap: 8 },
  iconWrap:     { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  title:        { fontSize: 13, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.2, lineHeight: 18 },
  badgeRow:     { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 },
  typeBadge:    { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1 },
  typeBadgeText:{ fontSize: 9, fontFamily: fonts.bold, textTransform: "uppercase", letterSpacing: 0.3 },
  statusBadge:  { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  statusBadgeText: { fontSize: 9, fontFamily: fonts.semiBold },
  metaRow:      { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 2 },
  meta:         { fontSize: 11, color: colors.muted },
  maxScoreWrap: { alignItems: "center", gap: 1, paddingHorizontal: 6 },
  maxScoreText: { fontSize: 14, fontFamily: fonts.bold, color: colors.mutedSoft },
  maxScoreLabel:{ fontSize: 9, color: colors.mutedSoft },
  scoreAction:  { minWidth: 54, alignItems: "center", justifyContent: "center", borderRadius: 12, paddingVertical: 4 },
  scoreCta:     { minWidth: 64, alignItems: "center", justifyContent: "center", gap: 2, paddingHorizontal: 8, paddingVertical: 7, borderRadius: 12, backgroundColor: colors.primary + "12", borderWidth: 1, borderColor: colors.primary + "26" },
  scoreCtaText: { fontSize: 10, fontFamily: fonts.bold, color: colors.primary },
  scoreCtaSub:  { fontSize: 9, fontFamily: fonts.semiBold, color: colors.muted },
  scoreEmpty:   { fontSize: 10, fontFamily: fonts.bold, color: colors.primary, paddingHorizontal: 7, paddingVertical: 5, borderRadius: 8, backgroundColor: colors.primary + "12", overflow: "hidden" },
  notes:        { fontSize: 11, color: colors.muted, fontStyle: "italic", marginTop: 2 },

  modalBackdrop: { flex: 1, justifyContent: "flex-end" },
  modalScrim:    { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(15,23,42,0.35)" },
  keyboardAvoider: { width: "100%" },
  modalSheet:    { maxHeight: "88%", backgroundColor: "#f8fafc", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24, gap: 16 },
  modalHandle:   { alignSelf: "center", width: 42, height: 4, borderRadius: 2, backgroundColor: "rgba(100,116,139,0.28)", marginBottom: 2 },
  modalHeader:   { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  modalLabel:    { fontSize: 11, fontFamily: fonts.bold, color: colors.primary, textTransform: "uppercase", letterSpacing: 0.8 },
  modalTitle:    { fontSize: 17, fontFamily: fonts.title, color: colors.ink, lineHeight: 22 },
  scorePanel:    { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "white", borderRadius: 18, padding: 14, borderWidth: 1, borderColor: "rgba(15,23,42,0.08)" },
  scorePanelLabel: { fontSize: 10, fontFamily: fonts.bold, color: colors.mutedSoft, textTransform: "uppercase", letterSpacing: 0.7 },
  scoreInput:    { fontSize: 28, fontFamily: fonts.title, color: colors.ink, paddingVertical: 2, marginTop: 2 },
  scoreDivider:  { width: 1, height: 44, backgroundColor: "rgba(15,23,42,0.08)" },
  scoreMax:      { fontSize: 24, fontFamily: fonts.title, color: colors.muted, marginTop: 2 },
  resultPreview: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  resultGrade:   { fontSize: 16, fontFamily: fonts.title },
  resultText:    { fontSize: 12, fontFamily: fonts.semiBold, color: colors.muted },
  quickRow:     { flexDirection: "row", gap: 7 },
  quickChip:    { flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "white", borderWidth: 1, borderColor: "rgba(15,23,42,0.08)" },
  quickValue:   { fontSize: 13, fontFamily: fonts.title, color: colors.ink },
  quickLabel:   { fontSize: 9, fontFamily: fonts.bold, color: colors.mutedSoft },
  modalActions:  { flexDirection: "row", gap: 10 },
  clearBtn:      { flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 14, borderWidth: 1, borderColor: "rgba(15,23,42,0.12)", backgroundColor: "white", paddingVertical: 13 },
  clearBtnText:  { fontSize: 14, fontFamily: fonts.bold, color: colors.muted },
  saveScoreBtn:  { flex: 1.4, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 14, backgroundColor: colors.primary, paddingVertical: 13 },
  saveScoreText: { fontSize: 14, fontFamily: fonts.bold, color: "#fff" },
});

const cp = StyleSheet.create({
  card:        { backgroundColor: "white", borderRadius: 16, padding: 14, borderLeftWidth: 3, borderLeftColor: "#7c3aed", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  topRow:      { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  icon:        { width: 36, height: 36, borderRadius: 12, backgroundColor: "#ede9fe", alignItems: "center", justifyContent: "center" },
  typeBadge:   { backgroundColor: "#ede9fe", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  typeBadgeText: { fontSize: 9, fontFamily: fonts.bold, color: "#7c3aed", textTransform: "uppercase" as const, letterSpacing: 0.4 },
  title:       { fontSize: 14, fontFamily: fonts.bold, color: "#0f172a", lineHeight: 19 },
  degree:      { fontSize: 12, fontFamily: fonts.bold, color: "#7c3aed" },
  institution: { fontSize: 11, color: "#64748b", marginTop: 1 },
  date:        { fontSize: 10, color: "#94a3b8", marginTop: 2 },
  thesisBox:   { backgroundColor: "#f8fafc", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginTop: 6 },
  thesisText:  { fontSize: 11, color: "#475569", fontStyle: "italic" as const },
});

const sm = StyleSheet.create({
  root:    { flex: 1, backgroundColor: "#f8fafc" },
  header:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(15,23,42,0.08)", backgroundColor: "white" },
  closeBtn:{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" },
  title:   { fontSize: 16, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.2 },
  saveBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  saveBtnText: { color: "#fff", fontFamily: fonts.bold, fontSize: 14 },
  label:   { fontSize: 12, fontFamily: fonts.bold, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  input:   { backgroundColor: "white", borderRadius: 12, borderWidth: 1, borderColor: "rgba(15,23,42,0.1)", paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: colors.ink },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip:    { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "rgba(15,23,42,0.1)", backgroundColor: "white" },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText:   { fontSize: 13, fontFamily: fonts.bold, color: colors.muted },
  chipTextActive: { color: "#fff" },
  statusChip: { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: "rgba(15,23,42,0.1)", alignItems: "center", backgroundColor: "white" },
  statusText: { fontSize: 11, color: colors.muted },
});
