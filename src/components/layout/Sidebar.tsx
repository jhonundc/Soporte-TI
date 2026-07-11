"use client";

import { PanelLeftClose, PanelLeftOpen, Boxes } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { BrandMark } from "@/components/layout/BrandMark";

export default function Sidebar() {
  const { isSidebarCollapsed, toggleSidebar, setSidebarCollapsed } = useUIStore();

  return (
    <aside
      aria-label="Navegación principal"
      className={cn(
        "relative hidden h-screen flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-out md:flex",
        isSidebarCollapsed ? "w-[4.5rem]" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-3">
        {!isSidebarCollapsed ? (
          <BrandMark textClassName="text-sidebar-foreground [&_p:last-child]:text-sidebar-muted" />
        ) : (
          <div className="mx-auto flex size-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <Boxes className="size-4" aria-hidden="true" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleSidebar}
          className="shrink-0 text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          aria-label={isSidebarCollapsed ? "Expandir menú" : "Contraer menú"}
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </Button>
      </div>

      <SidebarNav
        collapsed={isSidebarCollapsed}
        onExpandRequest={() => setSidebarCollapsed(false)}
      />
    </aside>
  );
}
