"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Cpu, Sparkles } from "lucide-react";
import clsx from "clsx";
import { saveAiSystemSettings } from "@/app/admin-actions";
import { OPENAI_SYLLABUS_MODELS, type AiSystemSettings, type OpenAiSyllabusModel } from "@/lib/ai-models";

export function AiSettingsForm({
  initialSettings,
  isUk,
  locale,
}: {
  initialSettings: AiSystemSettings;
  isUk: boolean;
  locale: string;
}) {
  const [model, setModel] = useState<OpenAiSyllabusModel>(initialSettings.openAiSyllabusModel);
  const [savedModel, setSavedModel] = useState<OpenAiSyllabusModel>(initialSettings.openAiSyllabusModel);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [pending, start] = useTransition();

  function save() {
    const fd = new FormData();
    fd.set("locale", locale);
    fd.set("openAiSyllabusModel", model);
    setStatus("idle");
    start(async () => {
      const res = await saveAiSystemSettings(fd);
      if (res.ok) setSavedModel(model);
      setStatus(res.ok ? "saved" : "error");
    });
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-black text-slate-950">
            {isUk ? "AI модель для імпорту силабусів" : "AI model for syllabus import"}
          </h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {isUk
              ? "Більша модель зазвичай точніше читає складні таблиці й неоднозначні скорочення, але працює повільніше та дорожче."
              : "Larger models usually parse complex tables and ambiguous abbreviations better, but are slower and more expensive."}
          </p>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        {OPENAI_SYLLABUS_MODELS.map((option) => {
          const active = model === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setModel(option.id)}
              className={clsx(
                "rounded-xl border p-3 text-left transition",
                active
                  ? "border-violet-400 bg-violet-50 text-violet-950 shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:border-violet-200 hover:bg-violet-50/40",
              )}
            >
              <div className="flex items-center gap-2">
                <Cpu className={clsx("h-4 w-4", active ? "text-violet-700" : "text-slate-400")} />
                <span className="text-sm font-black">{option.label}</span>
                {active && <CheckCircle2 className="ml-auto h-4 w-4 text-violet-700" />}
              </div>
              <p className="mt-1.5 text-xs leading-5 text-slate-500">{option.description}</p>
              <p className="mt-2 font-mono text-[10px] font-bold text-slate-400">{option.id}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <p className="text-[11px] text-slate-400">
          {isUk ? "Застосовується до наступних AI preview/import запитів." : "Applies to the next AI preview/import requests."}
        </p>
        <div className="flex items-center gap-2">
          {status === "saved" && <span className="text-xs font-bold text-emerald-600">{isUk ? "Збережено" : "Saved"}</span>}
          {status === "error" && <span className="text-xs font-bold text-rose-600">{isUk ? "Помилка" : "Error"}</span>}
          <button
            type="button"
            onClick={save}
            disabled={pending || model === savedModel}
            className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-violet-700 disabled:opacity-50"
          >
            {pending ? "..." : isUk ? "Зберегти модель" : "Save model"}
          </button>
        </div>
      </div>
    </div>
  );
}
