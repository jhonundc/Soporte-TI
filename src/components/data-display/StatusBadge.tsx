import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  active: boolean | number | null | undefined;
  activeLabel?: string;
  inactiveLabel?: string;
  className?: string;
}

export function StatusBadge({
  active,
  activeLabel = "Activo",
  inactiveLabel = "Inactivo",
  className,
}: StatusBadgeProps) {
  const isActive = active === true || active === 1;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        isActive
          ? "bg-success/10 text-success ring-success/20"
          : "bg-destructive/10 text-destructive ring-destructive/20",
        className
      )}
    >
      {isActive ? activeLabel : inactiveLabel}
    </span>
  );
}
