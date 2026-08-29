import clsx from "clsx";

interface SpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-[3px]",
  lg: "h-12 w-12 border-4",
};

export default function Spinner({
  className,
  size = "md",
}: SpinnerProps) {
  return (
    <span
      className={clsx(
        "inline-block animate-spin rounded-full border-slate-200 border-t-[#0E4A7B]",
        sizeClasses[size],
        className
      )}
      aria-label="Loading"
      role="status"
    />
  );
}