import { ReactNode } from "react";
import FieldLabel from "./FieldLabel";

interface FormRowProps {
  label: string;
  children: ReactNode;
  required?: boolean;
  labelWidth?: string;
}

export default function FormRow({
  label,
  children,
  required = false,
  labelWidth = "220px",
}: FormRowProps) {
  return (
    <div className="grid items-start gap-4 py-3 md:grid-cols-[220px_1fr]">
      <div className="pt-3">
        <FieldLabel required={required}>
          {label}
        </FieldLabel>
      </div>

      <div>{children}</div>
    </div>
  );
}