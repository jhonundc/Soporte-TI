import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TableRowActionsProps {
  children: ReactNode;
  className?: string;
}

export function TableRowActions({ children, className }: TableRowActionsProps) {
  return (
    <div className={cn("flex items-center justify-end gap-0.5", className)}>{children}</div>
  );
}

type TableActionVariant = "default" | "primary" | "warning" | "destructive";

interface TableActionButtonProps extends ComponentProps<typeof Button> {
  actionVariant?: TableActionVariant;
}

const actionVariantClasses: Record<TableActionVariant, string> = {
  default: "text-muted-foreground hover:text-foreground",
  primary: "text-primary hover:bg-primary/10 hover:text-primary",
  warning: "text-warning hover:bg-warning/10 hover:text-warning",
  destructive: "text-destructive hover:bg-destructive/10 hover:text-destructive",
};

export function TableActionButton({
  actionVariant = "default",
  className,
  size = "icon-sm",
  variant = "ghost",
  ...props
}: TableActionButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      className={cn(actionVariantClasses[actionVariant], className)}
      {...props}
    />
  );
}
