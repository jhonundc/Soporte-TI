"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Boxes,
  CheckCircle,
  ClipboardList,
  Clock,
  FilePlus2,
  MonitorCog,
  RefreshCw,
  ShieldCheck,
  Ticket,
  Trash2,
  Wrench,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardSkeleton } from "@/components/data-display/DashboardSkeleton";
import { StatCard, chartPalette } from "@/components/data-display/StatCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { DashboardCharts } from "@/lib/lazy/feature-views";

type Estadisticas = {
  totales: {
    totalBienes: number;
    totalBienesOperativos: number;
    totalBienesInoperativos: number;
    totalBajas: number;
    totalSoporte: number;
    totalSoportePendiente: number;
    totalSoporteProceso: number;
    totalSoporteAtendido: number;
    totalSoporteDerivado: number;
    totalActasEntrega: number;
    totalActasEntregadas: number;
    totalActasDevueltas: number;
  };
  fichasPorArea: Record<string, number>;
  soportePorMes: Array<{ label: string; Fichas: number }>;
  soportePorDia: Array<{ fecha: string; cantidad: number }>;
};

export default function DashboardPage() {
  const [data, setData] = useState<Estadisticas | null>(null);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null);
  const [role, setRole] = useState("");

  const loadStats = useCallback(async (showRefreshState = false) => {
    if (showRefreshState) setActualizando(true);

    try {
      const res = await fetch("/api/dashboard/estadisticas");
      if (!res.ok) throw new Error("Unable to load dashboard statistics");
      const dashboardData: Estadisticas = await res.json();
      if (dashboardData?.totales) {
        setData(dashboardData);
        setUltimaActualizacion(new Date());
      }
    } catch {
      setData(null);
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  }, []);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (!res.ok) return;
        const session = await res.json();
        setRole(String(session?.user?.role || "").toLowerCase());
      } catch {
        // ignore session errors on dashboard
      }
    };

    loadSession();
    const timer = window.setTimeout(() => loadStats(), 0);
    return () => window.clearTimeout(timer);
  }, [loadStats]);

  const isSupport = role.includes("soporte") || role.includes("support");

  const defaultTotals = {
    totalBienes: 0,
    totalBienesOperativos: 0,
    totalBienesInoperativos: 0,
    totalBajas: 0,
    totalSoporte: 0,
    totalSoportePendiente: 0,
    totalSoporteProceso: 0,
    totalSoporteAtendido: 0,
    totalSoporteDerivado: 0,
    totalActasEntrega: 0,
    totalActasEntregadas: 0,
    totalActasDevueltas: 0,
  };

  const totals = data?.totales ?? defaultTotals;
  const formatNumber = (value?: number) => Number(value ?? 0).toLocaleString();

  const stats = data
    ? isSupport
      ? [
          { title: "Total Fichas", value: formatNumber(totals.totalSoporte), icon: Ticket, accent: "primary" as const },
          { title: "Pendientes", value: formatNumber(totals.totalSoportePendiente), icon: Clock, accent: "warning" as const },
          { title: "En Progreso", value: formatNumber(totals.totalSoporteProceso), icon: Wrench, accent: "primary" as const },
          { title: "Atendidas", value: formatNumber(totals.totalSoporteAtendido), icon: CheckCircle, accent: "success" as const },
          { title: "Actas de entrega", value: formatNumber(totals.totalActasEntrega), icon: ClipboardList, accent: "primary" as const, breakdown: [{ label: "Entregadas", value: formatNumber(totals.totalActasEntregadas), tone: "success" as const }, { label: "Devueltas", value: formatNumber(totals.totalActasDevueltas), tone: "warning" as const }] },
        ]
      : [
          { title: "Total Equipos", value: formatNumber(totals.totalBienes), icon: Boxes, accent: "primary" as const },
          { title: "Operativos", value: formatNumber(totals.totalBienesOperativos), icon: CheckCircle, accent: "success" as const },
          { title: "Inoperativos", value: formatNumber(totals.totalBienesInoperativos), icon: XCircle, accent: "destructive" as const },
          { title: "Dados de Baja", value: formatNumber(totals.totalBajas), icon: Trash2, accent: "muted" as const },
          { title: "Actas de entrega", value: formatNumber(totals.totalActasEntrega), icon: ClipboardList, accent: "primary" as const, breakdown: [{ label: "Entregadas", value: formatNumber(totals.totalActasEntregadas), tone: "success" as const }, { label: "Devueltas", value: formatNumber(totals.totalActasDevueltas), tone: "warning" as const }] },
        ]
    : [];

  const areaChartData = data
    ? Object.entries(data.fichasPorArea ?? {})
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
    : [];

  const monthlyChartData = data ? data.soportePorMes.slice(0, 12).reverse() : [];

  const dailyChartData = data ? data.soportePorDia.slice(0, 14).reverse() : [];

  const ticketStatusData = data
    ? [
        { name: "Pendientes", value: data.totales.totalSoportePendiente, color: chartPalette.warning },
        { name: "En Progreso", value: data.totales.totalSoporteProceso, color: chartPalette.primary },
        { name: "Atendidos", value: data.totales.totalSoporteAtendido, color: chartPalette.success },
        { name: "Derivados", value: data.totales.totalSoporteDerivado, color: chartPalette.accent },
      ]
    : [];

  const operationalPercentage = totals.totalBienes
    ? Math.round((totals.totalBienesOperativos / totals.totalBienes) * 100)
    : 0;

  const quickActions = isSupport
    ? [
        {
          href: "/soporte/ficha",
          title: "Nueva ficha",
          description: "Registra una solicitud de soporte.",
          icon: FilePlus2,
        },
        {
          href: "/centro-notificaciones/fichas-soporte",
          title: "Mis notificaciones",
          description: "Consulta las fichas por revisar.",
          icon: ClipboardList,
        },
        {
          href: "/soporte/mantenimiento",
          title: "Mantenimiento",
          description: "Gestiona actividades técnicas.",
          icon: Wrench,
        },
        {
          href: "/soporte/acta-entrega",
          title: "Nueva acta",
          description: "Registra una entrega de bienes.",
          icon: ClipboardList,
        },
      ]
    : [
        {
          href: "/inventario/bienes",
          title: "Ver inventario",
          description: "Consulta equipos y su estado.",
          icon: MonitorCog,
        },
        {
          href: "/soporte/ficha",
          title: "Nueva ficha",
          description: "Registra una solicitud de soporte.",
          icon: FilePlus2,
        },
        {
          href: "/centro-notificaciones/fichas-soporte",
          title: "Centro de fichas",
          description: "Revisa solicitudes y novedades.",
          icon: ClipboardList,
        },
        {
          href: "/soporte/acta-entrega",
          title: "Nueva acta",
          description: "Registra una entrega de bienes.",
          icon: ClipboardList,
        },
      ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Panel de control"
        description={
          isSupport
            ? "Supervisa el estado de las solicitudes de soporte y prioriza tu atención."
            : "Una vista rápida del estado del inventario y las solicitudes de soporte."
        }
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={() => loadStats(true)}
            disabled={cargando || actualizando}
          >
            <RefreshCw className={actualizando ? "animate-spin" : undefined} aria-hidden="true" />
            Actualizar
          </Button>
        }
      />

      {cargando ? (
        <DashboardSkeleton />
      ) : data ? (
        <>
          <section className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/12 via-card to-card px-5 py-6 shadow-[var(--shadow-soft)] sm:px-7">
            <div className="absolute -top-16 -right-12 size-52 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl space-y-2">
                <p className="flex items-center gap-2 text-sm font-medium text-primary">
                  <ShieldCheck className="size-4" aria-hidden="true" />
                  Resumen operativo
                </p>
                <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  {isSupport
                    ? `${formatNumber(totals.totalSoportePendiente)} solicitudes requieren seguimiento.`
                    : `${operationalPercentage}% de los equipos se encuentran operativos.`}
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  {isSupport
                    ? `${formatNumber(totals.totalSoporteProceso)} fichas están en proceso y ${formatNumber(totals.totalSoporteAtendido)} ya fueron atendidas.`
                    : `${formatNumber(totals.totalBienesOperativos)} operativos de ${formatNumber(totals.totalBienes)} equipos registrados.`}
                </p>
              </div>
              <div className="rounded-xl border border-border/80 bg-card/75 px-4 py-3 backdrop-blur sm:min-w-48">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Actualizado</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {ultimaActualizacion
                    ? ultimaActualizacion.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "Ahora"}
                </p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <StatCard
                  title={stat.title}
                  value={stat.value}
                  icon={stat.icon}
                  accent={stat.accent}
                  breakdown={"breakdown" in stat ? stat.breakdown : undefined}
                />
              </motion.div>
            ))}
          </div>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="surface-panel p-5 sm:p-6">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-foreground">Accesos rápidos</h2>
                <p className="mt-1 text-sm text-muted-foreground">Continúa con las tareas más frecuentes.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="group rounded-xl border border-border bg-background/60 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 hover:shadow-[var(--shadow-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="size-4" aria-hidden="true" />
                        </span>
                        <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
                      </div>
                      <p className="mt-4 font-medium text-foreground">{action.title}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{action.description}</p>
                    </Link>
                  );
                })}
              </div>
            </div>

            <aside className="surface-panel p-5 sm:p-6" aria-label="Prioridades actuales">
              <h2 className="text-base font-semibold text-foreground">Prioridades</h2>
              <div className="mt-4 space-y-4">
                <div className="flex gap-3">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-warning" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {formatNumber(totals.totalSoportePendiente)} fichas pendientes
                    </p>
                    <p className="mt-0.5 text-xs leading-5 text-muted-foreground">Requieren una primera revisión.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {formatNumber(totals.totalSoporteProceso)} atenciones en curso
                    </p>
                    <p className="mt-0.5 text-xs leading-5 text-muted-foreground">Da seguimiento a las actividades activas.</p>
                  </div>
                </div>
                {!isSupport ? (
                  <div className="flex gap-3">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-destructive" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {formatNumber(totals.totalBienesInoperativos)} equipos inoperativos
                      </p>
                      <p className="mt-0.5 text-xs leading-5 text-muted-foreground">Evalúa mantenimiento, reasignación o baja.</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </aside>
          </section>

          <DashboardCharts
            monthlyChartData={monthlyChartData}
            ticketStatusData={ticketStatusData}
            dailyChartData={dailyChartData}
            areaChartData={areaChartData}
          />
        </>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center gap-3">
          <div className="rounded-full bg-destructive/10 p-4">
            <XCircle className="size-8 text-destructive" aria-hidden="true" />
          </div>
          <p className="font-medium text-foreground">No se pudo conectar a la base de datos</p>
          <p className="text-sm text-muted-foreground">
            Verifique la conexión al servidor SQL y recargue la página.
          </p>
          <Button type="button" onClick={() => loadStats(true)} disabled={actualizando}>
            Reintentar
          </Button>
        </div>
      )}
    </div>
  );
}
