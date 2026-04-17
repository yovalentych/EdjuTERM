import { CalendarDays, Database, FlaskConical, Settings2 } from "lucide-react";
import type { ReactNode } from "react";
import { createProject } from "@/app/actions";
import { ProjectIdentityFields } from "@/components/projects/project-identity-fields";
import type { Dictionary, Locale } from "@/lib/i18n";
import {
  dataPolicyOptions,
  projectTypes,
  projectVisibilityOptions,
  repositoryPlanOptions,
  researchFields,
} from "@/lib/schemas";

const fieldClass =
  "w-full border border-stone-300 bg-white px-3 py-2 text-sm text-stone-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100";

const radioClass =
  "border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700 transition has-checked:border-emerald-700 has-checked:bg-emerald-50 has-checked:text-emerald-950";

export function ProjectCreateForm({
  dictionary,
  locale,
  error,
}: {
  dictionary: Dictionary;
  locale: Locale;
  error?: string;
}) {
  return (
    <form action={createProject} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      {error ? (
        <div className="border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {dictionary.auth.invalidError}
        </div>
      ) : null}

      <FormSection
        icon={<FlaskConical className="h-5 w-5" />}
        title={dictionary.projects.stepIdentity}
      >
        <ProjectIdentityFields dictionary={dictionary} />
        <label className="space-y-1">
          <span className="text-sm font-medium text-stone-700">
            {dictionary.projects.summary}
          </span>
          <textarea
            name="summary"
            className={`${fieldClass} min-h-28 resize-y`}
            placeholder={dictionary.projects.summaryPlaceholder}
          />
        </label>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1">
            <span className="text-sm font-medium text-stone-700">
              {dictionary.projects.grantProgram}
            </span>
            <input
              name="grantProgram"
              className={fieldClass}
              placeholder={dictionary.projects.grantProgramPlaceholder}
              required
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-stone-700">
              {dictionary.projects.startDate}
            </span>
            <input name="startDate" type="date" className={fieldClass} />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-stone-700">
              {dictionary.projects.endDate}
            </span>
            <input name="endDate" type="date" className={fieldClass} />
          </label>
        </div>
      </FormSection>

      <FormSection
        icon={<CalendarDays className="h-5 w-5" />}
        title={dictionary.projects.stepClassification}
      >
        <div className="grid gap-3 lg:grid-cols-2">
          <SelectField
            label={dictionary.projects.projectType}
            name="projectType"
            options={projectTypes.map((value) => ({
              value,
              label: dictionary.projects.typeOptions[value],
            }))}
          />
          <SelectField
            label={dictionary.projects.researchField}
            name="researchField"
            options={researchFields.map((value) => ({
              value,
              label: dictionary.projects.fieldOptions[value],
            }))}
          />
        </div>
        <RadioGroup
          label={dictionary.projects.visibility}
          name="visibility"
          defaultValue="private"
          options={projectVisibilityOptions.map((value) => ({
            value,
            label: dictionary.projects.visibilityOptions[value],
          }))}
        />
        <RadioGroup
          label={dictionary.projects.defaultLocale}
          name="defaultLocale"
          defaultValue={locale}
          options={[
            { value: "uk", label: "Українська" },
            { value: "en", label: "English" },
          ]}
        />
      </FormSection>

      <FormSection
        icon={<Database className="h-5 w-5" />}
        title={dictionary.projects.stepGovernance}
      >
        <div className="grid gap-3 lg:grid-cols-2">
          <SelectField
            label={dictionary.projects.dataPolicy}
            name="dataPolicy"
            defaultValue="embargo_then_open"
            options={dataPolicyOptions.map((value) => ({
              value,
              label: dictionary.projects.dataPolicyOptions[value],
            }))}
          />
          <SelectField
            label={dictionary.projects.repositoryPlan}
            name="repositoryPlan"
            options={repositoryPlanOptions.map((value) => ({
              value,
              label: dictionary.projects.repositoryPlanOptions[value],
            }))}
          />
        </div>
        <RadioGroup
          label={dictionary.projects.ethicsReview}
          name="ethicsReview"
          defaultValue="planned"
          options={[
            {
              value: "not_required",
              label: dictionary.projects.ethicsOptions.not_required,
            },
            { value: "planned", label: dictionary.projects.ethicsOptions.planned },
            { value: "approved", label: dictionary.projects.ethicsOptions.approved },
          ]}
        />
        <div>
          <p className="text-sm font-medium text-stone-700">
            {dictionary.projects.sensitiveData}
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <Toggle name="hasHumanData" label={dictionary.projects.hasHumanData} />
            <Toggle name="hasAnimalData" label={dictionary.projects.hasAnimalData} />
            <Toggle
              name="hasPersonalData"
              label={dictionary.projects.hasPersonalData}
            />
          </div>
        </div>
      </FormSection>

      <FormSection
        icon={<Settings2 className="h-5 w-5" />}
        title={dictionary.projects.stepModules}
      >
        <p className="text-sm font-medium text-stone-700">
          {dictionary.projects.modules}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Toggle
            name="openScienceEnabled"
            label={dictionary.projects.openScienceEnabled}
            defaultChecked
          />
          <Toggle
            name="teamChatEnabled"
            label={dictionary.projects.teamChatEnabled}
            defaultChecked
          />
          <Toggle
            name="taskManagementEnabled"
            label={dictionary.projects.taskManagementEnabled}
            defaultChecked
          />
          <Toggle
            name="rawDataRegistryEnabled"
            label={dictionary.projects.rawDataRegistryEnabled}
            defaultChecked
          />
        </div>
      </FormSection>

      <div className="sticky bottom-0 border border-stone-200 bg-white p-4 shadow-sm">
        <button
          type="submit"
          className="w-full bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
        >
          {dictionary.projects.submit}
        </button>
      </div>
    </form>
  );
}

function FormSection({
  children,
  icon,
  title,
}: {
  children: ReactNode;
  icon: ReactNode;
  title: string;
}) {
  return (
    <section className="border border-stone-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center bg-emerald-50 text-emerald-700">
          {icon}
        </div>
        <h2 className="text-lg font-semibold text-stone-950">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function SelectField({
  defaultValue,
  label,
  name,
  options,
}: {
  defaultValue?: string;
  label: string;
  name: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="space-y-1">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className={fieldClass}
        required
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function RadioGroup({
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
    <fieldset>
      <legend className="text-sm font-medium text-stone-700">{label}</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        {options.map((option) => (
          <label key={option.value} className={radioClass}>
            <input
              type="radio"
              name={name}
              value={option.value}
              defaultChecked={option.value === defaultValue}
              className="mr-2 accent-emerald-700"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Toggle({
  defaultChecked,
  label,
  name,
}: {
  defaultChecked?: boolean;
  label: string;
  name: string;
}) {
  return (
    <label className="flex min-h-12 items-center justify-between gap-3 border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700 transition has-checked:border-emerald-700 has-checked:bg-emerald-50 has-checked:text-emerald-950">
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
