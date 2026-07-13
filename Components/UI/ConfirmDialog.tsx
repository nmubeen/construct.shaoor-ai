"use client";

import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      className="relative z-50"
    >
      {/* Background */}
      <div className="fixed inset-0 bg-black/40" />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">

          <DialogTitle className="text-xl font-bold">
            {title}
          </DialogTitle>

          <p className="mt-4 text-slate-600">
            {message}
          </p>

          <div className="mt-8 flex justify-end gap-3">

            <button
              onClick={onCancel}
              className="rounded-lg border px-5 py-2"
            >
              {cancelText}
            </button>

            <button
              onClick={onConfirm}
              disabled={loading}
              className="rounded-lg bg-red-600 px-5 py-2 text-white"
            >
              {loading ? "Deleting..." : confirmText}
            </button>

          </div>

        </DialogPanel>
      </div>

    </Dialog>
  );
}