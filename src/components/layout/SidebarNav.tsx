"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Boxes,
  Network,
  Ticket,
  BarChart,
  Users,
  Settings,
  ChevronDown,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchSessionClient } from "@/lib/auth/session-client";
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
    "group flex w-full items-center rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-150",
    active
      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-[var(--shadow-soft)]"
      : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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

  useEffect(() => {
    fetchSessionClient()
      .then((data) => {
        const role = String(data?.user?.role || "").toLowerCase();
        setMenuItems(role.includes("soporte") ? supportMenuItems : adminMenuItems);
      })
      .catch(() => {});
  }, []);

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
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
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
                    <item.icon className="size-[1.125rem] shrink-0" aria-hidden="true" />
                    {!collapsed ? <span className="ml-3 truncate">{item.label}</span> : null}
                  </div>
                  {!collapsed ? (
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 transition-transform duration-150",
                        isSubMenuOpen && "rotate-180"
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
                  <item.icon className="size-[1.125rem] shrink-0" aria-hidden="true" />
                  {!collapsed ? (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="ml-3 truncate"
                    >
                      {item.label}
                    </motion.span>
                  ) : null}
                </Link>
              )}

              <AnimatePresence>
                {hasSubItems && isSubMenuOpen && !collapsed ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="ml-4 space-y-0.5 overflow-hidden border-l border-sidebar-border pl-3"
                  >
                    {item.subItems!.map((subItem) => {
                      const isSubActive = pathname === subItem.href;
                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          onClick={onNavigate}
                          className={cn(
                            "block rounded-md px-2.5 py-1.5 text-sm transition-colors duration-150",
                            isSubActive
                              ? "font-medium text-sidebar-primary"
                              : "text-sidebar-muted hover:text-sidebar-accent-foreground"
                          )}
                        >
                          {subItem.label}
                        </Link>
                      );
                    })}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-2">
        <Button
          type="button"
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="size-[1.125rem] shrink-0" aria-hidden="true" />
          {!collapsed ? <span className="ml-3">Cerrar sesión</span> : null}
        </Button>
      </div>
    </div>
  );
}
