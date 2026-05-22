import { Dictionary } from "@/lib/i18n";
import { Project } from "@/lib/schemas";
import { NavGroup } from "@/components/workspace-shell";

export function getProjectNavGroups(
  project: Project,
  dictionary: Dictionary,
  locale: string
): NavGroup[] {
  const isUk = locale === "uk";
  const isDissertation = project.projectType === "dissertation";
  const isLaboratory = project.projectType === "laboratory";

  if (isLaboratory) {
    return [
      {
        label: isUk ? "Огляд" : "Overview",
        items: [
          { id: "overview", label: dictionary.projects.tabOverview, icon: "square-stack", href: `/${locale}/app/laboratory?projectId=${project._id}&tab=overview` },
        ],
      },
      {
        label: isUk ? "Керування лаб." : "Lab Management",
        items: [
          { id: "inventory", label: isUk ? "Склад" : "Inventory", icon: "database", href: `/${locale}/app/laboratory?projectId=${project._id}&tab=inventory` },
          { id: "equipment", label: isUk ? "Обладнання" : "Equipment", icon: "microscope", href: `/${locale}/app/laboratory?projectId=${project._id}&tab=equipment` },
          { id: "logs", label: isUk ? "Журнали GLP" : "Usage Logs", icon: "notebook-pen", href: `/${locale}/app/laboratory?projectId=${project._id}&tab=logs` },
        ],
      },
      {
        label: isUk ? "Команда та налаштування" : "Team & Settings",
        items: [
          { id: "team", label: dictionary.projects.tabTeam, icon: "users", href: `/${locale}/app/laboratory?projectId=${project._id}&tab=team` },
          { id: "settings", label: dictionary.projects.settings, icon: "settings", href: `/${locale}/app/laboratory?projectId=${project._id}&tab=settings` },
        ],
      },
    ];
  }

  return [
    {
      label: isUk ? "Огляд" : "Overview",
      items: [
        { id: "overview", label: dictionary.projects.tabOverview, icon: "square-stack", href: `/${locale}/app/project?projectId=${project._id}&tab=overview` },
      ],
    },
    {
      label: isUk ? "Доказова база" : "Evidence",
      items: [
        { id: "records", label: dictionary.projects.tabRecords, icon: "database", href: `/${locale}/app/project?projectId=${project._id}&tab=records` },
        { id: "experiments", label: dictionary.experiments.openExperiments, icon: "flask-conical", href: `/${locale}/app/experiments?projectId=${project._id}` },
        { id: "almanac", label: isUk ? "Альманах" : "Almanac", icon: "book-marked", href: `/${locale}/app/almanac?projectId=${project._id}` },
      ],
    },
    {
      label: isUk ? "Виконання" : "Execution",
      items: [
        { id: "research-plan", label: dictionary.researchPlan.openPlan, icon: "clipboard-list", href: `/${locale}/app/research-plan?projectId=${project._id}` },
        { id: "planning", label: dictionary.planning.openPlanning, icon: "calendar-days", href: `/${locale}/app/planning?projectId=${project._id}` },
        { id: "budget", label: dictionary.budget.openBudget, icon: "wallet", href: `/${locale}/app/budget?projectId=${project._id}` },
      ],
    },
    {
      label: isUk ? "Результати" : "Outputs",
      items: [
        { id: "openscience", label: dictionary.projects.tabOpenScience, icon: "globe", href: `/${locale}/app/project?projectId=${project._id}&tab=openscience` },
        { id: "manuscripts", label: isUk ? "Рукописи" : "Manuscripts", icon: "file-signature", href: `/${locale}/app/project?projectId=${project._id}&tab=manuscripts` },
        { id: "reports", label: dictionary.reports.openReports, icon: "file-text", href: `/${locale}/app/reports?projectId=${project._id}` },
      ],
    },
    {
      label: isUk ? "Команда та Навчання" : "Team & Education",
      items: [
        { id: "team", label: dictionary.projects.tabTeam, icon: "users", href: `/${locale}/app/project?projectId=${project._id}&tab=team` },
        { id: "learning", label: isUk ? "Журнал навчання" : "Learning", icon: "book-open", href: `/${locale}/app/learning?projectId=${project._id}` },
        { id: "diary", label: isUk ? "Щоденник" : "Diary", icon: "notebook-pen", href: `/${locale}/app/diary?projectId=${project._id}` },
        ...(isDissertation ? [{ id: "phd-plan", label: isUk ? "Інд. план" : "PhD Plan", icon: "graduation-cap" as const, href: `/${locale}/app/phd-plan?projectId=${project._id}` }] : []),
      ],
    },
    {
      label: isUk ? "Керування" : "Settings",
      items: [
        { id: "settings", label: dictionary.projects.settings, icon: "settings", href: `/${locale}/app/project-settings?projectId=${project._id}` },
      ],
    },
  ];
}

export function getAppNavGroups(dictionary: Dictionary, locale: string, userRole: string): NavGroup[] {
  const isUk = locale === "uk";
  return [
    {
      label: isUk ? "Головна" : "Home",
      items: [
        { id: "space", label: isUk ? "Мій простір" : "My Space", icon: "layout-dashboard", href: `/${locale}/app/space` },
      ],
    },
    {
      label: isUk ? "Навчання" : "Learning",
      items: [
        { id: "learning-bachelor", label: isUk ? "Бакалаврат" : "Bachelor", icon: "graduation-cap", href: `/${locale}/app/space?kind=bachelor` },
        { id: "learning-master",   label: isUk ? "Магістратура" : "Master",  icon: "graduation-cap", href: `/${locale}/app/space?kind=master` },
        { id: "learning-phd",      label: isUk ? "Аспірантура" : "PhD",      icon: "graduation-cap", href: `/${locale}/app/space?kind=phd` },
      ],
    },
    {
      label: isUk ? "Проєкти" : "Projects",
      items: [
        { id: "projects-grants",    label: isUk ? "Гранти"       : "Grants",       icon: "wallet",         href: `/${locale}/app/space?kind=grant` },
        { id: "projects-research",  label: isUk ? "Дослідження"  : "Research",     icon: "flask-conical",  href: `/${locale}/app/space?kind=individual_research` },
        { id: "projects-lab",       label: isUk ? "Лабораторії"  : "Laboratories", icon: "microscope",     href: `/${locale}/app/space?kind=laboratory` },
        { id: "projects-collab",    label: isUk ? "Колаборації"  : "Collaboration",icon: "users",          href: `/${locale}/app/space?kind=collaboration` },
      ],
    },
    {
      label: isUk ? "Ресурси" : "Resources",
      items: [
        { id: "library", label: isUk ? "Довідка" : "Library", icon: "book-open", href: `/${locale}/app/library` },
      ],
    },
    {
      label: isUk ? "Акаунт" : "Account",
      items: [
        { id: "profile", label: dictionary.nav.profile, icon: "user-round", href: `/${locale}/app/profile` },
        { id: "settings", label: dictionary.nav.settings, icon: "settings", href: `/${locale}/app/settings` },
        ...(userRole === "admin"
          ? [{ id: "admin", label: dictionary.nav.admin, icon: "shield-check" as const, href: `/${locale}/app/admin` }]
          : []),
      ],
    },
  ];
}
