import { updateProjectSettings } from "@/app/actions";
import type { Dictionary, Locale } from "@/lib/i18n";
import {
  dataPolicyOptions,
  type Project,
  projectTypes,
  projectVisibilityOptions,
  repositoryPlanOptions,
  researchFields,
} from "@/lib/schemas";

const fieldClass =
  "input-control px-3 py-2 text-sm outline-none";

export function ProjectSettingsForm({
  dictionary,
  locale,
  project,
}: {
  dictionary: Dictionary;
  locale: Locale;
  project: Project;
}) {
  return (
    <form action={updateProjectSettings} className="surface p-5 md:p-6">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="projectId" value={project._id} />
      <div className="mb-5 border-b border-stone-200 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
          Project identity
        </p>
        <h2 className="mt-1 text-xl font-semibold text-stone-950">
          {dictionary.projects.settingsTitle}
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-[1.4fr_0.6fr]">
        <TextField label={dictionary.projects.title} name="title" defaultValue={project.title} />
        <TextField label={dictionary.projects.acronym} name="acronym" defaultValue={project.acronym} />
      </div>
      <label className="mt-3 block space-y-1">
        <span className="text-sm font-medium text-stone-700">
          {dictionary.projects.summary}
        </span>
        <textarea
          name="summary"
          defaultValue={project.summary}
          className={`${fieldClass} min-h-28 resize-y`}
        />
      </label>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <TextField
          label={
            project.projectType === "grant"
              ? dictionary.projects.grantProgram
              : project.projectType === "dissertation"
              ? (locale === "uk" ? "Університет / кафедра / спеціальність" : "University / department / specialisation")
              : project.projectType === "fundamental"
              ? (locale === "uk" ? "Установа / тема НДР" : "Institution / research topic")
              : project.projectType === "applied"
              ? (locale === "uk" ? "Замовник / фінансувальник" : "Client / funder")
              : project.projectType === "experimental"
              ? (locale === "uk" ? "Замовник / договір" : "Client / contract")
              : project.projectType === "internship"
              ? (locale === "uk" ? "Приймаюча установа / програма" : "Host institution / programme")
              : (locale === "uk" ? "Установа / програма" : "Institution / programme")
          }
          name="grantProgram"
          defaultValue={project.grantProgram}
        />
        <TextField
          label={dictionary.projects.startDate}
          name="startDate"
          type="date"
          defaultValue={project.startDate}
        />
        <TextField
          label={dictionary.projects.endDate}
          name="endDate"
          type="date"
          defaultValue={project.endDate}
        />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <SelectField
          label={dictionary.projects.projectType}
          name="projectType"
          defaultValue={project.projectType}
          options={projectTypes.map((value) => ({
            value,
            label: dictionary.projects.typeOptions[value],
          }))}
        />
        <SelectField
          label={dictionary.projects.researchField}
          name="researchField"
          defaultValue={project.researchField}
          options={researchFields.map((value) => ({
            value,
            label: dictionary.projects.fieldOptions[value],
          }))}
        />
        <SelectField
          label={dictionary.projects.visibility}
          name="visibility"
          defaultValue={project.visibility}
          options={projectVisibilityOptions.map((value) => ({
            value,
            label: dictionary.projects.visibilityOptions[value],
          }))}
        />
        <SelectField
          label={dictionary.projects.defaultLocale}
          name="defaultLocale"
          defaultValue={project.defaultLocale}
          options={[
            { value: "uk", label: "Українська" },
            { value: "en", label: "English" },
          ]}
        />
        <SelectField
          label={dictionary.projects.dataPolicy}
          name="dataPolicy"
          defaultValue={project.dataPolicy}
          options={dataPolicyOptions.map((value) => ({
            value,
            label: dictionary.projects.dataPolicyOptions[value],
          }))}
        />
        <SelectField
          label={dictionary.projects.repositoryPlan}
          name="repositoryPlan"
          defaultValue={project.repositoryPlan}
          options={repositoryPlanOptions.map((value) => ({
            value,
            label: dictionary.projects.repositoryPlanOptions[value],
          }))}
        />
        <SelectField
          label={dictionary.projects.ethicsReview}
          name="ethicsReview"
          defaultValue={project.ethicsReview}
          options={[
            { value: "not_required", label: dictionary.projects.ethicsOptions.not_required },
            { value: "planned", label: dictionary.projects.ethicsOptions.planned },
            { value: "approved", label: dictionary.projects.ethicsOptions.approved },
          ]}
        />
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Toggle name="hasHumanData" label={dictionary.projects.hasHumanData} defaultChecked={project.hasHumanData} />
        <Toggle name="hasAnimalData" label={dictionary.projects.hasAnimalData} defaultChecked={project.hasAnimalData} />
        <Toggle name="hasPersonalData" label={dictionary.projects.hasPersonalData} defaultChecked={project.hasPersonalData} />
        <Toggle name="openScienceEnabled" label={dictionary.projects.openScienceEnabled} defaultChecked={project.openScienceEnabled} />
        <Toggle name="teamChatEnabled" label={dictionary.projects.teamChatEnabled} defaultChecked={project.teamChatEnabled} />
        <Toggle name="taskManagementEnabled" label={dictionary.projects.taskManagementEnabled} defaultChecked={project.taskManagementEnabled} />
        <Toggle name="rawDataRegistryEnabled" label={dictionary.projects.rawDataRegistryEnabled} defaultChecked={project.rawDataRegistryEnabled} />
      </div>
      <button
        type="submit"
        className="control-primary mt-5 px-4 py-2 text-sm font-semibold"
      >
        {dictionary.projects.saveSettings}
      </button>
    </form>
  );
}

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
}: {
  defaultChecked: boolean;
  label: string;
  name: string;
}) {
  return (
    <label className="surface-muted flex min-h-12 items-center justify-between gap-3 px-3 py-2 text-sm text-stone-700 transition has-checked:border-emerald-700 has-checked:bg-emerald-50 has-checked:text-emerald-950">
      <span>{label}</span>
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 accent-emerald-700"
      />
    </label>
  );
}
