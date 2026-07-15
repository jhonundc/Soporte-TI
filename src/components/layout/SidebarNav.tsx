"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Gauge,
  Boxes,
  Headset,
  BellRing,
  ChartNoAxesCombined,
  UsersRound,
  Settings2,
  ChevronLeft,
  LogOut,
  Search,
  X,
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
  { icon: Gauge, label: "Dashboard", href: "/" },
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
  {
    icon: Headset,
    label: "Soporte",
    href: "/soporte",
    subItems: [
      { label: "Generar Ficha Soporte", href: "/soporte/ficha" },
      { label: "Generar Ficha de Baja", href: "/soporte/baja" },
      { label: "Registrar Acta de Entrega", href: "/soporte/acta-entrega" },
    ],
  },
  {
    icon: BellRing,
    label: "Centro de Notificaciones",
    href: "/centro-notificaciones",
    subItems: [
      { label: "Fichas Soporte", href: "/centro-notificaciones/fichas-soporte" },
      { label: "Fichas Baja", href: "/centro-notificaciones/fichas-baja" },
      { label: "Actas de Entrega", href: "/centro-notificaciones/actas-entrega" },
    ],
  },
  {
    icon: UsersRound,
    label: "Usuarios",
    href: "/usuarios",
  },
  {
    icon: Settings2,
    label: "Configuración",
    href: "/configuracion",
    subItems: [
      { label: "Áreas", href: "/configuracion/areas" },
      { label: "Categorías", href: "/configuracion/categorias" },
      { label: "Marcas", href: "/configuracion/marcas" },
      { label: "Componentes", href: "/configuracion/componentes" },
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
    icon: ChartNoAxesCombined,
    label: "Reportes",
    href: "/reportes/inventario",
    subItems: [
      { label: "Registro de inventario", href: "/reportes/inventario" },
      { label: "Registro de fichas", href: "/reportes/fichas" },
    ],
  },
];

const supportMenuItems: SidebarMenuItem[] = [
  { icon: Gauge, label: "Dashboard", href: "/" },
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
  {
    icon: Headset,
    label: "Soporte",
    href: "/soporte",
    subItems: [
      { label: "Generar Ficha Soporte", href: "/soporte/ficha" },
      { label: "Generar Ficha de Baja", href: "/soporte/baja" },
      { label: "Registrar Acta de Entrega", href: "/soporte/acta-entrega" },
    ],
  },
  {
    icon: BellRing,
    label: "Centro de Notificaciones",
    href: "/centro-notificaciones",
    subItems: [
      { label: "Fichas Soporte", href: "/centro-notificaciones/fichas-soporte" },
      { label: "Fichas Baja", href: "/centro-notificaciones/fichas-baja" },
      { label: "Actas de Entrega", href: "/centro-notificaciones/actas-entrega" },
    ],
  },
  {
    icon: ChartNoAxesCombined,
    label: "Reportes",
    href: "/reportes/inventario",
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
    "group flex w-full items-center rounded-xl px-3 py-2.5 text-[0.9375rem] font-medium leading-snug transition-all duration-200",
    active
      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md ring-1 ring-white/10"
      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground"
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
  const [menuSearch, setMenuSearch] = useState("");

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

  const normalizedSearch = menuSearch.trim().toLocaleLowerCase();
  const visibleMenuItems = useMemo(() => {
    if (!normalizedSearch) return menuItems;

    return menuItems.flatMap((item) => {
      const parentMatches = item.label.toLocaleLowerCase().includes(normalizedSearch);
      const matchingSubItems = item.subItems?.filter((subItem) =>
        subItem.label.toLocaleLowerCase().includes(normalizedSearch)
      );

      if (!parentMatches && !matchingSubItems?.length) return [];

      return [{ ...item, subItems: parentMatches ? item.subItems : matchingSubItems }];
    });
  }, [menuItems, normalizedSearch]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="border-b border-sidebar-border/80 px-3 py-3">
        {collapsed ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="mx-auto flex text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={onExpandRequest}
            aria-label="Buscar en el menú"
            title="Buscar en el menú"
          >
            <Search className="size-4" aria-hidden="true" />
          </Button>
        ) : (
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sidebar-muted" aria-hidden="true" />
            <input
              type="search"
              value={menuSearch}
              onChange={(event) => setMenuSearch(event.target.value)}
              placeholder="Buscar en el menú..."
              className="h-10 w-full rounded-xl border border-sidebar-border bg-sidebar-accent/55 py-2 pl-9 pr-9 text-sm text-sidebar-foreground outline-none transition-colors placeholder:text-sidebar-muted focus:border-sidebar-ring focus:bg-sidebar-accent focus:ring-2 focus:ring-sidebar-ring/30"
              aria-label="Buscar en el menú"
            />
            {menuSearch ? (
              <button
                type="button"
                onClick={() => setMenuSearch("")}
                className="absolute right-2 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-sidebar-muted transition-colors hover:bg-sidebar-border hover:text-sidebar-foreground"
                aria-label="Limpiar búsqueda"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            ) : null}
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {!collapsed ? (
          <p className="px-3 pb-2 pt-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-sidebar-muted">
            Navegación
          </p>
        ) : null}
        {visibleMenuItems.map((item) => {
          const hasSubItems = !!item.subItems;
          const isSubMenuOpen = openSubMenus.includes(item.label);
          const showSubMenu = isSubMenuOpen || Boolean(normalizedSearch);
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
                  className={cn(navItemClass(Boolean(isActive && !showSubMenu)), "justify-between")}
                >
                  <div className="flex min-w-0 items-center">
                    <item.icon className="size-5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
                    {!collapsed ? <span className="ml-3 truncate">{item.label}</span> : null}
                  </div>
                  {!collapsed ? (
                    <ChevronLeft
                      className={cn(
                        "size-4 shrink-0 transition-transform duration-200 ease-out",
                        showSubMenu && "-rotate-90"
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
                  <item.icon className="size-5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
                  {!collapsed ? <span className="ml-3 truncate">{item.label}</span> : null}
                </Link>
              )}

              {hasSubItems && !collapsed ? (
                <div
                  className={cn(
                    "grid transition-[grid-template-rows] duration-200 ease-out",
                    showSubMenu ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="ml-5 space-y-0.5 border-l border-sidebar-primary/30 pl-3 pt-1">
                      {item.subItems!.map((subItem) => {
                        const isSubActive = pathname === subItem.href;
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            onClick={onNavigate}
                            className={cn(
                              "block rounded-lg px-2.5 py-2 text-[0.875rem] leading-snug transition-colors duration-150",
                              isSubActive
                                ? "bg-sidebar-primary/15 font-semibold text-sidebar-primary"
                                : "text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
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
        {!visibleMenuItems.length && !collapsed ? (
          <div className="mx-1 rounded-xl border border-sidebar-border bg-sidebar-accent/40 px-3 py-5 text-center text-sm text-sidebar-muted">
            No se encontraron opciones.
          </div>
        ) : null}
      </nav>

      <div className="border-t border-sidebar-border/80 p-3">
        <Button
          type="button"
          variant="ghost"
          onClick={handleLogout}
          className="h-auto w-full justify-start rounded-xl px-3 py-2.5 text-[0.9375rem] font-medium text-sidebar-foreground/80 hover:bg-destructive/15 hover:text-red-300"
        >
          <LogOut className="size-5 shrink-0" aria-hidden="true" />
          {!collapsed ? <span className="ml-3">Cerrar sesión</span> : null}
        </Button>
      </div>
    </div>
  );
}
