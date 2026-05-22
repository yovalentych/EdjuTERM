"use client";

import { useState, useEffect } from "react";
import {
  BookOpen,
  Beaker,
  Microscope,
  Building2,
  GraduationCap,
  Globe,
  Lock,
  Users,
  CheckCircle2,
  Circle,
  ChevronRight,
  Sparkles,
  CalendarDays,
  Database,
  FlaskConical,
  Clock,
  ShieldAlert,
  Search,
  UserPlus,
  X,
  Layers,
  Shield,
  Activity,
  DoorOpen,
} from "lucide-react";
import { createProjectWithTemplate } from "@/app/actions";
import { InstitutionSearch } from "@/components/ui/institution-search";
import type { Dictionary, Locale } from "@/lib/i18n";
import { 
  PROJECT_TEMPLATES, 
  type TemplateId 
} from "@/lib/project-templates";
import { SpecialtySelect } from "@/components/ui/specialty-select";

const inputCls = "input-control px-4 py-2.5 text-sm outline-none w-full border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all";

interface WizardData {
  title: string;
  acronym: string;
  grantProgram: string;
  summary: string;
  startDate: string;
  endDate: string;
  projectType: string;
  researchField: string;
  defaultLocale: string;
  visibility: string;
  dataPolicy: string;
  repositoryPlan: string;
  ethicsReview: string;
  template: TemplateId;
  // Laboratory specific
  roomNumber: string;
  labCategory: string;
  safetyLevel: string;
  accessPolicy: string;
  institution: string;
  responsiblePersonIds: string[];
}

