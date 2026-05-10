import { CheckCircle, Circle, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Milestone, ResearchStage, Task } from "@/lib/schemas";

function toMs(s: string) {
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.getTime();
}

export function SetupChecklist({
  stages,
  tasks,
  milestones,
  locale,
  projectId,
  baseUrl,
}: {
  stages: ResearchStage[];
  tasks: Task[];
  milestones: Milestone[];
  locale: string;
  projectId: string;
  baseUrl: string;
}) {
  const isUk = locale === "uk";

  const stagesWithDates = stages.filter(
    (s) => toMs(s.startDate) && toMs(s.endDate),
  );
  const stagesWithProgress = stages.filter((s) => (s.progress ?? 0) > 0);
  const stagesWithTasks = stages.filter((s) => s.linkedTaskIds.length > 0);

  const steps = [
    {
      done: stages.length > 0,
      label: isUk ? "Створіть хоча б один етап (ЕВП)" : "Create at least one stage",
      hint: isUk
        ? 'Вкладка "Етапи" → натисніть "Додати етап"'
        : 'Go to "Stages" tab → click "Add stage"',
      href: `${baseUrl}&tab=stages`,
      action: isUk ? "Перейти до Етапів →" : "Go to Stages →",
    },
    {
      done: stagesWithDates.length === stages.length && stages.length > 0,
      label: isUk
        ? "Встановіть дати початку і кінця кожного етапу"
        : "Set start and end dates for every stage",
      hint: isUk
        ? "Без дат Гант-діаграма порожня. Використовуйте поля дат у формі етапу."
        : "Without dates the Gantt chart will be empty. Use the date pickers in the stage form.",
      href: `${baseUrl}&tab=stages`,
      action: isUk ? "Відредагувати Етапи →" : "Edit Stages →",
    },
    {
      done: stagesWithProgress.length > 0,
      label: isUk ? "Вкажіть прогрес виконання хоча б одного етапу" : "Set progress on at least one stage",
      hint: isUk
        ? 'На картці етапу → слайдер "Прогрес виконання" → зберегти.'
        : 'On the stage card → "Completion progress" slider → save.',
      href: `${baseUrl}&tab=stages`,
      action: isUk ? "Оновити прогрес →" : "Update progress →",
    },
    {
      done: milestones.length > 0,
      label: isUk ? "Додайте ключові дати (вехи)" : "Add milestones",
      hint: isUk
        ? 'Модуль "Планування" → вкладка "Ключові дати" → "Нова ключова дата".'
        : '"Planning" module → "Key dates" tab → "New milestone".',
      href: `/${locale}/app/planning?projectId=${projectId}&tab=milestones`,
      action: isUk ? "Відкрити Планування →" : "Open Planning →",
    },
    {
      done: stagesWithTasks.length > 0,
      label: isUk ? "Прив'яжіть задачі до етапів" : "Link tasks to stages",
      hint: isUk
        ? 'Спочатку створіть задачі в "Планування", потім прив\'яжіть їх до етапів на картках нижче.'
        : 'First create tasks in "Planning", then link them to stages using the cards below.',
      href: `/${locale}/app/planning?projectId=${projectId}`,
      action: isUk ? "Відкрити Планування →" : "Open Planning →",
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;

  if (allDone) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-indigo-200 bg-indigo-50">
      <div className="flex items-center justify-between gap-3 border-b border-indigo-200 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-bold text-indigo-800">
            {isUk ? "Підготовка Ганта" : "Gantt setup"}
          </span>
          <span className="rounded-full bg-indigo-200 px-2 py-0.5 font-mono text-xs font-bold text-indigo-800">
            {doneCount}/{steps.length}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-2 w-32 overflow-hidden rounded-full bg-indigo-200">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all"
            style={{ width: `${(doneCount / steps.length) * 100}%` }}
          />
        </div>
      </div>
      <ul className="divide-y divide-indigo-100">
        {steps.map((step, i) => (
          <li key={i} className={`flex gap-3 px-5 py-3 ${step.done ? "opacity-60" : ""}`}>
            <div className="mt-0.5 shrink-0">
              {step.done ? (
                <CheckCircle className="h-4.5 w-4.5 text-emerald-600" />
              ) : (
                <Circle className="h-4.5 w-4.5 text-indigo-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-semibold ${step.done ? "line-through text-stone-400" : "text-indigo-900"}`}>
                {i + 1}. {step.label}
              </p>
              {!step.done && (
                <p className="mt-0.5 text-xs text-indigo-600">{step.hint}</p>
              )}
            </div>
            {!step.done && (
              <Link
                href={step.href}
                className="inline-flex shrink-0 items-center gap-1 self-center rounded border border-indigo-300 bg-white px-2.5 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-600 hover:text-white"
              >
                {step.action}
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
