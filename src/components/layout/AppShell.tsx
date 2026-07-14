"use client";



import type { ReactNode } from "react";

import { useEffect, useState } from "react";

import { usePathname, useRouter } from "next/navigation";

import { LogOut, Menu, User, Key, Bell, Moon, Sun } from "lucide-react";

import { useQuery } from "@tanstack/react-query";

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

import { queryKeys } from "@/lib/query-keys";

import { notificacionService, type NotificacionRecord } from "@/services/notificacion.service";

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
  const notificationStorageKey = sessionData?.user?.id
    ? `notificaciones-vistas:${sessionData.user.id}`
    : null;
  const [seenNotificationIds, setSeenNotificationIds] = useState<number[]>([]);
  const canViewNotifications = role === "admin" || role === "soporte";
  const isAdmin = role === "admin";
  const isSupport = role === "soporte";
  const { data: allNotifications = [] } = useQuery({
    queryKey: queryKeys.notificaciones("campana"),
    queryFn: () => notificacionService.list(),
    enabled: canViewNotifications,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
  const bellNotifications = allNotifications
    .filter((notification) => {
      const status = String(notification.EstadoAprobacion || "").trim().toUpperCase();
      return (isAdmin && status === "PENDIENTE") ||
        (isSupport && (status === "APROBADA" || status === "RECHAZADA"));
    })
    .slice(0, 5);
  const unseenBellNotifications = bellNotifications.filter(
    (notification) => !seenNotificationIds.includes(notification.IdNotificacion)
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    const storedTheme = window.localStorage.getItem("inventario-ti-theme");
    return storedTheme
      ? storedTheme === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const displayName = sessionData?.user?.name || sessionData?.user?.username || "R";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((currentMode) => {
      const nextMode = !currentMode;
      window.localStorage.setItem("inventario-ti-theme", nextMode ? "dark" : "light");
      return nextMode;
    });
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!notificationStorageKey) {
        setSeenNotificationIds([]);
        return;
      }

      try {
        const storedIds = JSON.parse(window.localStorage.getItem(notificationStorageKey) || "[]");
        setSeenNotificationIds(
          Array.isArray(storedIds)
            ? storedIds.filter((id): id is number => Number.isSafeInteger(id))
            : []
        );
      } catch {
        setSeenNotificationIds([]);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [notificationStorageKey]);

  const markBellNotificationsAsSeen = () => {
    if (!notificationStorageKey || bellNotifications.length === 0) return;

    setSeenNotificationIds((currentIds) => {
      const nextIds = Array.from(
        new Set([...currentIds, ...bellNotifications.map((notification) => notification.IdNotificacion)])
      ).slice(-200);
      window.localStorage.setItem(notificationStorageKey, JSON.stringify(nextIds));
      return nextIds;
    });
  };

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
              variant="ghost"
              size="icon-sm"
              className="shrink-0 text-muted-foreground hover:text-foreground"
              onClick={toggleTheme}
              aria-label={isDarkMode ? "Activar modo claro" : "Activar modo oscuro"}
              title={isDarkMode ? "Modo claro" : "Modo oscuro"}
            >
              {isDarkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <DropdownMenu
              onOpenChange={(open) => {
                if (open) markBellNotificationsAsSeen();
              }}
            >
              <DropdownMenuTrigger
                className="relative inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label={
                  unseenBellNotifications.length
                    ? `Notificaciones sin ver: ${unseenBellNotifications.length}`
                    : "Notificaciones"
                }
              >
                <Bell className="size-5" />
                {unseenBellNotifications.length ? (
                  <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
                    {unseenBellNotifications.length > 9 ? "9+" : unseenBellNotifications.length}
                  </span>
                ) : null}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-2">
                <div className="px-2 py-1.5 text-sm font-semibold text-foreground">
                  Notificaciones
                </div>
                <DropdownMenuSeparator />
                {bellNotifications.length ? (
                  bellNotifications.map((notification: NotificacionRecord) => {
                    const status = String(notification.EstadoAprobacion || "").trim().toUpperCase();
                    const isPending = status === "PENDIENTE";
                    return (
                      <DropdownMenuItem
                        key={notification.IdNotificacion}
                        className="cursor-pointer items-start px-2 py-2.5"
                        onClick={() =>
                          router.push(
                            `/centro-notificaciones/${
                              String(notification.TipoFicha || "").trim().toUpperCase() === "BAJA"
                                ? "fichas-baja"
                                : "fichas-soporte"
                            }?notificacion=${notification.IdNotificacion}`
                          )
                        }
                      >
                        <div className="min-w-0 space-y-1">
                          <p className="truncate font-medium text-foreground">
                            {notification.Titulo || "Ficha"}
                          </p>
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {isPending
                              ? "Nueva ficha de soporte pendiente de revisión."
                              : `Solicitud ${status.toLowerCase()}${
                                  notification.NombreUsuarioRespondio
                                    ? ` por ${notification.NombreUsuarioRespondio}`
                                    : ""
                                }.`}
                          </p>
                          <span className="text-xs font-medium text-primary">Ver detalles</span>
                        </div>
                      </DropdownMenuItem>
                    );
                  })
                ) : (
                  <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                    No tienes notificaciones nuevas.
                  </p>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer justify-center py-2 text-primary"
                  onClick={() => router.push("/centro-notificaciones/fichas-soporte")}
                >
                  Ver todas las notificaciones
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

