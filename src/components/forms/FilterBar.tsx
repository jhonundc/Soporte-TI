import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  children?: ReactNode;
  actions?: ReactNode;
  activeCount?: number;
  onClear?: () => void;
  className?: string;
  fieldsClassName?: string;
}

export function FilterBar({
  children,
  actions,
  activeCount = 0,
  onClear,
  className,
  fieldsClassName,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-soft)] lg:flex-row lg:items-end lg:justify-between",
        className
      )}
    >
      <div className={cn("grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-3", fieldsClassName)}>
        {children}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {activeCount > 0 ? (
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {activeCount} filtro{activeCount === 1 ? "" : "s"} activo{activeCount === 1 ? "" : "s"}
          </span>
        ) : null}
        {onClear && activeCount > 0 ? (
          <Button type="button" variant="ghost" size="sm" onClick={onClear} className="gap-1.5">
            <X className="size-3.5" aria-hidden="true" />
            Limpiar
          </Button>
        ) : null}
        {actions}
      </div>
    </div>
  );
}

interface FilterFieldProps {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

export function FilterField({ label, htmlFor, children, className }: FilterFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
