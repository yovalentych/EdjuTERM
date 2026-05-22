"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen, ChevronDown, ChevronUp, Clock, GraduationCap,
  Loader2, Pencil, Plus, Save, Trash2, UserCircle, X,
} from "lucide-react";
import { LiquidCard } from "@/components/ui/liquid";
import { MemberPicker } from "@/components/institution/person-picker";
import type {
  InstitutionCourse,
  InstitutionMember,
  InstitutionProgram,
  InstitutionUnit,
} from "@/lib/schemas";

// ─── Meta ──────────────────────────────────────────────────────────────────

const COURSE_TYPE_META: Record<string, { uk: string; en: string; color: string }> = {
  mandatory:  { uk: "Обов'язковий",   en: "Mandatory",   color: "blue" },
  elective:   { uk: "Вибірковий",     en: "Elective",    color: "violet" },
  optional:   { uk: "Факультатив",    en: "Optional",    color: "teal" },
  language:   { uk: "Мовна підгот.",  en: "Language",    color: "amber" },
  physical:   { uk: "Фіз. вих.",      en: "Physical ed", color: "emerald" },
  practice:   { uk: "Практика",       en: "Practice",    color: "orange" },
  research:   { uk: "Дослідження",    en: "Research",    color: "rose" },
};

const LANG_LABELS: Record<string, string> = {
  uk: "🇺🇦 Укр", en: "🇬🇧 Eng", de: "🇩🇪 Deu", fr: "🇫🇷 Fra", pl: "🇵🇱 Pol",
};

// ─── CoursesClient ─────────────────────────────────────────────────────────

