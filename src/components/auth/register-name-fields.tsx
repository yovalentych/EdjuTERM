"use client";

import { useMemo, useState } from "react";
import { Check, Phone, Sparkles, User } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";

// Базовий без horizontal padding — задаємо явно у кожному використанні,
// щоб іконки не перекривалися з текстом.
const fieldBase = "input-control w-full py-2.5 text-sm text-stone-950 outline-none";
const fieldClass = `${fieldBase} px-3`;

// ─── Ukrainian → Latin (KMU 2010) ──────────────────────────────────────────
const map: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh",
  з: "z", и: "y", і: "i", ї: "i", й: "i", к: "k", л: "l", м: "m", н: "n",
  о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
  ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "iu", я: "ia", "'": "", "’": "",
};

const initialMap: Record<string, string> = {
  є: "ye", ї: "yi", й: "y", ю: "yu", я: "ya",
};

function transliterateName(value: string) {
  return value
    .trim()
    .split(/(\s+|-)/)
    .map((part) => (/^\s+$|^-$/u.test(part) ? part : transliterateWord(part)))
    .join("");
}

function transliterateWord(value: string) {
  return value
    .split("")
    .map((char, index) => {
      const lower = char.toLowerCase();
      const replacement =
        index === 0 && initialMap[lower] ? initialMap[lower] : map[lower];
      if (replacement === undefined) return char;
      if (char === lower) return replacement;
      return replacement.charAt(0).toUpperCase() + replacement.slice(1);
    })
    .join("");
}

// ─── Phone formatting (digits only, max 15) ────────────────────────────────
function normalizePhone(value: string): string {
  // Allow leading + then digits only.
  const cleaned = value.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) {
    return "+" + cleaned.slice(1).replace(/\D/g, "").slice(0, 15);
  }
  return cleaned.replace(/\D/g, "").slice(0, 15);
}

const PHONE_RE = /^\+?[1-9]\d{6,14}$/u;

export function RegisterNameFields({ dictionary }: { dictionary: Dictionary }) {
  const isUk = dictionary.alternateLocale === "en";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [firstNameLatin, setFirstNameLatin] = useState("");
  const [lastNameLatin, setLastNameLatin] = useState("");
  const [phone, setPhone] = useState("");
  const [editedLatin, setEditedLatin] = useState({
    firstName: false,
    lastName: false,
  });

  const generatedFirstNameLatin = useMemo(() => transliterateName(firstName), [firstName]);
  const generatedLastNameLatin = useMemo(() => transliterateName(lastName), [lastName]);

  const firstLatinValue = editedLatin.firstName ? firstNameLatin : generatedFirstNameLatin;
  const lastLatinValue  = editedLatin.lastName  ? lastNameLatin  : generatedLastNameLatin;

  const phoneValid = phone.length === 0 || PHONE_RE.test(phone);

  function updateFirstName(value: string) {
    setFirstName(value);
    if (!editedLatin.firstName) setFirstNameLatin(transliterateName(value));
  }

  function updateLastName(value: string) {
    setLastName(value);
    if (!editedLatin.lastName) setLastNameLatin(transliterateName(value));
  }

  return (
    <>
      {/* ── Names (Ukrainian) ───────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm font-medium text-stone-700">
            {dictionary.auth.firstName}
          </span>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              name="firstName"
              className={`${fieldBase} pl-9 pr-3`}
              value={firstName}
              onChange={(event) => updateFirstName(event.target.value)}
              required
              autoComplete="given-name"
            />
          </div>
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-stone-700">
            {dictionary.auth.lastName}
          </span>
          <input
            name="lastName"
            className={fieldClass}
            value={lastName}
            onChange={(event) => updateLastName(event.target.value)}
            required
            autoComplete="family-name"
          />
        </label>
      </div>

      {/* ── Latin names with auto-translit hint ─────────────────── */}
      <div className="rounded-lg border border-emerald-200/70 bg-emerald-50/60 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
            <Sparkles className="h-3 w-3" />
            {isUk ? "Латиниця — для документів і ORCID" : "Latin — for documents and ORCID"}
            {!editedLatin.firstName && !editedLatin.lastName && (
              <span className="rounded bg-emerald-700/10 px-1.5 py-0.5 text-[9px] text-emerald-700">
                {isUk ? "АВТО" : "AUTO"}
              </span>
            )}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-medium text-stone-700">
                {dictionary.auth.firstNameLatin}
              </span>
              <input
                name="firstNameLatin"
                className={fieldClass}
                value={firstLatinValue}
                onChange={(event) => {
                  setEditedLatin((c) => ({ ...c, firstName: true }));
                  setFirstNameLatin(event.target.value);
                }}
                required
                autoComplete="off"
                spellCheck={false}
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-stone-700">
                {dictionary.auth.lastNameLatin}
              </span>
              <input
                name="lastNameLatin"
                className={fieldClass}
                value={lastLatinValue}
                onChange={(event) => {
                  setEditedLatin((c) => ({ ...c, lastName: true }));
                  setLastNameLatin(event.target.value);
                }}
                required
                autoComplete="off"
                spellCheck={false}
              />
            </label>
          </div>
          {(editedLatin.firstName || editedLatin.lastName) && (
            <button
              type="button"
              onClick={() => {
                setEditedLatin({ firstName: false, lastName: false });
                setFirstNameLatin(generatedFirstNameLatin);
                setLastNameLatin(generatedLastNameLatin);
              }}
              className="mt-2 text-[11px] font-bold text-emerald-700 hover:underline"
            >
              ↻ {isUk ? "Відновити автотранслітерацію" : "Restore auto-transliteration"}
            </button>
          )}
        </div>

      {/* ── Phone (optional, for future SMS verification) ───────── */}
      <label className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-stone-700">
            {isUk ? "Телефон" : "Phone"}
            <span className="ml-1 text-xs font-normal text-stone-400">
              {isUk ? "необов'язково" : "optional"}
            </span>
          </span>
          <span className="text-[11px] text-stone-400">
            {isUk ? "Для SMS-підтвердження" : "For SMS verification"}
          </span>
        </div>
        <div className="relative">
          <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            name="phone"
            type="tel"
            placeholder="+380XXXXXXXXX"
            className={`${fieldBase} pl-9 ${phone.length > 0 && phoneValid ? "pr-9" : "pr-3"}`}
            value={phone}
            onChange={(e) => setPhone(normalizePhone(e.target.value))}
            inputMode="tel"
            autoComplete="tel"
            maxLength={16}
          />
          {phone.length > 0 && phoneValid && (
            <Check className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />
          )}
        </div>
        {phone.length > 4 && !phoneValid && (
          <p className="text-xs text-rose-600">
            {isUk ? "Формат: +380XXXXXXXXX (7-15 цифр)" : "Format: +380XXXXXXXXX (7-15 digits)"}
          </p>
        )}
      </label>
    </>
  );
}
