import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { MotiView } from "moti";
import * as Icons from "lucide-react-native";
import { GlassCard } from "@/components/glass";
import { apiRequest } from "@/lib/api";
import { useMobileStore } from "@/lib/mobile-store";
import { colors, fonts } from "@/constants/theme";

type Member = {
  _id: string;
  courseId: string;
  fullName: string;
  email: string;
  studentId?: string;
  group?: string;
  role: string;
};
type AttendanceStatus = "present" | "absent" | "excused" | "late" | "online";
type AttendanceRec = {
  _id: string;
  sessionId: string;
  courseId: string;
  memberId: string;
  status: AttendanceStatus;
  grade: number | null;
  notes?: string;
};

const STATUS_META: Record<AttendanceStatus | "none", { label: string; color: string; icon: string }> = {
  present: { label: "Присутній", color: "#059669", icon: "CheckCircle2" },
  absent:  { label: "Відсутній", color: "#be123c", icon: "XCircle" },
  excused: { label: "Поважна",   color: "#d97706", icon: "UserMinus" },
  late:    { label: "Запізн.",   color: "#d97706", icon: "Clock" },
  online:  { label: "Онлайн",    color: "#0369a1", icon: "Wifi" },
  none:    { label: "—",          color: colors.mutedSoft, icon: "Circle" },
};

export function MyJournalView() {
  const { user, authToken, courses, sessions, activeProjectId } = useMobileStore();
  const [members, setMembers] = useState<Member[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRec[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !activeProjectId) return;
    void load();
  }, [user, activeProjectId]);

  async function load() {
    setLoading(true);
    try {
      const myEmail = (user?.email || "").toLowerCase();

      // 1) members project-wide
      const memRes = await apiRequest<{ members: Member[] }>(
        `/api/learning/members?projectId=${activeProjectId}`,
        { token: authToken || undefined },
      );
      const mine = (memRes.members || []).filter(
        (m) => (m.email || "").toLowerCase() === myEmail,
      );
      setMembers(mine);

      // 2) attendance for each of my courses
      const allRecs: AttendanceRec[] = [];
      for (const m of mine) {
        try {
          const attRes = await apiRequest<{ records: AttendanceRec[] }>(
            `/api/learning/attendance?courseId=${m.courseId}`,
            { token: authToken || undefined },
          );
          // лиш мої
          allRecs.push(...(attRes.records || []).filter((r) => r.memberId === m._id));
        } catch {
          // ignore per-course failure
        }
      }
      setAttendance(allRecs);
    } catch (e) {
      console.error("[my-journal] failed", e);
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const total = attendance.length;
    const attended = attendance.filter((r) => r.status === "present" || r.status === "online" || r.status === "late").length;
    const grades = attendance.map((r) => r.grade).filter((g): g is number => g != null);
    const avg = grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : null;
    return {
      total,
      attended,
      pct: total > 0 ? Math.round((attended / total) * 100) : 0,
      avgGrade: avg,
    };
  }, [attendance]);

  const rows = useMemo(() => {
    return attendance
      .map((r) => {
        const s = sessions.find((x) => x._id === r.sessionId);
        const c = courses.find((x) => x._id === r.courseId);
        return { rec: r, session: s, course: c };
      })
      .filter((x) => x.session)
      .sort((a, b) => (b.session!.date || "").localeCompare(a.session!.date || ""));
  }, [attendance, sessions, courses]);

  if (loading && members.length === 0) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={colors.primary} />
        <Text style={s.loadingText}>Завантажуємо ваш журнал…</Text>
      </View>
    );
  }

  if (members.length === 0) {
    return (
      <GlassCard padding={20}>
        <View style={{ alignItems: "center", gap: 8 }}>
          <Text style={{ fontSize: 36 }}>🎓</Text>
          <Text style={s.emptyTitle}>Ви не зараховані</Text>
          <Text style={s.emptyText}>
            У жодному курсі цього проєкту немає вашого email ({user?.email}).
            Якщо ви викладач — використайте електронний журнал на веб-версії, щоб додавати учасників і ставити відвідуваність.
          </Text>
          <View style={s.teacherHint}>
            <Icons.Info size={11} color={colors.primary} />
            <Text style={s.teacherHintText}>
              Викладацький режим повноцінно працює у вебзастосунку
            </Text>
          </View>
        </View>
      </GlassCard>
    );
  }

  return (
    <View style={{ gap: 14 }}>
      {/* Stats */}
      <View style={s.statsRow}>
        <GlassCard padding={12} style={{ flex: 1 }}>
          <View style={[s.statIcon, { backgroundColor: "#059669" + "18" }]}>
            <Icons.CheckCircle2 size={14} color="#059669" />
          </View>
          <Text style={[s.statValue, { color: "#059669" }]}>{stats.pct}%</Text>
          <Text style={s.statLabel}>Відвідуваність</Text>
          <Text style={s.statSub}>{stats.attended}/{stats.total}</Text>
        </GlassCard>
        <GlassCard padding={12} style={{ flex: 1 }}>
          <View style={[s.statIcon, { backgroundColor: "#7c3aed" + "18" }]}>
            <Icons.Award size={14} color="#7c3aed" />
          </View>
          <Text style={[s.statValue, { color: "#7c3aed" }]}>
            {stats.avgGrade != null ? stats.avgGrade.toFixed(1) : "—"}
          </Text>
          <Text style={s.statLabel}>Середній бал</Text>
        </GlassCard>
        <GlassCard padding={12} style={{ flex: 1 }}>
          <View style={[s.statIcon, { backgroundColor: colors.primary + "18" }]}>
            <Icons.BookOpen size={14} color={colors.primary} />
          </View>
          <Text style={[s.statValue, { color: colors.primary }]}>{members.length}</Text>
          <Text style={s.statLabel}>Курсів</Text>
        </GlassCard>
      </View>

      {/* My sessions list */}
      <GlassCard padding={0}>
        <View style={s.listHeader}>
          <Icons.ClipboardList size={14} color={colors.primary} strokeWidth={2.2} />
          <Text style={s.listTitle}>МОЇ ПАРИ</Text>
        </View>

        {rows.length === 0 ? (
          <Text style={s.empty}>Ще немає записів про відвідуваність.</Text>
        ) : (
          rows.slice(0, 20).map(({ rec, session, course }) => {
            const meta = STATUS_META[rec.status];
            const Icon = (Icons as any)[meta.icon] as React.ComponentType<{ size: number; color: string }>;
            return (
              <MotiView
                key={rec._id}
                from={{ opacity: 0, translateY: 4 }}
                animate={{ opacity: 1, translateY: 0 }}
                style={s.row}
              >
                <View style={[s.statusBox, { backgroundColor: meta.color + "18" }]}>
                  {Icon ? <Icon size={14} color={meta.color} /> : null}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.rowTitle} numberOfLines={1}>
                    {session?.title || "Сесія"}
                  </Text>
                  <Text style={s.rowMeta} numberOfLines={1}>
                    {session?.date} · {session?.startTime}–{session?.endTime}
                    {course ? ` · ${course.code || course.title.slice(0, 20)}` : ""}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[s.statusText, { color: meta.color }]}>{meta.label}</Text>
                  {rec.grade != null && (
                    <Text style={s.gradeText}>{rec.grade}/100</Text>
                  )}
                </View>
              </MotiView>
            );
          })
        )}
      </GlassCard>
    </View>
  );
}

