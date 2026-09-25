"use client";

export function ConfirmActionButton({ message, children, className, formAction, disabled, title, name, value }: { message: string; children: React.ReactNode; className: string; formAction?: (formData: FormData) => void | Promise<void>; disabled?: boolean; title?: string; name?: string; value?: string }) {
  return <button className={className} formAction={formAction} disabled={disabled} title={title} name={name} value={value} onClick={event => { if (!window.confirm(message)) event.preventDefault(); }}>{children}</button>;
}
