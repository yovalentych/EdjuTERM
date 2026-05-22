"use client";

import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Database,
  Eye,
  FlaskConical,
  Globe,
  MessageSquare,
  Scale,
  Settings2,
  Shield,
  UserCog,
} from "lucide-react";
import { useState } from "react";
import { updateProjectSettings } from "@/app/actions";
import type { Dictionary, Locale } from "@/lib/i18n";
import {
  dataPolicyOptions,
  type Project,
  projectTypes,
  projectVisibilityOptions,
  repositoryPlanOptions,
} from "@/lib/schemas";
import { SpecialtySelect } from "@/components/ui/specialty-select";

const fieldClass = "input-control px-3 py-2 text-sm outline-none";

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <h3 className="font-semibold text-slate-900">{title}</h3>
        {description && <p className="text-xs text-slate-500">{description}</p>}
      </div>
    </div>
  );
}

export function ProjectSettingsForm({
  dictionary,
  locale,
  project,
  availableLabs = [],
}: {
  dictionary: Dictionary;
  locale: Locale;
  project: Project;
  availableLabs?: Project[];
}) {
  const d = dictionary.projects;
  const isUk = locale === "uk";
  const [researchField, setResearchField] = useState(project.researchField ?? "");
  const [linkedLabIds, setLinkedLabIds] = useState<string[]>(project.linkedLabIds ?? []);

  const isLaboratory = project.projectType === "laboratory";

  const toggleLab = (id: string) => {
    setLinkedLabIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const grantProgramLabel =
    project.projectType === "grant"
      ? d.grantProgram
      : project.projectType === "dissertation"
      ? isUk ? "Університет / кафедра / спеціальність" : "University / department / specialisation"
      : project.projectType === "fundamental"
      ? isUk ? "Установа / тема НДР" : "Institution / research topic"
      : project.projectType === "applied"
      ? isUk ? "Замовник / фінансувальник" : "Client / funder"
      : project.projectType === "experimental"
      ? isUk ? "Замовник / договір" : "Client / contract"
      : project.projectType === "internship"
      ? isUk ? "Приймаюча установа / програма" : "Host institution / programme"
      : isUk ? "Установа / програма" : "Institution / programme";

  return (
    <form action={updateProjectSettings}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="projectId" value={project._id} />
      {linkedLabIds.map(id => (
        <input key={id} type="hidden" name="linkedLabIds" value={id} />
      ))}

      {/* ── Section 1: Identity ───────────────────────────────────────────── */}
      <div className="surface overflow-hidden">
        <SectionHeader
          icon={Settings2}
          title={isUk ? "Ідентичність проєкту" : "Project identity"}
          description={isUk ? "Назва, акронім, опис і тип" : "Name, acronym, description and type"}
        />
        <div className="space-y-4 p-5">
          <div className="grid gap-4 md:grid-cols-[1.4fr_0.6fr]">
            <TextField label={d.title} name="title" defaultValue={project.title} />
            <TextField label={d.acronym} name="acronym" defaultValue={project.acronym} />
          </div>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-stone-700">{d.summary}</span>
            <textarea
              name="summary"
              defaultValue={project.summary}
              rows={4}
              className={`${fieldClass} resize-y`}
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              label={d.projectType}
              name="projectType"
              defaultValue={project.projectType}
              options={projectTypes.map((value) => ({
                value,
                label: d.typeOptions[value],
              }))}
            />
            <label className="block space-y-1">
              <span className="text-sm font-medium text-stone-700">{researchField || d.researchField}</span>
              <SpecialtySelect
                name="researchField"
                value={researchField}
                onChange={setResearchField}
              />
            </label>
          </div>

          {isLaboratory && (
            <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50/30 p-5 space-y-4">
              <h4 className="text-sm font-bold text-blue-800 uppercase tracking-wider">
                {isUk ? "Спеціальні параметри лабораторії" : "Special Laboratory Parameters"}
              </h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label={isUk ? "Номер кімнати" : "Room Number"} name="roomNumber" defaultValue={project.roomNumber} />
                <SelectField 
                  label={isUk ? "Рівень безпеки" : "Safety Level"} 
                  name="safetyLevel" 
                  defaultValue={project.safetyLevel || "BSL-1"}
                  options={[
                    { value: "BSL-1", label: "BSL-1" },
                    { value: "BSL-2", label: "BSL-2" },
                    { value: "BSL-3", label: "BSL-3" },
                    { value: "BSL-4", label: "BSL-4" },
                  ]}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Section: Laboratory Linkage (for research projects) ──────────── */}
      {!isLaboratory && availableLabs.length > 0 && (
        <div className="surface mt-4 overflow-hidden">
          <SectionHeader
            icon={FlaskConical}
            title={isUk ? "Підключення лабораторії" : "Laboratory connection"}
            description={isUk ? "Оберіть спільні простори, ресурсами яких ви користуєтесь" : "Select shared workspaces whose resources you use"}
          />
          <div className="p-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {availableLabs.map(lab => (
                <button
                  key={lab._id}
                  type="button"
                  onClick={() => lab._id && toggleLab(lab._id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                    linkedLabIds.includes(lab._id ?? "") 
                      ? "border-blue-500 bg-blue-50" 
                      : "border-slate-100 hover:border-blue-200"
                  }`}
                >
                  <div className={`h-8 w-8 rounded flex items-center justify-center ${linkedLabIds.includes(lab._id ?? "") ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-400"}`}>
                    <FlaskConical className="h-4 w-4" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-xs font-bold text-blue-600 font-mono">{lab.acronym}</p>
                    <p className="text-sm font-semibold text-slate-800 truncate">{lab.title}</p>
                  </div>
                  {linkedLabIds.includes(lab._id ?? "") && <CheckCircle2 className="h-4 w-4 text-blue-500" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Section 2: Dates & program ────────────────────────────────────── */}
      <div className="surface mt-4 overflow-hidden">
        <SectionHeader
          icon={Calendar}
          title={isUk ? "Терміни та програма" : "Dates & programme"}
          description={isUk ? "Період виконання та фінансуюча програма" : "Execution period and funding programme"}
        />
        <div className="grid gap-4 p-5 md:grid-cols-3">
          <TextField label={grantProgramLabel} name="grantProgram" defaultValue={project.grantProgram} />
          <TextField label={d.startDate} name="startDate" type="date" defaultValue={project.startDate} />
          <TextField label={d.endDate} name="endDate" type="date" defaultValue={project.endDate} />
        </div>
      </div>

      {/* ── Section 3: Openness & data policy ────────────────────────────── */}
      <div className="surface mt-4 overflow-hidden">
        <SectionHeader
          icon={Globe}
          title={isUk ? "Відкритість і дані" : "Openness & data"}
          description={isUk ? "Видимість, правила даних і репозиторій" : "Visibility, data policy and repository"}
        />
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <SelectField
            label={d.visibility}
            name="visibility"
            defaultValue={project.visibility}
            options={projectVisibilityOptions.map((value) => ({
              value,
              label: d.visibilityOptions[value],
            }))}
          />
          <SelectField
            label={d.defaultLocale}
            name="defaultLocale"
            defaultValue={project.defaultLocale}
            options={[
              { value: "uk", label: "Українська" },
              { value: "en", label: "English" },
            ]}
          />
          <SelectField
            label={d.dataPolicy}
            name="dataPolicy"
            defaultValue={project.dataPolicy}
            options={dataPolicyOptions.map((value) => ({
              value,
              label: d.dataPolicyOptions[value],
            }))}
          />
          <SelectField
            label={d.repositoryPlan}
            name="repositoryPlan"
            defaultValue={project.repositoryPlan}
            options={repositoryPlanOptions.map((value) => ({
              value,
              label: d.repositoryPlanOptions[value],
            }))}
          />
        </div>
      </div>

      {/* ── Section 4: Ethics ────────────────────────────────────────────── */}
      <div className="surface mt-4 overflow-hidden">
        <SectionHeader
          icon={Shield}
          title={isUk ? "Етика і безпека даних" : "Ethics & data security"}
          description={isUk ? "Типи даних, що обробляються у проєкті" : "Types of data processed in the project"}
        />
        <div className="p-5">
          <div className="mb-4">
            <SelectField
              label={d.ethicsReview}
              name="ethicsReview"
              defaultValue={project.ethicsReview}
              options={[
                { value: "not_required", label: d.ethicsOptions.not_required },
                { value: "planned", label: d.ethicsOptions.planned },
                { value: "approved", label: d.ethicsOptions.approved },
              ]}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Toggle name="hasHumanData" label={d.hasHumanData} defaultChecked={project.hasHumanData} />
            <Toggle name="hasAnimalData" label={d.hasAnimalData} defaultChecked={project.hasAnimalData} />
            <Toggle name="hasPersonalData" label={d.hasPersonalData} defaultChecked={project.hasPersonalData} />
          </div>
        </div>
      </div>

      {/* ── Section 5: Modules ───────────────────────────────────────────── */}
      <div className="surface mt-4 overflow-hidden">
        <SectionHeader
          icon={Database}
          title={isUk ? "Робочі модулі" : "Workspace modules"}
          description={isUk ? "Увімкніть або вимкніть функціональні блоки проєкту" : "Enable or disable project feature blocks"}
        />
        <div className="grid gap-2 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <Toggle
            name="openScienceEnabled"
            label={d.openScienceEnabled}
            defaultChecked={project.openScienceEnabled}
            icon={Globe}
          />
          <Toggle
            name="teamChatEnabled"
            label={d.teamChatEnabled}
            defaultChecked={project.teamChatEnabled}
            icon={MessageSquare}
          />
          <Toggle
            name="taskManagementEnabled"
            label={d.taskManagementEnabled}
            defaultChecked={project.taskManagementEnabled}
            icon={Scale}
          />
          <Toggle
            name="rawDataRegistryEnabled"
            label={d.rawDataRegistryEnabled}
            defaultChecked={project.rawDataRegistryEnabled}
            icon={FlaskConical}
          />
        </div>
      </div>

      {/* ── Save ─────────────────────────────────────────────────────────── */}
      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          className="control-primary px-6 py-2.5 text-sm font-semibold"
        >
          {d.saveSettings}
        </button>
      </div>
    </form>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function TextField({
  defaultValue,
  label,
  name,
  type = "text",
}: {
  defaultValue?: string;
  label: string;
  name: string;
  type?: string;
}) {
  return (
    <label className="space-y-1">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        className={fieldClass}
        required={type !== "date"}
      />
    </label>
  );
}

function SelectField({
  defaultValue,
  label,
  name,
  options,
}: {
  defaultValue: string;
  label: string;
  name: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="space-y-1">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <select name={name} defaultValue={defaultValue} className={fieldClass}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Toggle({
  defaultChecked,
  label,
  name,
  icon: Icon,
}: {
  defaultChecked: boolean;
  label: string;
  name: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <label className="surface-muted flex min-h-12 cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-sm text-stone-700 transition has-[:checked]:border-emerald-200 has-[:checked]:bg-emerald-50 has-[:checked]:text-emerald-900">
      <span className="flex items-center gap-2">
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400 has-[:checked]:text-emerald-600" />}
        {label}
      </span>
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 accent-emerald-600"
      />
    </label>
  );
}
