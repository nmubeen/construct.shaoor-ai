"use client";

import { ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  title?: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  /**
   * Gate on every *indirect* close (backdrop click, Escape, the built-in
   * Close button) — return false to keep the dialog open, e.g. to confirm
   * discarding unsaved input. A caller that wants to close the dialog
   * itself (a "Done"/"Cancel" button inside `children`) should just call
   * `onClose` directly, bypassing this gate entirely.
   */
  confirmClose?: () => boolean;
}

export default function Modal({
  open,
  title,
  children,
  onClose,
  footer,
  confirmClose,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const attemptClose = () => {
    if (!confirmClose || confirmClose()) onClose();
  };

  // Body scroll lock + focus management, for as long as the dialog is open.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  // Escape to close (through the same confirm gate as everything else),
  // and a Tab trap so keyboard users can't accidentally tab out into the
  // page behind the dialog while it's open.
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        attemptClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- attemptClose closes over the latest onClose/confirmClose each render; re-subscribing is cheap.
  }, [open, onClose, confirmClose]);

  // Portals require `document`, which doesn't exist during SSR — `open`
  // starts false on every current caller, so this only matters in theory.
  // This is also what fixes the dialog rendering clipped inside whatever
  // card/button triggered it: a `fixed` element's containing block becomes
  // its nearest *transformed* ancestor (e.g. a service card's
  // `hover:-translate-y-1`), not necessarily the viewport, when it's
  // mounted inside that ancestor's own DOM subtree. Portaling to <body>
  // sidesteps that regardless of where the trigger button lives, so this
  // always opens as a true, full-viewport overlay.
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-slate-950/50"
        onClick={attemptClose}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? "Dialog"}
        tabIndex={-1}
        className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-4 shadow-2xl outline-none sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          {title && <h2 className="text-2xl font-bold text-slate-900">{title}</h2>}

          <button
            type="button"
            onClick={attemptClose}
            className="ml-auto rounded-lg px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Close
          </button>
        </div>

        <div className="mt-2 sm:mt-4">{children}</div>

        {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
