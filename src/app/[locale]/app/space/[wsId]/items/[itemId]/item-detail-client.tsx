"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Link as LinkIcon } from "lucide-react";
import { LiquidCard } from "@/components/ui/liquid";

type Ws = { id: string; name: string; emoji: string; color: string; isDefault: boolean };

export function ItemDetailClient({
  itemId,
  currentWorkspaceIds,
  allWorkspaces,
}: {
  itemId: string;
  currentWorkspaceIds: string[];
  allWorkspaces: Ws[];
}) {
  const [active, setActive] = useState<string[]>(currentWorkspaceIds);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function toggle(wsId: string) {
    if (busy) return;
    const isIn = active.includes(wsId);
    if (isIn && active.length === 1) {
      alert("Проєкт має бути хоча б в одному просторі.");
      return;
    }
    const next = isIn ? active.filter((id) => id !== wsId) : [...active, wsId];
    setBusy(true);
    try {
      const res = await fetch(`/api/workspace-items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceIds: next }),
      });
      if (res.ok) {
        setActive(next);
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Помилка оновлення");
      }
    } catch {
      alert("Помилка мережі");
    } finally {
      setBusy(false);
    }
  }

  const isShared = active.length > 1;

  return (
    <LiquidCard tint="blue">
      <h2 className="liquid-eyebrow">ПРОСТОРИ ({active.length})</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {allWorkspaces.map((ws) => {
          const isIn = active.includes(ws.id);
          return (
            <button
              key={ws.id}
              type="button"
              disabled={busy}
              onClick={() => toggle(ws.id)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                isIn ? "" : "border-slate-200 bg-white/70 text-slate-700 hover:bg-white"
              } ${busy ? "opacity-50" : ""}`}
              style={isIn ? { borderColor: ws.color, backgroundColor: ws.color + "20", color: ws.color } : {}}
            >
              <span>{ws.emoji}</span>
              <span>{ws.name}</span>
              {isIn && <Check className="h-3 w-3" strokeWidth={3} />}
            </button>
          );
        })}
      </div>
      {isShared && (
        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs font-bold text-violet-600">
          <LinkIcon className="h-3 w-3" />
          Цей проєкт спільний для {active.length} просторів
        </p>
      )}
    </LiquidCard>
  );
}
