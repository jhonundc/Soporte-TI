"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Boxes,
  Cpu,
  FileCode,
  Network,
  Ticket,
  Wrench,
  Trash2,
  BarChart,
  Users,
  Menu,
  ChevronDown,
  LogOut,
  Settings,
  ClipboardList,
  ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui";
import { Button } from "@/components/ui/button";

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

export default function Sidebar() {
  const pathname = usePathname();
  const { isSidebarCollapsed, toggleSidebar } = useUIStore();
  const [openSubMenus, setOpenSubMenus] = useState<string[]>([]);
  const [menuItems, setMenuItems] = useState(adminMenuItems);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (!res.ok) return;
        const data = await res.json();
        const role = String(data?.user?.role || "").toLowerCase();
        if (role.includes("soporte")) {
          setMenuItems(supportMenuItems);
        } else {
          setMenuItems(adminMenuItems);
        }
      } catch (error) {
        console.error("Error fetching session in Sidebar:", error);
      }
    };

    fetchSession();
  }, []);

  const toggleSubMenu = (label: string) => {
    setOpenSubMenus((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  return (
    <div
      className={cn(
        "relative flex flex-col h-screen bg-gradient-to-b from-[#0F172A] to-[#1E293B] text-white transition-all duration-300 ease-in-out border-r border-slate-800",
        isSidebarCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800/50">
        {!isSidebarCollapsed && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"
          >
            Soporte TI
          </motion.span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="text-slate-400 hover:text-white hover:bg-slate-800/50 ml-auto rounded-lg"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const hasSubItems = !!item.subItems;
          const isSubMenuOpen = openSubMenus.includes(item.label);
          const isActive = pathname === item.href || item.subItems?.some(sub => pathname === sub.href);

          return (
            <div key={item.label} className="space-y-1">
              {hasSubItems ? (
                <button
                  onClick={() => {
                    if (isSidebarCollapsed) {
                      toggleSidebar();
                      setOpenSubMenus([item.label]);
                    } else {
                      toggleSubMenu(item.label);
                    }
                  }}
                  className={cn(
                    "flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group",
                    isActive && !isSubMenuOpen
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-900/20"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                  )}
                >
                  <div className="flex items-center">
                    <item.icon
                      className={cn(
                        "h-5 w-5 flex-shrink-0 transition-colors",
                        isActive && !isSubMenuOpen ? "text-white" : "text-slate-400 group-hover:text-white"
                      )}
                    />
                    {!isSidebarCollapsed && (
                      <span className="ml-3">{item.label}</span>
                    )}
                  </div>
                  {!isSidebarCollapsed && (
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform duration-200 text-slate-500 group-hover:text-white",
                        isSubMenuOpen ? "transform rotate-180" : ""
                      )}
                    />
                  )}
                </button>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group",
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-900/20"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 flex-shrink-0 transition-colors",
                      isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                    )}
                  />
                  {!isSidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="ml-3"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </Link>
              )}

              {/* Sub Items */}
              <AnimatePresence>
                {hasSubItems && isSubMenuOpen && !isSidebarCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="ml-6 space-y-1 overflow-hidden mt-1"
                  >
                    {item.subItems.map((subItem) => {
                      const isSubActive = pathname === subItem.href;
                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={cn(
                            "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                            isSubActive
                              ? "text-blue-400 font-medium"
                              : "text-slate-500 hover:text-white hover:bg-slate-800/30"
                          )}
                        >
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full mr-2",
                            isSubActive ? "bg-blue-400" : "bg-slate-600"
                          )} />
                          {subItem.label}
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-800/50">
        <button
          className={cn(
            "flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-xl text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all duration-200"
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!isSidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="ml-3"
            >
              Cerrar Sesión
            </motion.span>
          )}
        </button>
      </div>
    </div>
  );
}
