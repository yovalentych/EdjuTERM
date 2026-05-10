"use client";

import { useMemo, useState } from "react";
import type { Dictionary } from "@/lib/i18n";

const fieldClass =
  "input-control w-full px-3 py-2 text-sm text-stone-950 outline-none";

const map: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "h",
  ґ: "g",
  д: "d",
  е: "e",
  є: "ie",
  ж: "zh",
  з: "z",
  и: "y",
  і: "i",
  ї: "i",
  й: "i",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ь: "",
  ю: "iu",
  я: "ia",
  "'": "",
  "’": "",
};

const initialMap: Record<string, string> = {
  є: "ye",
  ї: "yi",
  й: "y",
  ю: "yu",
  я: "ya",
};

function transliterateName(value: string) {
  return value
    .trim()
    .split(/(\s+|-)/)
    .map((part) => {
      if (/^\s+$|^-$/u.test(part)) {
        return part;
      }

      return transliterateWord(part);
    })
    .join("");
}

function transliterateWord(value: string) {
  return value
    .split("")
    .map((char, index) => {
      const lower = char.toLowerCase();
      const replacement =
        index === 0 && initialMap[lower] ? initialMap[lower] : map[lower];

      if (replacement === undefined) {
        return char;
      }

      if (char === lower) {
        return replacement;
      }

      return replacement.charAt(0).toUpperCase() + replacement.slice(1);
    })
    .join("");
}

export function RegisterNameFields({ dictionary }: { dictionary: Dictionary }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [firstNameLatin, setFirstNameLatin] = useState("");
  const [lastNameLatin, setLastNameLatin] = useState("");
  const [editedLatin, setEditedLatin] = useState({
    firstName: false,
    lastName: false,
  });

  const generatedFirstNameLatin = useMemo(
    () => transliterateName(firstName),
    [firstName],
  );
  const generatedLastNameLatin = useMemo(
    () => transliterateName(lastName),
    [lastName],
  );

  function updateFirstName(value: string) {
    setFirstName(value);

    if (!editedLatin.firstName) {
      setFirstNameLatin(transliterateName(value));
    }
  }

  function updateLastName(value: string) {
    setLastName(value);

    if (!editedLatin.lastName) {
      setLastNameLatin(transliterateName(value));
    }
  }

  return (
    <>
      <label className="space-y-1">
        <span className="text-sm font-medium text-stone-700">
          {dictionary.auth.firstName}
        </span>
        <input
          name="firstName"
          className={fieldClass}
          value={firstName}
          onChange={(event) => updateFirstName(event.target.value)}
          required
        />
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
        />
      </label>
      <label className="space-y-1">
        <span className="text-sm font-medium text-stone-700">
          {dictionary.auth.firstNameLatin}
        </span>
        <input
          name="firstNameLatin"
          className={fieldClass}
          value={firstNameLatin || generatedFirstNameLatin}
          onChange={(event) => {
            setEditedLatin((current) => ({ ...current, firstName: true }));
            setFirstNameLatin(event.target.value);
          }}
          required
        />
      </label>
      <label className="space-y-1">
        <span className="text-sm font-medium text-stone-700">
          {dictionary.auth.lastNameLatin}
        </span>
        <input
          name="lastNameLatin"
          className={fieldClass}
          value={lastNameLatin || generatedLastNameLatin}
          onChange={(event) => {
            setEditedLatin((current) => ({ ...current, lastName: true }));
            setLastNameLatin(event.target.value);
          }}
          required
        />
      </label>
    </>
  );
}
