"use client";



import type { ReactNode } from "react";

import { useEffect, useState } from "react";

import { usePathname, useRouter } from "next/navigation";

import { LogOut, Menu, User, Key, Bell } from "lucide-react";

import Sidebar from "@/components/layout/Sidebar";

import { SidebarNav } from "@/components/layout/SidebarNav";

import { BrandMark } from "@/components/layout/BrandMark";

import { useUIStore } from "@/store/ui";

import { cn } from "@/lib/utils";

import {

  DropdownMenu,

  DropdownMenuContent,

  DropdownMenuItem,

  DropdownMenuSeparator,

  DropdownMenuTrigger,

} from "@/components/ui/dropdown-menu";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { Button } from "@/components/ui/button";

import {

  Sheet,

  SheetContent,

  SheetHeader,

  SheetTitle,

} from "@/components/ui/sheet";

import { useSession } from "@/lib/hooks/useSession";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

import { PageTransition } from "@/components/layout/PageTransition";

import { SkipLink } from "@/components/layout/SkipLink";

import { buildBreadcrumbs, getPageTitle } from "@/lib/navigation/breadcrumbs";



interface AppShellProps {

  children: ReactNode;

}



export function AppShell({ children }: AppShellProps) {

  const { isSidebarCollapsed, toggleSidebar } = useUIStore();

  const pathname = usePathname();

  const router = useRouter();

  const { data: sessionData } = useSession();
  const role = String(sessionData?.user?.role || "").toLowerCase();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const displayName = (sessionData as any)?.user?.name || (sessionData as any)?.user?.Nombres || (sessionData as any)?.user?.username || "R";
  const shortName = (() => {
    const s = String(displayName || "").trim();
    const parts = s.split(/\s+/).filter(Boolean);
    if (!parts.length) return "";
    return parts.length > 1 ? `${parts[0]} ${parts[1]}` : parts[0];
  })();

  useEffect(() => {

    if (!role) return;

    if (

      role.includes("soporte") &&

      !pathname.startsWith("/reportes") &&

      pathname !== "/" &&

      !pathname.startsWith("/inventario") &&

      pathname !== "/redes" &&

      !pathname.startsWith("/soporte") &&

      !pathname.startsWith("/centro-notificaciones")

    ) {

      router.replace("/reportes");

    }

  }, [role, pathname, router]);



  const breadcrumbs = buildBreadcrumbs(pathname);

  const showHeaderBreadcrumbs = !pathname.startsWith("/reportes");



  return (

    <div className="flex h-screen bg-surface">

      <SkipLink />

      <Sidebar />



      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>

        <SheetContent

          side="left"

          className="w-72 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"

        >

          <SheetHeader className="border-b border-sidebar-border px-4 py-4 text-left">

            <SheetTitle className="sr-only">Menú de navegación</SheetTitle>

            <BrandMark textClassName="text-sidebar-foreground [&_p:last-child]:text-sidebar-muted" />

          </SheetHeader>

          <SidebarNav onNavigate={() => setMobileNavOpen(false)} />

        </SheetContent>

      </Sheet>



      <div

        className={cn(

          "flex min-w-0 flex-1 flex-col overflow-hidden transition-all duration-300 ease-out",

          isSidebarCollapsed ? "ml-0" : "ml-0"

        )}

      >

        <header

          role="banner"

          className="flex h-14 items-center justify-between border-b border-border bg-card px-4 md:px-6"

        >

          <div className="flex min-w-0 items-center gap-3">

            <Button

              variant="ghost"

              size="icon-sm"

              className="shrink-0 text-muted-foreground hover:text-foreground"

              onClick={() => {

                if (window.matchMedia("(min-width: 768px)").matches) {

                  toggleSidebar();

                } else {

                  setMobileNavOpen(true);

                }

              }}

              aria-label={

                isSidebarCollapsed ? "Abrir menú de navegación" : "Cerrar menú de navegación"

              }

            >

              <Menu className="size-5" />

            </Button>

            <div className="min-w-0">

              {showHeaderBreadcrumbs ? (

                <Breadcrumbs items={breadcrumbs} className="hidden sm:block" />

              ) : (

                <div className="text-sm font-medium text-foreground">{getPageTitle(pathname)}</div>

              )}

              {showHeaderBreadcrumbs ? (

                <div className="text-sm font-medium text-foreground sm:hidden">

                  {getPageTitle(pathname)}

                </div>

              ) : null}

            </div>

          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-lg text-muted-foreground hover:text-foreground"
              aria-label="Notificaciones"
              onClick={() => router.push("/centro-notificaciones")}
            >
              <Bell className="size-5" />
            </Button>
            <span className="hidden sm:inline-block text-sm font-medium">{displayName}</span>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex cursor-pointer items-center rounded-lg p-1.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Menú de cuenta de usuario"
              >
                <Avatar className="size-8" aria-hidden="true">
                  <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                    <User className="size-4" />
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm font-semibold text-foreground">Mi cuenta</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 size-4" />
                  <span>Agregar perfil (foto)</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Key className="mr-2 size-4" />
                  <span>Cambiar clave</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                  onClick={async () => {
                    await fetch("/api/auth/logout", { method: "POST" });
                    window.location.href = "/login";
                  }}
                >
                  <LogOut className="mr-2 size-4" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>



        <main

          id="main-content"

          tabIndex={-1}

          className="flex-1 overflow-y-auto bg-surface p-4 outline-none md:p-6"

        >

          <PageTransition>{children}</PageTransition>

        </main>

      </div>

    </div>

  );

}

