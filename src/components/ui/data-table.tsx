import type { ReactNode } from "react";

export function DataTable({
  children,
  minWidth = "760px",
  className = "",
}: {
  children: ReactNode;
  minWidth?: string;
  className?: string;
}) {
  return (
    <div className={`shell-scrollbar overflow-x-auto ${className}`}>
      <table className="w-full border-collapse text-left text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function DataTableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-slate-200 bg-[#f6f8fb] text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </thead>
  );
}

export function DataTableHeadCell({
  children,
  className = "",
  align = "left",
}: {
  children?: ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  return (
    <th
      className={`px-4 py-3 font-semibold ${
        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"
      } ${className}`}
    >
      {children}
    </th>
  );
}

export function DataTableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-slate-100">{children}</tbody>;
}

export function DataTableCell({
  children,
  className = "",
  align = "left",
  muted = false,
}: {
  children?: ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
  muted?: boolean;
}) {
  return (
    <td
      className={`px-4 py-3 ${
        align === "right" ? "text-right" : align === "center" ? "text-center" : ""
      } ${muted ? "text-slate-500" : "text-slate-800"} ${className}`}
    >
      {children}
    </td>
  );
}
