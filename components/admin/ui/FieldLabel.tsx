import { ReactNode } from "react";

interface FieldLabelProps {
  children: ReactNode;
  required?: boolean;
}

export default function FieldLabel({
  children,
  required = false,
}: FieldLabelProps) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {children}

      {required && (
        <span className="ml-1 text-red-500">*</span>
      )}
    </label>
  );
}