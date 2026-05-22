import {
  AlertTriangle, BookOpen, Building2, CheckCircle2,
  GraduationCap, Link2, Mail, Phone, ShieldCheck,
  Sparkles, Tag, UserRound, FileText, Globe, Edit, Medal, Award,
} from "lucide-react";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { updateProfile } from "@/app/actions";
import { LiquidAppShell } from "@/components/liquid-app-shell";
import { Avatar, Badge } from "@/components/ui";
import { LiquidCard } from "@/components/ui/liquid";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";
import { listItemsForUser } from "@/lib/workspaces";

const LEARNING_TYPES = ["bachelor", "master", "phd"] as const;
import { InstitutionSearch } from "@/components/ui/institution-search";
import { SpecialtySelect } from "@/components/ui/specialty-select";
import { AffiliationsPanel } from "@/components/profile/affiliations-panel";
import { AcademicLinksPanel, ResearchInterestsPanel } from "@/components/profile/academic-profile-panel";
import type { UserAffiliation } from "@/lib/schemas";

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/${localeParam}/login`);

  const dictionary   = getDictionary(localeParam);
  const { error, saved } = await searchParams;
  const isUk         = localeParam === "uk";
  const affiliations  = (user as { affiliations?: UserAffiliation[] }).affiliations ?? [];
  const currentAff   = affiliations.find((a) => a.isCurrent);
  const academicLinks = (user as any).academicLinks ?? {};
  const researchInterests: string[] = (user as any).researchInterests ?? [];
  const profileBio: string = (user as any).profileBio ?? "";

  const allUserItems = await listItemsForUser(user).catch(() => []);
  const completedLearningItems = allUserItems.filter(
    (it) =>
      (LEARNING_TYPES as unknown as string[]).includes(it.type) &&
      it.status === "completed" &&
      (it.fields as any)?.completion,
  );

  const filledLinksCount = Object.values(academicLinks).filter(Boolean).length;
  const interestsCount   = researchInterests.length;

  return (
    <LiquidAppShell dictionary={dictionary} locale={localeParam} user={user}>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-3xl shadow-sm">
        {/* Cover gradient */}
        <div className="relative h-32 bg-gradient-to-r from-teal-500 via-blue-500 to-violet-500">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-soft-light" />
          {/* Decorative circles */}
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute left-1/3 top-4 h-24 w-24 rounded-full bg-white/10 blur-xl" />
        </div>

        {/* Profile info */}
        <div className="border border-slate-200/80 border-t-0 rounded-b-3xl bg-white px-6 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            {/* Avatar */}
            <div className="-mt-10 shrink-0">
              <Avatar
                firstName={user.firstName}
                lastName={user.lastName}
                size="xl"
                colorClass="bg-gradient-to-br from-teal-500 via-blue-500 to-violet-500 text-white ring-4 ring-white shadow-lg"
                className="text-2xl"
              />
            </div>

            {/* Name + role + affiliation */}
            <div className="min-w-0 flex-1 pt-3 sm:pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  {user.firstName} {user.lastName}
                </h1>
                <Badge tone="blue">
                  {dictionary.roles[user.role as keyof typeof dictionary.roles]}
                </Badge>
                {user.emailVerifiedAt ? (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    {isUk ? "верифіковано" : "verified"}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    <AlertTriangle className="h-2.5 w-2.5" />
                    {isUk ? "email не підтверджено" : "email unverified"}
                  </span>
                )}
              </div>

              {/* Latin name */}
              {(user.firstNameLatin || user.lastNameLatin) && (
                <p className="mt-0.5 text-sm text-slate-400">
                  {user.firstNameLatin} {user.lastNameLatin}
                </p>
              )}

              {/* Current affiliation */}
              {currentAff ? (
                <div className="mt-2 flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                    <Building2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    {currentAff.institutionName}
                    <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                      {isUk ? "зараз" : "current"}
                    </span>
                  </div>
                  {(currentAff.parentUnitName || currentAff.unitName) && (
                    <p className="ml-5 text-xs text-slate-500">
                      {[currentAff.parentUnitName, currentAff.unitName].filter(Boolean).join(" › ")}
                    </p>
                  )}
                  {(currentAff.programName || currentAff.role || currentAff.position) && (
                    <div className="ml-5 flex flex-wrap gap-2 text-xs text-slate-400">
                      {currentAff.programName && (
                        <span className="flex items-center gap-1 text-blue-600">
                          <GraduationCap className="h-3 w-3" />
                          {currentAff.programName}
                        </span>
                      )}
                      {currentAff.role && <span>{currentAff.role}</span>}
                      {currentAff.position && <span>· {currentAff.position}</span>}
                    </div>
                  )}
                </div>
              ) : (user.position || user.affiliation) ? (
                <p className="mt-1 text-sm text-slate-500">
                  {[user.position, user.affiliation].filter(Boolean).join(" · ")}
                </p>
              ) : null}
            </div>

            {/* Right: stats pills */}
            <div className="flex flex-wrap gap-2 pb-1 sm:flex-col sm:items-end">
              {filledLinksCount > 0 && (
                <StatPill icon={<Link2 className="h-3 w-3" />} value={filledLinksCount} label={isUk ? "профілів" : "profiles"} color="blue" />
              )}
              {interestsCount > 0 && (
                <StatPill icon={<Tag className="h-3 w-3" />} value={interestsCount} label={isUk ? "інтересів" : "interests"} color="violet" />
              )}
              {affiliations.length > 0 && (
                <StatPill icon={<Building2 className="h-3 w-3" />} value={affiliations.length} label={isUk ? "місць" : "places"} color="teal" />
              )}
            </div>
          </div>

          {/* Contact row */}
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-4">
            <ContactChip icon={<Mail className="h-3.5 w-3.5" />} value={user.email} />
            {user.phone && (
              <ContactChip icon={<Phone className="h-3.5 w-3.5" />} value={user.phone} />
            )}
            {user.orcid && (
              <a
                href={`https://orcid.org/${user.orcid}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 transition hover:text-emerald-700 hover:underline"
              >
                <span className="flex h-4 w-4 items-center justify-center rounded bg-[#a6ce39] text-[8px] font-black text-white">ID</span>
                ORCID: {user.orcid}
              </a>
            )}
            {user.defaultSpecialty && (
              <ContactChip
                icon={<GraduationCap className="h-3.5 w-3.5 text-violet-500" />}
                value={user.defaultSpecialty}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Bio ──────────────────────────────────────────────────── */}
      {profileBio && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
              <FileText className="h-3.5 w-3.5 text-slate-500" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {isUk ? "Про мене" : "About"}
            </p>
          </div>
          <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">{profileBio}</p>
        </div>
      )}

      {/* ── Affiliations ─────────────────────────────────────────── */}
      <LiquidCard tint="emerald" className="space-y-4">
        <SectionHeader
          eyebrow={isUk ? "Академічний шлях" : "Academic Journey"}
          title={isUk ? "Місця навчання та роботи" : "Institutions & Affiliations"}
          icon={<Building2 className="h-4 w-4" />}
          color="#059669"
        />
        <AffiliationsPanel initial={affiliations} />
      </LiquidCard>

      {/* ── Academic Links ───────────────────────────────────────── */}
      <LiquidCard tint="blue" className="space-y-4">
        <SectionHeader
          eyebrow={isUk ? "Наукові профілі" : "Academic Profiles"}
          title={isUk ? "Платформи та бази даних" : "Platforms & Databases"}
          icon={<Link2 className="h-4 w-4" />}
          color="#0369a1"
        />
        <AcademicLinksPanel initial={academicLinks} />
      </LiquidCard>

      {/* ── Research Interests ───────────────────────────────────── */}
      <LiquidCard tint="violet" className="space-y-4">
        <SectionHeader
          eyebrow={isUk ? "Наукові інтереси" : "Research Interests"}
          title={isUk ? "Теми та напрями дослідження" : "Research Topics & Fields"}
          icon={<Tag className="h-4 w-4" />}
          color="#7c3aed"
        />
        <ResearchInterestsPanel initial={researchInterests} />
      </LiquidCard>

      {/* ── Achievements ─────────────────────────────────────────── */}
      {completedLearningItems.length > 0 && (
        <LiquidCard tint="violet" className="space-y-4">
          <SectionHeader
            eyebrow={isUk ? "Досягнення" : "Achievements"}
            title={isUk ? "Освітній шлях" : "Education path"}
            icon={<Medal className="h-4 w-4" />}
            color="#7c3aed"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {completedLearningItems.map((it) => {
              const comp = (it.fields as any).completion as Record<string, any>;
              const typeLabel: Record<string, string> = { bachelor: "Бакалавр", master: "Магістр", phd: "PhD" };
              const gradeMap: Record<string, string> = {
                A: "Відмінно", B: "Добре", C: "Добре", D: "Задовільно", E: "Задовільно",
              };
              return (
                <div key={it._id} className="rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-50/60 to-white p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-xl">
                      {it.emoji || "🎓"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[9px] font-bold text-violet-700">
                          {typeLabel[it.type] ?? it.type}
                        </span>
                        {comp.thesisGrade && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                            {comp.thesisGrade} · {gradeMap[comp.thesisGrade] ?? ""}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm font-bold leading-snug text-slate-900">{it.title}</p>
                      {comp.degreeTitle && (
                        <p className="mt-0.5 text-xs font-semibold text-violet-700">{comp.degreeTitle}</p>
                      )}
                      {comp.institution && (
                        <p className="mt-0.5 text-[11px] text-slate-500">{comp.institution}</p>
                      )}
                      {comp.completedAt && (
                        <p className="mt-1 text-[10px] text-slate-400">
                          {it.startDate && `${it.startDate} – `}{comp.completedAt}
                          {comp.diplomaNumber && ` · Диплом №${comp.diplomaNumber}`}
                        </p>
                      )}
                      {comp.thesisTitle && (
                        <p className="mt-1.5 line-clamp-2 rounded-lg bg-white/80 px-2.5 py-1.5 text-[11px] text-slate-600">
                          «{comp.thesisTitle}»
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </LiquidCard>
      )}

      {/* ── Edit form ────────────────────────────────────────────── */}
      <LiquidCard tint="teal" className="space-y-4">
        <SectionHeader
          eyebrow={isUk ? "Редагування" : "Edit profile"}
          title={isUk ? "Персональні дані" : "Personal information"}
          icon={<Edit className="h-4 w-4" />}
          color="#0f766e"
        />

        {saved && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            {dictionary.account.profileSaved}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
            {dictionary.auth.invalidError}
          </div>
        )}

        <form action={updateProfile} className="space-y-5">
          <input type="hidden" name="locale" value={localeParam} />

          {/* Name group */}
          <FormGroup title={isUk ? "Ім'я та прізвище" : "Name"}>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput label={dictionary.auth.firstName} name="firstName" defaultValue={user.firstName} />
              <TextInput label={dictionary.auth.lastName}  name="lastName"  defaultValue={user.lastName} />
              <TextInput label={dictionary.auth.firstNameLatin} name="firstNameLatin" defaultValue={user.firstNameLatin} />
              <TextInput label={dictionary.auth.lastNameLatin}  name="lastNameLatin"  defaultValue={user.lastNameLatin} />
            </div>
          </FormGroup>

          {/* Contact group */}
          <FormGroup title={isUk ? "Контакти та ідентифікатори" : "Contacts & IDs"}>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput label={isUk ? "Телефон" : "Phone"} name="phone" defaultValue={user.phone} placeholder="+380XXXXXXXXX" type="tel" />
              <TextInput label={dictionary.account.orcid} name="orcid" defaultValue={user.orcid} placeholder="0000-0000-0000-0000" />
              <TextInput label={dictionary.account.position} name="position" defaultValue={user.position} />
              <label className="space-y-1.5">
                <span className="block text-sm font-medium text-slate-700">{dictionary.account.affiliation}</span>
                <InstitutionSearch name="affiliation" defaultValue={user.affiliation} />
              </label>
            </div>
          </FormGroup>

          {/* Bio */}
          <FormGroup title={isUk ? "Біографія" : "Biography"}>
            <label className="space-y-1.5">
              <span className="block text-sm font-medium text-slate-700">{dictionary.account.profileBio}</span>
              <textarea
                name="profileBio"
                defaultValue={user.profileBio}
                rows={4}
                className="input-control min-h-24 w-full resize-y px-3 py-2.5 text-sm outline-none"
                placeholder={isUk ? "Кілька речень про вашу наукову діяльність, інтереси та досягнення…" : "A few sentences about your research, interests and achievements…"}
              />
            </label>
          </FormGroup>

          {/* Defaults */}
          <FormGroup
            title={isUk ? "Автозаповнення форм" : "Default values"}
            hint={isUk
              ? "Підставляються при створенні нових проєктів, аспірантського плану, портфоліо тощо."
              : "Pre-filled when you create new projects, PhD plans, portfolios, etc."}
            icon={<Sparkles className="h-4 w-4 text-amber-500" />}
          >
            <div className="space-y-1.5">
              <span className="block text-sm font-medium text-slate-700">
                {isUk ? "Спеціальність за замовчуванням" : "Default specialty"}
              </span>
              <SpecialtySelect name="defaultSpecialty" defaultValue={user.defaultSpecialty} />
            </div>
          </FormGroup>

          <div className="border-t border-slate-100 pt-4">
            <button type="submit" className="liquid-cta">
              <Sparkles className="h-4 w-4" />
              {dictionary.account.saveProfile}
            </button>
          </div>
        </form>
      </LiquidCard>
    </LiquidAppShell>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionHeader({
  eyebrow, title, icon, color,
}: { eyebrow: string; title: string; icon: ReactNode; color: string }) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}
      >
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>
          {eyebrow}
        </p>
        <h2 className="text-base font-bold tracking-tight text-slate-900">{title}</h2>
      </div>
    </div>
  );
}

function StatPill({
  icon, value, label, color,
}: { icon: ReactNode; value: number; label: string; color: "blue" | "violet" | "teal" }) {
  const cls = {
    blue:   "bg-blue-50 text-blue-700 border-blue-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
    teal:   "bg-teal-50 text-teal-700 border-teal-200",
  }[color];
  return (
    <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${cls}`}>
      {icon}
      {value} {label}
    </div>
  );
}

function ContactChip({ icon, value }: { icon: ReactNode; value: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-slate-500">
      <span className="text-slate-400">{icon}</span>
      {value}
    </span>
  );
}

function FormGroup({
  title, hint, icon, children,
}: { title: string; hint?: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
        {icon}
        <h3 className="text-sm font-bold text-slate-700">{title}</h3>
        {hint && <p className="ml-1 text-[11px] text-slate-400">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function TextInput({
  defaultValue, label, name, placeholder, type,
}: {
  defaultValue?: string; label: string; name: string; placeholder?: string; type?: string;
}) {
  return (
    <label className="space-y-1.5">
      <span className="block text-sm font-medium text-slate-700">{label}</span>
      <input
        name={name}
        type={type ?? "text"}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="input-control px-3 py-2 text-sm outline-none"
        required={!["orcid", "position", "phone", "firstNameLatin", "lastNameLatin"].includes(name)}
      />
    </label>
  );
}
