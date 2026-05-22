import { notFound } from "next/navigation";
import Link from "next/link";
import {
  AtSign, BookOpen, Building2, CheckCircle2, ChevronDown, ChevronRight,
  ExternalLink, FlaskConical, GraduationCap, Layers, Mail, MapPin, Phone,
  Shield, Users,
} from "lucide-react";
import { isLocale } from "@/lib/i18n";
import {
  getInstitution,
  listUnits,
  listMembers,
  listPrograms,
  listInstitutionCourses,
  listAdmins,
  getCommunityMembers,
  getCommunityStructure,
} from "@/lib/institutions-db";
import { CommunityStructureBlock } from "@/components/institution/community-structure";
import type {
  InstitutionType,
  InstitutionUnit,
  InstitutionMember,
  InstitutionMemberRole,
  InstitutionProgram,
  InstitutionCourse,
  InstitutionAdmin,
  StaffCategory,
} from "@/lib/schemas";

// ─── Lookups ──────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<InstitutionType, { uk: string; en: string }> = {
  university: { uk: "Університет",               en: "University" },
  institute:  { uk: "Інститут",                   en: "Institute" },
  academy:    { uk: "Академія",                   en: "Academy" },
  college:    { uk: "Коледж",                     en: "College" },
  school:     { uk: "Школа",                      en: "School" },
  research:   { uk: "Науково-дослідна установа",  en: "Research org" },
  other:      { uk: "Заклад",                     en: "Institution" },
};

const ROLE_LABELS: Record<InstitutionMemberRole, { uk: string; en: string }> = {
  rector:      { uk: "Ректор",              en: "Rector" },
  vice_rector: { uk: "Проректор",           en: "Vice-Rector" },
  dean:        { uk: "Декан",               en: "Dean" },
  vice_dean:   { uk: "Заст. декана",        en: "Vice-Dean" },
  head:        { uk: "Зав. кафедри",        en: "Head" },
  professor:   { uk: "Професор",            en: "Professor" },
  associate:   { uk: "Доцент",              en: "Assoc. Prof." },
  lecturer:    { uk: "Викладач",            en: "Lecturer" },
  assistant:   { uk: "Асистент",            en: "Assistant" },
  researcher:  { uk: "Наук. співробітник",  en: "Researcher" },
  staff:       { uk: "Персонал",            en: "Staff" },
  admin:       { uk: "Адмін",              en: "Admin" },
};

const LEVEL_LABELS: Record<string, { uk: string; en: string; color: string }> = {
  bachelor:    { uk: "Бакалавр",    en: "Bachelor",    color: "blue" },
  master:      { uk: "Магістр",     en: "Master",      color: "violet" },
  phd:         { uk: "Аспірантура", en: "PhD",         color: "rose" },
  post_doc:    { uk: "Постдок",     en: "Post-doc",    color: "amber" },
  certificate: { uk: "Сертифікат",  en: "Certificate", color: "teal" },
};

const UNIT_EMOJI: Partial<Record<string, string>> = {
  faculty: "🏛", institute: "🏫", department: "📚",
  division: "🔬", lab: "🧪", sector: "🔭",
  group: "👥", center: "🌐", council: "⚖️", office: "🏢",
};

const COURSE_TYPE_SHORT: Record<string, { uk: string; en: string }> = {
  mandatory: { uk: "Обов.",    en: "Req." },
  elective:  { uk: "Вибір.",   en: "Elec." },
  optional:  { uk: "Факульт.", en: "Opt." },
  practice:  { uk: "Практика", en: "Pract." },
  research:  { uk: "Дослідж.", en: "Res." },
  language:  { uk: "Мова",     en: "Lang." },
  physical:  { uk: "Фіз.вих.", en: "PE" },
};

