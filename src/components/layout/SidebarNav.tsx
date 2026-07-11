"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Boxes,
  Network,
  Ticket,
  BarChart,
  Users,
  Settings,
  ChevronLeft,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/hooks/useSession";
import { Button } from "@/components/ui/button";

export type SidebarMenuItem = {
  icon: LucideIcon;
  label: string;
  href: string;
  subItems?: { label: string; href: string }[];
};

const adminMenuItems: SidebarMenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  {
    icon: Boxes,
    label: "Inventario",
    href: "/inventario",
    subItems: [
      { label: "Bienes", href: "/inventario/bienes" },
      { label: "Componentes", href: "/inventario/componentes" },
      { label: "Software", href: "/inventario/software" },
    ],
  },
  { icon: Network, label: "Redes", href: "/redes" },
  {
    icon: Ticket,
    label: "Soporte",
    href: "/soporte",
    subItems: [
      { label: "Generar Ficha Soporte", href: "/soporte/ficha" },
      { label: "Generar Ficha de Baja", href: "/soporte/baja" },
      { label: "Componentes por Área", href: "/soporte/componentes-por-area" },
    ],
  },
  { icon: Users, label: "Usuarios", href: "/usuarios" },
  {
    icon: Settings,
    label: "Configuración",
    href: "/configuracion",
    subItems: [
      { label: "Áreas", href: "/configuracion/areas" },
      { label: "Categorías", href: "/configuracion/categorias" },
      { label: "Marcas", href: "/configuracion/marcas" },
      { label: "Proveedores", href: "/configuracion/proveedores" },
      { label: "Condiciones", href: "/configuracion/condiciones" },
      { label: "Estados", href: "/configuracion/estados" },
      { label: "Tipos de Software", href: "/configuracion/tipos-software" },
      { label: "Tipos de Licencia", href: "/configuracion/tipos-licencia" },
      { label: "Tipos de Asignación", href: "/configuracion/tipos-asignacion-software" },
      { label: "Catálogo de Software", href: "/configuracion/software-catalogo" },
    ],
  },
  {
    icon: BarChart,
    label: "Reportes",
    href: "/reportes",
    subItems: [
      { label: "Registro de inventario", href: "/reportes/inventario" },
      { label: "Registro de fichas", href: "/reportes/fichas" },
    ],
  },
];

const supportMenuItems: SidebarMenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  {
    icon: Boxes,
    label: "Inventario",
    href: "/inventario",
    subItems: [
      { label: "Bienes", href: "/inventario/bienes" },
      { label: "Componentes", href: "/inventario/componentes" },
      { label: "Software", href: "/inventario/software" },
    ],
  },
  { icon: Network, label: "Redes", href: "/redes" },
  {
    icon: Ticket,
    label: "Soporte",
    href: "/soporte",
    subItems: [
      { label: "Generar Ficha Soporte", href: "/soporte/ficha" },
      { label: "Generar Ficha de Baja", href: "/soporte/baja" },
      { label: "Componentes por Área", href: "/soporte/componentes-por-area" },
    ],
  },
  {
    icon: BarChart,
    label: "Reportes",
    href: "/reportes",
    subItems: [
      { label: "Registro de inventario", href: "/reportes/inventario" },
      { label: "Registro de fichas", href: "/reportes/fichas" },
    ],
  },
];

interface SidebarNavProps {
  collapsed?: boolean;
  onNavigate?: () => void;
  onExpandRequest?: () => void;
  className?: string;
}

const navItemClass = (active: boolean) =>
  cn(
    "group flex w-full items-center rounded-lg px-3 py-2.5 text-[0.9375rem] font-medium leading-snug transition-all duration-150",
    active
      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-[var(--shadow-soft)]"
      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
  );

export function SidebarNav({
  collapsed = false,
  onNavigate,
  onExpandRequest,
  className,
}: SidebarNavProps) {
  const pathname = usePathname();
  const [openSubMenus, setOpenSubMenus] = useState<string[]>([]);
  const [menuItems, setMenuItems] = useState(adminMenuItems);

  const { data: sessionData } = useSession();

  useEffect(() => {
    const role = String(sessionData?.user?.role || "").toLowerCase();
    setMenuItems(role.includes("soporte") ? supportMenuItems : adminMenuItems);
  }, [sessionData]);

  useEffect(() => {
    const activeParent = menuItems.find(
      (item) =>
        item.subItems?.some((sub) => pathname === sub.href) || pathname === item.href
    );
    if (activeParent?.subItems && !collapsed) {
      setOpenSubMenus((prev) =>
        prev.includes(activeParent.label) ? prev : [...prev, activeParent.label]
      );
    }
  }, [pathname, menuItems, collapsed]);

  const toggleSubMenu = (label: string) => {
    setOpenSubMenus((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 py-4">
        {menuItems.map((item) => {
          const hasSubItems = !!item.subItems;
          const isSubMenuOpen = openSubMenus.includes(item.label);
          const isActive =
            pathname === item.href ||
            item.subItems?.some((sub) => pathname === sub.href);

          return (
            <div key={item.label} className="space-y-0.5">
              {hasSubItems ? (
                <button
                  type="button"
                  onClick={() => {
                    if (collapsed) {
                      onExpandRequest?.();
                      setOpenSubMenus([item.label]);
                      return;
                    }
                    toggleSubMenu(item.label);
                  }}
                  className={cn(navItemClass(Boolean(isActive && !isSubMenuOpen)), "justify-between")}
                >
                  <div className="flex min-w-0 items-center">
                    <item.icon className="size-5 shrink-0" aria-hidden="true" />
                    {!collapsed ? <span className="ml-3 truncate">{item.label}</span> : null}
                  </div>
                  {!collapsed ? (
                    <ChevronLeft
                      className={cn(
                        "size-4 shrink-0 transition-transform duration-200 ease-out",
                        isSubMenuOpen && "-rotate-90"
                      )}
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
              ) : (
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={navItemClass(Boolean(isActive))}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="size-5 shrink-0" aria-hidden="true" />
                  {!collapsed ? <span className="ml-3 truncate">{item.label}</span> : null}
                </Link>
              )}

              {hasSubItems && !collapsed ? (
                <div
                  className={cn(
                    "grid transition-[grid-template-rows] duration-200 ease-out",
                    isSubMenuOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="ml-4 space-y-0.5 border-l border-sidebar-border pl-3 pt-0.5">
                      {item.subItems!.map((subItem) => {
                        const isSubActive = pathname === subItem.href;
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            onClick={onNavigate}
                            className={cn(
                              "block rounded-md px-2.5 py-2 text-[0.875rem] leading-snug transition-colors duration-150",
                              isSubActive
                                ? "font-semibold text-sidebar-primary"
                                : "text-sidebar-foreground/65 hover:text-sidebar-accent-foreground"
                            )}
                          >
                            {subItem.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-2.5">
        <Button
          type="button"
          variant="ghost"
          onClick={handleLogout}
          className="h-auto w-full justify-start px-3 py-2.5 text-[0.9375rem] font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="size-5 shrink-0" aria-hidden="true" />
          {!collapsed ? <span className="ml-3">Cerrar sesión</span> : null}
        </Button>
      </div>
    </div>
  );
}
