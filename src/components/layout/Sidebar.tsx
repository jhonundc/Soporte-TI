"use client";

import { Boxes } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { BrandMark } from "@/components/layout/BrandMark";

export default function Sidebar() {
  const { isSidebarCollapsed, setSidebarCollapsed } = useUIStore();

  return (
    <aside
      aria-label="Navegación principal"
      className={cn(
        "relative hidden h-screen flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-out md:flex",
        isSidebarCollapsed ? "w-[4.5rem]" : "w-64"
      )}
    >
      <div className="flex h-16 items-center border-b border-sidebar-border px-3">
        {!isSidebarCollapsed ? (
          <BrandMark textClassName="text-sidebar-foreground [&_p:first-child]:text-lg [&_p:last-child]:text-sm [&_p:last-child]:text-sidebar-muted" />
        ) : (
          <div className="mx-auto flex size-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <Boxes className="size-4" aria-hidden="true" />
          </div>
        )}
      </div>

      <SidebarNav
        collapsed={isSidebarCollapsed}
        onExpandRequest={() => setSidebarCollapsed(false)}
      />
    </aside>
  );
}
