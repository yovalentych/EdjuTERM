import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { LiquidAppShell } from "@/components/liquid-app-shell";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";
import { getItemForUser } from "@/lib/workspaces";
import { ITEM_TYPE_META, LEARNING_TYPES, type ItemType } from "@/lib/workspaces-meta";
import { getPhdPlan } from "@/lib/phd-plan";
import { PhdPlanView } from "@/components/phd-plan/phd-plan-view";
import { LearningTopLevelNav } from "@/components/items/learning-top-level-nav";

export default async function ItemPlanPage({
  params,
}: {
  params: Promise<{ locale: string; wsId: string; itemId: string }>;
}) {
  const { locale: localeParam, wsId, itemId } = await params;
  if (!isLocale(localeParam)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/${localeParam}/login`);

  const dictionary = getDictionary(localeParam);
  const item = await getItemForUser(itemId, user);
  if (!item) notFound();

  if (!LEARNING_TYPES.includes(item.type as ItemType)) {
    redirect(`/${localeParam}/app/space/${wsId}/items/${itemId}`);
  }
  if (item.type !== "phd") {
    redirect(`/${localeParam}/app/space/${wsId}/items/${itemId}/learning`);
  }

  const meta = ITEM_TYPE_META[item.type as ItemType];
  const dataId = item.legacyProjectId || item._id || "";
  const plan = await getPhdPlan(dataId).catch(() => null);
  const fields = item.fields as Record<string, unknown>;

  return (
    <LiquidAppShell dictionary={dictionary} locale={localeParam} user={user}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Link
            href={`/${localeParam}/app/space/${wsId}/items/${itemId}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/75 px-3 py-1.5 text-xs font-bold backdrop-blur transition hover:bg-white"
            style={{ color: meta.color }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {item.title.split(" — ")[0]}
          </Link>
          <span className="text-slate-300">/</span>
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
            <GraduationCap className="h-3.5 w-3.5" />
            {localeParam === "uk" ? "Загальний план аспірантури" : "General PhD Plan"}
          </span>
        </div>

        <LearningTopLevelNav
          locale={localeParam}
          wsId={wsId}
          itemId={itemId}
          learningType={item.type}
          active="plan"
          color={meta.color}
        />

        <PhdPlanView
          projectId={dataId}
          locale={localeParam}
          canManage={true}
          initialPlan={plan}
          userDefaults={{
            studentName: `${user.firstName} ${user.lastName}`,
            specialty: String(fields?.specialtyCode ?? ""),
            institution: String(fields?.institution ?? fields?.university ?? ""),
          }}
        />
      </div>
    </LiquidAppShell>
  );
}
