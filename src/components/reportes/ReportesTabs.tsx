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
    <div className="rounded-xl border border-border bg-card p-1 shadow-[var(--shadow-soft)]">
      <nav aria-label="Secciones de reportes" className="flex gap-1 overflow-x-auto">
        {REPORTES_TABS.map((tab) => {
          const isActive = pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