export function ProjectWizard({
  dictionary,
  locale,
  userDefaults,
}: {
  dictionary: Dictionary;
  locale: Locale;
  userDefaults?: { specialty?: string; institution?: string };
}) {
  const isUk = locale === "uk";
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>({
    title: "",
    acronym: "",
    grantProgram: "",
    summary: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    projectType: "fundamental",
    researchField: userDefaults?.specialty ?? "",
    defaultLocale: locale,
    visibility: "private",
    dataPolicy: "embargo_then_open",
    repositoryPlan: "github_zenodo",
    ethicsReview: "planned",
    template: "phd_dissertation",
    // Lab defaults
    roomNumber: "",
    labCategory: "general",
    safetyLevel: "BSL-1",
    accessPolicy: "private",
    institution: userDefaults?.institution ?? "",
    responsiblePersonIds: [],
  });

  const set = <K extends keyof WizardData>(key: K, value: WizardData[K]) => {
    setData((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "projectType") {
        if (value === "laboratory") next.template = "laboratory_resource";
        else if (value === "dissertation") next.template = "phd_dissertation";
      }
      return next;
    });
  };

  const isLab = data.projectType === "laboratory";

  const step1Valid =
    data.title.trim().length >= 3 &&
    data.acronym.trim().length >= 2;

  const step2Valid = isLab ? (data.institution.trim().length >= 2 && data.roomNumber.trim().length >= 1) : (data.researchField.length > 0 && data.institution.trim().length >= 2);

  const grantProgramLabel =
    data.projectType === "grant"
      ? (isUk ? "Грантова програма" : "Grant Program")
      : data.projectType === "dissertation"
      ? (isUk ? "Університет / Кафедра" : "University / Department")
      : (isUk ? "Установа (Організація)" : "Institution");

  return (
    <div className="mx-auto max-w-3xl">
      <nav className="mb-8 flex items-center justify-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
                step === s
                  ? "bg-blue-600 text-white ring-4 ring-blue-100"
                  : step > s
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-200 text-slate-400"
              }`}
            >
              {step > s ? <CheckCircle2 className="h-5 w-5" /> : s}
            </div>
            {s < 4 && <div className={`h-1 w-8 sm:w-16 mx-1 rounded-full ${step > s ? "bg-emerald-500" : "bg-slate-200"}`} />}
          </div>
        ))}
      </nav>

      <form action={createProjectWithTemplate}>
        {/* Hidden internal fields for form submission */}
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="title" value={data.title} />
        <input type="hidden" name="acronym" value={data.acronym} />
        <input type="hidden" name="projectType" value={data.projectType} />
        <input type="hidden" name="researchField" value={data.researchField} />
        <input type="hidden" name="template" value={data.template} />
        <input type="hidden" name="visibility" value={data.visibility} />
        <input type="hidden" name="defaultLocale" value={data.defaultLocale} />
        <input type="hidden" name="dataPolicy" value={data.dataPolicy} />
        <input type="hidden" name="repositoryPlan" value={data.repositoryPlan} />
        <input type="hidden" name="ethicsReview" value={data.ethicsReview} />
        <input type="hidden" name="labCategory" value={data.labCategory} />
        <input type="hidden" name="safetyLevel" value={data.safetyLevel} />
        <input type="hidden" name="accessPolicy" value={data.accessPolicy} />
        <input type="hidden" name="institution" value={data.institution} />
        <input type="hidden" name="roomNumber" value={data.roomNumber} />
        {data.responsiblePersonIds.map(id => <input key={id} type="hidden" name="responsiblePersonIds" value={id} />)}

        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="text-center">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                {isUk ? "Створення нового простору" : "Create new workspace"}
              </h1>
              <p className="text-slate-500 mt-2 text-lg">{isUk ? "Оберіть формат вашої діяльності" : "Choose the format of your activity"}</p>
            </header>

            <div className="grid gap-4 sm:grid-cols-2">
              <TypeCard
                id="laboratory"
                icon={FlaskConical}
                title={isUk ? "Лабораторія" : "Laboratory"}
                desc={isUk ? "Фізичний простір: склад, прилади, журнали GLP" : "Physical space: inventory, equipment, GLP logs"}
                active={data.projectType === "laboratory"}
                onSelect={() => set("projectType", "laboratory")}
                tone="rose"
              />
              <TypeCard
                id="dissertation"
                icon={GraduationCap}
                title={isUk ? "Дисертація" : "Dissertation"}
                desc={isUk ? "PhD дослідження, план навчання та публікації" : "PhD research, learning plan and publications"}
                active={data.projectType === "dissertation"}
                onSelect={() => set("projectType", "dissertation")}
                tone="violet"
              />
              <TypeCard
                id="grant"
                icon={Building2}
                title={isUk ? "Грантовий проєкт" : "Grant Project"}
                desc={isUk ? "Бюджет, фінансова звітність та етапи НДР" : "Budget, financial reporting and research stages"}
                active={data.projectType === "grant"}
                onSelect={() => set("projectType", "grant")}
                tone="emerald"
              />
              <TypeCard
                id="fundamental"
                icon={Microscope}
                title={isUk ? "Науковий проєкт" : "Research Project"}
                desc={isUk ? "Довільна структура, доказова база та дані" : "Custom structure, evidence base and data"}
                active={data.projectType === "fundamental"}
                onSelect={() => set("projectType", "fundamental")}
                tone="blue"
              />
            </div>

            <div className="surface p-6 shadow-sm border-slate-200/60 space-y-5">
               <Field label={isLab ? (isUk ? "Повна назва Лабораторії" : "Full Laboratory Name") : (isUk ? "Повна назва проєкту" : "Full Project Title")}>
                  <input
                    className={inputCls}
                    autoFocus
                    placeholder={isLab ? (isUk ? "Лабораторія молекулярної генетики" : "Molecular Genetics Lab") : (isUk ? "Вплив ШІ на..." : "Impact of AI on...")}
                    value={data.title}
                    onChange={(e) => set("title", e.target.value)}
                  />
               </Field>
               <div className="max-w-xs">
                  <Field label={isUk ? "Акронім (Код / Префікс)" : "Acronym / Prefix"}>
                    <input
                      className={`${inputCls} font-mono uppercase text-center text-lg tracking-widest`}
                      placeholder="MGL-LAB"
                      maxLength={12}
                      value={data.acronym}
                      onChange={(e) => set("acronym", e.target.value)}
                    />
                  </Field>
               </div>
            </div>

            <Footer 
              isUk={isUk} 
              onNext={() => setStep(2)} 
              nextDisabled={!step1Valid} 
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <header>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {isLab ? (isUk ? "Параметри приміщення" : "Facility settings") : (isUk ? "Деталі дослідження" : "Research details")}
              </h2>
              <p className="text-slate-500">{isUk ? "Вкажіть базову інформацію про об'єкт" : "Provide basic information about the facility"}</p>
            </header>

            <div className="surface p-8 space-y-8">
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label={grantProgramLabel}>
                  <InstitutionSearch
                    value={data.institution}
                    onChange={(v) => set("institution", v)}
                    placeholder={isUk ? "Введіть назву установи..." : "Enter institution name..."}
                  />
                </Field>
                {isLab && (
                  <Field label={isUk ? "Номер кімнати / Бокс" : "Room / Box Number"}>
                    <div className="relative">
                      <DoorOpen className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input 
                        className={`${inputCls} pl-10`}
                        placeholder={isUk ? "к. 412" : "Room 412"} 
                        value={data.roomNumber}
                        onChange={e => set("roomNumber", e.target.value)}
                      />
                    </div>
                  </Field>
                )}
              </div>

              {isLab ? (
                <div className="space-y-8">
                  <div className="grid gap-6 sm:grid-cols-3">
                    <Field label={isUk ? "Категорія" : "Category"}>
                      <select className={inputCls} value={data.labCategory} onChange={e => set("labCategory", e.target.value)}>
                        <option value="general">{isUk ? "Загальна" : "General"}</option>
                        <option value="biological">{isUk ? "Біологічна" : "Biological"}</option>
                        <option value="chemical">{isUk ? "Хімічна" : "Chemical"}</option>
                        <option value="analytical">{isUk ? "Аналітична" : "Analytical"}</option>
                        <option value="clinical">{isUk ? "Клінічна" : "Clinical"}</option>
                      </select>
                    </Field>
                    <Field label={isUk ? "Рівень безпеки" : "Safety"}>
                      <select className={inputCls} value={data.safetyLevel} onChange={e => set("safetyLevel", e.target.value)}>
                        <option value="BSL-1">BSL-1 (Low)</option>
                        <option value="BSL-2">BSL-2 (Med)</option>
                        <option value="BSL-3">BSL-3 (High)</option>
                      </select>
                    </Field>
                    <Field label={isUk ? "Доступ" : "Access"}>
                      <select className={inputCls} value={data.accessPolicy} onChange={e => set("accessPolicy", e.target.value)}>
                        <option value="private">{isUk ? "Закрита" : "Private"}</option>
                        <option value="request">{isUk ? "За запитом" : "Request"}</option>
                        <option value="public">{isUk ? "Публічна" : "Public"}</option>
                      </select>
                    </Field>
                  </div>

                  <ResponsiblePersonPicker 
                    isUk={isUk} 
                    selectedIds={data.responsiblePersonIds} 
                    onUpdate={ids => set("responsiblePersonIds", ids)} 
                  />
                </div>
              ) : (
                <>
                  <Field label={isUk ? "Спеціальність (1021)" : "Specialty"}>
                    <SpecialtySelect value={data.researchField} onChange={v => set("researchField", v)} />
                  </Field>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <Field label={isUk ? "Дата початку" : "Start date"}>
                      <input name="startDate" type="date" className={inputCls} value={data.startDate} onChange={e => set("startDate", e.target.value)} />
                    </Field>
                    <Field label={isUk ? "Дата завершення" : "End date"}>
                      <input name="endDate" type="date" className={inputCls} value={data.endDate} onChange={e => set("endDate", e.target.value)} />
                    </Field>
                  </div>
                </>
              )}
            </div>

            <Footer 
              isUk={isUk} 
              onBack={() => setStep(1)} 
              onNext={() => setStep(3)} 
              nextDisabled={!step2Valid} 
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
             <header>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {isUk ? "Шаблон структури" : "Workspace template"}
              </h2>
              <p className="text-slate-500">{isUk ? "Початкове налаштування фаз роботи" : "Initial configuration of workflow phases"}</p>
            </header>
            <div className="grid gap-4">
               {Object.values(PROJECT_TEMPLATES).filter(t => isLab ? t.id === "laboratory_resource" : t.id !== "laboratory_resource").map(t => (
                 <TemplateCard 
                   key={t.id} 
                   template={t} 
                   isUk={isUk} 
                   active={data.template === t.id} 
                   onSelect={() => set("template", t.id)} 
                 />
               ))}
            </div>
            <Footer isUk={isUk} onBack={() => setStep(2)} onNext={() => setStep(4)} />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <header className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
                <Sparkles className="h-10 w-10" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                {isUk ? "Все готово до запуску!" : "Ready to launch!"}
              </h2>
            </header>

            <div className="surface p-8 space-y-6 border-emerald-100 bg-emerald-50/10">
               <SummaryRow label={isUk ? "Назва" : "Name"} value={data.title} />
               <SummaryRow label={isUk ? "Тип" : "Type"} value={isUk ? (isLab ? "Лабораторія" : "Науковий проєкт") : data.projectType} />
               <SummaryRow label={isUk ? "Установа" : "Institution"} value={data.institution} />
               {isLab ? (
                 <>
                   <SummaryRow label={isUk ? "Кімната" : "Room"} value={data.roomNumber} />
                   <SummaryRow label={isUk ? "Рівень безпеки" : "Safety"} value={data.safetyLevel} />
                 </>
               ) : (
                 <SummaryRow label={isUk ? "Терміни" : "Timeline"} value={`${data.startDate} — ${data.endDate || "..."}`} />
               )}
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
               <button type="button" onClick={() => setStep(3)} className="text-slate-400 font-bold hover:text-slate-600 px-4 transition-colors">
                 ← {isUk ? "Назад" : "Back"}
               </button>
               <button type="submit" className="control-primary px-10 py-4 font-bold text-xl shadow-lg shadow-blue-200">
                 {isUk ? "СТВОРИТИ ПРОСТІР" : "CREATE WORKSPACE"}
               </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

// --- Sub-components ---

const toneColors = {
  rose: "border-rose-200 bg-rose-50/50 text-rose-600 active:border-rose-500 active:bg-rose-50",
  violet: "border-violet-200 bg-violet-50/50 text-violet-600 active:border-violet-500 active:bg-violet-50",
  emerald: "border-emerald-200 bg-emerald-50/50 text-emerald-600 active:border-emerald-500 active:bg-emerald-50",
  blue: "border-blue-200 bg-blue-50/50 text-blue-600 active:border-blue-500 active:bg-blue-50",
};

function TypeCard({ icon: Icon, title, desc, active, onSelect, tone }: any) {
  const colors = toneColors[tone as keyof typeof toneColors] || toneColors.blue;
  return (
    <button 
      type="button"
      onClick={onSelect}
      className={`relative flex flex-col p-6 rounded-3xl border-2 transition-all text-left duration-300 ${active ? "border-blue-600 bg-white shadow-xl -translate-y-1 scale-[1.02]" : "border-slate-100 bg-white hover:border-slate-300"}`}
    >
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${active ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-400"}`}>
        <Icon size={24} strokeWidth={2.5} />
      </div>
      <h3 className={`text-lg font-bold ${active ? "text-slate-900" : "text-slate-700"}`}>{title}</h3>
      <p className="text-sm text-slate-500 mt-2 leading-relaxed">{desc}</p>
      {active && (
        <div className="absolute top-4 right-4 bg-blue-600 rounded-full p-1">
          <CheckCircle2 size={16} className="text-white" />
        </div>
      )}
    </button>
  );
}

