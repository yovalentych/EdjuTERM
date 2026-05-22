"use client";

import { useState } from "react";
import {
  BookOpen, ChevronDown, ChevronRight, GraduationCap, Layers, Users,
} from "lucide-react";
import type { CommunityUnitNode } from "@/lib/institutions-db";
import type { UserAffiliation } from "@/lib/schemas";

type CMember = {
  userId: string;
  firstName: string;
  lastName: string;
  affiliation: UserAffiliation;
};

// ── TopUnitRow ────────────────────────────────────────────────────────────────

function TopUnitRow({ node, members, isUk }: {
  node: CommunityUnitNode;
  members: CMember[];
  isUk: boolean;
}) {
  const [open, setOpen] = useState(node.children.length <= 6);
  const hasChildren = node.children.length > 0;

  const unitMembers = members.filter((m) =>
    (m.affiliation.parentUnitName === node.name ||
      (!m.affiliation.parentUnitName && m.affiliation.unitName === node.name)) &&
    m.affiliation.isCurrent
  );

  return (
    <div className="py-1.5">
      <button
        type="button"
        onClick={() => hasChildren && setOpen((s) => !s)}
        className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition ${
          hasChildren ? "hover:bg-slate-50" : "cursor-default"
        }`}
      >
        {hasChildren
          ? open
            ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          : <span className="h-3.5 w-3.5 shrink-0" />}
        <Layers className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
        <span className="text-sm font-bold text-slate-900">{node.name}</span>
        <span className="ml-auto flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
          <Users className="h-2.5 w-2.5" />{node.count}
        </span>
      </button>

      {/* Member avatars */}
      {unitMembers.length > 0 && (
        <div className="ml-10 mb-1 flex flex-wrap gap-1">
          {unitMembers.slice(0, 8).map((m, i) => (
            <span key={i}
              title={`${m.firstName} ${m.lastName}${m.affiliation.role ? ` · ${m.affiliation.role}` : ""}`}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700 ring-1 ring-white">
              {m.firstName.charAt(0)}
            </span>
          ))}
          {unitMembers.length > 8 && (
            <span className="flex h-6 items-center rounded-full bg-slate-100 px-2 text-[9px] font-bold text-slate-500">
              +{unitMembers.length - 8}
            </span>
          )}
        </div>
      )}

      {/* Children */}
      {open && node.children.map((child) => (
        <ChildUnitRow key={child.name} node={child} members={members} parentName={node.name} />
      ))}
    </div>
  );
}

function ChildUnitRow({ node, members, parentName }: {
  node: CommunityUnitNode;
  members: CMember[];
  parentName: string;
}) {
  const childMembers = members.filter((m) =>
    m.affiliation.parentUnitName === parentName &&
    m.affiliation.unitName === node.name &&
    m.affiliation.isCurrent
  );

  return (
    <div className="ml-7 border-l border-slate-200 py-1 pl-3">
      <div className="flex items-center gap-2 rounded-lg px-2 py-1">
        <BookOpen className="h-3 w-3 shrink-0 text-blue-400" />
        <span className="text-xs font-semibold text-slate-700">{node.name}</span>
        <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-bold text-blue-700">
          {node.count}
        </span>
      </div>
      {childMembers.length > 0 && (
        <div className="ml-5 flex flex-wrap gap-1 pb-1">
          {childMembers.slice(0, 6).map((m, i) => (
            <span key={i}
              title={`${m.firstName} ${m.lastName}${m.affiliation.role ? ` · ${m.affiliation.role}` : ""}`}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[9px] font-bold text-blue-700 ring-1 ring-white">
              {m.firstName.charAt(0)}
            </span>
          ))}
          {childMembers.length > 6 && (
            <span className="flex h-5 items-center rounded-full bg-slate-100 px-1.5 text-[8px] font-bold text-slate-500">
              +{childMembers.length - 6}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function CommunityStructureBlock({
  structure, members, isUk,
}: {
  structure: {
    totalUsers: number;
    topUnits: CommunityUnitNode[];
    orphanCount: number;
    programs: { name: string; programId: string; count: number }[];
  };
  members: CMember[];
  isUk: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Hierarchy card */}
      <div className="overflow-hidden rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-50/80 via-white to-blue-50/40 shadow-sm">
        <div className="flex items-center gap-2 border-b border-violet-100 bg-violet-50/40 px-4 py-3">
          <Users className="h-4 w-4 text-violet-600" />
          <h2 className="text-sm font-bold text-slate-800">
            {isUk ? "Спільнота" : "Community"}
          </h2>
          <span className="ml-auto rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-bold text-violet-700">
            {structure.totalUsers} {isUk ? "учасників" : "members"}
          </span>
        </div>

        {structure.topUnits.length > 0 && (
          <div className="divide-y divide-slate-100 p-3">
            {structure.topUnits.map((top) => (
              <TopUnitRow key={top.name} node={top} members={members} isUk={isUk} />
            ))}
            {structure.orphanCount > 0 && (
              <div className="flex items-center gap-2 py-2 px-1 text-[11px] text-slate-400">
                <Users className="h-3.5 w-3.5" />
                <span>{structure.orphanCount} {isUk ? "без підрозділу" : "without unit"}</span>
              </div>
            )}
          </div>
        )}

        {structure.topUnits.length === 0 && structure.orphanCount > 0 && (
          <p className="px-4 py-3 text-xs text-slate-400">
            {structure.orphanCount} {isUk ? "учасників (без підрозділу)" : "members (no unit)"}
          </p>
        )}
      </div>

      {/* Programs from community */}
      {structure.programs.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-blue-200/60 bg-white/90 shadow-sm">
          <div className="flex items-center gap-2 border-b border-blue-100 bg-blue-50/40 px-4 py-3">
            <GraduationCap className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-800">
              {isUk ? "Освітні програми (від спільноти)" : "Programs (from community)"}
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {structure.programs.map((p) => (
              <div key={p.name} className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50/30">
                <GraduationCap className="h-4 w-4 shrink-0 text-blue-400" />
                <p className="flex-1 text-sm font-semibold text-slate-800">{p.name}</p>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                  {p.count} {isUk ? "уч." : "members"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
