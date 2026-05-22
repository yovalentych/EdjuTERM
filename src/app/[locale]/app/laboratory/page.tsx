import {
  Database,
  FlaskConical,
  LayoutDashboard,
  Microscope,
  NotebookPen,
  Settings,
  Users,
  MapPin,
  ShieldCheck,
  Clock,
  Activity,
  Plus,
  SquareStack,
} from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { WorkspaceShell, type NavGroup } from "@/components/workspace-shell";
import { ProjectOverviewDashboard } from "@/components/overview/project-overview-dashboard";
import { GlobalSearch } from "@/components/global-search";
import { NotificationBell } from "@/components/notification-bell";
import { PrivateThemeToggle } from "@/components/private-theme-toggle";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";
import { canManageProject, getProjectForUser } from "@/lib/projects";
import { listInventoryItems, listEquipment } from "@/lib/laboratory";
import { listSafeUsersByIds } from "@/lib/users";
import { readPrefs } from "@/lib/prefs";

export default async function LaboratoryWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ projectId?: string; tab?: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/${localeParam}/login`);

  const { projectId, tab } = await searchParams;
  if (!projectId) redirect(`/${localeParam}/app`);

  const project = await getProjectForUser(projectId, user);
  if (!project?._id || project.projectType !== "laboratory") notFound();

  const dictionary = getDictionary(localeParam);
  const prefs = await readPrefs();
  const isUk = localeParam === "uk";

  const validTabs = ["overview", "inventory", "equipment", "logs", "team", "settings"];
  const activeTab = validTabs.includes(tab || "") ? tab : "overview";

  const [inventory, equipment, members] = await Promise.all([
    listInventoryItems(project._id),
    listEquipment(project._id),
    listSafeUsersByIds([project.ownerId, project.supervisorId, ...project.memberIds, ...(project.responsiblePersonIds || [])]),
  ]);

  const navGroups: NavGroup[] = [
    {
      label: isUk ? "Огляд" : "Overview",
      items: [
        { id: "overview", label: dictionary.projects.tabOverview, icon: "square-stack", href: `/${localeParam}/app/laboratory?projectId=${project._id}&tab=overview` },
      ],
    },
    {
      label: isUk ? "Керування лаб." : "Lab Management",
      items: [
        { id: "inventory", label: isUk ? "Склад" : "Inventory", icon: "database", href: `/${localeParam}/app/laboratory?projectId=${project._id}&tab=inventory` },
        { id: "equipment", label: isUk ? "Обладнання" : "Equipment", icon: "microscope", href: `/${localeParam}/app/laboratory?projectId=${project._id}&tab=equipment` },
        { id: "logs", label: isUk ? "Журнали GLP" : "Usage Logs", icon: "notebook-pen", href: `/${localeParam}/app/laboratory?projectId=${project._id}&tab=logs` },
      ],
    },
    {
      label: isUk ? "Команда та налаштування" : "Team & Settings",
      items: [
        { id: "team", label: dictionary.projects.tabTeam, icon: "users", href: `/${localeParam}/app/laboratory?projectId=${project._id}&tab=team` },
        { id: "settings", label: dictionary.projects.settings, icon: "settings", href: `/${localeParam}/app/laboratory?projectId=${project._id}&tab=settings` },
      ],
    },
  ];

  return (
    <WorkspaceShell
      dictionary={dictionary}
      locale={localeParam}
      user={user}
      project={project}
      navGroups={navGroups}
      headerActions={
        <div key="header-actions-wrapper" className="flex items-center gap-1.5">
          <GlobalSearch key="global-search" locale={localeParam} />
          {prefs.notifications && <NotificationBell key="notification-bell" />}
          <PrivateThemeToggle key="theme-toggle" />
        </div>
      }
    >
      <div className="space-y-6">
        <div className="card-surface p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
          <div className="flex items-center gap-3 mb-2">
            <FlaskConical className="h-6 w-6 opacity-80" />
            <h1 className="text-2xl font-bold">{project.title}</h1>
          </div>
          <p className="text-blue-100 text-sm">
            {isUk ? `Локація: ${project.institution}, кімн. ${project.roomNumber}` : `Location: ${project.institution}, Room ${project.roomNumber}`}
          </p>
          <div className="flex gap-2 mt-4">
             <span className="px-2 py-1 bg-white/20 rounded text-[10px] font-bold uppercase tracking-wider">{project.labCategory?.toUpperCase() || "LAB"}</span>
             <span className="px-2 py-1 bg-white/20 rounded text-[10px] font-bold uppercase tracking-wider">{project.safetyLevel || "BSL-1"}</span>
          </div>
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Inventory Overview */}
              <div className="metric-tile flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{isUk ? "Склад" : "Inventory"}</h3>
                  <Database className="h-4 w-4 text-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{inventory.length}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">{isUk ? "Всього" : "Total"}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-500">{inventory.filter(i => i.status === "low_stock").length}</p>
                    <p className="text-[10px] text-amber-600 font-bold uppercase">{isUk ? "Мало" : "Low"}</p>
                  </div>
                </div>
              </div>

              {/* Equipment Overview */}
              <div className="metric-tile flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{isUk ? "Прилади" : "Equipment"}</h3>
                  <Microscope className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold text-emerald-600">{equipment.filter(e => e.status === "operational").length}</p>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase">{isUk ? "Працює" : "Active"}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-rose-500">{equipment.filter(e => e.status === "out_of_order").length}</p>
                    <p className="text-[10px] text-rose-600 font-bold uppercase">{isUk ? "Поломки" : "Issues"}</p>
                  </div>
                </div>
              </div>

              {/* Responsibility Card */}
              <div className="metric-tile flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{isUk ? "Відповідальні" : "Responsible"}</h3>
                  <ShieldCheck className="h-4 w-4 text-indigo-500" />
                </div>
                <div className="flex -space-x-2 overflow-hidden">
                  {members.slice(0, 5).map(m => (
                    <div key={m._id} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600" title={m.firstName}>
                      {m.firstName?.[0]}{m.lastName?.[0]}
                    </div>
                  ))}
                  {members.length > 5 && (
                     <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-[10px] font-bold text-slate-400 ring-2 ring-white">
                       +{members.length - 5}
                     </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
               <div className="card-surface p-6">
                  <div className="flex items-center gap-3 mb-6">
                     <Activity className="h-5 w-5 text-blue-600" />
                     <h3 className="font-bold text-slate-900">{isUk ? "Остання активність GLP" : "Recent GLP Activity"}</h3>
                  </div>
                  <div className="space-y-4">
                     <p className="text-sm text-slate-400 italic text-center py-8">{isUk ? "Записи відсутні" : "No recent logs"}</p>
                  </div>
               </div>
               
               <div className="card-surface p-6">
                  <div className="flex items-center gap-3 mb-6">
                     <Clock className="h-5 w-5 text-amber-600" />
                     <h3 className="font-bold text-slate-900">{isUk ? "Графік обслуговування" : "Maintenance Schedule"}</h3>
                  </div>
                  <div className="space-y-3">
                     {equipment.filter(e => e.nextCalibrationDate).map(e => (
                       <div key={e._id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                          <div>
                             <p className="text-sm font-bold text-slate-800">{e.name}</p>
                             <p className="text-[10px] text-slate-500 uppercase font-black">{isUk ? "Наступне калібрування" : "Next calibration"}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-xs font-mono font-bold text-blue-600">{e.nextCalibrationDate}</p>
                          </div>
                       </div>
                     ))}
                     {equipment.filter(e => e.nextCalibrationDate).length === 0 && (
                        <p className="text-sm text-slate-400 italic text-center py-8">{isUk ? "Подій не заплановано" : "No events scheduled"}</p>
                     )}
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === "inventory" && (
          <div className="card-surface p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{isUk ? "Склад та реактиви" : "Reagent Inventory"}</h3>
                <p className="text-sm text-slate-500">{isUk ? "Керування запасами та матеріалами лабораторії" : "Manage stocks and laboratory materials"}</p>
              </div>
              <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700">
                 <Plus className="h-4 w-4" />
                 {isUk ? "Додати айтем" : "Add item"}
              </button>
            </div>
            
            <div className="border rounded-xl overflow-hidden border-slate-200">
              <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                       <th className="px-4 py-3 font-bold text-slate-600 uppercase text-[10px] tracking-widest">{isUk ? "Назва" : "Name"}</th>
                       <th className="px-4 py-3 font-bold text-slate-600 uppercase text-[10px] tracking-widest">{isUk ? "Кількість" : "Qty"}</th>
                       <th className="px-4 py-3 font-bold text-slate-600 uppercase text-[10px] tracking-widest">{isUk ? "Місце" : "Location"}</th>
                       <th className="px-4 py-3 font-bold text-slate-600 uppercase text-[10px] tracking-widest">{isUk ? "Статус" : "Status"}</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {inventory.map(item => (
                      <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                         <td className="px-4 py-4">
                            <p className="font-bold text-slate-900">{item.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">CAS: {item.casNumber || "N/A"}</p>
                         </td>
                         <td className="px-4 py-4 font-mono font-bold text-blue-700">{item.quantity} {item.unit}</td>
                         <td className="px-4 py-4 text-slate-600 font-medium">{item.location}</td>
                         <td className="px-4 py-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${item.status === 'low_stock' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              {item.status.replace('_', ' ')}
                            </span>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
              {inventory.length === 0 && (
                 <div className="py-20 text-center">
                    <Database className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm font-medium">{isUk ? "Склад порожній" : "Inventory is empty"}</p>
                 </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "equipment" && (
          <div className="card-surface p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{isUk ? "Обладнання" : "Laboratory Equipment"}</h3>
                <p className="text-sm text-slate-500">{isUk ? "Перелік та стан лабораторних приладів" : "List and status of laboratory instruments"}</p>
              </div>
              <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700">
                 <Plus className="h-4 w-4" />
                 {isUk ? "Додати прилад" : "Add instrument"}
              </button>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
               {equipment.map(e => (
                  <div key={e._id} className="card-surface p-5 border-slate-200/80 hover:border-blue-300 transition-all cursor-pointer group">
                     <div className="flex items-start justify-between mb-4">
                        <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                           <Microscope className="h-5 w-5 text-slate-400 group-hover:text-blue-600" />
                        </div>
                        <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${e.status === 'operational' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                           {e.status.replace('_', ' ')}
                        </span>
                     </div>
                     <h4 className="font-bold text-slate-900 mb-1">{e.name}</h4>
                     <p className="text-xs text-slate-500 font-medium mb-3">{e.manufacturer} {e.model}</p>
                     <div className="pt-3 border-t border-slate-50 flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        <span className="text-[11px] font-bold text-slate-400 uppercase">{e.location}</span>
                     </div>
                  </div>
               ))}
            </div>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="card-surface p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
               <NotebookPen className="h-8 w-8 text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">{isUk ? "Журнали GLP" : "GLP Usage Logs"}</h3>
            <p className="text-slate-500 mt-2 max-w-sm mx-auto">{isUk ? "Тут ви зможете переглядати записи про експлуатацію всіх приладів у відповідності до стандартів лабораторної практики." : "Here you can view the operation records of all instruments in accordance with GLP standards."}</p>
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}
