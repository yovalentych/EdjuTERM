"use client";

import { useState, useTransition } from "react";
import {
  BookOpen, Award, Mic2, User, Plus, Trash2, Edit3, Save, X,
  ExternalLink, CheckCircle2, Eye, PenLine, GraduationCap, Medal,
  Calendar, MapPin, Users, FileText, Star, Copy, Check, Link2,
} from "lucide-react";
import clsx from "clsx";
import type {
  Portfolio,
  PortfolioPublication,
  PortfolioConference,
  PortfolioAward,
  PortfolioPublicationType,
} from "@/lib/schemas";
import { portfolioPublicationTypes } from "@/lib/schemas";

const COMPETITION_PLACE_LABELS: Record<string, string> = {
  I: "І місце",
  II: "ІІ місце",
  III: "ІІІ місце",
  special: "Спеціальний приз",
  nomination: "Номінація",
  other: "Інше",
};

const COMPETITION_PLACE_OPTIONS = [
  { value: "", label: "— Місце / відзнака —" },
  { value: "I", label: "І місце" },
  { value: "II", label: "ІІ місце" },
  { value: "III", label: "ІІІ місце" },
  { value: "special", label: "Спеціальний приз" },
  { value: "nomination", label: "Номінація" },
  { value: "other", label: "Інше" },
];
import {
  savePortfolioMetaAction,
  addPublicationAction, updatePublicationAction, removePublicationAction,
  addConferenceAction, updateConferenceAction, removeConferenceAction,
  addAwardAction, updateAwardAction, removeAwardAction,
} from "@/app/portfolio-actions";

// ── Constants ─────────────────────────────────────────────────────────────────

const PUB_TYPE_LABELS: Record<PortfolioPublicationType, string> = {
  journal_indexed: "Статті у виданнях міжнародних наукометричних баз",
  journal_other: "Статті у наукових виданнях України",
  conference_proceedings: "Тези конференцій",
  monograph: "Монографії",
  patent: "Патенти",
  other: "Інше",
};

const PUB_TYPE_OPTIONS = portfolioPublicationTypes.map((v) => ({
  value: v,
  label: PUB_TYPE_LABELS[v],
}));

// ── Base styles ───────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200";

// ── Primitive components ──────────────────────────────────────────────────────

function Input({ name, defaultValue = "", placeholder = "", type = "text", className = "", ...rest }: {
  name: string; defaultValue?: string | number; placeholder?: string;
  type?: string; className?: string; [key: string]: unknown;
}) {
  return (
    <input
      type={type} name={name} defaultValue={String(defaultValue)}
      placeholder={placeholder} className={clsx(inputCls, className)} {...rest}
    />
  );
}

function DateInput({ name, defaultValue = "" }: { name: string; defaultValue?: string }) {
  return <input type="date" name={name} defaultValue={defaultValue} className={clsx(inputCls, "cursor-pointer")} />;
}

function Textarea({ name, defaultValue = "", placeholder = "", rows = 3 }: {
  name: string; defaultValue?: string; placeholder?: string; rows?: number;
}) {
  return <textarea name={name} defaultValue={defaultValue} placeholder={placeholder} rows={rows} className={inputCls} />;
}

