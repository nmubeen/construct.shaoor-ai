"use client";

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Fragment } from "react";
import {
  FaTriangleExclamation,
  FaXmark,
} from "react-icons/fa6";

import Button from "@/components/admin/primitives/Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;

  confirmText?: string;
  cancelText?: string;

  loading?: boolean;
  danger?: boolean;

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
  danger = true,

  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Transition
      show={open}
      as={Fragment}
    >
      <Dialog
        as="div"
        className="relative z-50"
        onClose={loading ? () => {} : onCancel}
      >
        {/* Overlay */}

        <TransitionChild
          as={Fragment}
          enter="transition-opacity duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <DialogBackdrop className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </TransitionChild>

        {/* Dialog */}

        <div className="fixed inset-0 overflow-y-auto">

          <div className="flex min-h-full items-center justify-center p-4">

            <TransitionChild
              as={Fragment}
              enter="transition duration-200 ease-out"
              enterFrom="opacity-0 scale-95 translate-y-2"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="transition duration-150 ease-in"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-2"
            >
              <DialogPanel className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">

                {/* Header */}

                <div className="flex items-start justify-between border-b px-6 py-5">

                  <div className="flex items-center gap-4">

                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full ${
                        danger
                          ? "bg-red-100 text-red-600"
                          : "bg-amber-100 text-amber-600"
                      }`}
                    >
                      <FaTriangleExclamation className="text-xl" />
                    </div>

                    <div>

                      <DialogTitle className="text-lg font-semibold text-slate-900">
                        {title}
                      </DialogTitle>

                    </div>

                  </div>

                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={loading}
                    className="rounded-md p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:pointer-events-none"
                  >
                    <FaXmark className="text-xl" />
                  </button>

                </div>

                {/* Body */}

                <div className="px-6 py-5">

                  <p className="leading-7 text-slate-600">
                    {message}
                  </p>

                </div>

                {/* Footer */}

                <div className="flex justify-end gap-3 border-t bg-slate-50 px-6 py-4">

                  <Button
                    variant="secondary"
                    onClick={onCancel}
                    disabled={loading}
                  >
                    {cancelText}
                  </Button>

                  <Button
                    variant={danger ? "danger" : "primary"}
                    onClick={onConfirm}
                    loading={loading}
                  >
                    {confirmText}
                  </Button>

                </div>

              </DialogPanel>

            </TransitionChild>

          </div>

        </div>

      </Dialog>
    </Transition>
  );
}