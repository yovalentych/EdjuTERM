import { Sparkles } from "lucide-react";
import { LiquidCard } from "@/components/ui/liquid";
import type { WorkspaceItem } from "@/lib/workspaces";
import { type ItemType } from "@/lib/workspaces-meta";

function typeToBlock(t: ItemType): string {
  if (t === "laboratory") return "lab";
  if (t === "phd") return "phd";
  if (t === "bachelor" || t === "master") return "thesis";
  if (t === "course") return "course";
  if (t === "individual_research") return "research";
  // grant/seminar/open_science/collaboration/study_group/idea
  return t;
}
import { LabBlock } from "./blocks/lab-block";
import { PhdBlock } from "./blocks/phd-block";
import { CourseBlock } from "./blocks/course-block";
import { ThesisBlock } from "./blocks/thesis-block";
import { GenericFieldsBlock } from "./blocks/generic-fields-block";

/**
 * Сервер-диспетчер, який рендерить type-specific деталі для WorkspaceItem.
 *
 * Внутрішнє правило роботи з даними:
 *  - Для legacy item (з `legacyProjectId`) використовуємо саме його як projectId
 *    для існуючих API/колекцій (labInventory, courses, phdPlan тощо).
 *  - Для нових items — використовуємо `item._id` як projectId; колекції повертають
 *    порожньо, item ще не наповнений — це нормальний empty state.
 */
export async function ItemDetailBlock({
  item,
  locale,
  wsId,
}: {
  item: WorkspaceItem;
  locale: string;
  wsId?: string;
}) {
  const detailBlock = typeToBlock(item.type as ItemType);
  const dataProjectId = item.legacyProjectId || item._id || "";

  switch (detailBlock) {
    case "lab":
      return <LabBlock projectId={dataProjectId} locale={locale} legacyProjectId={item.legacyProjectId} />;

    case "phd":
      return <PhdBlock projectId={dataProjectId} locale={locale} legacyProjectId={item.legacyProjectId} />;

    case "course":
      return <CourseBlock projectId={dataProjectId} locale={locale} legacyProjectId={item.legacyProjectId} wsId={wsId} itemId={item._id} />;

    case "thesis":
      return (
        <ThesisBlock
          item={item as any}
          locale={locale}
          legacyProjectId={item.legacyProjectId}
        />
      );

    // Решта типів — універсальний рендер item.fields за специфікацією у GenericFieldsBlock.
    case "grant":
    case "seminar":
    case "open_science":
    case "collaboration":
    case "study_group":
    case "idea":
    case "research":
      return (
        <GenericFieldsBlock
          item={item as any}
          locale={locale}
          legacyProjectId={item.legacyProjectId}
          wsId={wsId}
          itemId={item._id}
        />
      );

    case "generic":
    default:
      return <PlaceholderBlock title={item.title ?? ""} />;
  }
}

function PlaceholderBlock({ title }: { title: string }) {
  return (
    <LiquidCard tint="amber" className="text-center">
      <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
        <Sparkles className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-bold text-slate-900">Деталі</h3>
      <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">
        Тип ще не має спеціального блоку.
      </p>
      <p className="mx-auto mt-3 max-w-md text-[11px] text-slate-400">
        Поточний проєкт: <span className="font-bold text-slate-600">{title}</span>
      </p>
    </LiquidCard>
  );
}
