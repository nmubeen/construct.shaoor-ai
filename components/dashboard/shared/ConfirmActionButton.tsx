"use client";

export function ConfirmActionButton({ message, children, className, formAction, disabled, title }: { message: string; children: React.ReactNode; className: string; formAction?: (formData: FormData) => void | Promise<void>; disabled?: boolean; title?: string }) {
  return <button className={className} formAction={formAction} disabled={disabled} title={title} onClick={event => { if (!window.confirm(message)) event.preventDefault(); }}>{children}</button>;
}