export function CoursesClient({
  locale,
  institutionName,
  initialCourses,
  programs,
  units,
  members,
}: {
  locale: "uk" | "en";
  institutionName: string;
  initialCourses: InstitutionCourse[];
  programs: InstitutionProgram[];
  units: InstitutionUnit[];
  members: InstitutionMember[];
}) {
  const isUk = locale === "uk";
  const router = useRouter();

  const [courses, setCourses] = useState(initialCourses);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [filterProgram, setFilterProgram] = useState("");
  const [filterUnit, setFilterUnit] = useState("");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = courses;
    if (filterType) list = list.filter((c) => c.courseType === filterType);
    if (filterProgram) list = list.filter((c) => c.programId === filterProgram);
    if (filterUnit) list = list.filter((c) => c.unitId === filterUnit);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q),
      );
    }
    return list;
  }, [courses, filterType, filterProgram, filterUnit, search]);

  const totalEcts = filtered.reduce((s, c) => s + (c.ects || 0), 0);

  function onCreated(c: InstitutionCourse) {
    setCourses((p) => [c, ...p]);
    setShowForm(false);
    router.refresh();
  }

  function onUpdated(c: InstitutionCourse) {
    setCourses((p) => p.map((x) => (x._id === c._id ? c : x)));
    setEditId(null);
  }

  async function onDelete(id: string) {
    if (!confirm(isUk ? "Видалити курс?" : "Delete course?")) return;
    setCourses((p) => p.filter((x) => x._id !== id));
    await fetch(`/api/institution/courses/${id}`, { method: "DELETE" }).catch(() => {});
  }

  return (
    <div className="space-y-4">
      {/* ── Header ──────────────────────────────────────────── */}
      <LiquidCard className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-br from-blue-50/70 via-white to-violet-50/40 px-5 py-4">
          <div>
            <p className="liquid-eyebrow text-blue-700">
              {isUk ? "Каталог курсів" : "Course catalog"}
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
              {institutionName}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              {courses.length} {isUk ? "курсів" : "courses"}
              {filtered.length !== courses.length && ` · ${filtered.length} ${isUk ? "показано" : "shown"}`}
              {totalEcts > 0 && ` · ${totalEcts} ECTS`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((s) => !s)}
            className="liquid-cta text-sm"
          >
            <Plus className="h-4 w-4" />
            {showForm ? (isUk ? "Сховати" : "Hide") : (isUk ? "Новий курс" : "New course")}
          </button>
        </div>

        {/* ── Search + Filters ──────────────────────────────── */}
        <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50/30 px-5 py-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isUk ? "Пошук за назвою або кодом…" : "Search by title or code…"}
            className="input-control flex-1 min-w-[180px] rounded-lg px-3 py-1.5 text-xs"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input-control rounded-lg px-2 py-1.5 text-xs"
          >
            <option value="">{isUk ? "Усі типи" : "All types"}</option>
            {Object.entries(COURSE_TYPE_META).map(([k, v]) => (
              <option key={k} value={k}>{isUk ? v.uk : v.en}</option>
            ))}
          </select>
          {programs.length > 0 && (
            <select
              value={filterProgram}
              onChange={(e) => setFilterProgram(e.target.value)}
              className="input-control rounded-lg px-2 py-1.5 text-xs"
            >
              <option value="">{isUk ? "Усі програми" : "All programs"}</option>
              {programs.map((p) => (
                <option key={p._id} value={p._id}>{p.title}</option>
              ))}
            </select>
          )}
          {units.length > 0 && (
            <select
              value={filterUnit}
              onChange={(e) => setFilterUnit(e.target.value)}
              className="input-control rounded-lg px-2 py-1.5 text-xs"
            >
              <option value="">{isUk ? "Усі підрозділи" : "All units"}</option>
              {units.map((u) => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))}
            </select>
          )}
        </div>
      </LiquidCard>

      {/* ── Add form ─────────────────────────────────────────── */}
      {showForm && (
        <CourseForm
          locale={locale}
          programs={programs}
          units={units}
          members={members}
          onCancel={() => setShowForm(false)}
          onSaved={onCreated}
        />
      )}

      {/* ── List ─────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <LiquidCard tint="amber" className="text-center" accent>
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-amber-500" />
          <h2 className="text-base font-bold text-slate-900">
            {courses.length === 0
              ? (isUk ? "Курсів ще немає" : "No courses yet")
              : (isUk ? "Нічого не знайдено" : "Nothing found")}
          </h2>
          <p className="mt-1 max-w-sm text-xs text-slate-500 mx-auto">
            {courses.length === 0
              ? (isUk ? "Натисніть «Новий курс» щоб додати перший." : "Click «New course» to add the first one.")
              : (isUk ? "Спробуйте змінити фільтри або пошуковий запит." : "Try changing the filters or search query.")}
          </p>
        </LiquidCard>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) =>
            editId === c._id ? (
              <CourseForm
                key={c._id}
                locale={locale}
                programs={programs}
                units={units}
                members={members}
                initial={c}
                onCancel={() => setEditId(null)}
                onSaved={onUpdated}
              />
            ) : (
              <CourseRow
                key={c._id}
                course={c}
                programs={programs}
                units={units}
                members={members}
                locale={locale}
                expanded={expandedId === c._id}
                onToggle={() => setExpandedId(expandedId === c._id ? null : c._id!)}
                onEdit={() => setEditId(c._id!)}
                onDelete={() => onDelete(c._id!)}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

// ─── CourseRow ──────────────────────────────────────────────────────────────

function CourseRow({
  course, programs, units, members, locale,
  expanded, onToggle, onEdit, onDelete,
}: {
  course: InstitutionCourse;
  programs: InstitutionProgram[];
  units: InstitutionUnit[];
  members: InstitutionMember[];
  locale: "uk" | "en";
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isUk = locale === "uk";
  const meta = COURSE_TYPE_META[course.courseType] ?? COURSE_TYPE_META.mandatory;
  const program = programs.find((p) => p._id === course.programId);
  const unit = units.find((u) => u._id === course.unitId);
  const instructor = members.find((m) => m._id === course.instructorMemberId);

  return (
    <LiquidCard className="overflow-hidden p-0">
      {/* ── Main row ────────────────────────────────────────── */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => e.key === "Enter" && onToggle()}
        className="flex cursor-pointer items-center gap-3 px-4 py-3 transition hover:bg-slate-50/40"
      >
        {/* Type badge */}
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-${meta.color}-100 text-${meta.color}-700`}>
          <BookOpen className="h-4 w-4" />
        </span>

        {/* Title + code */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {course.code && (
              <span className="font-mono text-[10px] font-bold text-slate-400">{course.code}</span>
            )}
            <span className={`inline-flex rounded-full bg-${meta.color}-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-${meta.color}-700`}>
              {isUk ? meta.uk : meta.en}
            </span>
            {!course.isActive && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500">
                {isUk ? "архів" : "archived"}
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-sm font-bold text-slate-900">{course.title}</p>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {isUk ? `${course.semester} семестр · ${course.year} рік` : `Sem ${course.semester} · Year ${course.year}`}
            </span>
            <span>{course.ects} ECTS</span>
            <span>{LANG_LABELS[course.language] ?? course.language}</span>
            {program && <span><GraduationCap className="inline h-3 w-3 mr-0.5" />{program.title}</span>}
            {unit && <span>{unit.name}</span>}
          </div>
        </div>

        {/* Instructor avatar */}
        {instructor && (
          <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <UserCircle className="h-3.5 w-3.5" />
            </span>
            <span className="max-w-[120px] truncate text-[11px] text-slate-500">
              {instructor.fullName.split(" ")[0]}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()} onKeyDown={() => {}}>
          <button
            type="button"
            onClick={onEdit}
            className="rounded-md p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
            title={isUk ? "Редагувати" : "Edit"}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
            title={isUk ? "Видалити" : "Delete"}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          {expanded
            ? <ChevronUp className="h-4 w-4 text-slate-300" />
            : <ChevronDown className="h-4 w-4 text-slate-300" />}
        </div>
      </div>

      {/* ── Expanded detail ─────────────────────────────────── */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/40 px-4 py-3">
          <div className="grid gap-3 text-xs sm:grid-cols-3">
            <Detail label={isUk ? "Тип" : "Type"} value={isUk ? meta.uk : meta.en} />
            <Detail label="ECTS" value={String(course.ects)} />
            <Detail label={isUk ? "Годин" : "Hours"} value={course.hoursTotal ? String(course.hoursTotal) : "—"} />
            <Detail label={isUk ? "Семестр" : "Semester"} value={String(course.semester)} />
            <Detail label={isUk ? "Рік навчання" : "Study year"} value={String(course.year)} />
            <Detail label={isUk ? "Мова" : "Language"} value={LANG_LABELS[course.language] ?? course.language} />
            {instructor && <Detail label={isUk ? "Викладач" : "Instructor"} value={`${instructor.fullName}${instructor.title ? ` · ${instructor.title}` : ""}`} />}
            {program && <Detail label={isUk ? "Програма" : "Program"} value={`${program.title} (${program.level})`} />}
            {unit && <Detail label={isUk ? "Підрозділ" : "Unit"} value={unit.name} />}
          </div>
          {course.description && (
            <p className="mt-3 text-xs leading-5 text-slate-600 whitespace-pre-wrap">{course.description}</p>
          )}
        </div>
      )}
    </LiquidCard>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-0.5 font-semibold text-slate-800">{value}</p>
    </div>
  );
}

// ─── CourseForm ─────────────────────────────────────────────────────────────

function CourseForm({
  locale, programs, units, members, initial,
  onCancel, onSaved,
}: {
  locale: "uk" | "en";
  programs: InstitutionProgram[];
  units: InstitutionUnit[];
  members: InstitutionMember[];
  initial?: InstitutionCourse;
  onCancel: () => void;
  onSaved: (c: InstitutionCourse) => void;
}) {
  const isUk = locale === "uk";
  const isEdit = !!initial;

  const [title, setTitle]         = useState(initial?.title ?? "");
  const [code, setCode]           = useState(initial?.code ?? "");
  const [type, setType]           = useState(initial?.courseType ?? "mandatory");
  const [ects, setEcts]           = useState(initial?.ects ?? 3);
  const [hours, setHours]         = useState(initial?.hoursTotal ?? 0);
  const [semester, setSemester]   = useState(initial?.semester ?? 1);
  const [year, setYear]           = useState(initial?.year ?? 1);
  const [language, setLanguage]   = useState(initial?.language ?? "uk");
  const [programId, setProgramId] = useState(initial?.programId ?? "");
  const [unitId, setUnitId]       = useState(initial?.unitId ?? "");
  const [instructorId, setInstructorId] = useState(initial?.instructorMemberId ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isActive, setIsActive]   = useState(initial?.isActive ?? true);
  const [busy, setBusy]           = useState(false);
  const [err, setErr]             = useState<string | null>(null);

  async function submit() {
    if (!title.trim()) return;
    setBusy(true); setErr(null);
    const payload = {
      title: title.trim(), code, courseType: type,
      ects: Number(ects), hoursTotal: Number(hours),
      semester: Number(semester), year: Number(year),
      language, programId, unitId,
      instructorMemberId: instructorId,
      description, isActive,
    };
    try {
      const url = isEdit ? `/api/institution/courses/${initial!._id}` : "/api/institution/courses";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "save_failed");
      onSaved(isEdit ? { ...initial!, ...payload } : data.course);
    } catch (e: any) {
      setErr(isUk ? "Помилка збереження." : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <LiquidCard tint="blue" className="overflow-hidden p-0" accent>
      <div className="flex items-center justify-between border-b border-slate-200/60 bg-blue-50/40 px-4 py-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
          {isEdit ? (isUk ? "Редагувати курс" : "Edit course") : (isUk ? "Новий курс" : "New course")}
        </span>
        <button type="button" onClick={onCancel} className="rounded p-1 text-slate-400 hover:bg-slate-100">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-3 p-4">
        {/* Row 1: title + code */}
        <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {isUk ? "Назва курсу *" : "Course title *"}
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-control w-full rounded-lg px-3 py-2 text-sm"
              autoFocus={!isEdit}
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {isUk ? "Код" : "Code"}
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="input-control w-full rounded-lg px-3 py-2 text-sm font-mono"
              placeholder="ВН-101"
            />
          </div>
        </div>

        {/* Row 2: type, semester, year, ects, hours, language */}
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {isUk ? "Тип" : "Type"}
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              className="input-control w-full rounded-lg px-2 py-2 text-xs"
            >
              {Object.entries(COURSE_TYPE_META).map(([k, v]) => (
                <option key={k} value={k}>{isUk ? v.uk : v.en}</option>
              ))}
            </select>
          </div>
          {[
            { label: isUk ? "Сем." : "Sem", value: semester, set: setSemester, min: 1, max: 12 },
            { label: isUk ? "Рік" : "Year", value: year, set: setYear, min: 1, max: 10 },
            { label: "ECTS", value: ects, set: setEcts, min: 0, max: 60 },
            { label: isUk ? "Год." : "Hrs", value: hours, set: setHours, min: 0, max: 9999 },
          ].map(({ label, value, set, min, max }) => (
            <div key={label}>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</label>
              <input
                type="number"
                min={min}
                max={max}
                value={value}
                onChange={(e) => set(Number(e.target.value))}
                className="input-control w-full rounded-lg px-2 py-2 text-sm"
              />
            </div>
          ))}
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {isUk ? "Мова" : "Lang"}
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="input-control w-full rounded-lg px-2 py-2 text-xs"
            >
              {Object.entries(LANG_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 3: program, unit, instructor */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {isUk ? "Програма" : "Program"}
            </label>
            <select value={programId} onChange={(e) => setProgramId(e.target.value)} className="input-control w-full rounded-lg px-2 py-2 text-xs">
              <option value="">— {isUk ? "без програми" : "no program"} —</option>
              {programs.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.title}{p.academicYear ? ` (${p.academicYear})` : ""}{p.level ? ` · ${p.level.toUpperCase()}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {isUk ? "Підрозділ" : "Unit"}
            </label>
            <select value={unitId} onChange={(e) => setUnitId(e.target.value)} className="input-control w-full rounded-lg px-2 py-2 text-xs">
              <option value="">— {isUk ? "без підрозділу" : "no unit"} —</option>
              {units.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {isUk ? "Викладач" : "Instructor"}
            </label>
            <MemberPicker
              value={instructorId}
              onChange={setInstructorId}
              members={members}
              placeholder={isUk ? "Пошук за ім'ям…" : "Search by name…"}
              className="input-control w-full rounded-lg px-2 py-2 text-xs"
            />
          </div>
        </div>

        {/* Row 4: description */}
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {isUk ? "Опис (необов.)" : "Description (optional)"}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="input-control w-full rounded-lg px-3 py-2 text-sm resize-none"
            placeholder={isUk ? "Коротка анотація курсу…" : "Short course annotation…"}
          />
        </div>

        {/* Active toggle */}
        <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-600">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-3.5 w-3.5 rounded"
          />
          {isUk ? "Курс активний (відображається у каталозі)" : "Course is active (shown in catalog)"}
        </label>

        {err && <p className="text-xs text-rose-700">{err}</p>}

        {/* Submit */}
        <div className="flex gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={submit}
            disabled={busy || !title.trim()}
            className="liquid-cta text-xs disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {isEdit ? (isUk ? "Зберегти зміни" : "Save changes") : (isUk ? "Створити курс" : "Create course")}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="liquid-pill text-slate-500"
          >
            <X className="h-3.5 w-3.5" />
            {isUk ? "Скасувати" : "Cancel"}
          </button>
        </div>
      </div>
    </LiquidCard>
  );
}
