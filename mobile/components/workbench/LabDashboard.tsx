import { View, Text, Pressable } from "react-native";
import * as Icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/constants/theme";
import { lab } from "./constants";
import { s } from "./styles";

type LabModuleDef = { id: string; label: string; sub: string; icon: any; color: string; teamOnly?: boolean };

const LAB_GROUPS: { id: string; label: string; desc: string; headerColor: string; headerBg: string; Icon: any; modules: LabModuleDef[] }[] = [
  {
    id: "science", label: "НАУКА", desc: "Проведення досліджень та GLP-журнал",
    headerColor: "#7c3aed", headerBg: "#7c3aed12", Icon: Icons.FlaskConical,
    modules: [
      { id: "quick_run",      label: "Швидкий аналіз",  sub: "Одиничні замірі, авто-журнал", icon: Icons.Zap,            color: "#0f766e" },
      { id: "course_session", label: "Навчальні сесії", sub: "Методички та оцінювання",      icon: Icons.GraduationCap,  color: "#7c3aed" },
      { id: "experiments",    label: "Експерименти",    sub: "Протоколи та статуси",         icon: Icons.FlaskConical,   color: "#7c3aed" },
      { id: "glp_journal",    label: "GLP-Журнал",      sub: "Лабораторні записи",           icon: Icons.BookOpen,       color: "#0f5c50" },
      { id: "lab_tools",      label: "Калькулятори",    sub: "Розведення та розчини",        icon: Icons.Calculator,     color: "#0f766e" },
      { id: "schedule",       label: "Розклад",         sub: "Бронювання обладнання",        icon: Icons.CalendarDays,   color: "#0891b2" },
    ],
  },
  {
    id: "safety", label: "БЕЗПЕКА", desc: "GLP/GMP відповідність та доступ",
    headerColor: "#b91c1c", headerBg: "#b91c1c10", Icon: Icons.ShieldCheck,
    modules: [
      { id: "safety",        label: "Інспекції",  sub: "GLP/GMP перевірки",    icon: Icons.ShieldCheck, color: "#dc2626" },
      { id: "waste",         label: "Відходи",    sub: "Утилізація та журнал",  icon: Icons.Recycle,     color: "#0d9488" },
      { id: "access",        label: "Доступ BSL", sub: "Журнал входу/виходу",   icon: Icons.ShieldAlert, color: "#b91c1c" },
      { id: "notifications", label: "Сповіщення", sub: "Нагадування та алерти", icon: Icons.Bell,        color: "#ea580c" },
    ],
  },
  {
    id: "analytics", label: "АНАЛІТИКА", desc: "Статистика та звітність",
    headerColor: "#0284c7", headerBg: "#0284c710", Icon: Icons.ChartBarBig,
    modules: [
      { id: "analytics", label: "Дашборд", sub: "Статистика та графіки", icon: Icons.ChartBarBig, color: "#7c3aed" },
      { id: "reports",   label: "Звіти",   sub: "PDF / Share API",        icon: Icons.FileDown,    color: "#0284c7" },
    ],
  },
  {
    id: "knowledge", label: "ДОКУМЕНТИ", desc: "Бібліотека та комунікація",
    headerColor: "#1d4ed8", headerBg: "#1d4ed810", Icon: Icons.BookMarked,
    modules: [
      { id: "activity_feed", label: "Стрічка активності", sub: "Live дії в лабораторії", icon: Icons.Activity,      color: "#0f766e" },
      { id: "library",       label: "Бібліотека",         sub: "Протоколи та статті",     icon: Icons.BookMarked,    color: "#1d4ed8" },
      { id: "team_chat",     label: "Командний чат",      sub: "Спілкування команди",     icon: Icons.MessageSquare, color: "#7c3aed", teamOnly: true },
    ],
  },
];

