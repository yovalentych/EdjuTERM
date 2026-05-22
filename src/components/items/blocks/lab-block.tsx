import Link from "next/link";
import {
  AlertTriangle,
  Beaker,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  FlaskConical,
  Microscope,
  PackageOpen,
  Wrench,
} from "lucide-react";
import { LiquidCard, LiquidStatTile } from "@/components/ui/liquid";
import {
  listEquipment,
  listExperiments,
  listInventoryItems,
} from "@/lib/laboratory";

/**
 * Лабораторний блок для item.type = "laboratory".
 *
 * Серверний компонент — фетчить дані за projectId (= legacyProjectId або
 * item._id для нових items) і показує статистику + перші позиції + CTA на
 * повний робочий простір (legacy /app/project) якщо є.
 */
export async function LabBlock({
  projectId,
  locale,
  legacyProjectId,
}: {
  projectId: string;
  locale: string;
  legacyProjectId?: string;
}) {
  if (!projectId) {
    return <EmptyHint locale={locale} />;
  }

  const [inventory, equipment, experiments] = await Promise.all([
    listInventoryItems(projectId).catch(() => []),
    listEquipment(projectId).catch(() => []),
    listExperiments(projectId).catch(() => []),
  ]);

  const isEmpty = inventory.length === 0 && equipment.length === 0 && experiments.length === 0;

  if (isEmpty) {
    return (
      <NewLabHint locale={locale} legacyProjectId={legacyProjectId} />
    );
  }

  const operational  = equipment.filter((e) => e.status === "operational").length;
  const inStock      = inventory.filter((i) => i.status === "in_stock").length;
  const lowStock     = inventory.filter((i) => i.status === "low_stock" || i.status === "depleted").length;
  const activeExperiments = experiments.filter((e) => e.status === "active").length;
  const expiringSoon = inventory.filter((i) => {
    if (!i.expirationDate) return false;
    const diff = new Date(i.expirationDate).getTime() - Date.now();
    return diff > 0 && diff < 30 * 24 * 3600 * 1000;
  }).length;

  const isUk = locale === "uk";

  return (
    <div className="flex flex-col gap-5">
      {/* ── Stats grid ──────────────────────────────────────── */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <LiquidStatTile
          icon={<Microscope className="h-4 w-4" />}
          label={isUk ? "Прилади" : "Equipment"}
          value={`${operational}/${equipment.length}`}
          sub={isUk ? "у роботі" : "operational"}
          tint="emerald"
        />
        <LiquidStatTile
          icon={<Beaker className="h-4 w-4" />}
          label={isUk ? "Реагенти" : "Reagents"}
          value={`${inStock}/${inventory.length}`}
          sub={isUk ? "у наявності" : "in stock"}
          tint="teal"
        />
        <LiquidStatTile
          icon={<FlaskConical className="h-4 w-4" />}
          label={isUk ? "Експерименти" : "Experiments"}
          value={String(activeExperiments)}
          sub={isUk ? "активні" : "active"}
          tint="violet"
        />
        <LiquidStatTile
          icon={<CalendarClock className="h-4 w-4" />}
          label={isUk ? "Термін" : "Expiry"}
          value={expiringSoon > 0 ? String(expiringSoon) : "✓"}
          sub={expiringSoon > 0 ? (isUk ? "закінч. < 30 дн." : "< 30 days") : (isUk ? "усе в нормі" : "all fine")}
          tint={expiringSoon > 0 ? "amber" : "emerald"}
        />
      </section>

      {/* ── Alerts ─────────────────────────────────────────── */}
      {(lowStock > 0 || expiringSoon > 0) && (
        <section className="flex flex-wrap gap-2">
          {lowStock > 0 && (
            <AlertChip
              icon={<PackageOpen className="h-3.5 w-3.5" />}
              count={lowStock}
              label={isUk ? "Потрібно замовити" : "Need restock"}
              tint="rose"
            />
          )}
          {expiringSoon > 0 && (
            <AlertChip
              icon={<AlertTriangle className="h-3.5 w-3.5" />}
              count={expiringSoon}
              label={isUk ? "Закінчуються" : "Expiring"}
              tint="amber"
            />
          )}
        </section>
      )}

      {/* ── Two-column lists ───────────────────────────────── */}
      <div className="grid gap-4 xl:grid-cols-2">
        {/* Inventory */}
        <LiquidCard tint="teal" className="p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200/60 bg-gradient-to-br from-teal-50/60 via-white to-slate-50/60 px-5 py-3.5">
            <span className="liquid-eyebrow inline-flex items-center gap-1.5">
              <Beaker className="h-3 w-3" />
              {isUk ? "Реагенти" : "Inventory"}
            </span>
            <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-700">
              {inventory.length}
            </span>
          </div>
          {inventory.length === 0 ? (
            <EmptyRow text={isUk ? "Реагентів ще немає" : "No reagents yet"} />
          ) : (
            <div className="divide-y divide-slate-100/70">
              {inventory.slice(0, 5).map((it) => (
                <div key={it._id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-base">{it.hazardClass === "biohazard" ? "☣" : "⚗"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">{it.name}</p>
                    <p className="truncate text-[11px] text-slate-500">
                      {it.quantity} {it.unit} · {it.location || "—"}
                    </p>
                  </div>
                  <StatusDot status={it.status} />
                </div>
              ))}
              {inventory.length > 5 && (
                <p className="px-4 py-2 text-center text-[10px] text-slate-400">+{inventory.length - 5} {isUk ? "ще" : "more"}</p>
              )}
            </div>
          )}
        </LiquidCard>

        {/* Equipment */}
        <LiquidCard tint="emerald" className="p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200/60 bg-gradient-to-br from-emerald-50/60 via-white to-slate-50/60 px-5 py-3.5">
            <span className="liquid-eyebrow inline-flex items-center gap-1.5">
              <Wrench className="h-3 w-3" />
              {isUk ? "Обладнання" : "Equipment"}
            </span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              {equipment.length}
            </span>
          </div>
          {equipment.length === 0 ? (
            <EmptyRow text={isUk ? "Обладнання ще немає" : "No equipment yet"} />
          ) : (
            <div className="divide-y divide-slate-100/70">
              {equipment.slice(0, 5).map((eq) => (
                <div key={eq._id} className="flex items-center gap-3 px-4 py-2.5">
                  <Microscope className="h-4 w-4 shrink-0 text-emerald-600" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">{eq.name}</p>
                    <p className="truncate text-[11px] text-slate-500">
                      {eq.manufacturer || "—"} · {eq.model || ""}
                    </p>
                  </div>
                  <StatusDot status={eq.status} />
                </div>
              ))}
              {equipment.length > 5 && (
                <p className="px-4 py-2 text-center text-[10px] text-slate-400">+{equipment.length - 5} {isUk ? "ще" : "more"}</p>
              )}
            </div>
          )}
        </LiquidCard>
      </div>

      {/* ── Active experiments ─────────────────────────────── */}
      {activeExperiments > 0 && (
        <LiquidCard tint="violet" className="p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200/60 bg-gradient-to-br from-violet-50/60 via-white to-slate-50/60 px-5 py-3.5">
            <span className="liquid-eyebrow inline-flex items-center gap-1.5">
              <FlaskConical className="h-3 w-3" />
              {isUk ? "Активні експерименти" : "Active experiments"}
            </span>
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
              {activeExperiments}
            </span>
          </div>
          <div className="divide-y divide-slate-100/70">
            {experiments
              .filter((e) => e.status === "active")
              .slice(0, 4)
              .map((e) => (
                <div key={e._id} className="flex items-center gap-3 px-4 py-2.5">
                  <FlaskConical className="h-4 w-4 shrink-0 text-violet-600" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">{e.title}</p>
                    <p className="truncate text-[11px] text-slate-500">
                      {(e.steps || []).filter((s) => s.completed).length}/{(e.steps || []).length} {isUk ? "кроків" : "steps"}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </LiquidCard>
      )}

      {/* ── CTA: open full workbench ───────────────────────── */}
      {legacyProjectId && (
        <Link
          href={`/${locale}/app/project?projectId=${legacyProjectId}`}
          className="liquid-cta self-start inline-flex"
        >
          <ExternalLink className="h-4 w-4" />
          {isUk ? "Відкрити повний робочий простір" : "Open full workbench"}
        </Link>
      )}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const map: Record<string, string> = {
    operational: "bg-emerald-500",
    in_stock:    "bg-emerald-500",
    low_stock:   "bg-amber-500",
    depleted:    "bg-rose-500",
    maintenance: "bg-amber-500",
    out_of_order:"bg-rose-500",
    decommissioned: "bg-slate-400",
    expired:     "bg-rose-500",
  };
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${map[status] ?? "bg-slate-300"}`} />;
}

function AlertChip({
  icon,
  count,
  label,
  tint,
}: {
  icon: React.ReactNode;
  count: number;
  label: string;
  tint: "rose" | "amber";
}) {
  const map = {
    rose:  "border-rose-200 bg-rose-50 text-rose-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${map[tint]}`}>
      {icon}
      <span className="font-mono">{count}</span>
      <span>{label}</span>
    </span>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-6 text-xs text-slate-400">
      <CheckCircle2 className="h-3.5 w-3.5" />
      {text}
    </div>
  );
}

function EmptyHint({ locale }: { locale: string }) {
  const isUk = locale === "uk";
  return (
    <LiquidCard tint="amber" className="text-center">
      <h3 className="text-sm font-bold text-slate-900">{isUk ? "Лабораторія без даних" : "Lab without data"}</h3>
      <p className="mt-1 text-xs text-slate-500">
        {isUk ? "Створіть items із backend або відкрийте legacy робочий простір." : "Create items via backend or open legacy workspace."}
      </p>
    </LiquidCard>
  );
}

function NewLabHint({ locale, legacyProjectId }: { locale: string; legacyProjectId?: string }) {
  const isUk = locale === "uk";
  return (
    <LiquidCard tint="emerald" className="text-center" accent>
      <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
        <FlaskConical className="h-6 w-6" />
      </div>
      <h3 className="text-base font-bold text-slate-900">
        {isUk ? "Нова лабораторія" : "New laboratory"}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500">
        {isUk
          ? "Додайте реагенти, обладнання та експерименти. Створіть GLP-журнал. Усе синхронізовано з мобільним застосунком."
          : "Add reagents, equipment, and experiments. Set up a GLP journal. Everything is synced with the mobile app."}
      </p>
      {legacyProjectId && (
        <Link
          href={`/${locale}/app/project?projectId=${legacyProjectId}`}
          className="liquid-cta mt-4 inline-flex"
        >
          <ExternalLink className="h-4 w-4" />
          {isUk ? "Перейти до робочого простору" : "Go to workbench"}
        </Link>
      )}
    </LiquidCard>
  );
}