function effectiveCategory(m: InstitutionMember): StaffCategory {
  if (m.staffCategory && m.staffCategory !== "other") return m.staffCategory as StaffCategory;
  if (["rector","vice_rector","dean","vice_dean","head"].includes(m.role)) return "leadership";
  if (["professor","associate","lecturer","assistant"].includes(m.role)) return "teaching";
  if (m.role === "researcher") return "research";
  if (m.role === "admin" || m.role === "staff") return "admin";
  return "other";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PublicInstitutionPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  const institution = await getInstitution(id).catch(() => null);
  if (!institution || institution.deletedAt) notFound();

  const isUk = locale === "uk";
  const typeLabel = TYPE_LABELS[institution.type as InstitutionType] ?? TYPE_LABELS.other;

  const [units, members, programs, courses, admins, communityMembers, communityStructure] = await Promise.all([
    listUnits(id).catch(() => []),
    listMembers(id).catch(() => []),
    listPrograms(id).catch(() => []),
    listInstitutionCourses(id).catch(() => []),
    listAdmins(id).catch(() => []),
    getCommunityMembers(id).catch(() => []),
    getCommunityStructure(id).catch(() => ({ totalUsers: 0, topUnits: [], orphanCount: 0, programs: [] })),
  ]);

  const activeMembers = members.filter((m) => m.isActive !== false);
  const activeCourses = courses.filter((c) => c.isActive !== false);
  const rootUnits = units.filter((u) => !u.parentId);

  // Group courses by program
  const coursesByProgram = new Map<string, InstitutionCourse[]>();
  for (const c of activeCourses) {
    const key = c.programId || "__none__";
    if (!coursesByProgram.has(key)) coursesByProgram.set(key, []);
    coursesByProgram.get(key)!.push(c);
  }

  // Staff by category
  const leadership = activeMembers.filter((m) => effectiveCategory(m) === "leadership");
  const teaching   = activeMembers.filter((m) => effectiveCategory(m) === "teaching");
  const research   = activeMembers.filter((m) => effectiveCategory(m) === "research");
  const otherStaff = activeMembers.filter((m) => !["leadership","teaching","research"].includes(effectiveCategory(m)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20">
      {/* Topbar */}
      <div className="border-b border-slate-200/60 bg-white/80 px-4 py-3 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href={`/${locale}`} className="text-xs font-semibold text-slate-500 hover:text-slate-900">
            ← Research Navigator
          </Link>
          <Link href={`/${locale}/register`} className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700">
            {isUk ? "Приєднатися" : "Join"}
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">

        {/* Hero */}
        <div className="rounded-2xl border border-slate-200/60 bg-white/90 p-7 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-start gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Building2 className="h-8 w-8" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                  {isUk ? typeLabel.uk : typeLabel.en}
                </span>
                {institution.isVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-700/10 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                    <CheckCircle2 className="h-3 w-3" />
                    {isUk ? "Верифіковано" : "Verified"}
                  </span>
                )}
              </div>
              <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight text-slate-950 md:text-3xl">
                {institution.name}
              </h1>
              {institution.shortName && (
                <p className="mt-1 font-mono text-sm text-slate-500">{institution.shortName}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                {(institution.city || institution.country) && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {[institution.city, institution.country].filter(Boolean).join(", ")}
                  </span>
                )}
                {institution.email && (
                  <a href={`mailto:${institution.email}`} className="inline-flex items-center gap-1.5 hover:text-emerald-700">
                    <Mail className="h-3.5 w-3.5" />{institution.email}
                  </a>
                )}
                {institution.website && (
                  <a href={institution.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-emerald-700 hover:underline">
                    <ExternalLink className="h-3.5 w-3.5" />
                    {institution.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
              </div>
              {institution.description && (
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">{institution.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <StatCard icon={<Layers className="h-5 w-5" />}       value={units.length}                      label={isUk ? "Підрозділів" : "Units"}    color="emerald" />
          <StatCard icon={<Users className="h-5 w-5" />}        value={activeMembers.length}               label={isUk ? "Персонал" : "Staff"}       color="blue" />
          <StatCard icon={<GraduationCap className="h-5 w-5" />} value={communityMembers.length}           label={isUk ? "Спільнота" : "Community"}  color="violet" />
          <StatCard icon={<GraduationCap className="h-5 w-5" />} value={programs.length}                  label={isUk ? "Програм" : "Programs"}     color="teal" />
          <StatCard icon={<BookOpen className="h-5 w-5" />}     value={activeCourses.length}               label={isUk ? "Курсів" : "Courses"}       color="amber" />
        </div>

        {/* Community structure */}
        {communityStructure.totalUsers > 0 && (
          <CommunityStructureBlock
            structure={communityStructure}
            members={communityMembers}
            isUk={isUk}
          />
        )}

        {/* Administration */}
        {admins.length > 0 && (
          <Section title={isUk ? "Адміністративний склад" : "Administration"} icon={<Shield className="h-4 w-4" />} accentColor="amber">
            <div className="divide-y divide-amber-50">
              {admins.map((a) => (
                <AdminRow key={a._id} admin={a} />
              ))}
            </div>
          </Section>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Left column */}
          <div className="space-y-6">

            {/* Structure */}
            {rootUnits.length > 0 && (
              <Section title={isUk ? "Структура" : "Structure"} icon={<Layers className="h-4 w-4" />}>
                <div className="divide-y divide-slate-100">
                  {rootUnits.map((u) => (
                    <UnitRow key={u._id} unit={u} allUnits={units} depth={0} />
                  ))}
                </div>
              </Section>
            )}

            {/* Courses */}
            {activeCourses.length > 0 && (
              <Section title={isUk ? "Навчальні курси" : "Courses"} icon={<BookOpen className="h-4 w-4" />}>
                <div className="divide-y divide-slate-100">
                  {Array.from(coursesByProgram.entries()).map(([progId, list]) => {
                    const prog = programs.find((p) => p._id === progId);
                    return (
                      <div key={progId}>
                        {prog && (
                          <div className="flex items-center gap-2 bg-slate-50/60 px-4 py-2">
                            <GraduationCap className="h-3.5 w-3.5 text-violet-600" />
                            <span className="text-xs font-bold text-slate-700">{prog.title}</span>
                            {prog.academicYear && (
                              <span className="rounded bg-slate-200/60 px-1.5 py-0.5 text-[9px] font-mono text-slate-500">{prog.academicYear}</span>
                            )}
                          </div>
                        )}
                        {list.map((c) => <CourseRow key={c._id} course={c} isUk={isUk} />)}
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

          </div>

          {/* Right column */}
          <div className="space-y-6">

            {/* Programs */}
            {programs.length > 0 && (
              <Section title={isUk ? "Освітні програми" : "Programs"} icon={<GraduationCap className="h-4 w-4" />}>
                <div className="space-y-2 p-3">
                  {programs.map((p) => {
                    const lv = LEVEL_LABELS[p.level] ?? LEVEL_LABELS.bachelor;
                    return (
                      <div key={p._id} className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5">
                        <p className="text-sm font-bold text-slate-900">{p.title}</p>
                        <div className="mt-1 flex flex-wrap gap-1.5 text-[10px]">
                          <span className={`rounded-md bg-${lv.color}-100 px-1.5 py-0.5 font-bold text-${lv.color}-700`}>
                            {isUk ? lv.uk : lv.en}
                          </span>
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-slate-500">{p.ects} ECTS · {p.durationYears} {isUk ? "р." : "yr."}</span>
                          {p.academicYear && <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-slate-400">{p.academicYear}</span>}
                          {p.specialty && <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-blue-700">{p.specialty}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* Staff by category */}
            {leadership.length > 0 && (
              <StaffSection title={isUk ? "Керівництво" : "Leadership"} members={leadership} units={units} isUk={isUk} color="violet" icon={<Shield className="h-4 w-4" />} />
            )}
            {teaching.length > 0 && (
              <StaffSection title={isUk ? "Викладачі" : "Teaching staff"} members={teaching} units={units} isUk={isUk} color="emerald" icon={<GraduationCap className="h-4 w-4" />} />
            )}
            {research.length > 0 && (
              <StaffSection title={isUk ? "Науковці" : "Researchers"} members={research} units={units} isUk={isUk} color="blue" icon={<FlaskConical className="h-4 w-4" />} />
            )}
            {otherStaff.length > 0 && (
              <StaffSection title={isUk ? "Персонал" : "Staff"} members={otherStaff} units={units} isUk={isUk} color="slate" icon={<Users className="h-4 w-4" />} />
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: number; label: string; color: string }) {
  const cls: Record<string, string> = {
    emerald: "border-emerald-200 bg-emerald-50/60 text-emerald-700",
    blue:    "border-blue-200 bg-blue-50/60 text-blue-700",
    violet:  "border-violet-200 bg-violet-50/60 text-violet-700",
    amber:   "border-amber-200 bg-amber-50/60 text-amber-700",
    teal:    "border-teal-200 bg-teal-50/60 text-teal-700",
  };
  return (
    <div className={`rounded-2xl border p-4 ${cls[color] ?? cls.blue}`}>
      <div className="flex items-center gap-2 opacity-70">{icon}<span className="text-[10px] font-bold uppercase tracking-wider">{label}</span></div>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

function Section({
  title, icon, children, accentColor,
}: {
  title: string; icon: React.ReactNode; children: React.ReactNode; accentColor?: string;
}) {
  const headerBg = accentColor === "amber"
    ? "bg-gradient-to-r from-amber-500/10 to-orange-500/5 border-amber-200/60"
    : accentColor === "violet"
      ? "bg-gradient-to-r from-violet-500/10 to-purple-500/5 border-violet-200/60"
      : "bg-slate-50/60 border-slate-100";
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/90 shadow-sm">
      <div className={`flex items-center gap-2 border-b px-4 py-3 ${headerBg}`}>
        <span className={accentColor === "amber" ? "text-amber-600" : accentColor === "violet" ? "text-violet-600" : "text-slate-500"}>{icon}</span>
        <h2 className="text-sm font-bold text-slate-800">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function AdminRow({ admin }: { admin: InstitutionAdmin }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50/30">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-900">{admin.fullName}</p>
        <p className="text-[11px] text-amber-700">{admin.position}</p>
        {admin.title && <p className="text-[10px] text-slate-400">{admin.title}</p>}
      </div>
      <div className="flex flex-col items-end gap-0.5 text-[10px] text-slate-400">
        {admin.email && (
          <a href={`mailto:${admin.email}`} className="inline-flex items-center gap-1 hover:text-emerald-700">
            <Mail className="h-3 w-3" />{admin.email}
          </a>
        )}
        {admin.phone && (
          <span className="inline-flex items-center gap-1">
            <Phone className="h-3 w-3" />{admin.phone}
          </span>
        )}
      </div>
    </div>
  );
}

function UnitRow({ unit, allUnits, depth }: { unit: InstitutionUnit; allUnits: InstitutionUnit[]; depth: number }) {
  const children = allUnits.filter((u) => u.parentId === unit._id);
  return (
    <>
      <div className="flex items-center gap-2 py-2.5 hover:bg-slate-50/60" style={{ paddingLeft: `${16 + depth * 20}px`, paddingRight: "16px" }}>
        <span className="text-base">{UNIT_EMOJI[unit.type] ?? "📁"}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800">{unit.name}</p>
          {unit.head && <p className="text-[10px] text-slate-400">{unit.head}</p>}
        </div>
        {unit.shortName && (
          <span className="shrink-0 font-mono text-[10px] text-slate-400">{unit.shortName}</span>
        )}
      </div>
      {children.map((c) => (
        <UnitRow key={c._id} unit={c} allUnits={allUnits} depth={depth + 1} />
      ))}
    </>
  );
}

function CourseRow({ course, isUk }: { course: InstitutionCourse; isUk: boolean }) {
  const typeLabel = COURSE_TYPE_SHORT[course.courseType];
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50/40">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {course.code && <span className="font-mono text-[9px] text-slate-400">{course.code}</span>}
          {typeLabel && (
            <span className="rounded bg-slate-100 px-1 py-0.5 text-[9px] font-bold text-slate-500">
              {isUk ? typeLabel.uk : typeLabel.en}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm font-semibold text-slate-800">{course.title}</p>
      </div>
      <div className="shrink-0 text-right text-[10px] text-slate-400">
        <p>{course.ects} ECTS</p>
        <p>{isUk ? `${course.semester} сем.` : `Sem ${course.semester}`}</p>
      </div>
    </div>
  );
}

function StaffSection({
  title, members, units, isUk, color, icon,
}: {
  title: string;
  members: InstitutionMember[];
  units: InstitutionUnit[];
  isUk: boolean;
  color: string;
  icon: React.ReactNode;
}) {
  const colorMap: Record<string, string> = {
    violet: "text-violet-500",
    emerald: "text-emerald-500",
    blue: "text-blue-500",
    slate: "text-slate-400",
  };
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/90 shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-3">
        <span className={colorMap[color] ?? "text-slate-400"}>{icon}</span>
        <h2 className="text-sm font-bold text-slate-800">{title}</h2>
        <span className="ml-auto text-xs text-slate-400">{members.length}</span>
      </div>
      <div className="divide-y divide-slate-100">
        {members.slice(0, 15).map((m) => (
          <MemberRow key={m._id} member={m} units={units} isUk={isUk} />
        ))}
        {members.length > 15 && (
          <p className="px-4 py-2 text-xs text-slate-400">
            {isUk ? `і ще ${members.length - 15} осіб` : `and ${members.length - 15} more`}
          </p>
        )}
      </div>
    </div>
  );
}

function MemberRow({ member, units, isUk }: { member: InstitutionMember; units: InstitutionUnit[]; isUk: boolean }) {
  const unit = units.find((u) => u._id === member.unitId);
  const role = ROLE_LABELS[member.role];
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50/40">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500">
        {member.fullName.charAt(0)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">{member.fullName}</p>
        <p className="truncate text-[10px] text-slate-400">
          {[member.title, isUk ? role?.uk : role?.en, unit?.shortName || unit?.name].filter(Boolean).join(" · ")}
        </p>
      </div>
      {member.orcid && (
        <a
          href={`https://orcid.org/${member.orcid}`}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 inline-flex items-center gap-0.5 font-mono text-[9px] text-emerald-600 hover:underline"
        >
          <AtSign className="h-3 w-3" />ORCID
        </a>
      )}
    </div>
  );
}