const s = StyleSheet.create({
  center: { alignItems: "center", gap: 12, paddingVertical: 40 },
  loadingText: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },

  emptyTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  emptyText: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, textAlign: "center", lineHeight: 18 },
  teacherHint: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: 6, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 10, backgroundColor: colors.primary + "12",
    borderWidth: 0.5, borderColor: colors.primary + "30",
  },
  teacherHintText: { fontFamily: fonts.semiBold, fontSize: 11, color: colors.primary, letterSpacing: -0.1, flexShrink: 1 },

  statsRow: { flexDirection: "row", gap: 8 },
  statIcon: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  statValue: { fontFamily: fonts.title, fontSize: 22, letterSpacing: -0.6 },
  statLabel: { fontFamily: fonts.bold, fontSize: 10, color: colors.ink, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 },
  statSub: { fontFamily: fonts.regular, fontSize: 10, color: colors.muted, marginTop: 1 },

  listHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 12 },
  listTitle: { fontFamily: fonts.bold, fontSize: 10, color: colors.ink, letterSpacing: 1.2 },

  empty: { paddingVertical: 24, fontFamily: fonts.regular, fontSize: 12, color: colors.muted, textAlign: "center" },

  row: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(15,23,42,0.06)",
  },
  statusBox: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rowTitle: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
  rowMeta: { fontFamily: fonts.regular, fontSize: 10.5, color: colors.muted, marginTop: 1 },
  statusText: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: -0.1 },
  gradeText: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink, marginTop: 1, fontVariant: ["tabular-nums"] },
});
