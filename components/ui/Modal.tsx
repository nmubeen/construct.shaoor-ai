"use client";

import { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  title?: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
}

export default function Modal({
  open,
  title,
  children,
  onClose,
  footer,
}: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-slate-950/50"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          {title && <h2 className="text-2xl font-bold text-slate-900">{title}</h2>}

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Close
          </button>
        </div>

        <div className="mt-6">{children}</div>

        {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}