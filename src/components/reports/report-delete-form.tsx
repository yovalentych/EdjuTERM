"use client";

import { useRef, useState } from "react";
import { deleteReport } from "@/app/actions";
import { ConfirmModal } from "@/components/ui/confirm-modal";

export function ReportDeleteForm({
  locale,
  projectId,
  reportId,
  confirmMessage,
  label,
  className,
  buttonClassName,
}: {
  locale: string;
  projectId: string;
  reportId: string;
  confirmMessage: string;
  label: string;
  className?: string;
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <div className={className}>
        <button type="button" className={buttonClassName} onClick={() => setOpen(true)}>
          {label}
        </button>
      </div>

      {/* Hidden form that performs the actual delete */}
      <form ref={formRef} action={deleteReport} className="hidden" aria-hidden="true">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="reportId" value={reportId} />
        <button type="submit" />
      </form>

      <ConfirmModal
        open={open}
        title={label}
        message={confirmMessage}
        onConfirm={() => {
          setOpen(false);
          formRef.current?.requestSubmit();
        }}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
