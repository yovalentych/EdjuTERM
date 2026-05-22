"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, Building2, Hash, Loader2, Palette, Plus, Save, Smile, Sparkles, X,
} from "lucide-react";
import { LiquidCard } from "@/components/ui/liquid";
import {
  resolveTemplate,
  type TemplateId,
  type WorkspaceFieldSpec,
  TEMPLATE_CONFIGS,
} from "@/lib/workspace-template-config";
import { InstitutionPicker } from "./institution-picker";

type Workspace = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  template?: string;
  description?: string;
  fields?: Record<string, any>;
};

export function WorkspaceSettingsEditor({
  workspace,
  locale,
  onClose,
}: {
  workspace: Workspace;
  locale: "uk" | "en";
  onClose: () => void;
}) {
  const isUk = locale === "uk";
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [name, setName]             = useState(workspace.name);
  const [emoji, setEmoji]           = useState(workspace.emoji || "🏠");
  const [color, setColor]           = useState(workspace.color || "#0f766e");
  const [description, setDescription] = useState(workspace.description || "");
  const [template, setTemplate]     = useState<TemplateId>((workspace.template as TemplateId) || "empty");
  const [fields, setFields]         = useState<Record<string, any>>(workspace.fields || {});

  const [pending, setPending]       = useState(false);
  const [errorMsg, setErrorMsg]     = useState<string | null>(null);

  const config = useMemo(() => resolveTemplate(template), [template]);

  function setField(key: string, value: any) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!name.trim()) {
      setErrorMsg(isUk ? "Назва обов'язкова" : "Name is required");
      return;
    }
    setErrorMsg(null);
    setPending(true);
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          emoji: emoji.trim() || undefined,
          color: color.trim() || undefined,
          description: description.trim() || undefined,
          template,
          fields: cleanFields(fields),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "save_failed");
      }
      startTransition(() => { router.refresh(); onClose(); });
    } catch (e: any) {
      setErrorMsg(e?.message || (isUk ? "Помилка збереження" : "Save failed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/55 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="my-8 w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
        <LiquidCard className="overflow-hidden p-0">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200/60 bg-gradient-to-br from-emerald-50/70 via-white to-slate-50/60 px-5 py-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">
                {isUk ? "Налаштування простору" : "Workspace settings"}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="space-y-4 p-5">
            {errorMsg && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Basic: emoji + name */}
            <div className="grid grid-cols-[80px_1fr] gap-3">
              <FieldGroup label={isUk ? "Емодзі" : "Emoji"} icon={<Smile className="h-3 w-3" />}>
                <input
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value.slice(0, 4))}
                  className="input-control rounded-xl px-3 py-2.5 text-center text-2xl"
                />
              </FieldGroup>
              <FieldGroup label={isUk ? "Назва" : "Name"} icon={<Hash className="h-3 w-3" />} required>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-control rounded-xl px-3 py-2.5 text-sm"
                  required
                />
              </FieldGroup>
            </div>

            <FieldGroup label={isUk ? "Опис" : "Description"}>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="input-control rounded-xl px-3 py-2 text-sm leading-6"
                placeholder={isUk ? "Короткий опис простору…" : "Short description…"}
              />
            </FieldGroup>

            {/* Template + color */}
            <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
              <FieldGroup label={isUk ? "Шаблон" : "Template"}>
                <select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value as TemplateId)}
                  className="input-control rounded-xl px-3 py-2.5 text-sm"
                >
                  {Object.values(TEMPLATE_CONFIGS).map((cfg) => (
                    <option key={cfg.id} value={cfg.id}>
                      {cfg.emoji} {cfg.label[isUk ? "uk" : "en"]}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-500">
                  {config.description[isUk ? "uk" : "en"]}
                </p>
              </FieldGroup>
              <FieldGroup label={isUk ? "Колір" : "Color"} icon={<Palette className="h-3 w-3" />}>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-[42px] w-full rounded-xl border border-slate-200 bg-white px-1"
                />
              </FieldGroup>
            </div>

            {/* Institution picker для academic templates */}
            {isAcademic(template) && (
              <div className="space-y-2 rounded-xl border border-slate-200 bg-emerald-50/30 p-3">
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-emerald-700" />
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                    {isUk ? "Навчальний заклад" : "Institution"}
                  </h3>
                </div>
                <p className="text-[11px] leading-5 text-slate-500">
                  {isUk
                    ? "Знайдіть свій університет/інститут у системі та приєднайтесь, або введіть назву вручну у полях нижче."
                    : "Find your university/institute in the system or enter the name manually below."}
                </p>
                <InstitutionPicker
                  locale={isUk ? "uk" : "en"}
                  value={(fields.institutionId as string) ?? ""}
                  valueName={(fields.institutionName as string) ?? (fields.university as string) ?? ""}
                  onChange={(inst) => {
                    setFields((prev) => ({
                      ...prev,
                      institutionId: inst?.id ?? "",
                      institutionName: inst?.name ?? "",
                      // також автозаповнюємо university (старе поле для зворотньої сумісності)
                      university: inst?.name ?? prev.university ?? "",
                    }));
                  }}
                />
              </div>
            )}

            {/* Template-specific groups */}
            {config.fieldGroups.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 border-t border-slate-200/60 pt-3">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                    {isUk ? "Специфічні поля шаблону" : "Template-specific fields"}
                  </h3>
                </div>
                {config.fieldGroups.map((group, gi) => (
                  <details key={gi} open className="rounded-xl border border-slate-200 bg-white/60 p-3">
                    <summary className="cursor-pointer text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      {isUk ? group.titleUk : group.titleEn}
                    </summary>
                    <div className="mt-3 space-y-3">
                      {group.fields.map((fs) => (
                        <DynamicField
                          key={fs.key}
                          spec={fs}
                          value={fields[fs.key]}
                          onChange={(v) => setField(fs.key, v)}
                          isUk={isUk}
                        />
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-200/60 bg-slate-50/60 px-5 py-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {isUk ? "Скасувати" : "Cancel"}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={pending || !name.trim()}
              className="liquid-cta disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isUk ? "Зберегти" : "Save"}
            </button>
          </div>
        </LiquidCard>
      </div>
    </div>
  );
}

function FieldGroup({
  label,
  icon,
  required,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {icon}
        {label}
        {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function DynamicField({
  spec,
  value,
  onChange,
  isUk,
}: {
  spec: WorkspaceFieldSpec;
  value: any;
  onChange: (v: any) => void;
  isUk: boolean;
}) {
  const Icon = spec.icon;
  const label = isUk ? spec.label.uk : spec.label.en;
  const t = spec.type;

  if (t === "longtext") {
    return (
      <FieldGroup label={label} icon={Icon ? <Icon className="h-3 w-3" /> : undefined}>
        <textarea
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="input-control rounded-xl px-3 py-2 text-sm leading-6"
          placeholder={spec.placeholder}
        />
      </FieldGroup>
    );
  }

  if (t === "list") {
    return <ListField label={label} icon={Icon ? <Icon className="h-3 w-3" /> : null} value={value} onChange={onChange} isUk={isUk} />;
  }

  if (t === "enum" && spec.enum) {
    return (
      <FieldGroup label={label} icon={Icon ? <Icon className="h-3 w-3" /> : undefined}>
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          className="input-control rounded-xl px-3 py-2 text-sm"
        >
          <option value="">— {isUk ? "не обрано" : "not set"} —</option>
          {spec.enum.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {isUk ? opt.label.uk : opt.label.en}
            </option>
          ))}
        </select>
      </FieldGroup>
    );
  }

  const inputType =
    t === "date" ? "date"
    : t === "number" || t === "money" ? "number"
    : t === "url" ? "url"
    : "text";

  return (
    <FieldGroup label={label} icon={Icon ? <Icon className="h-3 w-3" /> : undefined}>
      <input
        type={inputType}
        value={value ?? ""}
        onChange={(e) =>
          onChange(
            inputType === "number"
              ? e.target.value === "" ? undefined : Number(e.target.value)
              : e.target.value,
          )
        }
        className="input-control rounded-xl px-3 py-2 text-sm"
        placeholder={spec.placeholder}
      />
    </FieldGroup>
  );
}

function ListField({
  label,
  icon,
  value,
  onChange,
  isUk,
}: {
  label: string;
  icon: React.ReactNode;
  value: any;
  onChange: (v: any) => void;
  isUk: boolean;
}) {
  const arr: string[] = Array.isArray(value) ? value.map((v) => String(v)) : [];
  const [input, setInput] = useState("");

  function add() {
    const t = input.trim();
    if (!t || arr.includes(t)) return;
    onChange([...arr, t]);
    setInput("");
  }
  function remove(t: string) {
    onChange(arr.filter((x) => x !== t));
  }

  return (
    <FieldGroup label={label} icon={icon}>
      <div className="flex flex-wrap gap-1.5">
        {arr.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
          >
            {t}
            <button type="button" onClick={() => remove(t)} className="rounded p-0.5 hover:bg-emerald-100">
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
        <div className="inline-flex items-center gap-1">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
            placeholder={isUk ? "+ елемент" : "+ item"}
            className="input-control w-32 rounded-md px-2 py-1 text-[11px]"
          />
          <button
            type="button"
            onClick={add}
            className="rounded-md bg-slate-100 p-1 text-slate-500 hover:bg-emerald-100 hover:text-emerald-700"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>
    </FieldGroup>
  );
}

function isAcademic(t: TemplateId): boolean {
  return t === "bachelor" || t === "master" || t === "phd" || t === "education";
}

function cleanFields(f: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(f)) {
    if (v == null) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}
