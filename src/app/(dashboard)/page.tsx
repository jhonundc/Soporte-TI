"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Boxes,
  CheckCircle,
  Clock,
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
  };
  fichasPorArea: Record<string, number>;
  soportePorMes: Array<{ año: number; mes: number; cantidad: number }>;
  soportePorDia: Array<{ fecha: string; cantidad: number }>;
};

export default function DashboardPage() {
  const [data, setData] = useState<Estadisticas | null>(null);
  const [cargando, setCargando] = useState(true);
  const [role, setRole] = useState("");

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

    const loadStats = async () => {
      try {
        const res = await fetch("/api/dashboard/estadisticas");
        if (!res.ok) throw new Error("Error al cargar estadísticas");
        const d: Estadisticas = await res.json();
        if (d?.totales) setData(d);
      } catch {
        setData(null);
      } finally {
        setCargando(false);
      }
    };

    loadSession();
    loadStats();
  }, []);

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
        ]
      : [
          { title: "Total Equipos", value: formatNumber(totals.totalBienes), icon: Boxes, accent: "primary" as const },
          { title: "Operativos", value: formatNumber(totals.totalBienesOperativos), icon: CheckCircle, accent: "success" as const },
          { title: "Inoperativos", value: formatNumber(totals.totalBienesInoperativos), icon: XCircle, accent: "destructive" as const },
          { title: "Dados de Baja", value: formatNumber(totals.totalBajas), icon: Trash2, accent: "muted" as const },
        ]
    : [];

  const areaChartData = data
    ? Object.entries(data.fichasPorArea ?? {})
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
    : [];

  const monthlyChartData = data
    ? data.soportePorMes.slice(0, 12).reverse().map((m) => ({
        label: `${m.año}-${String(m.mes).padStart(2, "0")}`,
        Fichas: m.cantidad,
      }))
    : [];

  const dailyChartData = data ? data.soportePorDia.slice(0, 14).reverse() : [];

  const ticketStatusData = data
    ? [
        { name: "Pendientes", value: data.totales.totalSoportePendiente, color: chartPalette.warning },
        { name: "En Progreso", value: data.totales.totalSoporteProceso, color: chartPalette.primary },
        { name: "Atendidos", value: data.totales.totalSoporteAtendido, color: chartPalette.success },
        { name: "Derivados", value: data.totales.totalSoporteDerivado, color: chartPalette.accent },
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Panel de control"
        description="Bienvenido al sistema de gestión de soporte e inventario."
      />

      {cargando ? (
        <DashboardSkeleton />
      ) : data ? (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
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
                />
              </motion.div>
            ))}
          </div>

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
          <Button type="button" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </div>
      )}
    </div>
  );
}
