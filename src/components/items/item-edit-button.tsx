"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { ItemEditor } from "./item-editor";

type Item = {
  _id?: string;
  type: string;
  title: string;
  description?: string;
  emoji?: string;
  status: string;
  visibility: string;
  supervisor?: string;
  startDate?: string;
  plannedEndDate?: string;
  tags: string[];
  fields?: Record<string, any>;
};

export function ItemEditButton({
  item,
  locale,
  label,
  accentColor,
}: {
  item: Item;
  locale: "uk" | "en";
  label: string;
  accentColor?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="liquid-cta"
        style={accentColor ? { background: accentColor } : undefined}
      >
        <Pencil className="h-4 w-4" />
        {label}
      </button>
      {open && (
        <ItemEditor
          item={item}
          locale={locale}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
