"use client";

export function ConfirmActionButton({ message, children, className, formAction }: { message: string; children: React.ReactNode; className: string; formAction?: (formData: FormData) => void | Promise<void> }) {
  return <button className={className} formAction={formAction} onClick={event => { if (!window.confirm(message)) event.preventDefault(); }}>{children}</button>;
}
