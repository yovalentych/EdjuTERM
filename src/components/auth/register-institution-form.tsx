"use client";

import { useFormStatus } from "react-dom";
import { useEffect, useState } from "react";
import {
  ArrowLeft, ArrowRight, Building2, Check, Eye, EyeOff, Globe, Globe2, KeyRound,
  Loader2, Mail, MapPin, Phone, Sparkles, User,
} from "lucide-react";
import { registerInstitution } from "@/app/actions";

type EdboPick = {
  name: string;
  shortName: string;
  city: string;
  type: string;
};

const fieldBase = "input-control w-full py-2.5 text-sm text-stone-950 outline-none";

const INSTITUTION_TYPES = [
  { value: "university", uk: "Університет",              en: "University" },
  { value: "institute",  uk: "Інститут",                  en: "Institute" },
  { value: "academy",    uk: "Академія",                  en: "Academy" },
  { value: "college",    uk: "Коледж",                    en: "College" },
  { value: "school",     uk: "Школа / гімназія",          en: "School" },
  { value: "research",   uk: "Науково-дослідна установа", en: "Research org" },
  { value: "other",      uk: "Інше",                      en: "Other" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function RegisterInstitutionForm({ locale }: { locale: "uk" | "en" }) {
  const isUk = locale === "uk";

  // Step 1: Institution data
  const [institutionName, setInstName] = useState("");
  const [institutionShortName, setInstShort] = useState("");
  const [institutionType, setInstType] = useState("university");
  const [institutionCountry, setInstCountry] = useState("Україна");
  const [institutionCity, setInstCity] = useState("");
  const [institutionWebsite, setInstWebsite] = useState("");
  const [institutionDescription, setInstDescr] = useState("");

  // Step 2: Admin/contact user
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const [step, setStep] = useState<1 | 2>(1);

  const emailValid = email.length === 0 || EMAIL_RE.test(email);
  const step1Valid =
    institutionName.trim().length >= 2 &&
    institutionType.length > 0 &&
    institutionCity.trim().length > 0;
  const step2Valid =
    contactName.trim().length >= 2 &&
    EMAIL_RE.test(email) &&
    password.length >= 8 &&
    agreed;

  return (
    <form action={registerInstitution} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />

      {/* progress */}
      <div className="flex items-center gap-2">
        <StepDot active={step >= 1} done={step > 1} label={isUk ? "Заклад" : "Institution"} />
        <div className={`h-px flex-1 ${step >= 2 ? "bg-emerald-400" : "bg-slate-200"}`} />
        <StepDot active={step >= 2} done={false} label={isUk ? "Контактна особа" : "Contact"} />
      </div>

      {/* ── Step 1 ────────────────────────────────────────── */}
      <fieldset className={step === 1 ? "" : "hidden"}>
        <h2 className="mb-3 text-sm font-bold tracking-tight text-slate-900">
          {isUk ? "Дані навчального закладу" : "Institution data"}
        </h2>

        <div className="grid gap-3">
          <Field label={isUk ? "Повна назва закладу" : "Full name"} required icon={<Building2 className="h-3 w-3" />}>
            <InstitutionNameAutocomplete
              locale={locale}
              value={institutionName}
              onChange={setInstName}
              onPickFromEdbo={(e) => {
                setInstName(e.name);
                if (e.shortName) setInstShort(e.shortName);
                if (/університет/i.test(e.type)) setInstType("university");
                else if (/інститут/i.test(e.type)) setInstType("institute");
                else if (/академі/i.test(e.type)) setInstType("academy");
                else if (/колед/i.test(e.type)) setInstType("college");
                else if (/наукові/i.test(e.type)) setInstType("research");
                if (e.city) setInstCity(e.city.replace(/^м\.\s*/i, ""));
                setInstCountry("Україна");
              }}
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
            <Field label={isUk ? "Тип" : "Type"} required>
              <select
                name="institutionType"
                value={institutionType}
                onChange={(e) => setInstType(e.target.value)}
                className={`${fieldBase} px-3`}
              >
                {INSTITUTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{isUk ? t.uk : t.en}</option>
                ))}
              </select>
            </Field>
            <Field label={isUk ? "Скорочення" : "Abbreviation"}>
              <input
                name="institutionShortName"
                value={institutionShortName}
                onChange={(e) => setInstShort(e.target.value)}
                maxLength={40}
                placeholder={isUk ? "КНУ" : "KNU"}
                className={`${fieldBase} px-3`}
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={isUk ? "Країна" : "Country"} icon={<MapPin className="h-3 w-3" />}>
              <input
                name="institutionCountry"
                value={institutionCountry}
                onChange={(e) => setInstCountry(e.target.value)}
                maxLength={80}
                className={`${fieldBase} px-3`}
              />
            </Field>
            <Field label={isUk ? "Місто" : "City"} required icon={<MapPin className="h-3 w-3" />}>
              <input
                name="institutionCity"
                value={institutionCity}
                onChange={(e) => setInstCity(e.target.value)}
                required
                maxLength={120}
                placeholder={isUk ? "Київ" : "Kyiv"}
                className={`${fieldBase} px-3`}
              />
            </Field>
          </div>

          <Field label={isUk ? "Веб-сайт" : "Website"} icon={<Globe className="h-3 w-3" />}>
            <input
              name="institutionWebsite"
              type="url"
              value={institutionWebsite}
              onChange={(e) => setInstWebsite(e.target.value)}
              maxLength={240}
              placeholder="https://knu.ua"
              className={`${fieldBase} px-3`}
            />
          </Field>

          <Field label={isUk ? "Короткий опис" : "Short description"}>
            <textarea
              name="institutionDescription"
              value={institutionDescription}
              onChange={(e) => setInstDescr(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder={isUk ? "Місія, основні факультети, акредитація…" : "Mission, key faculties, accreditation…"}
              className={`${fieldBase} px-3`}
            />
          </Field>
        </div>

        <div className="mt-4 flex items-center justify-end">
          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={!step1Valid}
            className="liquid-cta text-sm disabled:opacity-60"
          >
            {isUk ? "Далі" : "Next"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </fieldset>

      {/* ── Step 2 ────────────────────────────────────────── */}
      <fieldset className={step === 2 ? "" : "hidden"}>
        <h2 className="mb-3 text-sm font-bold tracking-tight text-slate-900">
          {isUk ? "Контактна особа / адміністратор" : "Contact / administrator"}
        </h2>
        <div className="grid gap-3">
          <Field label={isUk ? "ПІБ контактної особи" : "Full name"} required icon={<User className="h-3 w-3" />}>
            <input
              name="contactName"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              required
              minLength={2}
              maxLength={200}
              placeholder={isUk ? "Іваненко Іван Іванович" : "John Smith"}
              className={`${fieldBase} px-3`}
              autoComplete="name"
            />
          </Field>

          <Field label={isUk ? "Телефон" : "Phone"} icon={<Phone className="h-3 w-3" />}>
            <input
              name="contactPhone"
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              maxLength={20}
              placeholder="+380XXXXXXXXX"
              className={`${fieldBase} px-3`}
              autoComplete="tel"
            />
          </Field>

          <Field label="Email" required icon={<Mail className="h-3 w-3" />}>
            <div className="relative">
              <input
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                spellCheck={false}
                inputMode="email"
                placeholder="admin@knu.ua"
                className={`${fieldBase} pl-3 ${emailValid && email.length > 0 ? "pr-9" : "pr-3"}`}
                autoComplete="email"
              />
              {emailValid && email.length > 0 && (
                <Check className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />
              )}
            </div>
            {!emailValid && email.length > 3 && (
              <p className="mt-1 text-xs text-rose-600">{isUk ? "Перевірте формат пошти" : "Check email format"}</p>
            )}
          </Field>

          <Field label={isUk ? "Пароль" : "Password"} required icon={<KeyRound className="h-3 w-3" />}>
            <div className="relative">
              <input
                name="password"
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder={isUk ? "Мінімум 8 символів" : "Min. 8 characters"}
                className={`${fieldBase} px-3 pr-10`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-stone-500 hover:text-stone-800"
                aria-label={showPwd ? "hide" : "show"}
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          <label className="flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              name="termsAccepted"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-emerald-700"
            />
            <span className="text-xs leading-5 text-stone-600">
              {isUk ? (
                <>
                  Я підтверджую, що маю повноваження реєструвати цей заклад, і погоджуюся з{" "}
                  <a href={`/${locale}/terms`} className="font-semibold text-emerald-700 hover:underline">умовами використання</a>{" "}
                  та <a href={`/${locale}/privacy`} className="font-semibold text-emerald-700 hover:underline">політикою конфіденційності</a>.
                </>
              ) : (
                <>
                  I confirm I am authorized to register this institution and agree to the{" "}
                  <a href={`/${locale}/terms`} className="font-semibold text-emerald-700 hover:underline">terms of service</a>{" "}
                  and <a href={`/${locale}/privacy`} className="font-semibold text-emerald-700 hover:underline">privacy policy</a>.
                </>
              )}
            </span>
          </label>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {isUk ? "Назад" : "Back"}
          </button>
          <SubmitButton disabled={!step2Valid} label={isUk ? "Зареєструвати заклад" : "Register institution"} />
        </div>
      </fieldset>
    </form>
  );
}

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
          done ? "bg-emerald-600 text-white"
          : active ? "border-2 border-emerald-500 bg-white text-emerald-700"
          : "border-2 border-slate-200 bg-white text-slate-400"
        }`}
      >
        {done ? <Check className="h-3 w-3" /> : (active ? "●" : "○")}
      </span>
      <span className={`text-[11px] font-bold uppercase tracking-wider ${active ? "text-emerald-700" : "text-slate-400"}`}>
        {label}
      </span>
    </div>
  );
}

function Field({
  label,
  required,
  icon,
  children,
}: {
  label: string;
  required?: boolean;
  icon?: React.ReactNode;
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

function SubmitButton({ disabled, label }: { disabled: boolean; label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="liquid-cta inline-flex items-center gap-2 text-sm disabled:opacity-60"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      {label}
    </button>
  );
}

/**
 * Inline-autocomplete для поля "Повна назва закладу":
 *   • Користувач вводить — нижче з'являється dropdown з пропозиціями ЄДЕБО.
 *   • Клік по пропозиції — підтягуємо повну назву + місто + тип у форму.
 *   • Якщо нічого не обрано — значення поля залишається тим, що ввів сам.
 */
function InstitutionNameAutocomplete({
  locale,
  value,
  onChange,
  onPickFromEdbo,
}: {
  locale: "uk" | "en";
  value: string;
  onChange: (v: string) => void;
  onPickFromEdbo: (e: EdboPick) => void;
}) {
  const isUk = locale === "uk";
  const [results, setResults] = useState<EdboPick[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  /** Flag що користувач щойно обрав пропозицію — не показуємо dropdown знову до зміни. */
  const [justPicked, setJustPicked] = useState(false);

  useEffect(() => {
    if (justPicked) return;
    const q = value.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/institutions/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data?.edbo ?? []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [value, justPicked]);

  const showDropdown = open && !justPicked && value.trim().length >= 2 && (results.length > 0 || searching);

  return (
    <div className="relative">
      <input
        name="institutionName"
        value={value}
        onChange={(e) => {
          setJustPicked(false);
          onChange(e.target.value);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Невелика затримка, щоб клік по пункту встиг спрацювати раніше.
          setTimeout(() => setOpen(false), 150);
        }}
        required
        minLength={2}
        maxLength={300}
        placeholder={isUk
          ? "Почніть вводити: «КНУ», «Шевченка», «Київський…»"
          : "Start typing: \"KNU\", \"Shevchenko\", \"Kyiv…\""}
        className={`${fieldBase} px-3`}
        autoComplete="off"
        spellCheck={false}
      />

      {searching && (
        <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-slate-400" />
      )}

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-xl border border-blue-200 bg-white shadow-lg">
          <div className="flex items-center gap-1.5 border-b border-blue-100 bg-blue-50/50 px-3 py-1.5">
            <Globe2 className="h-3 w-3 text-blue-700" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
              {isUk ? "Реєстр ЄДЕБО (МОН України)" : "EDBO registry (Ministry of Education)"}
            </span>
          </div>
          {results.length === 0 && !searching ? (
            <p className="px-3 py-3 text-xs text-slate-500">
              {isUk ? "Нічого не знайдено — продовжуйте вводити вручну." : "Nothing found — keep typing manually."}
            </p>
          ) : (
            results.map((e, idx) => (
              <button
                key={`${e.name}-${idx}`}
                type="button"
                onMouseDown={(ev) => ev.preventDefault()}
                onClick={() => {
                  onPickFromEdbo(e);
                  setJustPicked(true);
                  setResults([]);
                  setOpen(false);
                }}
                className="flex w-full items-start gap-2 border-b border-slate-100 px-3 py-2 text-left transition last:border-0 hover:bg-blue-50/40"
              >
                <Globe2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{e.name}</p>
                  <p className="truncate text-[11px] text-slate-500">
                    {[e.shortName, e.city, e.type].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <Check className="h-3 w-3 shrink-0 text-slate-300" />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
