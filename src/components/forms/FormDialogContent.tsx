import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { DialogContent } from "@/components/ui/dialog";

const sizeClasses = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
  full: "sm:max-w-[min(96vw,72rem)]",
} as const;

interface FormDialogContentProps extends ComponentProps<typeof DialogContent> {
  size?: keyof typeof sizeClasses;
  children: ReactNode;
}

export function FormDialogContent({
  size = "lg",
  className,
  children,
  ...props
}: FormDialogContentProps) {
  return (
    <DialogContent className={cn(sizeClasses[size], className)} {...props}>
      {children}
    </DialogContent>
  );
}
