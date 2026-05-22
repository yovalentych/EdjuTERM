import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { LiquidAppShell } from "@/components/liquid-app-shell";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";
import { getItemForUser } from "@/lib/workspaces";
import { ITEM_TYPE_META, LEARNING_TYPES, type ItemType } from "@/lib/workspaces-meta";
import {
  listCourses, listModulesForProject, listTopicsForProject,
  listAssessmentsForProject, listSessionsForProject, listAssignmentsForProject,
} from "@/lib/learning";
import { LearningJournal } from "@/components/learning/learning-journal";
import { LearningTopLevelNav } from "@/components/items/learning-top-level-nav";

export default async function ItemLearningPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; wsId: string; itemId: string }>;
  searchParams: Promise<{ tab?: string; courseId?: string; action?: string }>;
}) {
  const { locale: localeParam, wsId, itemId } = await params;
  if (!isLocale(localeParam)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/${localeParam}/login`);

  const dictionary = getDictionary(localeParam);
  const item = await getItemForUser(itemId, user);
  if (!item) notFound();

  const LEARNING_ALLOWED: ItemType[] = [...LEARNING_TYPES, "course"];
  if (!LEARNING_ALLOWED.includes(item.type as ItemType)) {
    redirect(`/${localeParam}/app/space/${wsId}/items/${itemId}`);
  }

  const dataId = item.legacyProjectId || item._id || "";
  const itemFields = item.fields as Record<string, any>;
  const sp = await searchParams;
  const initialCourseId = sp.courseId ?? null;
  const isUk = localeParam === "uk";
  const meta = ITEM_TYPE_META[item.type as ItemType];

  const [courses, modules, topics, assessments, sessions, assignments] = await Promise.all([
    listCourses(dataId).catch(() => []),
    listModulesForProject(dataId).catch(() => []),
    listTopicsForProject(dataId).catch(() => []),
    listAssessmentsForProject(dataId).catch(() => []),
    listSessionsForProject(dataId).catch(() => []),
    listAssignmentsForProject(dataId).catch(() => []),
  ]);

  return (
    <LiquidAppShell dictionary={dictionary} locale={localeParam} user={user}>
      <div className="flex flex-col gap-4">
        {/* Breadcrumb */}
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
            <BookOpen className="h-3.5 w-3.5" />
            {isUk ? "Навчальна складова" : "Academic Track"}
          </span>
        </div>

        <LearningTopLevelNav
          locale={localeParam}
          wsId={wsId}
          itemId={itemId}
          learningType={item.type}
          active="learning"
          color={meta.color}
        />

        {/* Learning Journal */}
        <LearningJournal
          projectId={dataId}
          locale={localeParam}
          canManage={true}
          initialCourseId={initialCourseId}
          courses={courses}
          modules={modules}
          topics={topics}
          assessments={assessments}
          sessions={sessions}
          assignments={assignments}
          isDissertation={item.type === "phd"}
          learningProfile={{
            institution: String(itemFields?.university || itemFields?.institution || ""),
            programName: String(itemFields?.programName || itemFields?.educationalProgram || ""),
            faculty: String(itemFields?.faculty || itemFields?.institute || ""),
            department: String(itemFields?.department || ""),
            studyLevel: String(item.type || ""),
            academicSettings: itemFields?.academicSettings ?? null,
          }}
        />
      </div>
    </LiquidAppShell>
  );
}
