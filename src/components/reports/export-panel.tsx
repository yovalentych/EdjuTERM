"use client";

import { useState } from "react";
import { FileDown, FileSpreadsheet, FileText, Presentation, File, Printer } from "lucide-react";
import { ExportPreviewModal, type ExportFormat } from "@/components/reports/export-preview-modal";

type Props = {
  projectId: string;
  reportId: string | null;
  locale: string;
  printHref?: string;
};

const FORMATS: Array<{
  id: ExportFormat; label: string; icon: React.ReactNode;
  color: string; bg: string; border: string;
}> = [
  { id: "pdf",  label: "PDF",  icon: <Printer className="h-4 w-4" />,         color: "text-rose-600",    bg: "bg-rose-50 hover:bg-rose-100",       border: "border-rose-200 hover:border-rose-300"    },
  { id: "docx", label: "DOCX", icon: <File className="h-4 w-4" />,            color: "text-blue-600",    bg: "bg-blue-50 hover:bg-blue-100",       border: "border-blue-200 hover:border-blue-300"    },
  { id: "pptx", label: "PPTX", icon: <Presentation className="h-4 w-4" />,    color: "text-orange-600",  bg: "bg-orange-50 hover:bg-orange-100",   border: "border-orange-200 hover:border-orange-300"  },
  { id: "xlsx", label: "XLSX", icon: <FileSpreadsheet className="h-4 w-4" />, color: "text-emerald-600", bg: "bg-emerald-50 hover:bg-emerald-100", border: "border-emerald-200 hover:border-emerald-300" },
  { id: "csv",  label: "CSV",  icon: <FileText className="h-4 w-4" />,        color: "text-teal-600",    bg: "bg-teal-50 hover:bg-teal-100",       border: "border-teal-200 hover:border-teal-300"    },
  { id: "txt",  label: "TXT",  icon: <FileText className="h-4 w-4" />,        color: "text-stone-500",   bg: "bg-stone-50 hover:bg-stone-100",     border: "border-stone-200 hover:border-stone-300"  },
];

export function ExportPanel({ projectId, reportId, locale, printHref }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("docx");
  const isUk = locale === "uk";

  function openModal(format: ExportFormat) {
    setSelectedFormat(format);
    setModalOpen(true);
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <FileDown className="h-4 w-4 text-stone-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
            {isUk ? "Експорт" : "Export"}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {FORMATS.map(fmt => (
            <button
              key={fmt.id}
              type="button"
              onClick={() => openModal(fmt.id)}
              title={isUk ? "Переглянути та налаштувати" : "Preview and configure"}
              className={`flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 text-center transition ${fmt.bg} ${fmt.border} ${fmt.color}`}
            >
              {fmt.icon}
              <span className="text-xs font-bold">{fmt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <ExportPreviewModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialFormat={selectedFormat}
        projectId={projectId}
        reportId={reportId}
        locale={locale}
        printHref={printHref}
      />
    </>
  );
}
