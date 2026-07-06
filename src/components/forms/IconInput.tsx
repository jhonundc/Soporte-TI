import type { LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface IconInputProps extends ComponentProps<typeof Input> {
  icon: LucideIcon;
  containerClassName?: string;
}

export function IconInput({
  icon: Icon,
  className,
  containerClassName,
  ...props
}: IconInputProps) {
  return (
    <div className={cn("relative", containerClassName)}>
      <Icon
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input className={cn("pl-9", className)} {...props} />
    </div>
  );
}
