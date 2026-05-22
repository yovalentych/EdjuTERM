"use client";

import { useState } from "react";
import {
  CLASSIFICATION_1021,
  LEGACY_CLASSIFICATION,
  SPECIALTY_BY_CODE,
  LEGACY_SPECIALTY_BY_CODE,
  getFieldForCode,
  type FieldCode,
} from "@/lib/classification-1021";

interface SpecialtySelectProps {
  name?: string;
  value?: string;
  onChange?: (code: string) => void;
  defaultValue?: string;
  fieldOnly?: boolean;
  className?: string;
}

type System = "new" | "legacy";

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

  // Detect which system the current value belongs to
  const isLegacyValue = Boolean(LEGACY_SPECIALTY_BY_CODE[value]);
  const [system, setSystem] = useState<System>(isLegacyValue ? "legacy" : "new");

  function setValue(v: string) {
    if (isControlled) onChange?.(v);
    else setInternal(v);
  }

  // ── NEW system (letter codes) ──
  const activeField = getFieldForCode(value);
  const activeFieldCode: FieldCode | null = activeField?.code ?? null;

  function selectField(code: FieldCode) {
    if (activeFieldCode === code) { setValue(""); return; }
    setValue(code);
  }

  const specialtiesInField = activeFieldCode
    ? CLASSIFICATION_1021.find((f) => f.code === activeFieldCode)?.specialties ?? []
    : [];

  const currentNewSpecialty = SPECIALTY_BY_CODE[value];
  const isNewSpecialtyChosen = Boolean(currentNewSpecialty);
  const panelOpen = !fieldOnly && Boolean(activeFieldCode);

  // ── LEGACY system (numeric codes) ──
  const [legacyField, setLegacyField] = useState<string>(() => {
    if (isLegacyValue) {
      const field = LEGACY_CLASSIFICATION.find((f) => f.specialties.some((s) => s.code === value));
      return field?.code ?? "";
    }
    return "";
  });

  const legacySpecialties = legacyField
    ? LEGACY_CLASSIFICATION.find((f) => f.code === legacyField)?.specialties ?? []
    : [];

  function handleLegacyFieldChange(code: string) {
    setLegacyField(code);
    setValue(""); // reset specialty when field changes
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {name && <input type="hidden" name={name} value={value} />}

      {/* System toggle */}
      <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5 w-fit">
        <button
          type="button"
          onClick={() => { setSystem("new"); setValue(""); setLegacyField(""); }}
          className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-all ${
            system === "new"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Нова 2024
        </button>
        <button
          type="button"
          onClick={() => { setSystem("legacy"); setValue(""); }}
          className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-all ${
            system === "legacy"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Стара (2015–2024)
        </button>
      </div>

      {/* ── NEW classification ── */}
      {system === "new" && (
        <div className="space-y-1.5">
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
            {activeField && (
              <span className="ml-1 text-[11px] text-slate-500 italic leading-tight">
                {activeField.name}
              </span>
            )}
          </div>

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
                value={isNewSpecialtyChosen ? value : ""}
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
      )}

      {/* ── LEGACY classification ── */}
      {system === "legacy" && (
        <div className="space-y-1.5">
          <select
            value={legacyField}
            onChange={(e) => handleLegacyFieldChange(e.target.value)}
            className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1a3564]/20"
          >
            <option value="">— Оберіть галузь знань —</option>
            {LEGACY_CLASSIFICATION.map((f) => (
              <option key={f.code} value={f.code}>
                {f.code} {f.name}
              </option>
            ))}
          </select>

          {legacyField && (
            <select
              value={LEGACY_SPECIALTY_BY_CODE[value] ? value : ""}
              onChange={(e) => setValue(e.target.value)}
              className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1a3564]/20"
            >
              <option value="">— Оберіть спеціальність —</option>
              {legacySpecialties.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.code} {s.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Show selected value */}
      {value && !activeField && !LEGACY_SPECIALTY_BY_CODE[value] && SPECIALTY_BY_CODE[value] && (
        <p className="text-[11px] text-emerald-600">
          ✓ {SPECIALTY_BY_CODE[value].code} — {SPECIALTY_BY_CODE[value].name}
        </p>
      )}
    </div>
  );
}
