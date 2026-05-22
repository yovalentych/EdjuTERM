"use client";

import { useRef, useState, useTransition } from "react";
import { Paperclip, Upload, X, Loader2, Download, File, Image, FileText, Archive } from "lucide-react";

type ItemFileData = {
  _id: string;
  name: string;
  mimeType?: string;
  bytes: number;
  uploadedAt: string | Date;
  uploadedBy?: string;
};

function fileIcon(mimeType?: string) {
  if (!mimeType) return File;
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType === "application/pdf" || mimeType.includes("document") || mimeType.includes("text")) return FileText;
  if (mimeType.includes("zip") || mimeType.includes("archive")) return Archive;
  return File;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ItemFilesBlock({
  itemId,
  initialFiles,
}: {
  itemId: string;
  initialFiles: ItemFileData[];
}) {
  const [files, setFiles] = useState<ItemFileData[]>(initialFiles);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;
    setError(null);
    setUploading(true);

    try {
      const fd = new FormData();
      selected.forEach((f) => fd.append("files", f));
      const res = await fetch(`/api/workspace-items/${itemId}/files`, { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? data.error ?? "Помилка завантаження");
        return;
      }
      setFiles((prev) => [...(data.files ?? []), ...prev]);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleDelete(fileId: string) {
    startTransition(async () => {
      const res = await fetch(`/api/workspace-items/${itemId}/files?fileId=${encodeURIComponent(fileId)}`, { method: "DELETE" });
      if (res.ok) setFiles((prev) => prev.filter((f) => f._id !== fileId));
    });
  }

  function downloadUrl(fileId: string) {
    return `/api/workspace-items/${itemId}/files/${fileId}`;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Paperclip className="h-4 w-4 text-slate-500" />
        <h2 className="liquid-eyebrow">ФАЙЛИ</h2>
        <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{files.length}</span>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1 rounded-lg bg-slate-700 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
          Завантажити
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleUpload}
          accept=".pdf,.docx,.xlsx,.pptx,.txt,.csv,.png,.jpg,.jpeg,.zip,.json"
        />
      </div>

      {error && <p className="mb-2 text-[11px] font-medium text-red-600">{error}</p>}

      {files.length === 0 && !uploading && (
        <p className="text-xs text-slate-400 italic">Файлів ще немає</p>
      )}

      <div className="space-y-1.5">
        {files.map((f) => {
          const Icon = fileIcon(f.mimeType);
          const date = typeof f.uploadedAt === "string"
            ? f.uploadedAt.slice(0, 10)
            : (f.uploadedAt as Date).toISOString().slice(0, 10);
          return (
            <div key={f._id} className="group flex items-center gap-3 rounded-lg border border-slate-100 bg-white/80 px-3 py-2.5 shadow-sm">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-800">{f.name}</p>
                <p className="text-[10px] text-slate-400">{formatBytes(f.bytes)} · {date}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={downloadUrl(f._id)}
                  download={f.name}
                  className="rounded-md p-1 text-slate-400 hover:bg-blue-50 hover:text-blue-500 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
                <button
                  onClick={() => handleDelete(f._id)}
                  disabled={isPending}
                  className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
