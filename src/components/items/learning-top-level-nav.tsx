import Link from "next/link";
import { BookOpen, FlaskConical, GraduationCap } from "lucide-react";

type ActiveTab = "learning" | "plan" | "science";

export function LearningTopLevelNav({
  locale,
  wsId,
  itemId,
  learningType,
  active,
  color,
}: {
  locale: string;
  wsId: string;
  itemId: string;
  learningType: string;
  active: ActiveTab;
  color: string;
}) {
  const isUk = locale === "uk";
  const scienceLabel = isUk
    ? { bachelor: "Кваліфікаційна робота", master: "Магістерська робота", phd: "Дисертація" }[learningType] ?? "Наукова складова"
    : { bachelor: "Thesis", master: "Master's Thesis", phd: "Dissertation" }[learningType] ?? "Science";

  const items = [
    {
      id: "learning" as const,
      href: `/${locale}/app/space/${wsId}/items/${itemId}/learning`,
      label: isUk ? "Навчальна складова" : "Academic Track",
      icon: BookOpen,
    },
    ...(learningType === "phd" ? [{
      id: "plan" as const,
      href: `/${locale}/app/space/${wsId}/items/${itemId}/plan`,
      label: isUk ? "Загальний план" : "General Plan",
      icon: GraduationCap,
    }] : []),
    {
      id: "science" as const,
      href: `/${locale}/app/space/${wsId}/items/${itemId}/science`,
      label: scienceLabel,
      icon: FlaskConical,
    },
  ];

  return (
    <div className="flex overflow-x-auto gap-1 rounded-2xl border border-slate-200/70 bg-white/60 p-1 shadow-sm backdrop-blur">
      {items.map(({ id, href, label, icon: Icon }) => {
        const isActive = id === active;
        return (
          <Link
            key={id}
            href={href}
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition whitespace-nowrap"
            style={isActive ? { background: color, color: "#fff" } : {}}
          >
            <Icon className="h-4 w-4" />
            <span className={isActive ? "" : "text-slate-500"}>{label}</span>
          </Link>
        );
      })}
    </div>
  );
}
