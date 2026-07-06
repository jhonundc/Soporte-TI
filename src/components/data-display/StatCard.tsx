import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const accentStyles = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
} as const;

export type StatAccent = keyof typeof accentStyles;

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  accent?: StatAccent;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  accent = "primary",
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "border-border shadow-[var(--shadow-soft)] transition-shadow duration-200 hover:shadow-[var(--shadow-elevated)]",
        className
      )}
    >
      <CardContent className="flex items-center justify-between p-5">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {title}
          </p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
        </div>
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            accentStyles[accent]
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </div>
      </CardContent>
    </Card>
  );
}

export const chartPalette = {
  primary: "oklch(0.52 0.19 264)",
  success: "oklch(0.62 0.16 155)",
  warning: "oklch(0.78 0.14 85)",
  destructive: "oklch(0.577 0.245 27.325)",
  muted: "oklch(0.55 0.04 260)",
  accent: "oklch(0.58 0.16 280)",
} as const;
