"use client";

import {
  EDUCATION_LEVELS,
  type EducationLevelCode,
} from "@/lib/education-levels";

interface EducationLevelSelectProps {
  name?: string;
  value?: string;
  onChange?: (code: string) => void;
  defaultValue?: string;
  className?: string;
}

export function EducationLevelSelect({
  name,
  value: controlledValue,
  onChange,
  defaultValue = "",
  className = "",
}: EducationLevelSelectProps) {
  const isControlled = controlledValue !== undefined;

  const currentValue = isControlled ? controlledValue : undefined;
  const initialValue = defaultValue;

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (isControlled) onChange?.(e.target.value);
  }

  const selectProps = isControlled
    ? { value: currentValue, onChange: handleChange }
    : { defaultValue: initialValue };

  const standard = EDUCATION_LEVELS.filter((l) => !l.legacy);
  const legacy = EDUCATION_LEVELS.filter((l) => l.legacy);

  return (
    <div className={className}>
      <select
        name={name}
        {...selectProps}
        className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 focus:border-[#1a3564]/40 focus:outline-none focus:ring-1 focus:ring-[#1a3564]/20"
      >
        <option value="">— Оберіть рівень —</option>
        <optgroup label="Поточна система (після 2014 р.)">
          {standard.map((l) => (
            <option key={l.code} value={l.code}>
              {`НРК ${l.nqfLevel} — ${l.name}`}{l.ects ? ` (${l.ects})` : ""}
            </option>
          ))}
        </optgroup>
        <optgroup label="Перехідні / застарілі ступені">
          {legacy.map((l) => (
            <option key={l.code} value={l.code}>
              {l.name}
            </option>
          ))}
        </optgroup>
      </select>
    </div>
  );
}
