"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BarChart, Download, FileSpreadsheet, ShieldCheck, Sparkles, Ticket } from "lucide-react";
import { StatCard } from "@/components/data-display/StatCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Estadisticas = {
  totalSoporte: number;
  totalSoportePendiente: number;
  totalSoporteProceso: number;
  totalSoporteAtendido: number;
  totalSoporteDerivado: number;
};

export default function ReportesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState("");
  const [stats, setStats] = useState<Estadisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (!res.ok) return;
        const data = await res.json();
        setRole(String(data?.user?.role || "").toLowerCase());
      } catch (error) {
        console.error("Error cargando sesión:", error);
      }
    };

    const loadStats = async () => {
      try {
        const res = await fetch("/api/dashboard/estadisticas");
        if (!res.ok) {
          throw new Error("No se pudieron cargar las estadísticas");
        }
        const data = await res.json();
        setStats({
          totalSoporte: data.totales.totalSoporte,
          totalSoportePendiente: data.totales.totalSoportePendiente,
          totalSoporteProceso: data.totales.totalSoporteProceso,
          totalSoporteAtendido: data.totales.totalSoporteAtendido,
          totalSoporteDerivado: data.totales.totalSoporteDerivado,
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
    loadStats();
  }, []);

  useEffect(() => {
    if (!role) return;
    if (role.includes("soporte") && pathname !== "/" && pathname !== "/reportes") {
      router.replace("/reportes");
    }
  }, [role, pathname, router]);

  const handleExport = async (type: "fichas" | "bienes") => {
    setExporting(true);
    setMessage("");

    try {
      const endpoint = type === "bienes" ? "/api/bienes/exportar" : "/api/soporte/ficha/exportar";
      const filenamePrefix = type === "bienes" ? "inventario_bienes" : "fichas_soporte";

      const res = await fetch(endpoint);
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.error || "Error al generar el archivo");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage("Reporte generado correctamente.");
    } catch (error: unknown) {
      console.error(error);
      setMessage(error instanceof Error ? error.message : "No se pudo generar el reporte.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reportes"
        description="Genera y descarga reportes del sistema. Usa las pestañas superiores para cambiar entre resumen, inventario y fichas."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Fichas totales"
          value={loading ? "..." : (stats?.totalSoporte ?? 0)}
          icon={Ticket}
          accent="primary"
        />
        <StatCard
          title="Pendientes"
          value={loading ? "..." : (stats?.totalSoportePendiente ?? 0)}
          icon={Ticket}
          accent="warning"
        />
        <StatCard
          title="En progreso"
          value={loading ? "..." : (stats?.totalSoporteProceso ?? 0)}
          icon={Ticket}
          accent="muted"
        />
        <StatCard
          title="Atendidas"
          value={loading ? "..." : (stats?.totalSoporteAtendido ?? 0)}
          icon={Ticket}
          accent="success"
        />
        <StatCard
          title="Derivadas"
          value={loading ? "..." : (stats?.totalSoporteDerivado ?? 0)}
          icon={Ticket}
          accent="destructive"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border shadow-[var(--shadow-soft)]">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Registros de bienes</CardTitle>
            <CardDescription>
              Reporte de inventario con códigos, descripción, marca y estado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => handleExport("bienes")}
              disabled={exporting}
              className="gap-2"
            >
              <Download className="size-4" aria-hidden="true" />
              {exporting ? "Generando..." : "Descargar reporte de bienes"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border shadow-[var(--shadow-soft)]">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Registros de fichas</CardTitle>
            <CardDescription>
              Reporte de soporte con ticket, responsable, prioridad y bien asociado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => handleExport("fichas")}
              disabled={exporting}
              className="gap-2"
            >
              <Download className="size-4" aria-hidden="true" />
              {exporting ? "Generando..." : "Descargar reporte de fichas"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {message ? (
        <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-muted-foreground" aria-hidden="true" />
            <span>{message}</span>
          </div>
        </div>
      ) : null}

      <Card className="border-border shadow-[var(--shadow-soft)]">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Indicaciones</CardTitle>
          <CardDescription>Accede a los datos de soporte y genera tu reporte en CSV.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <div className="flex items-start gap-2">
            <FileSpreadsheet className="mt-0.5 size-5 shrink-0 text-muted-foreground/70" aria-hidden="true" />
            <p>El botón generará un archivo descargable con los registros de fichas de soporte.</p>
          </div>
          <div className="flex items-start gap-2">
            <BarChart className="mt-0.5 size-5 shrink-0 text-muted-foreground/70" aria-hidden="true" />
            <p>El reporte incluye estado del ticket, responsable, datos del bien y firmas.</p>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-muted-foreground/70" aria-hidden="true" />
            <p>
              Los usuarios de soporte tienen acceso restringido a este panel y no pueden acceder a
              la configuración administrativa.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
