"use client";

import { motion } from "framer-motion";
import { PanelLeftClose, PanelLeftOpen, Boxes } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui";
import { Button } from "@/components/ui/button";
<<<<<<< HEAD

const adminMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { 
    icon: Boxes, 
    label: "Inventario", 
    href: "/inventario",
    subItems: [
      { label: "Bienes", href: "/inventario/bienes" },
      { label: "Componentes", href: "/inventario/componentes" },
      { label: "Software", href: "/inventario/software" },
    ]
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
    ]
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
    ]
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

const supportMenuItems = [
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
=======
import { SidebarNav } from "@/components/layout/SidebarNav";
import { BrandMark } from "@/components/layout/BrandMark";
>>>>>>> f94a8a056b7c87972de21b6fa024d9bb7624f8d5

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
