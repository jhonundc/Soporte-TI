"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Sparkles, Eye, Edit, Trash2, Search, Ticket, Clock, Wrench, CheckCircle, TrendingUp, Printer, FileSpreadsheet } from "lucide-react";
import { useSession } from "@/lib/hooks/useSession";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/data-display/StatCard";
import { TableRowActions, TableActionButton } from "@/components/data-display/TableRowActions";
import { FilterBar, FilterField } from "@/components/forms/FilterBar";
import { IconInput } from "@/components/forms/IconInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { exportFichaSoporteExcel } from "@/lib/export/ficha-soporte-excel";
import { exportFichaBajaExcel } from "@/lib/export/ficha-baja-excel";
import { printFichaSoporte } from "@/lib/print/ficha-print-template";
import { openBajaPrintWindow } from "@/lib/print/baja-print-template";

export default function ReportesFichasPage() {
  const router = useRouter();
  const { data: sessionData } = useSession();
  const role = String(sessionData?.user?.role || "").toLowerCase();
  const isSupport = role.includes("soporte") || role.includes("support");

  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState("");

  const [stats, setStats] = useState<any | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const normalizeSupport = (row: any) => ({
    id: row.IdSoporte,
    tipo: "Soporte",
    numero: row.NumeroFicha,
    unidadOrganica: row.UnidadOrganica,
    responsable: row.Responsable,
    dependencia: row.Dependencia,
    ambiente: row.Ambiente,
    tipoBien: row.TipoBien,
    fechaRegistro: row.FechaRegistro,
    bien: row.Bien || null,
    estado: row.Estado?.EstadoBien || "",
    estadoTicket: row.EstadoTicket || "",
    trabajosRealizados: row.TrabajosRealizados || "",
    diagnostico: row.Diagnostico || "",
    recomendacion: row.Recomendacion || "",
    prioridad: row.Prioridad?.NombrePrioridad || "",
    siglas: row.Siglas || "",
    firmaSoporte: row.FirmaSoporte || "",
    firmaJefeUnidad: row.FirmaJefeUnidad || "",
    firmaAreaUsuario: row.FirmaAreaUsuario || "",
    usuario: row.UsuarioSoporte?.Nombres || row.UsuarioSoporte?.Usuario || "",
    raw: row,
  });

  const normalizeBaja = (row: any) => ({
    id: row.IdBaja,
    tipo: "Baja",
    numero: row.NumeroFichaBaja,
    unidadOrganica: row.UnidadOrganica,
    responsable: row.Responsable,
    dependencia: row.Dependencia,
    ambiente: row.Ambiente,
    tipoBien: row.TipoBien,
    fechaRegistro: row.FechaRegistro,
    bien: row.Bien || null,
    estado: row.Estado?.EstadoBien || "",
    causalBaja: row.CausalBaja || "",
    fundamentacion: row.Fundamentacion || "",
    recomendacion: row.Recomendacion || "",
    observacion: row.Observacion || "",
    usuario: row.UsuarioRegistro?.Nombres || row.UsuarioRegistro?.Usuario || "",
    raw: row,
  });

  const [searchTerm, setSearchTerm] = useState("");

  const StatusBadge = ({ status }: { status?: string }) => {
    const s = (status || "").toLowerCase();
    const classes = s.includes("pend")
      ? "bg-warning/10 text-warning ring-warning/20"
      : s.includes("progres")
        ? "bg-primary/10 text-primary ring-primary/20"
        : s.includes("atend") || s === "atendida"
          ? "bg-success/10 text-success ring-success/20"
          : s.includes("deriv")
            ? "bg-muted text-muted-foreground ring-border"
            : "bg-muted text-muted-foreground ring-border";
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${classes}`}>
        {status || "-"}
      </span>
    );
  };
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [viewOpen, setViewOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<any>(null);
  const [selectedTipo, setSelectedTipo] = useState<"Soporte" | "Baja">("Soporte");

  const loadRecords = async () => {
    setLoading(true);
    try {
      const [supportRes, bajaRes] = await Promise.all([
        fetch("/api/soporte/ficha?reportes=1"),
        fetch("/api/soporte/baja?reportes=1"),
      ]);

      if (!supportRes.ok) throw new Error("Error cargando fichas de soporte");
      if (!bajaRes.ok) throw new Error("Error cargando fichas de baja");

      const [supportData, bajaData] = await Promise.all([supportRes.json(), bajaRes.json()]);
      const supportRecords = Array.isArray(supportData) ? supportData.map(normalizeSupport) : [];
      const bajaRecords = Array.isArray(bajaData) ? bajaData.map(normalizeBaja) : [];

      setRecords([...supportRecords, ...bajaRecords]);
    } catch (e) {
      console.error(e);
      setMessage("No se pudieron cargar las fichas");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      setLoadingStats(true);
      try {
        const res = await fetch("/api/dashboard/estadisticas");
        if (!res.ok) throw new Error("No se pudieron cargar estadísticas");
        const data = await res.json();
        setStats(data?.totales ?? null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingStats(false);
      }
    };

    loadStats();
  }, []);

  const filteredRecords = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return records.filter((r) => {
      if (r.tipo !== selectedTipo) return false;

      // filtro fecha
      if (startDate) {
        const fecha = r.fechaRegistro ? new Date(r.fechaRegistro) : null;
        if (!fecha || fecha < new Date(startDate)) return false;
      }
      if (endDate) {
        const fecha = r.fechaRegistro ? new Date(r.fechaRegistro) : null;
        if (!fecha || fecha > new Date(endDate + "T23:59:59")) return false;
      }

      if (!term) return true;

      const checks = [
        r.tipo,
        r.numero,
        r.responsable,
        r.dependencia,
        r.ambiente,
        r.tipoBien,
        r.recomendacion,
        r.causalBaja,
        r.fundamentacion,
        r.trabajosRealizados,
        r.diagnostico,
        r.prioridad,
        r.bien?.CodigoInventario,
        r.bien?.CodigoPatrimonial,
        r.bien?.NumeroSerie,
        r.bien?.Descripcion,
        r.usuario,
      ];

      return checks.some((c) => String(c || "").toLowerCase().includes(term));
    });
  }, [records, searchTerm, startDate, endDate, selectedTipo]);

  const handleExport = async () => {
    setExporting(true);
    setMessage("");
    try {
      // enviar filtros al endpoint de exportar si soporta query params
      const headers = [
        "Tipo",
        "Nº Ficha",
        "Unidad Orgánica",
        "Fecha Registro",
        "Responsable",
        "Dependencia",
        "Ambiente",
        "Bien",
        "Cod. Inventario",
        "Cod. Patrimonial",
        "Estado",
        "Tipo Bien",
        "Recomendación",
        "Causal de Baja",
        "Fundamentación",
        "Trabajos Realizados",
        "Diagnóstico",
        "Prioridad",
      ];

      const rows = filteredRecords.map((r) => [
        r.tipo,
        r.numero || "",
        r.unidadOrganica || "",
        r.fechaRegistro ? new Date(r.fechaRegistro).toLocaleString("es-PE") : "",
        r.responsable || "",
        r.dependencia || "",
        r.ambiente || "",
        r.bien?.Descripcion || r.bien?.CodigoInventario || "",
        r.bien?.CodigoInventario || "",
        r.bien?.CodigoPatrimonial || "",
        r.estado || "",
        r.tipoBien || "",
        r.recomendacion || "",
        r.causalBaja || "",
        r.fundamentacion || "",
        r.trabajosRealizados || "",
        r.diagnostico || "",
        r.prioridad || "",
      ]);

      const csvContent = [headers.join("\t"), ...rows.map((row) => row.join("\t"))].join("\n");
      const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      const objectUrl = window.URL.createObjectURL(blob);
      link.href = objectUrl;
      link.download = `registros_fichas_${selectedTipo.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
      setMessage("Exportación completada");
    } catch (e: any) {
      console.error(e);
      setMessage(e?.message || "Error en exportación");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async (record: any) => {
    if (!confirm("¿Está seguro de eliminar esta ficha?")) return;
    try {
      const endpoint = record.tipo === "Baja" ? "/api/soporte/baja" : "/api/soporte/ficha";
      const res = await fetch(`${endpoint}?id=${record.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      await loadRecords();
      setMessage(`Ficha de ${record.tipo.toLowerCase()} eliminada`);
    } catch (e) {
      console.error(e);
      setMessage("No se pudo eliminar la ficha");
    }
  };

  const handlePrintPdf = (record: any) => {
    try {
      if (record.tipo === "Baja") {
        openBajaPrintWindow(record.raw ?? record, record.raw?.Bien ?? record.bien ?? null);
      } else {
        printFichaSoporte(record.raw ?? record);
      }
    } catch (error) {
      console.error(error);
      setMessage("No se pudo generar el PDF de la ficha");
    }
  };

  const handleExportExcelByRecord = async (record: any) => {
    try {
      if (record.tipo === "Baja") {
        await exportFichaBajaExcel(record.raw ?? record, record.raw?.Bien ?? record.bien ?? null);
      } else {
        await exportFichaSoporteExcel(record.raw ?? record);
      }
      setMessage(`Excel de ficha de ${record.tipo.toLowerCase()} generado correctamente`);
    } catch (error) {
      console.error(error);
      setMessage("No se pudo generar el Excel de la ficha");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registro de fichas"
        description="Listado, filtros, exportación y acciones sobre fichas de soporte y baja."
        actions={
          <Button variant="outline" onClick={loadRecords}>
            Recargar
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Total fichas"
          value={loadingStats ? "..." : stats?.totalSoporte ?? records.length}
          icon={Ticket}
          accent="primary"
        />
        <StatCard
          title="Pendientes"
          value={loadingStats ? "..." : stats?.totalSoportePendiente ?? 0}
          icon={Clock}
          accent="warning"
        />
        <StatCard
          title="En progreso"
          value={loadingStats ? "..." : stats?.totalSoporteProceso ?? 0}
          icon={Wrench}
          accent="primary"
        />
        <StatCard
          title="Atendidas"
          value={loadingStats ? "..." : stats?.totalSoporteAtendido ?? 0}
          icon={CheckCircle}
          accent="success"
        />
        <StatCard
          title="Derivadas"
          value={loadingStats ? "..." : stats?.totalSoporteDerivado ?? 0}
          icon={TrendingUp}
          accent="muted"
        />
      </div>

      <Card className="border-border shadow-[var(--shadow-soft)]">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Registros</CardTitle>
            <CardDescription>Lista de fichas filtrable y exportable</CardDescription>
          </div>
          <Button onClick={handleExport} disabled={exporting} className="gap-2" size="lg">
            <Download className="size-4" aria-hidden="true" />
            {exporting ? "Generando..." : "Descargar"}
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={selectedTipo === "Soporte" ? "default" : "outline"}
              onClick={() => setSelectedTipo("Soporte")}
            >
              Ficha de soporte
            </Button>
            <Button
              type="button"
              size="sm"
              variant={selectedTipo === "Baja" ? "default" : "outline"}
              onClick={() => setSelectedTipo("Baja")}
            >
              Ficha de baja
            </Button>
          </div>

          <FilterBar
            activeCount={
              Number(Boolean(searchTerm)) + Number(Boolean(startDate)) + Number(Boolean(endDate))
            }
            onClear={() => {
              setSearchTerm("");
              setStartDate("");
              setEndDate("");
            }}
          >
            <FilterField label="Buscar" htmlFor="search-fichas" className="sm:col-span-2">
              <IconInput
                id="search-fichas"
                icon={Search}
                placeholder="Buscar por número, responsable, dependencia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </FilterField>
            <FilterField label="Desde" htmlFor="start-date">
              <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </FilterField>
            <FilterField label="Hasta" htmlFor="end-date">
              <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </FilterField>
          </FilterBar>

          <div className="surface-panel overflow-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs font-semibold tracking-wide text-foreground uppercase">
                <tr>
                  <th className="px-4 py-3.5 text-left" scope="col">Nº Ficha</th>
                  <th className="px-4 py-3.5 text-left" scope="col">Responsable</th>
                  <th className="px-4 py-3.5 text-left" scope="col">Dependencia</th>
                  <th className="px-4 py-3.5 text-left" scope="col">Bien</th>
                  <th className="px-4 py-3.5 text-left" scope="col">Fecha</th>
                  <th className="px-4 py-3.5 text-left" scope="col">Estado</th>
                  <th className="px-4 py-3.5 text-right" scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Cargando...</td></tr>
                ) : filteredRecords.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No hay registros</td></tr>
                ) : (
                  filteredRecords.map((r) => (
                    <tr key={`${r.tipo}-${r.id}`} className="transition-colors duration-150 hover:bg-muted/40">
                      <td className="whitespace-nowrap px-4 py-3.5 font-medium text-foreground">{r.numero || "-"}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">{r.responsable || "-"}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">{r.dependencia || "-"}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">{r.bien?.Descripcion || r.bien?.CodigoInventario || "-"}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">{r.fechaRegistro ? new Date(r.fechaRegistro).toLocaleString() : "-"}</td>
                      <td className="whitespace-nowrap px-4 py-3.5"><StatusBadge status={r.estado} /></td>
                      <td className="whitespace-nowrap px-4 py-3.5">
                          <TableRowActions>
                          <TableActionButton
                            title="Imprimir PDF"
                            aria-label="Imprimir ficha en PDF"
                            onClick={() => handlePrintPdf(r)}
                          >
                            <Printer className="size-4" />
                          </TableActionButton>
                          <TableActionButton
                            title="Descargar Excel"
                            aria-label="Descargar ficha en Excel"
                            onClick={() => void handleExportExcelByRecord(r)}
                          >
                            <FileSpreadsheet className="size-4" />
                          </TableActionButton>
                          <TableActionButton
                            title="Ver"
                            aria-label="Ver ficha"
                            onClick={() => { setViewingRecord(r); setViewOpen(true); }}
                          >
                            <Eye className="size-4" />
                          </TableActionButton>
                          {!isSupport && (
                            <>
                              <TableActionButton
                                actionVariant="primary"
                                title="Editar"
                                aria-label="Editar ficha"
                                onClick={() => router.push(`/soporte/${r.tipo === "Baja" ? "baja" : "ficha"}?id=${r.id}`)}
                              >
                                <Edit className="size-4" />
                              </TableActionButton>
                              <TableActionButton
                                actionVariant="destructive"
                                title="Eliminar"
                                aria-label="Eliminar ficha"
                                onClick={() => handleDelete(r)}
                              >
                                <Trash2 className="size-4" />
                              </TableActionButton>
                            </>
                          )}
                        </TableRowActions>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {message && (
        <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-muted-foreground" aria-hidden="true" />
            <span>{message}</span>
          </div>
        </div>
      )}

      {/* VIEW DIALOG */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="bg-white sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Ficha</DialogTitle>
            <DialogDescription>Vista detallada de la ficha seleccionada.</DialogDescription>
          </DialogHeader>

          {viewingRecord && (
            <div className="space-y-6 p-4 border rounded-lg bg-white text-slate-800">
              <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4">
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">UNIDAD DE ESTADISTICA E INFORMATICA</p>
                  <h2 className="text-base font-extrabold text-slate-800 mt-1">FICHA DE {viewingRecord.tipo?.toUpperCase() || 'REGISTRO'}</h2>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold bg-slate-100 px-3 py-1 rounded border text-slate-800 inline-block">Nº {viewingRecord.numero || '-'}</p>
                  <p className="text-[10px] text-slate-500 mt-1.5">Fecha: {viewingRecord.fechaRegistro ? new Date(viewingRecord.fechaRegistro).toLocaleString() : '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-[11px] bg-slate-50 p-3 rounded border">
                <div>
                  <span className="font-bold block text-slate-500">RESPONSABLE DEL BIEN</span>
                  <span className="font-medium text-xs text-slate-800">{viewingRecord.responsable || '-'}</span>
                </div>
                <div>
                  <span className="font-bold block text-slate-500">DEPENDENCIA (ÁREA)</span>
                  <span className="font-medium text-xs text-slate-800">{viewingRecord.dependencia || '-'}</span>
                </div>
                <div>
                  <span className="font-bold block text-slate-500">AMBIENTE</span>
                  <span className="font-medium text-xs text-slate-800">{viewingRecord.ambiente || '-'}</span>
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-bold bg-slate-800 text-white px-2.5 py-1 uppercase tracking-wider rounded-t">II. Detalle Técnico del Bien</h3>
                <div className="border border-t-0 rounded-b overflow-hidden">
                  <table className="w-full text-[11px] text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b">
                        <th className="p-2 border-r font-bold">Código Inventario</th>
                        <th className="p-2 border-r font-bold">Código Patrimonial</th>
                        <th className="p-2 border-r font-bold">Bien / Descripción</th>
                        <th className="p-2 border-r font-bold">Marca</th>
                        <th className="p-2 border-r font-bold">Modelo</th>
                        <th className="p-2 font-bold">Nº Serie</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-2 border-r border-b">{viewingRecord.Bien?.CodigoInventario || '-'}</td>
                        <td className="p-2 border-r border-b">{viewingRecord.Bien?.CodigoPatrimonial || '-'}</td>
                        <td className="p-2 border-r border-b">{viewingRecord.Bien?.Descripcion || '-'}</td>
                        <td className="p-2 border-r border-b">{viewingRecord.Bien?.Marca?.Marca || '-'}</td>
                        <td className="p-2 border-r border-b">{viewingRecord.Bien?.Modelo?.Modelo || '-'}</td>
                        <td className="p-2 border-b">{viewingRecord.Bien?.NumeroSerie || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-[11px] font-bold bg-slate-800 text-white px-2.5 py-1 uppercase tracking-wider rounded-t">V. Trabajos Realizados</h3>
                  <div className="border border-t-0 p-3 rounded-b min-h-[50px] text-xs whitespace-pre-wrap">{viewingRecord.TrabajosRealizados || 'Ninguno'}</div>
                </div>

                <div>
                  <h3 className="text-[11px] font-bold bg-slate-800 text-white px-2.5 py-1 uppercase tracking-wider rounded-t">VI. Diagnóstico</h3>
                  <div className="border border-t-0 p-3 rounded-b min-h-[50px] text-xs whitespace-pre-wrap">{viewingRecord.Diagnostico || 'Ninguno'}</div>
                </div>

                <div>
                  <h3 className="text-[11px] font-bold bg-slate-800 text-white px-2.5 py-1 uppercase tracking-wider rounded-t">VII. Recomendaciones</h3>
                  <div className="border border-t-0 p-3 rounded-b min-h-[50px] text-xs whitespace-pre-wrap">{viewingRecord.Recomendacion || 'Ninguna'}</div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setViewOpen(false)}>Cerrar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
