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
        border-[#dce5da]
        bg-white
        shadow-[0_8px_24px_rgba(9,65,54,.06)]
        ${className}
      `}
    >
      {children}
    </div>
  );
}
