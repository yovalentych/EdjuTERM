"use client";

import { useRef, useState } from "react";
import { ConfirmModal } from "./confirm-modal";

export function ConfirmDeleteButton({
  message,
  label,
  className,
  formAction,
}: {
  message: string;
  label: string;
  className?: string;
  formAction?: (formData: FormData) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const submitRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      {/* Visible trigger — type="button" so it doesn't submit the parent form */}
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {label}
      </button>

      {/* Hidden real submit button */}
      <button
        ref={submitRef}
        type="submit"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formAction={formAction as any}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />

      <ConfirmModal
        open={open}
        title={label}
        message={message}
        onConfirm={() => {
          setOpen(false);
          submitRef.current?.click();
        }}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
