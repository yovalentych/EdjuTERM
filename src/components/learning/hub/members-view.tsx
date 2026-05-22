"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Plus, Trash2, UserCircle, Users } from "lucide-react";
import { LiquidCard } from "@/components/ui/liquid";
import type { CourseMember, LearningCourse } from "@/lib/schemas";

const ROLE_META = {
  student: { uk: "Студент", en: "Student", bg: "bg-blue-50 text-blue-700" },
  auditor: { uk: "Вільний слухач", en: "Auditor", bg: "bg-violet-50 text-violet-700" },
  ta:      { uk: "Асистент", en: "TA", bg: "bg-amber-50 text-amber-700" },
  guest:   { uk: "Гість", en: "Guest", bg: "bg-slate-50 text-slate-700" },
};

export function MembersView({
  locale,
  canManage,
  course,
  projectId,
  members: membersProp,
}: {
  locale: "uk" | "en";
  canManage: boolean;
  course: LearningCourse | null;
  projectId: string;
  members: CourseMember[];
}) {
  const isUk = locale === "uk";
  const router = useRouter();
  const [members, setMembers] = useState<CourseMember[]>(membersProp);
  const [showForm, setShowForm] = useState(false);
  const [pending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // form
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [group, setGroup] = useState("");
  const [studentId, setStudentId] = useState("");
  const [role, setRole] = useState<"student" | "auditor" | "ta" | "guest">("student");

  function resetForm() {
    setFullName(""); setEmail(""); setGroup(""); setStudentId(""); setRole("student");
  }

  async function handleEnroll() {
    if (!course?._id || !fullName.trim()) return;
    setErrorMsg(null);
    setBusy(true);
    try {
      const res = await fetch("/api/learning/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course._id,
          projectId,
          fullName: fullName.trim(),
          email: email.trim(),
          group: group.trim(),
          studentId: studentId.trim(),
          role,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "enroll_failed");
      if (data?.member) {
        setMembers((prev) => [...prev, data.member]);
        resetForm();
        setShowForm(false);
        startTransition(() => router.refresh());
      }
    } catch (e: any) {
      setErrorMsg(e?.message || (isUk ? "Помилка додавання" : "Add failed"));
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(id: string) {
    if (!canManage) return;
    if (!confirm(isUk ? "Видалити учасника з курсу?" : "Remove member from course?")) return;
    setMembers((prev) => prev.filter((m) => m._id !== id));
    try {
      await fetch(`/api/learning/members/${id}`, { method: "DELETE" });
      startTransition(() => router.refresh());
    } catch {
      // revert: re-fetch is automatic on refresh
    }
  }

  if (!course) {
    return (
      <LiquidCard tint="amber" className="text-center">
        <h3 className="text-sm font-bold text-slate-900">
          {isUk ? "Оберіть курс зверху" : "Pick a course at the top"}
        </h3>
      </LiquidCard>
    );
  }

  return (
    <div className="space-y-4">
      <LiquidCard tint="blue" className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 bg-gradient-to-br from-blue-50/60 via-white to-slate-50/60 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-bold tracking-tight text-slate-900">
              {isUk ? "Учасники курсу" : "Course members"}
            </h2>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
              {members.length}
            </span>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={() => setShowForm((s) => !s)}
              className="liquid-cta text-xs"
            >
              <Plus className="h-4 w-4" />
              {showForm ? (isUk ? "Сховати" : "Hide") : (isUk ? "Додати студента" : "Add student")}
            </button>
          )}
        </div>

        {showForm && canManage && (
          <div className="border-b border-slate-200/60 bg-slate-50/40 px-5 py-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <input
                placeholder={isUk ? "Прізвище Ім'я По-батькові *" : "Full name *"}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-control rounded-xl px-3 py-2 text-sm lg:col-span-2"
              />
              <input
                type="email"
                placeholder="email@..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-control rounded-xl px-3 py-2 text-sm"
              />
              <input
                placeholder={isUk ? "Група" : "Group"}
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="input-control rounded-xl px-3 py-2 text-sm"
              />
              <input
                placeholder={isUk ? "Залік. книжка" : "Student ID"}
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="input-control rounded-xl px-3 py-2 text-sm"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="input-control rounded-xl px-3 py-2 text-sm"
              >
                {Object.entries(ROLE_META).map(([k, v]) => (
                  <option key={k} value={k}>{isUk ? v.uk : v.en}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleEnroll}
                disabled={busy || !fullName.trim()}
                className="liquid-cta lg:col-span-4 disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {isUk ? "Зарахувати" : "Enroll"}
              </button>
            </div>
            {errorMsg && (
              <p className="mt-2 text-xs font-semibold text-rose-700">{errorMsg}</p>
            )}
          </div>
        )}

        {members.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-slate-400">
            {isUk ? "Учасників ще немає. Додайте першого студента." : "No members yet. Add your first student."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200/60 bg-slate-50/40">
                  <Th>{isUk ? "Учасник" : "Member"}</Th>
                  <Th>{isUk ? "Група / ID" : "Group / ID"}</Th>
                  <Th>Email</Th>
                  <Th>{isUk ? "Роль" : "Role"}</Th>
                  <Th align="right">{isUk ? "Дії" : "Actions"}</Th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const r = ROLE_META[m.role] ?? ROLE_META.student;
                  return (
                    <tr key={m._id} className="border-b border-slate-100/70 hover:bg-slate-50/30">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                            <UserCircle className="h-4 w-4" />
                          </span>
                          <span className="font-bold text-slate-900">{m.fullName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-500">
                        <div>{m.group || "—"}</div>
                        <div className="font-mono text-[10px] text-slate-400">{m.studentId || ""}</div>
                      </td>
                      <td className="px-4 py-2.5">
                        {m.email ? (
                          <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline">
                            <Mail className="h-3 w-3" />
                            {m.email}
                          </a>
                        ) : <span className="text-xs text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${r.bg}`}>
                          {isUk ? r.uk : r.en}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => handleRemove(m._id!)}
                            className="rounded-md p-1.5 text-rose-500 transition hover:bg-rose-50"
                            aria-label="remove"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </LiquidCard>
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <th className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 ${align === "right" ? "text-right" : "text-left"}`}>
      {children}
    </th>
  );
}
