import Image from "next/image";
import { Boxes } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  showText?: boolean;
  className?: string;
  textClassName?: string;
  logoSrc?: string;
}

export function BrandMark({
  showText = true,
  className,
  textClassName,
  logoSrc,
}: BrandMarkProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {logoSrc ? (
        <Image
          src={logoSrc}
          alt="Hospital Rezola"
          width={36}
          height={36}
          className="size-9 shrink-0 rounded-xl bg-white object-contain p-0.5"
        />
      ) : (
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[var(--shadow-soft)]">
          <Boxes className="size-5" aria-hidden="true" />
        </div>
      )}
      {showText ? (
        <div className={cn("min-w-0", textClassName)}>
          <p className="text-gradient-brand text-base font-bold leading-tight">Soporte TI</p>
          <p className="truncate text-xs text-muted-foreground">Hospital Rezola</p>
        </div>
      ) : null}
    </div>
  );
}
