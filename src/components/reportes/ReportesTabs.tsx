"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const REPORTES_TABS = [
  { label: "Inventario", href: "/reportes/inventario" },
  { label: "Fichas", href: "/reportes/fichas" },
] as const;

export function ReportesTabs() {
  const pathname = usePathname();

  return (
    <div className="border-b border-border">
      <nav aria-label="Secciones de reportes" className="-mb-px flex gap-1 overflow-x-auto">
        {REPORTES_TABS.map((tab) => {
          const isActive = pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
