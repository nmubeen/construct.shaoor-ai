import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({
  children,
  className = "",
}: CardProps) {
  return (
    <div
      className={`
        rounded-2xl
        border
        border-(--border)
        bg-white
        shadow-sm
        ${className}
      `}
    >
      {children}
    </div>
  );
}