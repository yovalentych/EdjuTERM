"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, CheckCircle2, ExternalLink, Loader2, Mail,
  MapPin, Pencil, Phone, Save, ShieldCheck, X,
} from "lucide-react";
import { LiquidCard } from "@/components/ui/liquid";
import type { Institution, InstitutionType } from "@/lib/schemas";

const TYPE_OPTIONS: { value: InstitutionType; uk: string; en: string }[] = [
  { value: "university", uk: "Університет",              en: "University" },
  { value: "institute",  uk: "Інститут",                  en: "Institute" },
  { value: "academy",    uk: "Академія",                  en: "Academy" },
  { value: "college",    uk: "Коледж",                    en: "College" },
  { value: "school",     uk: "Школа / гімназія",          en: "School" },
  { value: "research",   uk: "Науково-дослідна установа", en: "Research org" },
  { value: "other",      uk: "Інше",                      en: "Other" },
];

function Field({
  label, children, required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label}{required && <span className="ml-0.5 text-rose-500">*</span>}
      </span>
      {children}
    </label>
  );
}

export function SettingsClient({
  locale,
  institution,
}: {
  locale: "uk" | "en";
  institution: Institution;
}) {
  const isUk = locale === "uk";
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState(institution.name);
  const [shortName, setShortName] = useState(institution.shortName ?? "");
  const [type, setType] = useState<InstitutionType>(institution.type as InstitutionType);
  const [email, setEmail] = useState(institution.email);
  const [city, setCity] = useState(institution.city ?? "");
  const [country, setCountry] = useState(institution.country ?? "");
  const [website, setWebsite] = useState(institution.website ?? "");
  const [description, setDescription] = useState(institution.description ?? "");
  const [contactName, setContactName] = useState(institution.contactName ?? "");
  const [contactPhone, setContactPhone] = useState(institution.contactPhone ?? "");
  const [accreditation, setAccreditation] = useState(institution.accreditation ?? "");

  function reset() {
    setName(institution.name);
    setShortName(institution.shortName ?? "");
    setType(institution.type as InstitutionType);
    setEmail(institution.email);
    setCity(institution.city ?? "");
    setCountry(institution.country ?? "");
    setWebsite(institution.website ?? "");
    setDescription(institution.description ?? "");
    setContactName(institution.contactName ?? "");
    setContactPhone(institution.contactPhone ?? "");
    setAccreditation(institution.accreditation ?? "");
    setEditing(false);
    setErr(null);
  }

  async function save() {
    if (!name.trim()) return;
    setBusy(true); setErr(null);
    try {
      const res = await fetch("/api/institution/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(), shortName, type, email,
          city, country, website, description,
          contactName, contactPhone, accreditation,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "save_failed");
      setSaved(true);
      setEditing(false);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setErr(isUk ? "Помилка збереження. Спробуйте ще раз." : "Save failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* ── Header card ───────────────────────────────────── */}
      <LiquidCard className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-br from-emerald-50/70 via-white to-blue-50/40 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Building2 className="h-6 w-6" />
            </span>
            <div>
              <p className="liquid-eyebrow text-emerald-700">
                {isUk ? "Налаштування закладу" : "Institution settings"}
              </p>
              <h1 className="mt-1 text-lg font-bold tracking-tight text-slate-900">{institution.name}</h1>
              <div className="mt-1 flex items-center gap-2">
                {institution.isVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    <CheckCircle2 className="h-3 w-3" />
                    {isUk ? "Верифіковано" : "Verified"}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    <ShieldCheck className="h-3 w-3" />
                    {isUk ? "Очікує верифікації" : "Pending verification"}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {saved && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="h-3 w-3" />
                {isUk ? "Збережено" : "Saved"}
              </span>
            )}
            {editing ? (
              <>
                <button
                  type="button"
                  onClick={reset}
                  className="liquid-pill text-slate-500"
                >
                  <X className="h-3.5 w-3.5" />
                  {isUk ? "Скасувати" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={busy || !name.trim()}
                  className="liquid-cta text-sm disabled:opacity-60"
                >
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  {isUk ? "Зберегти" : "Save"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="liquid-pill text-slate-600"
              >
                <Pencil className="h-3.5 w-3.5" />
                {isUk ? "Редагувати" : "Edit"}
              </button>
            )}
          </div>
        </div>
        {err && (
          <div className="border-t border-rose-100 bg-rose-50/60 px-5 py-2.5 text-xs font-semibold text-rose-700">
            {err}
          </div>
        )}
      </LiquidCard>

      {editing ? (
        /* ── Edit form ───────────────────────────────────── */
        <div className="space-y-4">
          <LiquidCard tint="blue" className="p-5">
            <p className="liquid-eyebrow text-blue-700 mb-3">{isUk ? "Основна інформація" : "Basic info"}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={isUk ? "Повна назва *" : "Full name *"} required>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-control w-full rounded-lg px-3 py-2 text-sm sm:col-span-2"
                  autoFocus
                />
              </Field>
              <Field label={isUk ? "Скорочення" : "Short name"}>
                <input
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                  className="input-control w-full rounded-lg px-3 py-2 text-sm font-mono"
                  placeholder="КПІ, ІФБ…"
                />
              </Field>
              <Field label={isUk ? "Тип закладу" : "Type"}>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as InstitutionType)}
                  className="input-control w-full rounded-lg px-3 py-2 text-sm"
                >
                  {TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{isUk ? o.uk : o.en}</option>
                  ))}
                </select>
              </Field>
              <Field label="Email *" required>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-control w-full rounded-lg px-3 py-2 text-sm"
                />
              </Field>
              <Field label={isUk ? "Місто" : "City"}>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="input-control w-full rounded-lg px-3 py-2 text-sm"
                  placeholder="Київ"
                />
              </Field>
              <Field label={isUk ? "Країна" : "Country"}>
                <input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="input-control w-full rounded-lg px-3 py-2 text-sm"
                  placeholder="Україна"
                />
              </Field>
              <Field label="Website" >
                <input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="input-control w-full rounded-lg px-3 py-2 text-sm"
                  placeholder="https://example.edu.ua"
                />
              </Field>
            </div>
          </LiquidCard>

          <LiquidCard tint="emerald" className="p-5">
            <p className="liquid-eyebrow text-emerald-700 mb-3">{isUk ? "Опис та контакти" : "Description & contacts"}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label={isUk ? "Опис закладу" : "Description"}>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="input-control w-full rounded-lg px-3 py-2 text-sm resize-none"
                    placeholder={isUk ? "Коротко про заклад, напрями досліджень…" : "Brief description, research areas…"}
                  />
                </Field>
              </div>
              <Field label={isUk ? "Контактна особа (ПІБ)" : "Contact person"}>
                <input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="input-control w-full rounded-lg px-3 py-2 text-sm"
                />
              </Field>
              <Field label={isUk ? "Телефон" : "Phone"}>
                <input
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  type="tel"
                  placeholder="+380..."
                  className="input-control w-full rounded-lg px-3 py-2 text-sm"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label={isUk ? "Акредитація / рейтинги" : "Accreditation / ratings"}>
                  <input
                    value={accreditation}
                    onChange={(e) => setAccreditation(e.target.value)}
                    className="input-control w-full rounded-lg px-3 py-2 text-sm"
                    placeholder={isUk ? "EUA, Scopus Q1, рівень акредитації IV…" : "EUA, Scopus Q1, Level IV…"}
                  />
                </Field>
              </div>
            </div>
          </LiquidCard>
        </div>
      ) : (
        /* ── Read-only view ──────────────────────────────── */
        <div className="space-y-4">
          <LiquidCard tint="blue" className="p-0 overflow-hidden">
            <div className="border-b border-slate-200/60 bg-blue-50/40 px-5 py-3">
              <span className="liquid-eyebrow text-blue-700">{isUk ? "Основна інформація" : "Basic info"}</span>
            </div>
            <div className="divide-y divide-slate-100/60">
              <InfoRow label={isUk ? "Тип" : "Type"} value={TYPE_OPTIONS.find((o) => o.value === institution.type)?.[isUk ? "uk" : "en"] ?? institution.type} icon={<Building2 className="h-3.5 w-3.5" />} />
              {institution.shortName && <InfoRow label={isUk ? "Скорочення" : "Short name"} value={institution.shortName} mono />}
              <InfoRow label="Email" value={institution.email} icon={<Mail className="h-3.5 w-3.5" />} />
              {(institution.city || institution.country) && (
                <InfoRow label={isUk ? "Місцезнаходження" : "Location"} value={[institution.city, institution.country].filter(Boolean).join(", ")} icon={<MapPin className="h-3.5 w-3.5" />} />
              )}
              {institution.website && (
                <div className="flex items-center gap-3 px-5 py-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><ExternalLink className="h-3.5 w-3.5" /></span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Website</span>
                  <a href={institution.website} target="_blank" rel="noreferrer" className="ml-auto text-sm font-semibold text-emerald-700 hover:underline truncate">{institution.website.replace(/^https?:\/\//, "")}</a>
                </div>
              )}
              {institution.contactName && <InfoRow label={isUk ? "Контактна особа" : "Contact"} value={institution.contactName} />}
              {institution.contactPhone && <InfoRow label={isUk ? "Телефон" : "Phone"} value={institution.contactPhone} icon={<Phone className="h-3.5 w-3.5" />} />}
              {institution.accreditation && <InfoRow label={isUk ? "Акредитація" : "Accreditation"} value={institution.accreditation} />}
            </div>
          </LiquidCard>

          {institution.description && (
            <LiquidCard tint="emerald" className="p-5">
              <span className="liquid-eyebrow text-emerald-700">{isUk ? "Опис" : "Description"}</span>
              <p className="mt-2 text-sm leading-7 text-slate-700 whitespace-pre-wrap">{institution.description}</p>
            </LiquidCard>
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({
  icon, label, value, mono,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      {icon && <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">{icon}</span>}
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">{label}</span>
      <span className={`ml-auto truncate text-sm font-semibold text-slate-900 ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}