function SelectField({ name, defaultValue, options, className = "" }: {
  name: string; defaultValue?: string; options: { value: string; label: string }[]; className?: string;
}) {
  return (
    <select name={name} defaultValue={defaultValue} className={clsx(inputCls, className)}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-0.5 block text-xs font-medium text-slate-600">{children}</label>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label>{label}</Label>{children}</div>;
}

function UrlField({ name, defaultValue = "" }: { name: string; defaultValue?: string }) {
  const [val, setVal] = useState(defaultValue);
  const [copied, setCopied] = useState(false);
  const href = val ? (val.startsWith("http") ? val : `https://${val}`) : "";
  function doCopy() {
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  return (
    <div className="flex gap-1.5">
      <div className="relative flex-1 min-w-0">
        <Link2 className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          type="url"
          name={name}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="https://..."
          className={`${inputCls} pl-8`}
        />
      </div>
      {val && (
        <>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            title="Перейти за посиланням"
            className="inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded border border-blue-200 bg-blue-50 text-blue-600 transition hover:bg-blue-100"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <button
            type="button"
            title={copied ? "Скопійовано!" : "Скопіювати посилання"}
            onClick={doCopy}
            className="inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
          >
            {copied
              ? <Check className="h-3.5 w-3.5 text-emerald-600" />
              : <Copy className="h-3.5 w-3.5" />}
          </button>
        </>
      )}
    </div>
  );
}

function LinkBadge({ url, label }: { url?: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  if (!url) return null;
  const safeUrl = url;
  const href = safeUrl.startsWith("http") ? safeUrl : `https://${safeUrl}`;
  function doCopy() {
    navigator.clipboard.writeText(safeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  return (
    <span className="mt-1 inline-flex flex-wrap items-center gap-1">
      {label && <span className="text-[11px] text-slate-400">{label}</span>}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 transition hover:bg-blue-100"
      >
        <ExternalLink className="h-3 w-3" /> Перейти
      </a>
      <button
        type="button"
        onClick={doCopy}
        className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-500 transition hover:bg-slate-50"
      >
        {copied
          ? <><Check className="h-3 w-3 text-emerald-600" /> Скопійовано</>
          : <><Copy className="h-3 w-3" /> Копіювати</>}
      </button>
    </span>
  );
}

function Btn({ onClick, variant = "ghost", children, type = "button", className = "", disabled }: {
  onClick?: () => void; variant?: "ghost" | "primary" | "danger" | "preview";
  children: React.ReactNode; type?: "button" | "submit"; className?: string; disabled?: boolean;
}) {
  const base = "inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition focus:outline-none disabled:opacity-50";
  const v = {
    ghost: "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
    primary: "border border-blue-600 bg-blue-600 text-white hover:bg-blue-700",
    danger: "border border-rose-200 bg-white text-rose-600 hover:border-rose-300 hover:bg-rose-50",
    preview: "border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={clsx(base, v[variant], className)}>
      {children}
    </button>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("rounded-lg border border-slate-200 bg-white", className)}>{children}</div>;
}

function CardHeader({ icon: Icon, title, action }: {
  icon?: typeof BookOpen; title: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-blue-600" />}
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>
      {action}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" });
}

function formatDateRange(start?: string, end?: string): string {
  const s = formatDate(start);
  const e = formatDate(end);
  if (s && e) return `${s} — ${e}`;
  return s || e || "";
}

// ── Main component ────────────────────────────────────────────────────────────

export function PortfolioView({ projectId, locale, canManage, initialPortfolio }: {
  projectId: string; locale: string; canManage: boolean; initialPortfolio: Portfolio | null;
}) {
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [tab, setTab] = useState<"info" | "publications" | "conferences" | "awards">("info");
  const [, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const p = initialPortfolio;

  function flash() { setSaved(true); setTimeout(() => setSaved(false), 2000); }

  const editTabs = [
    { id: "info" as const, label: "Профіль", icon: User },
    { id: "publications" as const, label: "Публікації", icon: BookOpen },
    { id: "conferences" as const, label: "Конференції", icon: Mic2 },
    { id: "awards" as const, label: "Нагороди", icon: Award },
  ];

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
          <button
            onClick={() => setMode("edit")}
            className={clsx("inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition",
              mode === "edit" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:bg-white/60")}
          >
            <PenLine className="h-3.5 w-3.5" /> Редагування
          </button>
          <button
            onClick={() => setMode("preview")}
            className={clsx("inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition",
              mode === "preview" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:bg-white/60")}
          >
            <Eye className="h-3.5 w-3.5" /> Перегляд
          </button>
        </div>
        {saved && (
          <span className="flex items-center gap-1 text-xs text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" /> Збережено
          </span>
        )}
      </div>

      {mode === "preview" ? (
        <PortfolioPreview portfolio={p} />
      ) : (
        <>
          {/* Edit tab bar */}
          <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
            {editTabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={clsx("inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition",
                  tab === t.id ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:bg-white/60 hover:text-slate-700")}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
                {t.id === "publications" && (p?.publications.length ?? 0) > 0 && (
                  <span className="ml-0.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-700">
                    {p!.publications.length}
                  </span>
                )}
                {t.id === "conferences" && (p?.conferences.length ?? 0) > 0 && (
                  <span className="ml-0.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-700">
                    {p!.conferences.length}
                  </span>
                )}
                {t.id === "awards" && (p?.awards.length ?? 0) > 0 && (
                  <span className="ml-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">
                    {p!.awards.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {tab === "info" && (
            <InfoTab projectId={projectId} locale={locale} canManage={canManage} portfolio={p} onSaved={flash} startTransition={startTransition} />
          )}
          {tab === "publications" && (
            <PublicationsTab projectId={projectId} locale={locale} canManage={canManage} publications={p?.publications ?? []} startTransition={startTransition} />
          )}
          {tab === "conferences" && (
            <ConferencesTab projectId={projectId} locale={locale} canManage={canManage} conferences={p?.conferences ?? []} startTransition={startTransition} />
          )}
          {tab === "awards" && (
            <AwardsTab projectId={projectId} locale={locale} canManage={canManage} awards={p?.awards ?? []} startTransition={startTransition} />
          )}
        </>
      )}
    </div>
  );
}

// ── Info tab ──────────────────────────────────────────────────────────────────

function InfoTab({ projectId, locale, canManage, portfolio, onSaved, startTransition }: {
  projectId: string; locale: string; canManage: boolean; portfolio: Portfolio | null;
  onSaved: () => void; startTransition: ReturnType<typeof useTransition>[1];
}) {
  const p = portfolio;
  return (
    <form
      action={(fd) => {
        fd.set("locale", locale); fd.set("projectId", projectId);
        startTransition(async () => { await savePortfolioMetaAction(fd); onSaved(); });
      }}
      className="space-y-4"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="projectId" value={projectId} />

      <Card>
        <CardHeader icon={User} title="Особисті відомості" />
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="ПІБ аспіранта (повністю)">
              <Input name="fullName" defaultValue={p?.fullName} placeholder="Прізвище Ім'я По батькові" />
            </Field>
          </div>
          <Field label="Рівень вищої освіти">
            <Input name="educationLevel" defaultValue={p?.educationLevel ?? "третій освітньо-науковий"} />
          </Field>
          <Field label="Спеціальність">
            <Input name="specialty" defaultValue={p?.specialty} placeholder="Наприклад: 091 «Біологія»" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Освітньо-наукова програма">
              <Input name="educationalProgram" defaultValue={p?.educationalProgram} placeholder="Назва освітньо-наукової програми" />
            </Field>
          </div>
          <Field label="Установа">
            <Input name="institution" defaultValue={p?.institution} placeholder="Назва наукової установи / університету" />
          </Field>
          <Field label="Відділ / Підрозділ">
            <Input name="department" defaultValue={p?.department} placeholder="Назва відділу або підрозділу" />
          </Field>
          <Field label="Термін навчання: від">
            <DateInput name="studyPeriodStart" defaultValue={p?.studyPeriodStart} />
          </Field>
          <Field label="Термін навчання: до">
            <DateInput name="studyPeriodEnd" defaultValue={p?.studyPeriodEnd} />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader icon={GraduationCap} title="Дисертаційне дослідження" />
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Тема дисертаційного дослідження">
              <Textarea name="dissertationTopic" defaultValue={p?.dissertationTopic} rows={3}
                placeholder="Повна назва теми дисертації..." />
            </Field>
          </div>
          <Field label="Науковий керівник (ПІБ)">
            <Input name="supervisor" defaultValue={p?.supervisor} placeholder="Прізвище Ім'я По батькові" />
          </Field>
          <Field label="Науковий ступінь, звання керівника">
            <Input name="supervisorTitle" defaultValue={p?.supervisorTitle} placeholder="к.б.н., старший дослідник" />
          </Field>
        </div>
      </Card>

      {canManage && (
        <div className="flex justify-end">
          <Btn type="submit" variant="primary"><Save className="h-3.5 w-3.5" /> Зберегти</Btn>
        </div>
      )}
    </form>
  );
}

// ── Publications tab ──────────────────────────────────────────────────────────

function PublicationsTab({ projectId, locale, canManage, publications, startTransition }: {
  projectId: string; locale: string; canManage: boolean; publications: PortfolioPublication[];
  startTransition: ReturnType<typeof useTransition>[1];
}) {
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const grouped = portfolioPublicationTypes.reduce<Record<PortfolioPublicationType, PortfolioPublication[]>>((acc, t) => {
    acc[t] = publications.filter((p) => p.pubType === t);
    return acc;
  }, {} as any);

  return (
    <div className="space-y-4">
      {portfolioPublicationTypes.map((type) => {
        const pubs = grouped[type];
        if (pubs.length === 0 && !canManage) return null;
        return (
          <Card key={type}>
            <CardHeader
              icon={BookOpen}
              title={PUB_TYPE_LABELS[type]}
              action={
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 tabular-nums">
                  {pubs.length}
                </span>
              }
            />
            <div className="divide-y divide-slate-50 p-2">
              {pubs.map((pub, i) =>
                editId === pub.pubid ? (
                  <PublicationForm
                    key={pub.pubid}
                    projectId={projectId} locale={locale}
                    pub={pub} orderIndex={pub.orderIndex}
                    onSave={(fd) => { fd.set("pubid", pub.pubid); startTransition(async () => { await updatePublicationAction(fd); setEditId(null); }); }}
                    onCancel={() => setEditId(null)}
                  />
                ) : (
                  <PublicationRow
                    key={pub.pubid}
                    index={i + 1} pub={pub} canManage={canManage}
                    onEdit={() => setEditId(pub.pubid)}
                    onDelete={() => {
                      const fd = new FormData();
                      fd.set("locale", locale); fd.set("projectId", projectId); fd.set("pubid", pub.pubid);
                      startTransition(() => removePublicationAction(fd));
                    }}
                  />
                )
              )}
              {pubs.length === 0 && (
                <p className="py-3 text-center text-xs text-slate-400">
                  {canManage ? "Публікацій цього типу ще немає." : "Немає публікацій."}
                </p>
              )}
            </div>
          </Card>
        );
      })}

      {canManage && (
        <div>
          {adding ? (
            <Card>
              <CardHeader icon={Plus} title="Нова публікація" />
              <div className="p-3">
                <PublicationForm
                  projectId={projectId} locale={locale}
                  orderIndex={publications.length}
                  onSave={(fd) => { startTransition(async () => { await addPublicationAction(fd); setAdding(false); }); }}
                  onCancel={() => setAdding(false)}
                />
              </div>
            </Card>
          ) : (
            <Btn onClick={() => setAdding(true)}>
              <Plus className="h-3.5 w-3.5" /> Додати публікацію
            </Btn>
          )}
        </div>
      )}
    </div>
  );
}

function PublicationRow({ index, pub, canManage, onEdit, onDelete }: {
  index: number; pub: PortfolioPublication; canManage: boolean;
  onEdit: () => void; onDelete: () => void;
}) {
  return (
    <div className="group flex gap-3 rounded px-2 py-2.5 hover:bg-slate-50/60">
      <span className="mt-0.5 shrink-0 text-xs font-bold text-slate-400">{index}.</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-800 leading-snug">{pub.authors}</p>
        <p className="mt-0.5 text-sm font-medium text-slate-900">{pub.title}</p>
        <p className="mt-0.5 text-xs text-slate-500 italic">
          {pub.journal}
          {pub.year ? `. ${pub.year}` : ""}
          {pub.volume ? `. Vol. ${pub.volume}` : ""}
          {pub.issue ? `, no. ${pub.issue}` : ""}
          {pub.pages ? `. P. ${pub.pages}` : ""}
        </p>
        {pub.doi && (
          <div className="mt-0.5 flex flex-wrap items-center gap-1">
            <span className="text-[11px] text-slate-400">DOI:</span>
            <span className="text-[11px] text-slate-600 font-mono">
              {pub.doi.startsWith("http") ? pub.doi : `doi.org/${pub.doi}`}
            </span>
            <LinkBadge url={pub.doi.startsWith("http") ? pub.doi : `https://doi.org/${pub.doi}`} />
          </div>
        )}
        {pub.url && <LinkBadge url={pub.url} label="URL:" />}
      </div>
      {canManage && (
        <div className="hidden shrink-0 items-start gap-1 group-hover:flex">
          <button onClick={onEdit} className="rounded p-1 text-slate-400 hover:text-blue-600">
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDelete} className="rounded p-1 text-slate-400 hover:text-rose-600">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function PublicationForm({ projectId, locale, pub, orderIndex, onSave, onCancel }: {
  projectId: string; locale: string; pub?: PortfolioPublication; orderIndex: number;
  onSave: (fd: FormData) => void; onCancel: () => void;
}) {
  function handleSubmit(fd: FormData) {
    fd.set("locale", locale);
    fd.set("projectId", projectId);
    fd.set("orderIndex", String(orderIndex));
    onSave(fd);
  }
  return (
    <form action={handleSubmit} className="space-y-3">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="orderIndex" value={String(orderIndex)} />
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Тип публікації">
            <SelectField name="pubType" defaultValue={pub?.pubType ?? "journal_indexed"} options={PUB_TYPE_OPTIONS} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Автори">
            <Input name="authors" defaultValue={pub?.authors} placeholder="Коваленко І.В., Шевченко О.М., ..." />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Назва роботи">
            <Textarea name="title" defaultValue={pub?.title} rows={2} placeholder="Назва статті / монографії / тез..." />
          </Field>
        </div>
        <Field label="Журнал / видання">
          <Input name="journal" defaultValue={pub?.journal} placeholder="Назва журналу / збірника" />
        </Field>
        <Field label="Рік">
          <Input name="year" type="number" defaultValue={pub?.year ?? new Date().getFullYear()} />
        </Field>
        <Field label="Том (Vol.)">
          <Input name="volume" defaultValue={pub?.volume} placeholder="39" />
        </Field>
        <Field label="Номер (no.)">
          <Input name="issue" defaultValue={pub?.issue} placeholder="3" />
        </Field>
        <Field label="Сторінки (P.)">
          <Input name="pages" defaultValue={pub?.pages} placeholder="231–241" />
        </Field>
        <Field label="DOI">
          <Input name="doi" defaultValue={pub?.doi} placeholder="10.7124/bc.000a9b" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="URL (якщо є)">
            <UrlField name="url" defaultValue={pub?.url} />
          </Field>
        </div>
      </div>
      <div className="flex gap-2">
        <Btn type="submit" variant="primary"><Save className="h-3.5 w-3.5" /> Зберегти</Btn>
        <Btn onClick={onCancel}><X className="h-3.5 w-3.5" /> Скасувати</Btn>
      </div>
    </form>
  );
}

// ── Conferences tab ───────────────────────────────────────────────────────────

function ConferencesTab({ projectId, locale, canManage, conferences, startTransition }: {
  projectId: string; locale: string; canManage: boolean; conferences: PortfolioConference[];
  startTransition: ReturnType<typeof useTransition>[1];
}) {
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {conferences.map((conf, i) =>
        editId === conf.confid ? (
          <Card key={conf.confid}>
            <CardHeader icon={Mic2} title={`Редагування конференції`} />
            <div className="p-3">
              <ConferenceForm
                projectId={projectId} locale={locale} conf={conf} orderIndex={conf.orderIndex}
                onSave={(fd) => { fd.set("confid", conf.confid); startTransition(async () => { await updateConferenceAction(fd); setEditId(null); }); }}
                onCancel={() => setEditId(null)}
              />
            </div>
          </Card>
        ) : (
          <ConferenceCard
            key={conf.confid} index={i + 1} conf={conf} canManage={canManage}
            onEdit={() => setEditId(conf.confid)}
            onDelete={() => {
              const fd = new FormData();
              fd.set("locale", locale); fd.set("projectId", projectId); fd.set("confid", conf.confid);
              startTransition(() => removeConferenceAction(fd));
            }}
          />
        )
      )}

      {conferences.length === 0 && !adding && (
        <div className="rounded-lg border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
          Конференцій ще не додано.
        </div>
      )}

      {canManage && (
        adding ? (
          <Card>
            <CardHeader icon={Plus} title="Нова конференція" />
            <div className="p-3">
              <ConferenceForm
                projectId={projectId} locale={locale} orderIndex={conferences.length}
                onSave={(fd) => { startTransition(async () => { await addConferenceAction(fd); setAdding(false); }); }}
                onCancel={() => setAdding(false)}
              />
            </div>
          </Card>
        ) : (
          <Btn onClick={() => setAdding(true)}>
            <Plus className="h-3.5 w-3.5" /> Додати конференцію
          </Btn>
        )
      )}
    </div>
  );
}

function ConferenceCard({ index, conf, canManage, onEdit, onDelete }: {
  index: number; conf: PortfolioConference; canManage: boolean;
  onEdit: () => void; onDelete: () => void;
}) {
  return (
    <div className="group relative rounded-lg border border-slate-200 bg-white p-4 hover:border-blue-200 transition">
      <div className="flex items-start gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
          {index}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm text-slate-900 leading-snug">{conf.name}</p>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500">
            {conf.organizer && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" /> {conf.organizer}
              </span>
            )}
            {(conf.location || conf.dateStart) && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {conf.location}
                {conf.location && conf.dateStart ? " — " : ""}
                {formatDateRange(conf.dateStart, conf.dateEnd)}
              </span>
            )}
          </div>
          {conf.thesisTitle && (
            <p className="mt-2 text-xs italic text-slate-600">«{conf.thesisTitle}»</p>
          )}
          {conf.authors && (
            <p className="mt-0.5 text-xs text-slate-500">{conf.authors}</p>
          )}
          {(conf.award || conf.isCompetition) && (
            <div className="mt-2 flex flex-wrap gap-1.5 items-center">
              {conf.isCompetition && conf.competitionPlace && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                  <Medal className="h-3 w-3" />
                  {COMPETITION_PLACE_LABELS[conf.competitionPlace] ?? conf.competitionPlace}
                </span>
              )}
              {conf.isCompetition && conf.competitionNomination && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs text-amber-700">
                  {conf.competitionNomination}
                </span>
              )}
              {conf.award && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs text-amber-800">
                  <Star className="h-3 w-3" />
                  {conf.award}
                </span>
              )}
            </div>
          )}
          {conf.url && <LinkBadge url={conf.url} />}
        </div>
        {canManage && (
          <div className="hidden shrink-0 gap-1 group-hover:flex">
            <button onClick={onEdit} className="rounded p-1 text-slate-400 hover:text-blue-600">
              <Edit3 className="h-3.5 w-3.5" />
            </button>
            <button onClick={onDelete} className="rounded p-1 text-slate-400 hover:text-rose-600">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ConferenceForm({ projectId, locale, conf, orderIndex, onSave, onCancel }: {
  projectId: string; locale: string; conf?: PortfolioConference; orderIndex: number;
  onSave: (fd: FormData) => void; onCancel: () => void;
}) {
  const [isCompetition, setIsCompetition] = useState(conf?.isCompetition ?? false);

  function handleSubmit(fd: FormData) {
    fd.set("locale", locale);
    fd.set("projectId", projectId);
    fd.set("orderIndex", String(orderIndex));
    fd.set("isCompetition", String(isCompetition));
    onSave(fd);
  }
  return (
    <form action={handleSubmit} className="space-y-3">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="orderIndex" value={String(orderIndex)} />
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Назва конференції">
            <Textarea name="name" defaultValue={conf?.name} rows={2} placeholder="Назва конференції / наукових читань..." />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Організатор">
            <Input name="organizer" defaultValue={conf?.organizer} placeholder="Назва організуючої установи" />
          </Field>
        </div>
        <Field label="Місце проведення">
          <Input name="location" defaultValue={conf?.location} placeholder="Київ, Україна" />
        </Field>
        <Field label="Дата початку">
          <DateInput name="dateStart" defaultValue={conf?.dateStart} />
        </Field>
        <Field label="Дата завершення">
          <DateInput name="dateEnd" defaultValue={conf?.dateEnd} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Тема тез / доповіді">
            <Textarea name="thesisTitle" defaultValue={conf?.thesisTitle} rows={2}
              placeholder="Назва доповіді або тез конференції..." />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Автори">
            <Input name="authors" defaultValue={conf?.authors} placeholder="Коваленко І.В., Шевченко О.М., ..." />
          </Field>
        </div>

        {/* Award / Recognition block */}
        <div className="sm:col-span-2">
          <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-3 space-y-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 flex items-center gap-1.5">
              <Medal className="h-3.5 w-3.5" /> Відзнака / нагорода
            </p>
            <Field label="Назва відзнаки / нагороди (якщо є)">
              <Input name="award" defaultValue={conf?.award} placeholder="Назва нагороди, диплому або відзнаки..." />
            </Field>
            <label className="flex cursor-pointer items-center gap-2 select-none">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-amber-300 accent-amber-500 cursor-pointer"
                checked={isCompetition}
                onChange={(e) => setIsCompetition(e.target.checked)}
              />
              <span className="text-xs font-medium text-slate-700">Був конкурс (змагальне оцінювання)</span>
            </label>
            {isCompetition && (
              <div className="grid gap-2 sm:grid-cols-2 pl-1 pt-1 border-l-2 border-amber-300">
                <Field label="Місце / відзнака">
                  <SelectField
                    name="competitionPlace"
                    defaultValue={conf?.competitionPlace ?? ""}
                    options={COMPETITION_PLACE_OPTIONS}
                  />
                </Field>
                <Field label="Номінація (якщо є)">
                  <Input name="competitionNomination" defaultValue={conf?.competitionNomination}
                    placeholder="Назва номінації..." />
                </Field>
              </div>
            )}
          </div>
        </div>

        {/* URL */}
        <div className="sm:col-span-2">
          <Field label="Посилання (сайт конференції / матеріали)">
            <UrlField name="url" defaultValue={conf?.url} />
          </Field>
        </div>
      </div>
      <div className="flex gap-2">
        <Btn type="submit" variant="primary"><Save className="h-3.5 w-3.5" /> Зберегти</Btn>
        <Btn onClick={onCancel}><X className="h-3.5 w-3.5" /> Скасувати</Btn>
      </div>
    </form>
  );
}

// ── Awards tab ────────────────────────────────────────────────────────────────

function AwardsTab({ projectId, locale, canManage, awards, startTransition }: {
  projectId: string; locale: string; canManage: boolean; awards: PortfolioAward[];
  startTransition: ReturnType<typeof useTransition>[1];
}) {
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {awards.map((aw, i) =>
          editId === aw.awid ? (
            <div key={aw.awid} className="sm:col-span-2">
              <Card>
                <CardHeader icon={Award} title="Редагування нагороди" />
                <div className="p-3">
                  <AwardForm
                    projectId={projectId} locale={locale} award={aw} orderIndex={aw.orderIndex}
                    onSave={(fd) => { fd.set("awid", aw.awid); startTransition(async () => { await updateAwardAction(fd); setEditId(null); }); }}
                    onCancel={() => setEditId(null)}
                  />
                </div>
              </Card>
            </div>
          ) : (
            <AwardCard
              key={aw.awid} index={i + 1} award={aw} canManage={canManage}
              onEdit={() => setEditId(aw.awid)}
              onDelete={() => {
                const fd = new FormData();
                fd.set("locale", locale); fd.set("projectId", projectId); fd.set("awid", aw.awid);
                startTransition(() => removeAwardAction(fd));
              }}
            />
          )
        )}
      </div>

      {awards.length === 0 && !adding && (
        <div className="rounded-lg border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
          Нагород ще не додано.
        </div>
      )}

      {canManage && (
        adding ? (
          <Card>
            <CardHeader icon={Plus} title="Нова нагорода" />
            <div className="p-3">
              <AwardForm
                projectId={projectId} locale={locale} orderIndex={awards.length}
                onSave={(fd) => { startTransition(async () => { await addAwardAction(fd); setAdding(false); }); }}
                onCancel={() => setAdding(false)}
              />
            </div>
          </Card>
        ) : (
          <Btn onClick={() => setAdding(true)}>
            <Plus className="h-3.5 w-3.5" /> Додати нагороду
          </Btn>
        )
      )}
    </div>
  );
}

function AwardCard({ index, award, canManage, onEdit, onDelete }: {
  index: number; award: PortfolioAward; canManage: boolean;
  onEdit: () => void; onDelete: () => void;
}) {
  return (
    <div className="group relative flex flex-col gap-2 rounded-lg border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 hover:border-amber-300 transition">
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
          <Star className="h-4 w-4 text-amber-600" />
        </div>
        {canManage && (
          <div className="hidden gap-1 group-hover:flex">
            <button onClick={onEdit} className="rounded p-1 text-slate-400 hover:text-blue-600">
              <Edit3 className="h-3.5 w-3.5" />
            </button>
            <button onClick={onDelete} className="rounded p-1 text-slate-400 hover:text-rose-600">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
      <div>
        <p className="font-semibold text-sm text-slate-900 leading-snug">{award.title}</p>
        {award.issuer && <p className="mt-0.5 text-xs text-slate-600">{award.issuer}</p>}
        {award.date && (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
            <Calendar className="h-3 w-3" /> {formatDate(award.date)}
          </p>
        )}
        {award.description && <p className="mt-1.5 text-xs text-slate-600">{award.description}</p>}
        {award.url && <LinkBadge url={award.url} />}
      </div>
    </div>
  );
}

function AwardForm({ projectId, locale, award, orderIndex, onSave, onCancel }: {
  projectId: string; locale: string; award?: PortfolioAward; orderIndex: number;
  onSave: (fd: FormData) => void; onCancel: () => void;
}) {
  function handleSubmit(fd: FormData) {
    fd.set("locale", locale); fd.set("projectId", projectId); fd.set("orderIndex", String(orderIndex));
    onSave(fd);
  }
  return (
    <form action={handleSubmit} className="space-y-3">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="orderIndex" value={String(orderIndex)} />
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Назва нагороди">
            <Input name="title" defaultValue={award?.title} placeholder="ІІ місце у конкурсі на кращу доповідь..." />
          </Field>
        </div>
        <Field label="Організація / орган нагородження">
          <Input name="issuer" defaultValue={award?.issuer} placeholder="Назва організації або установи" />
        </Field>
        <Field label="Дата нагородження">
          <DateInput name="date" defaultValue={award?.date} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Додатковий опис">
            <Textarea name="description" defaultValue={award?.description} rows={2}
              placeholder="Контекст отримання нагороди..." />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Посилання (диплом, сертифікат)">
            <UrlField name="url" defaultValue={award?.url} />
          </Field>
        </div>
      </div>
      <div className="flex gap-2">
        <Btn type="submit" variant="primary"><Save className="h-3.5 w-3.5" /> Зберегти</Btn>
        <Btn onClick={onCancel}><X className="h-3.5 w-3.5" /> Скасувати</Btn>
      </div>
    </form>
  );
}

// ── Preview (document-style) ──────────────────────────────────────────────────

function PortfolioPreview({ portfolio }: { portfolio: Portfolio | null }) {
  const p = portfolio;

  if (!p?.fullName && !p?.publications.length && !p?.conferences.length && !p?.awards.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 py-16 text-center text-sm text-slate-400">
        Заповніть дані в режимі редагування, щоб побачити портфоліо.
      </div>
    );
  }

  const pubsByType = portfolioPublicationTypes.reduce<Record<PortfolioPublicationType, PortfolioPublication[]>>(
    (acc, t) => { acc[t] = (p?.publications ?? []).filter((x) => x.pubType === t); return acc; },
    {} as any,
  );

  return (
    <div className="mx-auto max-w-3xl">
      {/* Document card */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        {/* ── Header band ── */}
        <div className="border-b border-slate-200 bg-slate-50 px-8 py-5 text-center">
          {p?.institution && (
            <p className="mb-1 text-xs font-medium uppercase tracking-widest text-slate-500">{p.institution}</p>
          )}
          <h1 className="text-2xl font-black tracking-tight text-slate-900">ПОРТФОЛІО</h1>
          <p className="text-base font-semibold text-slate-600">аспіранта</p>
        </div>

        <div className="px-8 py-6 space-y-6">

          {/* ── Profile section ── */}
          <div className="flex flex-col gap-5 sm:flex-row sm:gap-8">
            <div className="flex-1 space-y-2">
              {p?.fullName && (
                <h2 className="text-xl font-bold text-slate-900">{p.fullName}</h2>
              )}
              <dl className="space-y-1 text-sm">
                {p?.educationLevel && (
                  <div className="flex gap-2">
                    <dt className="shrink-0 font-semibold text-slate-700">Рівень вищої освіти:</dt>
                    <dd className="text-slate-600">{p.educationLevel}</dd>
                  </div>
                )}
                {p?.specialty && (
                  <div className="flex gap-2">
                    <dt className="shrink-0 font-semibold text-slate-700">Спеціальність:</dt>
                    <dd className="text-slate-600">{p.specialty}</dd>
                  </div>
                )}
                {p?.educationalProgram && (
                  <div className="flex gap-2">
                    <dt className="shrink-0 font-semibold text-slate-700">Освітньо-наукова програма:</dt>
                    <dd className="text-slate-600">{p.educationalProgram}</dd>
                  </div>
                )}
                {p?.department && (
                  <div className="flex gap-2">
                    <dt className="shrink-0 font-semibold text-slate-700">Відділ:</dt>
                    <dd className="text-slate-600">{p.department}</dd>
                  </div>
                )}
                {(p?.studyPeriodStart || p?.studyPeriodEnd) && (
                  <div className="flex gap-2">
                    <dt className="shrink-0 font-semibold text-slate-700">Термін навчання:</dt>
                    <dd className="text-slate-600">{formatDateRange(p.studyPeriodStart, p.studyPeriodEnd)}</dd>
                  </div>
                )}
                {p?.dissertationTopic && (
                  <div className="flex gap-2">
                    <dt className="shrink-0 font-semibold text-slate-700">Тема дисертаційного дослідження:</dt>
                    <dd className="text-slate-600">{p.dissertationTopic}</dd>
                  </div>
                )}
                {p?.supervisor && (
                  <div className="flex gap-2">
                    <dt className="shrink-0 font-semibold text-slate-700">Науковий керівник:</dt>
                    <dd className="text-slate-600">
                      {p.supervisorTitle ? `${p.supervisorTitle} ` : ""}{p.supervisor}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Photo placeholder */}
            <div className="flex-shrink-0">
              <div className="h-32 w-28 rounded border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400">
                <User className="h-10 w-10" />
              </div>
            </div>
          </div>

          {/* ── Publications ── */}
          {(p?.publications.length ?? 0) > 0 && (
            <div>
              <PreviewSection title="ПУБЛІКАЦІЇ" />
              {portfolioPublicationTypes.map((type) => {
                const pubs = pubsByType[type];
                if (!pubs.length) return null;
                return (
                  <div key={type} className="mb-4">
                    <p className="mb-2 text-xs font-bold underline text-slate-700">{PUB_TYPE_LABELS[type]}:</p>
                    <ol className="list-decimal list-inside space-y-2 marker:text-slate-400">
                      {pubs.map((pub) => (
                        <li key={pub.pubid} className="text-sm text-slate-700 leading-relaxed">
                          {pub.authors}
                          {pub.title ? (
                            <> <span className="italic">{pub.title}</span></>
                          ) : null}
                          {pub.journal ? <> / <span className="italic">{pub.journal}</span></> : null}
                          {pub.year ? `. ${pub.year}` : ""}
                          {pub.volume ? `. Vol. ${pub.volume}` : ""}
                          {pub.issue ? `, no. ${pub.issue}` : ""}
                          {pub.pages ? `. P. ${pub.pages}` : ""}
                          {pub.doi ? (
                            <>
                              {". "}
                              <a
                                href={pub.doi.startsWith("http") ? pub.doi : `https://doi.org/${pub.doi}`}
                                target="_blank" rel="noopener noreferrer"
                                className="text-blue-600 hover:underline break-all"
                              >
                                {pub.doi.startsWith("http") ? pub.doi : `https://doi.org/${pub.doi}`}
                              </a>
                            </>
                          ) : null}
                        </li>
                      ))}
                    </ol>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Conferences ── */}
          {(p?.conferences.length ?? 0) > 0 && (
            <div>
              <PreviewSection title="УЧАСТЬ У КОНФЕРЕНЦІЯХ" />
              <div className="space-y-4">
                {(p?.conferences ?? []).map((conf, i) => (
                  <div key={conf.confid} className="text-sm text-slate-700">
                    <p className="font-bold">{i + 1}) {conf.name}</p>
                    {conf.organizer && (
                      <p><span className="font-semibold">Організатор:</span> {conf.organizer}</p>
                    )}
                    {(conf.location || conf.dateStart) && (
                      <p>
                        <span className="font-semibold">Місце/дата:</span>{" "}
                        {conf.location}
                        {conf.location && conf.dateStart ? " — " : ""}
                        <span className="font-semibold">{formatDateRange(conf.dateStart, conf.dateEnd)}</span>
                      </p>
                    )}
                    {conf.thesisTitle && (
                      <p>
                        <span className="font-semibold">Тези:</span>{" "}
                        <span className="italic">{conf.thesisTitle}</span>
                      </p>
                    )}
                    {conf.authors && <p><span className="font-semibold">Автори:</span> {conf.authors}</p>}
                    {(conf.award || conf.isCompetition) && (
                      <p className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        <span className="font-bold">Відзнака:</span>
                        {conf.isCompetition && conf.competitionPlace && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">
                            {COMPETITION_PLACE_LABELS[conf.competitionPlace] ?? conf.competitionPlace}
                          </span>
                        )}
                        {conf.isCompetition && conf.competitionNomination && (
                          <span className="text-xs italic text-amber-700">{conf.competitionNomination}</span>
                        )}
                        {conf.award && <span className="font-semibold">{conf.award}</span>}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Awards ── */}
          {(p?.awards.length ?? 0) > 0 && (
            <div>
              <PreviewSection title="НАГОРОДИ ТА ВІДЗНАКИ" />
              <div className="grid gap-3 sm:grid-cols-2">
                {(p?.awards ?? []).map((aw) => (
                  <div key={aw.awid} className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
                    <div className="flex items-start gap-2">
                      <Medal className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{aw.title}</p>
                        {aw.issuer && <p className="text-xs text-slate-600">{aw.issuer}</p>}
                        {aw.date && <p className="text-xs text-slate-500">{formatDate(aw.date)}</p>}
                        {aw.description && <p className="mt-1 text-xs text-slate-600">{aw.description}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-slate-100 bg-slate-50 px-8 py-3 text-center text-xs text-slate-400">
          Портфоліо аспіранта · {p?.institution}
        </div>
      </div>
    </div>
  );
}

function PreviewSection({ title }: { title: string }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <div className="h-px flex-1 bg-slate-300" />
      <h3 className="text-xs font-black uppercase tracking-widest text-slate-700">{title}</h3>
      <div className="h-px flex-1 bg-slate-300" />
    </div>
  );
}