function TemplateCard({ template, isUk, active, onSelect }: any) {
  return (
    <button 
      type="button"
      onClick={onSelect}
      className={`flex items-center gap-5 p-5 rounded-2xl border-2 transition-all duration-300 ${active ? "border-emerald-500 bg-emerald-50 shadow-md" : "border-slate-100 bg-white hover:border-slate-200"}`}
    >
      <div className="text-3xl filter grayscale-[0.2]">{template.icon}</div>
      <div className="flex-1 min-w-0 text-left">
        <h4 className="font-bold text-slate-900 text-base">{isUk ? template.labelUk : template.labelEn}</h4>
        <p className="text-sm text-slate-500 mt-1 line-clamp-1">{isUk ? template.descriptionUk : template.descriptionEn}</p>
      </div>
      {active ? <CheckCircle2 size={24} className="text-emerald-600" /> : <Circle size={24} className="text-slate-100" />}
    </button>
  );
}

function ResponsiblePersonPicker({ isUk, selectedIds, onUpdate }: { isUk: boolean, selectedIds: string[], onUpdate: (ids: string[]) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/system/users/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.users || []);
      } finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="space-y-4">
      <SectionLabel icon={<Shield className="h-3.5 w-3.5" />} text={isUk ? "Відповідальні за безпеку та прилади" : "Safety & equipment responsible"} />
      <div className="relative group">
        <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors ${loading ? "text-blue-500" : "text-slate-400 group-focus-within:text-blue-500"}`}>
          {loading ? <Activity className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </div>
        <input 
          className={`${inputCls} pl-11 bg-slate-50/50`}
          placeholder={isUk ? "Пошук колег за ім'ям або email..." : "Search users by name..."}
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {results.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-2 surface shadow-2xl border border-slate-200 overflow-hidden rounded-2xl scale-in-center">
            <div className="max-h-64 overflow-y-auto">
              {results.map(u => (
                <button
                  key={u.id}
                  type="button"
                  className="w-full flex items-center gap-4 p-4 hover:bg-blue-50 text-left border-b border-slate-100 last:border-0 transition-colors"
                  onClick={() => {
                    if (!selectedIds.includes(u.id)) onUpdate([...selectedIds, u.id]);
                    setQuery(""); setResults([]);
                  }}
                >
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-sm">{u.initials}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 truncate">{u.name}</p>
                    <p className="text-xs text-slate-500 truncate">{u.email}</p>
                  </div>
                  <UserPlus size={18} className="text-blue-600 opacity-0 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2 min-h-8">
        {selectedIds.length === 0 ? (
          <div className="flex items-center gap-2 bg-slate-50 text-slate-500 px-3 py-1.5 rounded-lg border border-slate-100 text-xs font-medium">
             <CheckCircle2 size={12} />
             <span>{isUk ? "Ви (Власник)" : "You (Owner)"}</span>
          </div>
        ) : (
          selectedIds.map(id => (
            <div key={id} className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-xl text-xs font-black shadow-sm animate-in zoom-in-50">
              <span>ID: {id.slice(-4)}</span>
              <button type="button" onClick={() => onUpdate(selectedIds.filter(i => i !== id))} className="hover:bg-white/20 rounded-full p-0.5">
                <X size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SectionLabel({ icon, text }: any) {
  return (
    <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
      <span className="p-1 rounded bg-slate-100 text-slate-500">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function Field({ label, children }: any) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-slate-800 ml-0.5 block">{label}</label>
      {children}
    </div>
  );
}

function Footer({ isUk, onBack, onNext, nextDisabled }: any) {
  return (
    <div className="flex items-center justify-between pt-8 border-t border-slate-100 mt-4">
      {onBack ? (
        <button type="button" onClick={onBack} className="text-slate-400 font-bold px-4 hover:text-slate-600 transition-colors">
          ← {isUk ? "Назад" : "Back"}
        </button>
      ) : <div />}
      <button 
        type="button" 
        onClick={onNext} 
        disabled={nextDisabled}
        className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl font-black text-base transition-all duration-300 ${nextDisabled ? "bg-slate-100 text-slate-300 grayscale cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-200 active:scale-95"}`}
      >
        {isUk ? "ПРОДОВЖИТИ" : "CONTINUE"}
        <ChevronRight size={20} strokeWidth={3} />
      </button>
    </div>
  );
}

function SummaryRow({ label, value }: any) {
  return (
    <div className="flex justify-between items-center py-4 border-b border-slate-100 last:border-0">
      <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className="text-base font-black text-slate-900">{value}</span>
    </div>
  );
}
