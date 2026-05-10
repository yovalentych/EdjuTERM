"use client";

import { useState } from "react";
import {
  CLASSIFICATION_1021,
  SPECIALTY_BY_CODE,
  getFieldForCode,
  type FieldCode,
} from "@/lib/classification-1021";

interface SpecialtySelectProps {
  /** name for the hidden <input> carrying the specialty code (FormData) */
  name?: string;
  value?: string;
  onChange?: (code: string) => void;
  defaultValue?: string;
  /** if true, only the field-level chips are shown (no specialty drill-down) */
  fieldOnly?: boolean;
  className?: string;
}

export function SpecialtySelect({
  name,
  value: controlledValue,
  onChange,
  defaultValue = "",
  fieldOnly = false,
  className = "",
}: SpecialtySelectProps) {
  const isControlled = controlledValue !== undefined;
  const [internal, setInternal] = useState(defaultValue);
  const value = isControlled ? controlledValue : internal;

  function setValue(v: string) {
    if (isControlled) onChange?.(v);
    else setInternal(v);
  }

  const activeField = getFieldForCode(value);
  const activeFieldCode: FieldCode | null = activeField?.code ?? null;

  function selectField(code: FieldCode) {
    // Toggle: clicking the active chip clears the whole selection
    if (activeFieldCode === code) { setValue(""); return; }
    setValue(code);
  }

  const specialtiesInField = activeFieldCode
    ? CLASSIFICATION_1021.find((f) => f.code === activeFieldCode)?.specialties ?? []
    : [];

  const currentSpecialty = SPECIALTY_BY_CODE[value];
  const isSpecialtyChosen = Boolean(currentSpecialty);
  const panelOpen = !fieldOnly && Boolean(activeFieldCode);

  return (
    <div className={`space-y-1.5 ${className}`}>
      {name && <input type="hidden" name={name} value={value} />}

      {/* Compact field chips — letter codes only */}
      <div className="flex flex-wrap items-center gap-1">
        {CLASSIFICATION_1021.map((field) => {
          const active = activeFieldCode === field.code;
          return (
            <button
              key={field.code}
              type="button"
              title={`${field.code} — ${field.name}`}
              onClick={() => selectField(field.code)}
              className={`h-7 min-w-[1.75rem] px-1.5 rounded text-xs font-bold transition-all duration-150 ${
                active
                  ? "bg-[#1a3564] text-white shadow-sm ring-2 ring-[#1a3564]/20 scale-105"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
              }`}
            >
              {field.code}
            </button>
          );
        })}

        {/* Active field name — shown inline next to chips */}
        {activeField && (
          <span className="ml-1 text-[11px] text-slate-500 italic leading-tight">
            {activeField.name}
          </span>
        )}
      </div>

      {/* Specialty panel — slides down via CSS grid trick */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: panelOpen ? "1fr" : "0fr",
          opacity: panelOpen ? 1 : 0,
          transition: "grid-template-rows 180ms ease-out, opacity 160ms ease-out",
        }}
      >
        <div style={{ overflow: "hidden" }}>
          <select
            className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 focus:border-[#1a3564]/40 focus:outline-none focus:ring-1 focus:ring-[#1a3564]/20 mt-0.5"
            value={isSpecialtyChosen ? value : ""}
            onChange={(e) => setValue(e.target.value)}
          >
            <option value="">— Оберіть спеціальність —</option>
            {specialtiesInField.map((s) => (
              <option key={s.code} value={s.code}>
                {s.code} — {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
