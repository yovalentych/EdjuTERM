"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";

const fieldClass =
  "w-full border border-stone-300 bg-white px-3 py-2 text-sm text-stone-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100";

export function ProjectIdentityFields({
  dictionary,
}: {
  dictionary: Dictionary;
}) {
  const [title, setTitle] = useState("");
  const [acronym, setAcronym] = useState("");
  const [wasEdited, setWasEdited] = useState(false);

  function updateTitle(value: string) {
    setTitle(value);

    if (!wasEdited) {
      setAcronym(buildAcronym(value));
    }
  }

  return (
    <div className="grid gap-3 md:grid-cols-[1.4fr_0.6fr]">
      <label className="space-y-1">
        <span className="text-sm font-medium text-stone-700">
          {dictionary.projects.title}
        </span>
        <input
          name="title"
          value={title}
          onChange={(event) => updateTitle(event.target.value)}
          className={fieldClass}
          placeholder={dictionary.projects.titlePlaceholder}
          required
        />
      </label>
      <label className="space-y-1">
        <span className="text-sm font-medium text-stone-700">
          {dictionary.projects.acronym}
        </span>
        <input
          name="acronym"
          value={acronym}
          onChange={(event) => {
            setWasEdited(true);
            setAcronym(event.target.value.toUpperCase());
          }}
          className={fieldClass}
          placeholder={dictionary.projects.acronymPlaceholder}
          required
          maxLength={32}
        />
      </label>
    </div>
  );
}

function buildAcronym(value: string) {
  const transliterated = transliterate(value);
  const words = transliterated
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((word) => word.length > 2);

  const acronym =
    words.length >= 2
      ? words.map((word) => word[0]).join("")
      : transliterated.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);

  return acronym.toUpperCase().slice(0, 16);
}

function transliterate(value: string) {
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
    ю: "iu",
    я: "ia",
    ь: "",
    "'": "",
  };

  return value
    .toLowerCase()
    .split("")
    .map((char) => map[char] ?? char)
    .join("");
}
