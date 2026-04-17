import { AppShell } from "@/components/app-shell";
import { RecordForm } from "@/components/record-form";
import { getDashboardData } from "@/lib/repositories";
import {
  Activity,
  Archive,
  BadgeCheck,
  CalendarDays,
  Database,
  FileCheck2,
  FlaskConical,
  GitBranch,
  ShieldCheck,
} from "lucide-react";

const statusStyles: Record<string, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-800",
  planned: "border-stone-200 bg-stone-50 text-stone-700",
  review: "border-amber-200 bg-amber-50 text-amber-800",
  released: "border-cyan-200 bg-cyan-50 text-cyan-800",
  blocked: "border-rose-200 bg-rose-50 text-rose-800",
};

export default async function Home() {
  const data = await getDashboardData();

  return (
    <AppShell>
      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-700">
                Fundamental science grant 2027-2029
              </p>
              <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-normal text-stone-950">
                Коморбідна патологія, мієлоїдні клітини, RAGE та некодуючі РНК
              </h1>
            </div>
            <div className="flex items-center gap-2 border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
              <GitBranch className="h-4 w-4 text-emerald-700" />
              Git repository active
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {data.metrics.map((metric) => (
              <div
                key={metric.label}
                className="border border-stone-200 bg-stone-50 p-4"
              >
                <p className="text-sm text-stone-500">{metric.label}</p>
                <p className="mt-2 text-3xl font-semibold text-stone-950">
                  {metric.value}
                </p>
                <p className="mt-1 text-sm text-stone-600">{metric.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-stone-200 bg-[#f8fbf7] p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-emerald-700 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-950">
                Open science readiness
              </h2>
              <p className="text-sm text-stone-600">
                FAIR, DMP, protocols, DOI-ready outputs
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {data.readiness.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-stone-800">
                    {item.label}
                  </span>
                  <span className="text-stone-500">{item.value}%</span>
                </div>
                <div className="mt-2 h-2 bg-white">
                  <div
                    className="h-2 bg-emerald-700"
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-stone-950">
              Research stages
            </h2>
            <CalendarDays className="h-5 w-5 text-emerald-700" />
          </div>
          <div className="mt-5 space-y-4">
            {data.stages.map((stage) => (
              <article
                key={stage.year}
                className="border border-stone-200 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-stone-500">
                      {stage.year}
                    </p>
                    <h3 className="mt-1 font-semibold text-stone-950">
                      {stage.title}
                    </h3>
                  </div>
                  <span
                    className={`border px-2 py-1 text-xs font-medium ${
                      statusStyles[stage.status]
                    }`}
                  >
                    {stage.status}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-stone-600">
                  {stage.focus}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-stone-950">
              New project record
            </h2>
            <Database className="h-5 w-5 text-emerald-700" />
          </div>
          <RecordForm />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <RecordPanel
          title="Datasets"
          icon={<Archive className="h-5 w-5" />}
          records={data.records.filter((record) => record.kind === "dataset")}
        />
        <RecordPanel
          title="Protocols"
          icon={<FileCheck2 className="h-5 w-5" />}
          records={data.records.filter((record) => record.kind === "protocol")}
        />
        <RecordPanel
          title="Team work"
          icon={<Activity className="h-5 w-5" />}
          records={data.records.filter((record) => record.kind === "task")}
        />
      </section>

      <section className="border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-stone-950">
              Evidence matrix
            </h2>
            <p className="text-sm text-stone-600">
              Project objects linked to stage, repository, access, and owner.
            </p>
          </div>
          <BadgeCheck className="h-5 w-5 text-emerald-700" />
        </div>
        <div className="mt-5 overflow-hidden border border-stone-200">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-stone-100 text-stone-600">
              <tr>
                <th className="px-3 py-3 font-medium">ID</th>
                <th className="px-3 py-3 font-medium">Title</th>
                <th className="px-3 py-3 font-medium">Kind</th>
                <th className="px-3 py-3 font-medium">Stage</th>
                <th className="px-3 py-3 font-medium">Access</th>
                <th className="px-3 py-3 font-medium">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {data.records.map((record) => (
                <tr key={record.localId} className="bg-white">
                  <td className="px-3 py-3 font-mono text-xs text-stone-600">
                    {record.localId}
                  </td>
                  <td className="px-3 py-3 font-medium text-stone-900">
                    {record.title}
                  </td>
                  <td className="px-3 py-3 text-stone-600">{record.kind}</td>
                  <td className="px-3 py-3 text-stone-600">{record.stage}</td>
                  <td className="px-3 py-3 text-stone-600">
                    {record.access}
                  </td>
                  <td className="px-3 py-3 text-stone-600">{record.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}

function RecordPanel({
  title,
  icon,
  records,
}: {
  title: string;
  icon: React.ReactNode;
  records: Awaited<ReturnType<typeof getDashboardData>>["records"];
}) {
  return (
    <section className="border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-stone-950">{title}</h2>
        <div className="text-emerald-700">{icon}</div>
      </div>
      <div className="mt-5 space-y-3">
        {records.length === 0 ? (
          <div className="border border-dashed border-stone-300 p-4 text-sm text-stone-500">
            No records yet
          </div>
        ) : (
          records.map((record) => (
            <article key={record.localId} className="border border-stone-200 p-4">
              <div className="flex items-start gap-3">
                <FlaskConical className="mt-1 h-4 w-4 shrink-0 text-emerald-700" />
                <div>
                  <p className="font-mono text-xs text-stone-500">
                    {record.localId}
                  </p>
                  <h3 className="mt-1 font-semibold text-stone-950">
                    {record.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {record.summary}
                  </p>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
