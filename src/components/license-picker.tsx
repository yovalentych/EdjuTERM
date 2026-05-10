"use client";

import { Check, ChevronDown, ExternalLink, ShieldCheck, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ATTR_LABELS, getLicense, LICENSE_FAMILIES, LICENSES, type License } from "@/lib/licenses";

// ── Compact attribute pill ─────────────────────────────────────────────────────

function AttrPill({ label, variant }: { label: string; variant: "allow" | "require" | "forbid" }) {
  const cls = {
    allow:   "bg-emerald-50 text-emerald-700 border-emerald-200",
    require: "bg-blue-50 text-blue-700 border-blue-200",
    forbid:  "bg-rose-50 text-rose-700 border-rose-200",
  }[variant];
  const icon = { allow: "✓", require: "!", forbid: "✗" }[variant];
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium ${cls}`}>
      <span>{icon}</span>{label}
    </span>
  );
}

// ── License card in the picker ─────────────────────────────────────────────────

function LicenseCard({
  license,
  selected,
  onSelect,
}: {
  license: License;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded border p-3 text-left transition
        ${selected
          ? "border-blue-400 bg-blue-50 shadow-sm ring-1 ring-blue-300"
          : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`rounded border px-2 py-0.5 text-xs font-bold ${license.badgeClass}`}>
              {license.name}
            </span>
            {selected && <Check className="h-3.5 w-3.5 text-blue-600" />}
          </div>
          <p className="mt-1.5 text-xs leading-5 text-stone-500">{license.summary}</p>
        </div>
        {license.url && (
          <a
            href={license.url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 text-slate-400 hover:text-blue-600"
            title="Переглянути ліцензію"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {license.allows.map((a) => <AttrPill key={a} label={ATTR_LABELS[a]} variant="allow" />)}
        {license.requires.map((r) => <AttrPill key={r} label={ATTR_LABELS[r]} variant="require" />)}
        {license.forbids.map((f) => <AttrPill key={f} label={ATTR_LABELS[f]} variant="forbid" />)}
      </div>
    </button>
  );
}

// ── Dropdown portal (fixed position, always visible) ──────────────────────────

interface DropdownPos {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
}

// ── Main picker ────────────────────────────────────────────────────────────────

export function LicensePicker({
  defaultValue = "",
  name = "license",
  label = "Ліцензія",
}: {
  defaultValue?: string;
  name?: string;
  label?: string;
}) {
  const [selected, setSelected] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<DropdownPos | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const current = getLicense(selected);
  const families = Object.entries(LICENSE_FAMILIES) as [License["family"], string][];

  const computePos = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewH = window.innerHeight;
    const viewW = window.innerWidth;
    const MARGIN = 12;
    const DROPDOWN_W = Math.min(rect.width, viewW - 2 * MARGIN);
    const left = Math.max(MARGIN, Math.min(rect.left, viewW - DROPDOWN_W - MARGIN));

    const spaceBelow = viewH - rect.bottom - MARGIN;
    const spaceAbove = rect.top - MARGIN;

    if (spaceBelow >= 300 || spaceBelow >= spaceAbove) {
      setPos({
        top: rect.bottom + 4,
        left,
        width: DROPDOWN_W,
        maxHeight: Math.max(240, spaceBelow),
      });
    } else {
      setPos({
        bottom: viewH - rect.top + 4,
        left,
        width: DROPDOWN_W,
        maxHeight: Math.max(240, spaceAbove),
      });
    }
  }, []);

  function handleOpen() {
    computePos();
    setOpen(true);
  }

  // Recompute on scroll/resize while open
  useEffect(() => {
    if (!open) return;
    const onScroll = () => computePos();
    const onResize = () => computePos();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, computePos]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-stone-700">{label}</span>
        {selected && (
          <button
            type="button"
            onClick={() => setSelected("")}
            className="flex items-center gap-1 text-xs text-stone-400 hover:text-rose-500"
          >
            <X className="h-3 w-3" /> Скинути
          </button>
        )}
      </div>

      {/* Hidden input */}
      <input type="hidden" name={name} value={selected} />

      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={open ? () => setOpen(false) : handleOpen}
        className={`input-control flex w-full items-center justify-between gap-2 px-3 py-2 text-sm transition
          ${open ? "ring-2 ring-blue-300 border-blue-400" : ""}`}
      >
        {current ? (
          <span className="flex items-center gap-2">
            <span className={`rounded border px-2 py-0.5 text-xs font-bold ${current.badgeClass}`}>
              {current.name}
            </span>
            <span className="truncate text-stone-700">{current.fullName}</span>
          </span>
        ) : (
          <span className="flex items-center gap-2 text-stone-400">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>Оберіть ліцензію…</span>
          </span>
        )}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-stone-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown — rendered fixed to viewport, always fully visible */}
      {open && pos && (
        <div
          ref={dropdownRef}
          className="z-[9999] overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-2xl"
          style={{
            position: "fixed",
            top: pos.top,
            bottom: pos.bottom,
            left: pos.left,
            width: pos.width,
            maxHeight: pos.maxHeight,
          }}
        >
          {/* Legend */}
          <div className="sticky top-0 flex flex-wrap items-center gap-2 border-b border-slate-100 bg-white/95 px-3 py-2 backdrop-blur-sm">
            <span className="text-xs font-semibold text-stone-500">Позначки:</span>
            <AttrPill label="Дозволено" variant="allow" />
            <AttrPill label="Обов'язково" variant="require" />
            <AttrPill label="Заборонено" variant="forbid" />
          </div>

          {families.map(([family, familyLabel]) => {
            const group = LICENSES.filter((l) => l.family === family);
            return (
              <div key={family} className="border-b border-slate-100 last:border-0">
                <p className="bg-slate-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {familyLabel}
                </p>
                <div className="grid gap-1.5 p-2 sm:grid-cols-2">
                  {group.map((license) => (
                    <LicenseCard
                      key={license.id}
                      license={license}
                      selected={selected === license.id}
                      onSelect={() => {
                        setSelected(license.id);
                        setOpen(false);
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info strip when selected */}
      {current && (
        <div className={`flex items-start gap-2 rounded border px-3 py-2 text-xs ${current.badgeClass}`}>
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <div>
            <span className="font-semibold">{current.fullName}</span>
            {current.url && (
              <>
                {" · "}
                <a
                  href={current.url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2"
                >
                  переглянути текст ліцензії
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
