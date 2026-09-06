"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

// Shared reveal-password field for the Construct auth pages (signup, login,
// reset password). Toggling swaps type="password" <-> type="text" — it
// never touches the actual value, so it's safe alongside the server
// action's own validation either way.
export function ConstructPasswordInput({
  name,
  autoComplete,
  required,
  minLength,
  defaultValue,
  className,
}: {
  name: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  defaultValue?: string;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        defaultValue={defaultValue}
        className={`${className ?? ""} pr-11`}
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400 transition hover:text-slate-600"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
