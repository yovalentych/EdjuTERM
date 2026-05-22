import { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Text, Alert, Platform, Modal, FlatList } from "react-native";
import * as Icons from "lucide-react-native";
import { LucideIcon } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Screen } from "@/components/screen";
import { GlassCard, GlassPill } from "@/components/glass";
import { ProfileEditorSheet } from "@/components/profile-editor-sheet";
import { colors, fonts } from "@/constants/theme";
import { apiConfig } from "@/lib/api";
import { useMobileStore, LAB_ROLE_META, type AppNotification } from "@/lib/mobile-store";

export default function ProfileScreen() {
  const {
    user, personalProfile, logoutAndClear, projects, activeProjectId, activeWorkspaceItem,
    userRole, setUserRole, hydrated, labRuns, labCourseSessions,
    courses, assessments, workspaces,
    notifications, unreadCount, fetchNotifications, markNotificationsRead,
  } = useMobileStore();
  const [editorOpen, setEditorOpen] = useState(false);
  const [notifVisible, setNotifVisible] = useState(false);
  const [profilePrompted, setProfilePrompted] = useState(false);

  useEffect(() => {
    if (!hydrated || !user || profilePrompted) return;
    if (personalProfile && !personalProfile.onboardingCompleted) {
      setProfilePrompted(true);
      setEditorOpen(true);
    }
  }, [hydrated, personalProfile, profilePrompted, user]);

  function openNotifications() {
    Haptics.selectionAsync();
    fetchNotifications();
    setNotifVisible(true);
  }

  function closeNotifications() {
    markNotificationsRead();
    setNotifVisible(false);
  }
  // Item-first з fallback на legacy MobileProject.
  const legacyProject = projects.find(p => String(p.id) === String(activeProjectId));
  const itemType = activeWorkspaceItem?.type;
  const isLab = itemType === "laboratory" || legacyProject?.projectType === "laboratory";
  const isLearn = itemType === "course" || itemType === "phd" || itemType === "bachelor" || itemType === "master";
  const project = activeWorkspaceItem
    ? {
        title: activeWorkspaceItem.title,
        acronym: activeWorkspaceItem.tags[0] ?? legacyProject?.acronym ?? "",
        roomNumber: (activeWorkspaceItem.fields as any)?.roomNumber ?? legacyProject?.roomNumber,
        safetyLevel: (activeWorkspaceItem.fields as any)?.bslLevel ?? (legacyProject as any)?.safetyLevel,
      }
    : legacyProject;
  const roleMeta = userRole ? LAB_ROLE_META[userRole] : null;

  // Stats: lab or learning context
  const completedRuns = labRuns.filter(r => r.status === "completed").length;
  const submittedSessions = labCourseSessions.filter(s => s.studentId === user?._id && (s.status === "submitted" || s.status === "graded")).length;
  const completedCourses = courses.filter(c => c.status === "completed").length;
  const totalCredits = courses.filter(c => c.status === "completed").reduce((s, c) => s + c.credits, 0);
  const gradedAssessments = assessments.filter(a => a.achievedScore !== null && a.maxScore > 0);
  const avgScore = gradedAssessments.length
    ? Math.round(gradedAssessments.reduce((s, a) => s + (a.achievedScore! / a.maxScore) * 100, 0) / gradedAssessments.length)
    : null;

  function handleLogout() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Вихід",
      "Ви впевнені, що хочете вийти?",
      [
        { text: "Скасувати", style: "cancel" },
        {
          text: "Вийти",
          style: "destructive",
          onPress: async () => {
            await logoutAndClear();
            router.replace("/login");
          },
        },
      ]
    );
  }

  return (
    <Screen>
      {/* ── Hero with avatar ring ── */}
      <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "spring" }}>
        <View style={s.heroWrap}>
          <View style={s.avatarOuter}>
            <LinearGradient
              colors={["#0f766e", "#7c3aed", "#0369a1"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={s.avatarRing}
            />
            <View style={s.avatarInner}>
              <Text style={s.avatarText}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Text>
            </View>
            {/* Status dot */}
            <View style={s.statusDot} />
          </View>

          <Text style={s.heroName}>{user?.firstName} {user?.lastName}</Text>
          <View style={s.heroEmailRow}>
            <Text style={s.heroEmail}>{user?.email}</Text>
            {user?.emailVerifiedAt ? (
              <View style={s.verifiedBadge}>
                <Icons.CheckCircle2 size={9} color="#059669" strokeWidth={2.4} />
                <Text style={s.verifiedText}>верифіковано</Text>
              </View>
            ) : (
              <View style={s.unverifiedBadge}>
                <Icons.AlertTriangle size={9} color="#d97706" strokeWidth={2.4} />
                <Text style={s.unverifiedText}>не підтв.</Text>
              </View>
            )}
          </View>

          {user?.position && (
            <View style={s.heroPhoneRow}>
              <Icons.Briefcase size={11} color={colors.muted} />
              <Text style={s.heroPhone}>{user.position}</Text>
            </View>
          )}
          {user?.affiliation && (
            <View style={s.heroPhoneRow}>
              <Icons.Building2 size={11} color={colors.muted} />
              <Text style={s.heroPhone} numberOfLines={1}>{user.affiliation}</Text>
            </View>
          )}
          {user?.phone && (
            <View style={s.heroPhoneRow}>
              <Icons.Phone size={11} color={colors.muted} />
              <Text style={s.heroPhone}>{user.phone}</Text>
            </View>
          )}

          <View style={s.heroBadges}>
            {roleMeta && (
              <View style={[s.roleBadge, { borderColor: roleMeta.color + "55", backgroundColor: roleMeta.color + "12" }]}>
                <Text style={s.roleEmoji}>{roleMeta.emoji}</Text>
                <Text style={[s.roleText, { color: roleMeta.color }]}>{roleMeta.label}</Text>
              </View>
            )}
            {user?.role === "admin" && (
              <View style={[s.roleBadge, { borderColor: "#be123c55", backgroundColor: "#be123c12" }]}>
                <Icons.ShieldCheck size={11} color="#be123c" />
                <Text style={[s.roleText, { color: "#be123c" }]}>Адмін</Text>
              </View>
            )}
          </View>

          <Pressable
            onPress={() => { Haptics.selectionAsync(); setEditorOpen(true); }}
            style={({ pressed }) => [s.editProfileBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.985 }] }]}
          >
            <Icons.Pencil size={13} color={colors.primary} strokeWidth={2.4} />
            <Text style={s.editProfileText}>Редагувати профіль</Text>
          </Pressable>
        </View>
      </MotiView>

      <GlassCard accent={personalProfile?.onboardingCompleted ? "#0f766e" : "#d97706"}>
        <View style={s.personalDbRow}>
          <View style={[s.personalDbIcon, { backgroundColor: (personalProfile?.onboardingCompleted ? "#0f766e" : "#d97706") + "16" }]}>
            <Icons.Database size={18} color={personalProfile?.onboardingCompleted ? "#0f766e" : "#d97706"} strokeWidth={2} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={s.personalDbTitle}>Персональна база</Text>
            <Text style={s.personalDbSub} numberOfLines={2}>
              {personalProfile?.onboardingCompleted
                ? `${personalProfile.institutions?.length || 0} установ · ${personalProfile.links?.length || 0} профілів · готово до автозаповнення`
                : "Заповніть анкету, щоб підтягувати дані у курси, публікації й документи."}
            </Text>
          </View>
          <Pressable onPress={() => setEditorOpen(true)} style={s.personalDbBtn}>
            <Text style={s.personalDbBtnText}>{personalProfile?.onboardingCompleted ? "Оновити" : "Заповнити"}</Text>
          </Pressable>
        </View>
      </GlassCard>

      {/* ── Quick stats ── */}
      <View style={s.statsRow}>
        {isLab ? (
          <>
            <StatCard icon={<Icons.Zap size={16} color="#0f766e" />} value={String(completedRuns)} label="Аналізів" color="#0f766e" delay={50} />
            <StatCard icon={<Icons.FlaskConical size={16} color="#7c3aed" />} value={String(submittedSessions)} label="Лабораторних" color="#7c3aed" delay={100} />
          </>
        ) : isLearn ? (
          <>
            <StatCard icon={<Icons.BookOpen size={16} color="#7c3aed" />} value={String(completedCourses)} label="Курсів" color="#7c3aed" delay={50} />
            <StatCard icon={<Icons.Award size={16} color="#0f766e" />} value={String(totalCredits)} label="Кредитів" color="#0f766e" delay={100} />
            <StatCard icon={<Icons.TrendingUp size={16} color="#d97706" />} value={avgScore !== null ? String(avgScore) : "—"} label="Ср. бал" color="#d97706" delay={150} />
          </>
        ) : (
          <>
            <StatCard icon={<Icons.Layers size={16} color={colors.primary} />} value={String(workspaces.length)} label="Просторів" color={colors.primary} delay={50} />
            <StatCard icon={<Icons.BookOpen size={16} color="#7c3aed" />} value={String(courses.length)} label="Курсів" color="#7c3aed" delay={100} />
          </>
        )}
        <StatCard icon={<Icons.Briefcase size={16} color="#0369a1" />} value={String(projects.length)} label="Проєктів" color="#0369a1" delay={150} />
      </View>

      {/* ── Active workspace ── */}
      {project && (
        <GlassCard delay={150} accent={isLab ? "#0f766e" : "#0369a1"}>
          <View style={s.rowBetween}>
            <Text style={s.sectionLabel}>АКТИВНИЙ ПРОЄКТ</Text>
            <GlassPill label="Змінити" icon="ArrowLeftRight" size="sm" tone="tinted" color={colors.primary} onPress={() => router.push("/space")} />
          </View>
          <View style={s.projectRow}>
            <View style={[s.projectIcon, { backgroundColor: (isLab ? "#0f766e" : "#0369a1") + "18" }]}>
              {isLab ? <Icons.FlaskConical size={18} color="#0f766e" /> : <Icons.Briefcase size={18} color="#0369a1" />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.projectTitle} numberOfLines={1}>{project.title}</Text>
              <Text style={s.projectMeta} numberOfLines={1}>
                {project.acronym}{project.roomNumber ? `  ·  кімн. ${project.roomNumber}` : ""}{isLab && (project as any).safetyLevel ? `  ·  ${(project as any).safetyLevel}` : ""}
              </Text>
            </View>
          </View>
        </GlassCard>
      )}

      {/* ── Role section (lab only) ── */}
      {isLab && (
        <GlassCard delay={200}>
          <View style={s.rowBetween}>
            <Text style={s.sectionLabel}>МОЯ РОЛЬ</Text>
            {userRole && (
              <Pressable onPress={() => setUserRole(null)} hitSlop={8}>
                <Text style={s.linkText}>Скинути</Text>
              </Pressable>
            )}
          </View>
          {!userRole ? (
            <Pressable onPress={() => router.replace("/home")} style={s.emptyRoleBtn}>
              <Icons.UserPlus size={14} color={colors.primary} />
              <Text style={[s.linkText, { fontSize: 13 }]}>Обрати роль у лабораторії</Text>
            </Pressable>
          ) : (
            <View style={s.roleDetailRow}>
              <Text style={s.roleEmojiLarge}>{roleMeta?.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.roleLabel}>{roleMeta?.label}</Text>
                <Text style={s.roleDesc}>{roleMeta?.description}</Text>
              </View>
            </View>
          )}
        </GlassCard>
      )}

      {/* ── Settings groups ── */}
      <Text style={s.groupHeader}>НАЛАШТУВАННЯ</Text>
      <GlassCard padding={0} delay={250}>
        <MenuItem Icon={Icons.LayoutGrid} label="Мій Простір" sub={`${projects.length} legacy + нові проєкти у одному місці`} onPress={() => router.push("/space")} />
        <Divider />
        <MenuItem Icon={Icons.Bell} label="Сповіщення" sub={unreadCount > 0 ? `${unreadCount} непрочитаних` : "Все прочитано"} badge={unreadCount} onPress={openNotifications} />
        <Divider />
        <MenuItem Icon={Icons.Shield} label="Безпека та доступ" sub="Паролі, BSL рівні" />
        <Divider />
        <MenuItem Icon={Icons.RefreshCw} label="Синхронізація" sub="Оновити дані з сервера" onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); Alert.alert("Готово", "Дані оновлено."); }} />
      </GlassCard>

      <Text style={s.groupHeader}>ДОВІДКА</Text>
      <GlassCard padding={0} delay={300}>
        <MenuItem Icon={Icons.HelpCircle} label="Допомога та FAQ" />
        <Divider />
        <MenuItem Icon={Icons.MessageSquare} label="Зворотний зв'язок" />
        <Divider />
        <MenuItem Icon={Icons.FileText} label="Умови використання" />
      </GlassCard>

      {/* ── Status / version ── */}
      <GlassCard delay={350}>
        <View style={s.rowBetween}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={s.onlineDot} />
            <Text style={s.statusText}>З'єднано</Text>
          </View>
          <Text style={s.versionText}>v1.0.4 (Build 42)</Text>
        </View>
        <Text style={s.serverText}>{apiConfig.baseUrl.replace(/^https?:\/\//, "")}</Text>
      </GlassCard>

      {/* ── Logout ── */}
      <Pressable onPress={handleLogout} style={({ pressed }) => [s.logoutBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}>
        <BlurView intensity={Platform.OS === "ios" ? 60 : 100} tint="light" style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={["rgba(190,18,60,0.08)", "rgba(190,18,60,0.18)"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Icons.LogOut size={16} color="#be123c" />
        <Text style={s.logoutText}>Вийти з профілю</Text>
      </Pressable>

      <ProfileEditorSheet
        visible={editorOpen}
        onClose={() => setEditorOpen(false)}
      />

      {/* Notifications modal */}
      <Modal visible={notifVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeNotifications}>
        <View style={s.notifModal}>
          <View style={s.notifHeader}>
            <Text style={s.notifTitle}>Сповіщення</Text>
            <Pressable onPress={closeNotifications} hitSlop={10}>
              <Icons.X size={20} color={colors.ink} />
            </Pressable>
          </View>
          <FlatList
            data={notifications}
            keyExtractor={(n) => n._id}
            contentContainerStyle={{ paddingBottom: 40 }}
            ListEmptyComponent={
              <View style={s.notifEmpty}>
                <Icons.BellOff size={32} color={colors.mutedSoft} strokeWidth={1.5} />
                <Text style={s.notifEmptyText}>Сповіщень немає</Text>
              </View>
            }
            renderItem={({ item: notif }) => (
              <View style={[s.notifRow, !notif.read && s.notifRowUnread]}>
                <View style={[s.notifDot, notif.read && { backgroundColor: "transparent" }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.notifRowTitle}>{notif.title}</Text>
                  {notif.body ? <Text style={s.notifRowBody}>{notif.body}</Text> : null}
                  <Text style={s.notifRowDate}>{new Date(notif.createdAt).toLocaleString("uk-UA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</Text>
                </View>
              </View>
            )}
          />
        </View>
      </Modal>
    </Screen>
  );
}

function StatCard({ icon, value, label, color, delay }: { icon: React.ReactNode; value: string; label: string; color: string; delay: number }) {
  return (
    <GlassCard padding={12} delay={delay} style={{ flex: 1 }}>
      <View style={[s.statIcon, { backgroundColor: color + "18" }]}>{icon}</View>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </GlassCard>
  );
}

function MenuItem({ Icon, label, sub, onPress, badge }: { Icon: LucideIcon; label: string; sub?: string; onPress?: () => void; badge?: number }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.menuItem, pressed && { backgroundColor: "rgba(15,23,42,0.04)" }]}
    >
      <View style={s.menuIcon}>
        <Icon size={17} color={colors.ink} strokeWidth={1.7} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.menuLabel}>{label}</Text>
        {sub ? <Text style={s.menuSub}>{sub}</Text> : null}
      </View>
      {badge ? (
        <View style={s.menuBadge}><Text style={s.menuBadgeText}>{badge > 99 ? "99+" : badge}</Text></View>
      ) : (
        <Icons.ChevronRight size={16} color={colors.mutedSoft} strokeWidth={2} />
      )}
    </Pressable>
  );
}

function Divider() {
  return <View style={s.divider} />;
}

const AVATAR_SIZE = 100;
const RING_SIZE = AVATAR_SIZE + 8;

const s = StyleSheet.create({
  heroWrap: { alignItems: "center", marginTop: 8, marginBottom: 14, gap: 6 },
  avatarOuter: { width: RING_SIZE, height: RING_SIZE, marginBottom: 14, alignItems: "center", justifyContent: "center" },
  avatarRing: { position: "absolute", width: RING_SIZE, height: RING_SIZE, borderRadius: RING_SIZE / 2 },
  avatarInner: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", shadowColor: "#0f766e", shadowOpacity: 0.25, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  avatarText: { fontSize: 36, fontFamily: fonts.title, color: colors.ink, letterSpacing: -1 },
  statusDot: { position: "absolute", bottom: 4, right: 4, width: 16, height: 16, borderRadius: 8, backgroundColor: "#10b981", borderWidth: 3, borderColor: "#fff" },

  heroName: { fontSize: 22, fontFamily: fonts.title, color: colors.ink, letterSpacing: -0.5 },
  heroEmailRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  heroEmail: { fontSize: 13, color: colors.muted, fontFamily: fonts.regular },
  heroPhoneRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  heroPhone: { fontSize: 12, color: colors.muted, fontFamily: fonts.semiBold },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, backgroundColor: "rgba(5,150,105,0.12)" },
  verifiedText: { fontSize: 8, fontFamily: fonts.bold, color: "#059669", letterSpacing: 0.3, textTransform: "uppercase" },
  unverifiedBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, backgroundColor: "rgba(217,119,6,0.12)" },
  unverifiedText: { fontSize: 8, fontFamily: fonts.bold, color: "#d97706", letterSpacing: 0.3, textTransform: "uppercase" },
  heroBadges: { flexDirection: "row", gap: 6, marginTop: 8, flexWrap: "wrap", justifyContent: "center" },
  editProfileBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: "rgba(15,118,110,0.12)", borderWidth: 0.5, borderColor: "rgba(15,118,110,0.25)" },
  editProfileText: { fontFamily: fonts.bold, fontSize: 12, color: colors.primary, letterSpacing: -0.1 },
  roleBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  roleEmoji: { fontSize: 12 },
  roleText: { fontSize: 11, fontFamily: fonts.bold, letterSpacing: -0.1 },

  personalDbRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  personalDbIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  personalDbTitle: { fontSize: 14, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.2 },
  personalDbSub: { fontSize: 11, color: colors.muted, lineHeight: 15 },
  personalDbBtn: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, backgroundColor: colors.primary + "14", borderWidth: 1, borderColor: colors.primary + "25" },
  personalDbBtnText: { fontSize: 11, fontFamily: fonts.bold, color: colors.primary },

  statsRow: { flexDirection: "row", gap: 8 },
  statIcon: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  statValue: { fontSize: 22, fontFamily: fonts.title, letterSpacing: -0.6 },
  statLabel: { fontSize: 10, color: colors.muted, fontFamily: fonts.bold, marginTop: 1, textTransform: "uppercase", letterSpacing: 0.5 },

  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionLabel: { fontSize: 10, fontFamily: fonts.bold, letterSpacing: 1.4, color: colors.mutedSoft, textTransform: "uppercase" },
  linkText: { fontSize: 11, fontFamily: fonts.bold, color: colors.primary },

  projectRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 },
  projectIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  projectTitle: { fontSize: 14, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.2 },
  projectMeta: { fontSize: 11, color: colors.muted, marginTop: 2 },

  emptyRoleBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 },
  roleDetailRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 6 },
  roleEmojiLarge: { fontSize: 30 },
  roleLabel: { fontSize: 15, fontFamily: fonts.bold, color: colors.ink },
  roleDesc: { fontSize: 11, color: colors.muted, marginTop: 2, lineHeight: 14 },

  groupHeader: { fontSize: 10, fontFamily: fonts.bold, letterSpacing: 1.4, color: colors.mutedSoft, textTransform: "uppercase", paddingHorizontal: 4, marginTop: 6 },

  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16, gap: 12 },
  menuIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: "rgba(100,116,139,0.1)", alignItems: "center", justifyContent: "center" },
  menuLabel: { fontSize: 14, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.2 },
  menuSub: { fontSize: 11, color: colors.muted, marginTop: 1 },
  divider: { height: 0.5, backgroundColor: "rgba(15,23,42,0.06)", marginLeft: 64 },

  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  statusText: { fontSize: 12, fontFamily: fonts.bold, color: colors.ink },
  versionText: { fontSize: 11, color: colors.mutedSoft, fontFamily: fonts.semiBold },
  serverText: { fontSize: 10, color: colors.mutedSoft, marginTop: 6, fontFamily: "monospace" },

  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: "rgba(190,18,60,0.25)", marginTop: 4 },
  logoutText: { fontSize: 14, fontFamily: fonts.bold, color: "#be123c", letterSpacing: -0.2 },
  menuBadge: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: "#be123c", alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  menuBadgeText: { fontSize: 10, fontFamily: fonts.bold, color: "#fff" },

  notifModal: { flex: 1, backgroundColor: "#f8fafc" },
  notifHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: "rgba(15,23,42,0.08)" },
  notifTitle: { fontSize: 18, fontFamily: fonts.title, color: colors.ink },
  notifEmpty: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  notifEmptyText: { fontSize: 14, color: colors.muted, fontFamily: fonts.semiBold },
  notifRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 0.5, borderBottomColor: "rgba(15,23,42,0.06)", backgroundColor: "#fff" },
  notifRowUnread: { backgroundColor: "rgba(15,118,110,0.04)" },
  notifDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6, flexShrink: 0 },
  notifRowTitle: { fontSize: 13, fontFamily: fonts.bold, color: colors.ink, marginBottom: 2 },
  notifRowBody: { fontSize: 12, color: colors.muted, lineHeight: 17 },
  notifRowDate: { fontSize: 10, color: colors.mutedSoft, marginTop: 4 },
});