const GENERIC_TOOLS = [
  { id: "lab_tools", title: "Лабораторія",  desc: "Калькулятори та інструменти", Icon: Icons.FlaskConical,  color: colors.primary },
  { id: "inventory", title: "Склад",        desc: "Реактиви та матеріали",       Icon: Icons.Package,       color: colors.danger },
  { id: "equipment", title: "Обладнання",   desc: "Прилади та журнали GLP",      Icon: Icons.Microscope,    color: colors.amber },
  { id: "diary",     title: "Щоденник",     desc: "Швидкі нотатки та історія",   Icon: Icons.PenLine,       color: colors.teal },
  { id: "library",   title: "Бібліотека",   desc: "Література та DOI",           Icon: Icons.BookMarked,    color: colors.blue },
  { id: "team_chat", title: "Чат",          desc: "Спілкування з групою",        Icon: Icons.MessageSquare, color: "#7c3aed", teamOnly: true },
];

function StatPill({ Icon, label, value, color, warn }: any) {
  return (
    <View style={[s.statPill, warn && { borderColor: color + "60", borderWidth: 1.5 }]}>
      <Icon size={14} color={color} strokeWidth={2} />
      <Text style={[s.statVal, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function LabModuleTile({ Icon, label, sub, color, delay, onPress }: any) {
  return (
    <MotiView
      from={{ opacity: 0, translateX: -16 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: "spring", damping: 18, delay }}
    >
      <Pressable onPress={onPress} style={({ pressed }) => [s.labRow, pressed && s.labRowPressed]}>
        <LinearGradient colors={[color + "22", color + "0c"]} style={[s.labRowIcon, { borderColor: color + "28" }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Icon size={22} color={color} strokeWidth={1.7} />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={s.labRowLabel}>{label}</Text>
          <Text style={s.labRowSub}>{sub}</Text>
        </View>
        <View style={[s.labRowChevron, { backgroundColor: color + "14" }]}>
          <Icons.ChevronRight size={14} color={color} strokeWidth={2.5} />
        </View>
      </Pressable>
    </MotiView>
  );
}

export function LabDashboard({ project, operational, inStock, expiringSoon, isTeamProject, onSelect }: any) {
  const bsl      = project?.safetyLevel || "BSL-1";
  const room     = project?.roomNumber  || "—";
  const name     = project?.title       || "Лабораторія";
  const acro     = project?.acronym     || "";
  const bslColor = bsl === "BSL-3" || bsl === "BSL-4" ? lab.danger : bsl === "BSL-2" ? lab.amber : lab.ok;

  return (
    <View style={{ gap: 20 }}>
      <LinearGradient colors={["#040e0c", lab.dark, lab.mid]} style={s.labBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={s.bannerCircle1} />
        <View style={s.bannerCircle2} />
        <View style={s.bannerTop}>
          <View style={s.labIconWrap}>
            <Icons.Beaker size={22} color={lab.soft} strokeWidth={1.5} />
          </View>
          <MotiView from={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", delay: 200 }}>
            <View style={[s.bslBadge, { borderColor: bslColor }]}>
              <Icons.Shield size={9} color={bslColor} />
              <Text style={[s.bslText, { color: bslColor }]}>{bsl}</Text>
            </View>
          </MotiView>
        </View>
        <Text style={s.labAcro}>{acro}</Text>
        <Text style={s.labName} numberOfLines={2}>{name}</Text>
        <View style={s.bannerMeta}>
          {room !== "—" && (
            <>
              <Icons.DoorOpen size={11} color={lab.soft + "70"} />
              <Text style={s.bannerMetaText}>кімн. {room}</Text>
              <View style={s.bannerDot} />
            </>
          )}
          <View style={[s.onlineDot, { backgroundColor: lab.ok }]} />
          <Text style={s.bannerMetaText}>Активна</Text>
        </View>
      </LinearGradient>

      <View style={s.statsRow}>
        <StatPill Icon={Icons.Microscope} label="Прилади"  value={String(operational)} color={lab.ok} />
        <StatPill Icon={Icons.TestTubes}  label="Реагенти" value={String(inStock)}     color={lab.accent} />
        <StatPill Icon={Icons.Clock}      label="Термін"   value={expiringSoon > 0 ? String(expiringSoon) : "✓"} color={expiringSoon > 0 ? lab.amber : lab.ok} warn={expiringSoon > 0} />
      </View>

      <View style={s.safetyNotice}>
        <Icons.ShieldCheck size={14} color={lab.mid} strokeWidth={2} />
        <Text style={s.safetyText}>Дотримуйтесь протоколів GLP/GMP. Фіксуйте всі маніпуляції в журналі.</Text>
      </View>

      {LAB_GROUPS.map((group, gi) => {
        const GroupIcon = group.Icon;
        const visibleModules = group.modules.filter(m => !m.teamOnly || isTeamProject);
        if (visibleModules.length === 0) return null;
        return (
          <View key={group.id} style={{ gap: 10 }}>
            <View style={[s.groupHeader, { backgroundColor: group.headerBg, borderColor: group.headerColor + "25" }]}>
              <View style={[s.groupHeaderIcon, { backgroundColor: group.headerColor + "20" }]}>
                <GroupIcon size={15} color={group.headerColor} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.groupHeaderLabel, { color: group.headerColor }]}>{group.label}</Text>
                <Text style={s.groupHeaderDesc}>{group.desc}</Text>
              </View>
            </View>
            {visibleModules.map((mod, i) => (
              <LabModuleTile
                key={mod.id}
                Icon={mod.icon}
                label={mod.label}
                sub={mod.sub}
                color={mod.color}
                delay={gi * 60 + i * 35}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelect(mod.id); }}
              />
            ))}
          </View>
        );
      })}
    </View>
  );
}

export function GenericDashboard({ isTeamProject, onSelect }: any) {
  return (
    <View style={{ gap: 14 }}>
      <LinearGradient colors={[colors.primary + "18", colors.primary + "06"]} style={s.genericHeader} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={s.genericHeaderIcon}>
          <Icons.LayoutDashboard size={22} color={colors.primary} strokeWidth={1.7} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.genericHeaderTitle}>Робочий стіл</Text>
          <Text style={s.genericHeaderSub}>Оберіть інструмент для роботи</Text>
        </View>
      </LinearGradient>

      <View style={{ gap: 10 }}>
        {GENERIC_TOOLS.map((tool, i) => {
          const locked = (tool as any).teamOnly && !isTeamProject;
          const ToolIcon = tool.Icon;
          return (
            <MotiView key={tool.id} from={{ opacity: 0, translateX: -16 }} animate={{ opacity: 1, translateX: 0 }} transition={{ type: "spring", damping: 18, delay: i * 45 }}>
              <Pressable
                onPress={() => !locked && (Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), onSelect(tool.id))}
                style={({ pressed }) => [
                  s.labRow,
                  { borderLeftWidth: 4, borderLeftColor: locked ? colors.border : tool.color },
                  locked && { opacity: 0.45 },
                  pressed && !locked && s.labRowPressed,
                ]}
              >
                <LinearGradient
                  colors={[tool.color + (locked ? "0a" : "20"), tool.color + "08"]}
                  style={[s.labRowIcon, { borderColor: tool.color + "20" }]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                  <ToolIcon size={22} color={locked ? colors.mutedSoft : tool.color} strokeWidth={1.7} />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={[s.labRowLabel, locked && { color: colors.mutedSoft }]}>{tool.title}</Text>
                  <Text style={s.labRowSub}>{locked ? "Тільки для командних проєктів" : tool.desc}</Text>
                </View>
                {locked
                  ? <Icons.Lock size={14} color={colors.mutedSoft} strokeWidth={2} />
                  : <View style={[s.labRowChevron, { backgroundColor: tool.color + "14" }]}>
                      <Icons.ChevronRight size={14} color={tool.color} strokeWidth={2.5} />
                    </View>
                }
              </Pressable>
            </MotiView>
          );
        })}
      </View>
    </View>
  );
}
