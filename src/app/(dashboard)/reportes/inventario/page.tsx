"use client";

<<<<<<< HEAD
import { useEffect, useState, useMemo } from "react";
import { Download, Sparkles, Eye, Edit, Trash2, Search, BarChart3, FileText, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BienFormModal from "@/components/inventory/BienFormModal";
import ComponenteFormModal from "@/components/inventory/ComponenteFormModal";
import SoftwareFormModal from "@/components/inventory/SoftwareFormModal";
=======
import { useEffect, useMemo, useState } from "react";
import { AppWindow, Boxes, Cpu, Download, Edit, Eye, Search, Sparkles, Trash2 } from "lucide-react";
import { StatCard } from "@/components/data-display/StatCard";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { TableActionButton, TableRowActions } from "@/components/data-display/TableRowActions";
import { FilterBar, FilterField } from "@/components/forms/FilterBar";
import { IconInput } from "@/components/forms/IconInput";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  BienFormModal,
  ComponenteFormModal,
  SoftwareFormModal,
} from "@/lib/lazy/inventory-modals";
import { notify } from "@/lib/feedback/toast";
import { cn } from "@/lib/utils";
>>>>>>> f94a8a056b7c87972de21b6fa024d9bb7624f8d5

type InventarioStats = {
  totalBienes: number;
  totalBienesActivos: number;
  totalBienesInactivos: number;
  totalComponentes: number;
  totalSoftware: number;
};

type FilterType = "bienes" | "componentes" | "software";
type BienesReporteType = "listado" | "general" | "areas" | "categorias" | "estados";

const TABLE_HEAD_CLASS =
  "border-b border-border bg-muted/50 text-xs font-semibold tracking-wide text-foreground uppercase";
const TABLE_ROW_CLASS = "border-t border-border transition-colors duration-150 hover:bg-muted/40";
const TABLE_CELL_CLASS = "whitespace-nowrap px-4 py-3.5 text-foreground";
const TABLE_CELL_MUTED = "whitespace-nowrap px-4 py-3.5 text-muted-foreground";

function RecordRowActions({
  onView,
  onEdit,
  onDelete,
}: {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <TableRowActions>
      <TableActionButton title="Ver" aria-label="Ver registro" onClick={onView}>
        <Eye className="size-4" />
      </TableActionButton>
      <TableActionButton
        actionVariant="primary"
        title="Editar"
        aria-label="Editar registro"
        onClick={onEdit}
      >
        <Edit className="size-4" />
      </TableActionButton>
      <TableActionButton
        actionVariant="destructive"
        title="Eliminar"
        aria-label="Eliminar registro"
        onClick={onDelete}
      >
        <Trash2 className="size-4" />
      </TableActionButton>
    </TableRowActions>
  );
}

export default function ReportesInventarioPage() {
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState("");
  const [stats, setStats] = useState<InventarioStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const [filterType, setFilterType] = useState<FilterType>("bienes");
  const [bienesReporteType, setBienesReporteType] = useState<BienesReporteType>("listado");
  const [records, setRecords] = useState<any[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [reporteData, setReporteData] = useState<any>(null);
  const [loadingReporte, setLoadingReporte] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeFilter, setActiveFilter] = useState<"todos" | "activos" | "inactivos">("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit">("view");
  const [modalRecord, setModalRecord] = useState<any | null>(null);
  const [areas, setAreas] = useState<any[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<number | undefined>();

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetch("/api/dashboard/estadisticas");
        if (!res.ok) throw new Error("No se pudieron cargar las estadísticas");
        const data = await res.json();
        setStats({
          totalBienes: data.totales.totalBienes,
          totalBienesActivos: data.totales.totalBienesActivos,
          totalBienesInactivos: data.totales.totalBienesInactivos,
          totalComponentes: data.totales.totalComponentes,
          totalSoftware: data.totales.totalSoftware,
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingStats(false);
      }
    };

    const loadAreas = async () => {
      try {
        const res = await fetch("/api/areas");
        if (!res.ok) throw new Error("Error al cargar áreas");
        const data = await res.json();
        setAreas(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
      }
    };

    loadStats();
    loadAreas();
  }, []);

  useEffect(() => {
    loadRecords();
  }, [filterType]);

<<<<<<< HEAD
  // Cargar reportes de bienes cuando cambia el tipo (excepto para "areas")
  useEffect(() => {
    if (filterType === "bienes" && bienesReporteType !== "listado" && bienesReporteType !== "areas") {
      loadBienesReporte();
    }
  }, [filterType, bienesReporteType]);

  // Cargar bienes cuando se selecciona "Por Área"
  useEffect(() => {
    if (filterType === "bienes" && bienesReporteType === "areas") {
      loadRecords();
    }
  }, [filterType, bienesReporteType]);

  async function loadBienesReporte() {
    setLoadingReporte(true);
    try {
      const accionMap: Record<BienesReporteType, string> = {
        listado: "",
        general: "G",
        areas: "A",
        categorias: "C",
        estados: "E",
      };

      const accion = accionMap[bienesReporteType];
      if (!accion) {
        setReporteData(null);
        return;
      }

      const res = await fetch(`/api/reportes/bienes?accion=${accion}`);
      if (!res.ok) throw new Error("Error al cargar el reporte");
      const data = await res.json();
      setReporteData(data);
    } catch (error) {
      console.error(error);
      setReporteData(null);
      setMessage("Error al cargar el reporte de bienes");
    } finally {
      setLoadingReporte(false);
    }
  }

  // Extraer función de carga para reutilizar
=======
>>>>>>> f94a8a056b7c87972de21b6fa024d9bb7624f8d5
  async function loadRecords() {
    setLoadingRecords(true);
    try {
      let url = "";
      if (filterType === "bienes") {
        url = "/api/bienes";
      } else if (filterType === "componentes") {
        url = "/api/componentes";
      } else if (filterType === "software") {
        url = "/api/software";
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Error al cargar ${filterType}`);
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setRecords([]);
    } finally {
      setLoadingRecords(false);
    }
  }

  const handleExport = async () => {
    setExporting(true);
    setMessage("");
    try {
      let exportUrl = "";
      let filenameType = "inventario";
      if (filterType === "bienes") {
        exportUrl = "/api/bienes/exportar";
        filenameType = "bienes";
      } else if (filterType === "componentes") {
        exportUrl = "/api/componentes/exportar";
        filenameType = "componentes";
      } else if (filterType === "software") {
        exportUrl = "/api/software/exportar";
        filenameType = "software";
      }

      const res = await fetch(exportUrl);
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.error || "Error al generar el archivo");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `inventario_${filenameType}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage(`Reporte de ${filenameType} generado correctamente.`);
    } catch (error: unknown) {
      console.error(error);
      setMessage(error instanceof Error ? error.message : "No se pudo generar el reporte.");
    } finally {
      setExporting(false);
    }
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm.trim()) count += 1;
    if (startDate) count += 1;
    if (endDate) count += 1;
    if (activeFilter !== "todos") count += 1;
    return count;
  }, [searchTerm, startDate, endDate, activeFilter]);

  const clearFilters = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    setActiveFilter("todos");
  };

  const filteredRecords = useMemo(() => {
    let result = records;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((record) => {
        if (filterType === "bienes") {
          return (
            (record.Descripcion?.toLowerCase() || "").includes(term) ||
            (record.CodigoInventario?.toLowerCase() || "").includes(term) ||
            (record.CodigoPatrimonial?.toLowerCase() || "").includes(term) ||
            (record.NumeroSerie?.toLowerCase() || "").includes(term)
          );
        }
        if (filterType === "componentes") {
          return (
            (record.NombreComponente?.toLowerCase() || "").includes(term) ||
            (record.BienDescripcion?.toLowerCase() || "").includes(term) ||
            (record.Serie?.toLowerCase() || "").includes(term)
          );
        }
        if (filterType === "software") {
          return (
            (record.NombreSoftware?.toLowerCase() || "").includes(term) ||
            (record.TipoSoftware?.toLowerCase() || "").includes(term) ||
            (record.VersionSoftware?.toLowerCase() || "").includes(term)
          );
        }
        return true;
      });
    }

<<<<<<< HEAD
    // Filtro por estado activo/inactivo
    if (activeFilter === "activos" || activeFilter === "inactivos") {
      result = result.filter((record) => {
        // Convert Activo value to boolean
        // Considers as active: 1, "1", true
        // Considers as inactive: 0, "0", false, null, undefined
        const activo = record?.Activo;
        const isActive = activo === 1 || activo === "1" || activo === true;
        
        return activeFilter === "activos" ? isActive : !isActive;
=======
    if (activeFilter !== "todos") {
      const isActive = activeFilter === "activos";
      result = result.filter((record) => {
        const isRecordActive = record.Activo === 1 || record.Activo === true;
        return isActive ? isRecordActive : !isRecordActive;
>>>>>>> f94a8a056b7c87972de21b6fa024d9bb7624f8d5
      });
    }

    if (startDate || endDate) {
      result = result.filter((record) => {
        const recordDate = record.FechaRegistro ? new Date(record.FechaRegistro) : null;
        if (!recordDate) return true;

        if (startDate) {
          const start = new Date(startDate);
          if (recordDate < start) return false;
        }

        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (recordDate > end) return false;
        }

        return true;
      });
    }

    return result;
  }, [records, searchTerm, filterType, activeFilter, startDate, endDate]);

<<<<<<< HEAD
  // Calcular bienes filtrados para el reporte "Por Área"
  const bienesFiltered = useMemo(() => {
    let result = records;
    
    // Filtrar por área seleccionada
    if (selectedAreaId) {
      result = result.filter((bien: any) => bien.IdArea === selectedAreaId);
    }
    
    // Filtro por estado
    if (activeFilter === "activos" || activeFilter === "inactivos") {
      result = result.filter((bien: any) => {
        const activo = bien?.Activo;
        const isActive = activo === 1 || activo === "1" || activo === true;
        return activeFilter === "activos" ? isActive : !isActive;
      });
    }
    
    return result;
  }, [records, selectedAreaId, activeFilter]);
=======
  const openModal = (record: any, mode: "view" | "edit") => {
    setModalRecord(record);
    setModalMode(mode);
    setModalOpen(true);
  };
>>>>>>> f94a8a056b7c87972de21b6fa024d9bb7624f8d5

  const renderRecordsTable = () => {
    if (loadingRecords) {
      return (
        <div className="p-8 text-center text-sm text-muted-foreground">Cargando registros...</div>
      );
    }

    if (filteredRecords.length === 0) {
      return (
        <div className="p-8 text-center text-sm text-muted-foreground">
          No hay registros para mostrar
        </div>
      );
    }

    if (filterType === "bienes") {
      return (
        <div className="overflow-auto">
          <table className="w-full border-collapse text-left text-sm text-muted-foreground">
            <thead className={TABLE_HEAD_CLASS}>
              <tr>
                <th className="px-4 py-3.5 text-left">Código Inventario</th>
                <th className="px-4 py-3.5 text-left">Descripción</th>
                <th className="px-4 py-3.5 text-left">Marca</th>
                <th className="px-4 py-3.5 text-left">Modelo</th>
                <th className="px-4 py-3.5 text-left">Fecha Registro</th>
                <th className="px-4 py-3.5 text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {filteredRecords.map((bien, idx) => (
                <tr key={idx} className={TABLE_ROW_CLASS}>
                  <td className={cn(TABLE_CELL_CLASS, "font-medium")}>
                    {bien.CodigoInventario || "-"}
                  </td>
                  <td className={TABLE_CELL_CLASS}>{bien.Descripcion || "-"}</td>
                  <td className={TABLE_CELL_CLASS}>{bien.Marca?.Marca || "-"}</td>
                  <td className={TABLE_CELL_CLASS}>{bien.Modelo?.Modelo || "-"}</td>
                  <td className={TABLE_CELL_MUTED}>
                    {bien.FechaRegistro
                      ? new Date(bien.FechaRegistro).toLocaleDateString("es-ES")
                      : "-"}
                  </td>
                  <td className={cn(TABLE_CELL_CLASS, "text-right")}>
                    <div className="flex items-center justify-end gap-2">
                      <StatusBadge active={bien.Activo} />
                      <RecordRowActions
                        onView={() => openModal(bien, "view")}
                        onEdit={() => openModal(bien, "edit")}
                        onDelete={async () => {
                          const ok = confirm("¿Eliminar este bien? Esta acción lo desactivará.");
                          if (!ok) return;
                          try {
                            const res = await fetch(
                              `/api/bienes?id=${encodeURIComponent(String(bien.IdBien))}`,
                              { method: "DELETE" }
                            );
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.error || "Error al eliminar");
                            setMessage("Bien eliminado/desactivado correctamente.");
                            await loadRecords();
                          } catch (e: unknown) {
                            notify.fromError(e, "Error al eliminar");
                          }
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (filterType === "componentes") {
      return (
        <div className="overflow-auto">
          <table className="w-full border-collapse text-left text-sm text-muted-foreground">
            <thead className={TABLE_HEAD_CLASS}>
              <tr>
                <th className="px-4 py-3.5 text-left">Bien</th>
                <th className="px-4 py-3.5 text-left">Componente</th>
                <th className="px-4 py-3.5 text-left">Marca</th>
                <th className="px-4 py-3.5 text-left">Serie</th>
                <th className="px-4 py-3.5 text-left">Fecha Registro</th>
                <th className="px-4 py-3.5 text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {filteredRecords.map((comp, idx) => (
                <tr key={idx} className={TABLE_ROW_CLASS}>
                  <td className={TABLE_CELL_CLASS}>{comp.BienDescripcion || "-"}</td>
                  <td className={TABLE_CELL_CLASS}>{comp.NombreComponente || "-"}</td>
                  <td className={TABLE_CELL_CLASS}>{comp.Marca || "-"}</td>
                  <td className={TABLE_CELL_CLASS}>{comp.Serie || "-"}</td>
                  <td className={TABLE_CELL_MUTED}>
                    {comp.FechaRegistro
                      ? new Date(comp.FechaRegistro).toLocaleDateString("es-ES")
                      : "-"}
                  </td>
                  <td className={cn(TABLE_CELL_CLASS, "text-right")}>
                    <div className="flex items-center justify-end gap-2">
                      <StatusBadge active={comp.Activo} />
                      <RecordRowActions
                        onView={() => openModal(comp, "view")}
                        onEdit={() => openModal(comp, "edit")}
                        onDelete={async () => {
                          const ok = confirm("¿Eliminar este componente del bien?");
                          if (!ok) return;
                          try {
                            const res = await fetch(
                              `/api/componentes?idBien=${encodeURIComponent(String(comp.IdBien))}&idComponente=${encodeURIComponent(String(comp.IdComponente))}`,
                              { method: "DELETE" }
                            );
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.error || "Error al eliminar");
                            setMessage("Componente eliminado correctamente.");
                            await loadRecords();
                          } catch (e: unknown) {
                            notify.fromError(e, "Error al eliminar");
                          }
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <div className="overflow-auto">
        <table className="w-full border-collapse text-left text-sm text-muted-foreground">
          <thead className={TABLE_HEAD_CLASS}>
            <tr>
              <th className="px-4 py-3.5 text-left">Nombre</th>
              <th className="px-4 py-3.5 text-left">Tipo</th>
              <th className="px-4 py-3.5 text-left">Versión</th>
              <th className="px-4 py-3.5 text-left">Licencias</th>
              <th className="px-4 py-3.5 text-left">Fecha Registro</th>
              <th className="px-4 py-3.5 text-right">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {filteredRecords.map((soft, idx) => (
              <tr key={idx} className={TABLE_ROW_CLASS}>
                <td className={TABLE_CELL_CLASS}>{soft.NombreSoftware || "-"}</td>
                <td className={TABLE_CELL_CLASS}>{soft.TipoSoftware || "-"}</td>
                <td className={TABLE_CELL_CLASS}>{soft.VersionSoftware || "-"}</td>
                <td className={TABLE_CELL_CLASS}>{soft.CantidadLicencias || "-"}</td>
                <td className={TABLE_CELL_MUTED}>
                  {soft.FechaRegistro
                    ? new Date(soft.FechaRegistro).toLocaleDateString("es-ES")
                    : "-"}
                </td>
                <td className={cn(TABLE_CELL_CLASS, "text-right")}>
                  <div className="flex items-center justify-end gap-2">
                    <StatusBadge active={soft.Activo} />
                    <RecordRowActions
                      onView={() => openModal(soft, "view")}
                      onEdit={() => openModal(soft, "edit")}
                      onDelete={async () => {
                        const ok = confirm("¿Eliminar este software? Será desactivado.");
                        if (!ok) return;
                        try {
                          const res = await fetch(
                            `/api/software?id=${encodeURIComponent(String(soft.IdSoftware))}`,
                            { method: "DELETE" }
                          );
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || "Error al eliminar");
                          setMessage("Software desactivado correctamente.");
                          await loadRecords();
                        } catch (e: unknown) {
                          notify.fromError(e, "Error al eliminar");
                        }
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

<<<<<<< HEAD
  const renderBienesReporte = () => {
    if (bienesReporteType === "listado") {
      return renderRecordsTable();
    }

    // Para "areas", no necesitamos reporteData, usamos records directamente
    if (bienesReporteType === "areas") {
      if (loadingRecords) {
        return <div className="p-8 text-center text-slate-500">Cargando bienes...</div>;
      }

      return (
        <div className="space-y-4">
          <div className="flex flex-col gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-sm font-semibold text-slate-700 block mb-2">Filtrar por Área</label>
                <Select
                  value={selectedAreaId?.toString() || ""}
                  onValueChange={(value) => setSelectedAreaId(value ? parseInt(value) : undefined)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todas las áreas..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas las áreas</SelectItem>
                    {areas.map((area: any) => (
                      <SelectItem key={area.IdArea} value={area.IdArea.toString()}>
                        {area.NombreArea}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-xs text-slate-600">
                Total: <strong>{bienesFiltered.length}</strong>
              </div>
            </div>
          </div>

          <div className="overflow-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-slate-900 to-slate-700 text-white text-xs">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Código Inventario</th>
                  <th className="px-4 py-3 text-left font-semibold">Descripción</th>
                  <th className="px-4 py-3 text-left font-semibold">Área</th>
                  <th className="px-4 py-3 text-left font-semibold">Marca</th>
                  <th className="px-4 py-3 text-left font-semibold">Modelo</th>
                  <th className="px-4 py-3 text-left font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {bienesFiltered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-3 text-center text-slate-500">
                      No hay bienes para mostrar
                    </td>
                  </tr>
                ) : (
                  bienesFiltered.map((bien: any, idx: number) => (
                    <tr key={idx} className="border-t transition-colors text-xs hover:bg-slate-50 odd:bg-white even:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-700">{bien.CodigoInventario || "-"}</td>
                      <td className="px-4 py-3">{bien.Descripcion || "-"}</td>
                      <td className="px-4 py-3">{bien.Area?.NombreArea || "-"}</td>
                      <td className="px-4 py-3">{bien.Marca?.Marca || "-"}</td>
                      <td className="px-4 py-3">{bien.Modelo?.Modelo || "-"}</td>
                      <td className="px-4 py-3">
                        <StatusBadge active={bien.Activo} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (loadingReporte) {
      return <div className="p-8 text-center text-slate-500">Cargando reporte...</div>;
    }

    if (!reporteData || !reporteData.datos || reporteData.datos.length === 0) {
      return <div className="p-8 text-center text-slate-500">No hay datos para mostrar</div>;
    }

    const datos = reporteData.datos;

    // Resumen General
    if (bienesReporteType === "general") {
      return (
        <div className="grid gap-4 md:grid-cols-3">
          {datos.map((item: any, idx: number) => (
            <Card key={idx} className="border-slate-200 shadow-sm">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">Total Bienes</span>
                    <span className="text-2xl font-bold text-blue-600">{item.TotalBienes}</span>
                  </div>
                  <div className="h-px bg-slate-200"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Activos</span>
                    <span className="font-semibold text-emerald-600">{item.BienesActivos}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Inactivos</span>
                    <span className="font-semibold text-red-600">{item.BienesInactivos}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    // Reporte por Categorías, Estados
    if (["categorias", "estados"].includes(bienesReporteType)) {
      const columnMap: Record<string, { name: string; cantidad: string }> = {
        categorias: { name: "CategoriaBien", cantidad: "CantidadBienes" },
        estados: { name: "EstadoBien", cantidad: "CantidadBienes" },
      };

      const config = columnMap[bienesReporteType as keyof typeof columnMap];
      const nameKey = config.name;
      const cantKey = config.cantidad;

      return (
        <div className="overflow-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-slate-900 to-slate-700 text-white text-xs">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">
                  {bienesReporteType === "categorias"
                    ? "Categoría"
                    : "Estado"}
                </th>
                <th className="px-4 py-3 text-right font-semibold">Cantidad de Bienes</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((item: any, idx: number) => (
                <tr key={idx} className="border-t transition-colors text-xs hover:bg-slate-50 odd:bg-white even:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-700">{item[nameKey] || "-"}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      {item[cantKey]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return <div className="p-8 text-center text-slate-500">Reporte no disponible</div>;
  };
=======
  const searchPlaceholder =
    filterType === "bienes"
      ? "Descripción, código..."
      : filterType === "componentes"
        ? "Componente, bien..."
        : "Nombre, tipo...";
>>>>>>> f94a8a056b7c87972de21b6fa024d9bb7624f8d5

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registro de inventario"
        description="Consulta, filtra y exporta registros de inventario. Usa las pestañas para cambiar de sección."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Bienes"
          value={loadingStats ? "..." : (stats?.totalBienes ?? 0)}
          icon={Boxes}
          accent="primary"
        />
        <StatCard
          title="Componentes"
          value={loadingStats ? "..." : (stats?.totalComponentes ?? 0)}
          icon={Cpu}
          accent="success"
        />
        <StatCard
          title="Software"
          value={loadingStats ? "..." : (stats?.totalSoftware ?? 0)}
          icon={AppWindow}
          accent="muted"
        />
      </div>

      <Card className="border-border shadow-[var(--shadow-soft)]">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Registros</CardTitle>
          <CardDescription>Consulta y filtra los registros de inventario.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(["bienes", "componentes", "software"] as FilterType[]).map((type) => (
              <Button
                key={type}
                variant={filterType === type ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setFilterType(type);
<<<<<<< HEAD
                  setSearchTerm("");
                  setStartDate("");
                  setEndDate("");
                  setBienesReporteType("listado");
=======
                  clearFilters();
>>>>>>> f94a8a056b7c87972de21b6fa024d9bb7624f8d5
                }}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>

<<<<<<< HEAD
          {filterType === "bienes" && (
            <div className="flex gap-2 flex-wrap p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-2 px-2 py-1">
                <BarChart3 className="w-4 h-4" />
                Reportes:
              </span>
              {(["listado", "general", "areas", "categorias", "estados"] as BienesReporteType[]).map((tipo) => (
                <Button
                  key={tipo}
                  variant={bienesReporteType === tipo ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBienesReporteType(tipo)}
                  className={bienesReporteType === tipo ? "bg-blue-600 hover:bg-blue-700 text-white text-xs" : "text-xs hover:border-blue-400 hover:text-blue-600"}
                >
                  {tipo === "listado"
                    ? "Listado"
                    : tipo === "general"
                    ? "General"
                    : tipo === "areas"
                    ? "Por Área"
                    : tipo === "categorias"
                    ? "Por Categoría"
                    : "Por Estado"}
                </Button>
              ))}
            </div>
          )}

          {!(filterType === "bienes" && bienesReporteType !== "listado" && bienesReporteType !== "areas") && (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  className="pl-10 pr-10 rounded-lg shadow-sm border"
                  placeholder={
                    filterType === "bienes"
                      ? "Descripción, código..."
                      : filterType === "componentes"
                      ? "Componente, bien..."
                      : "Nombre, tipo..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-2 top-2 text-slate-500">✕</button>}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">Desde</label>
=======
          <FilterBar
            activeCount={activeFilterCount}
            onClear={clearFilters}
            actions={
              <Button onClick={handleExport} disabled={exporting} className="gap-2">
                <Download className="size-4" aria-hidden="true" />
                {exporting
                  ? "Generando..."
                  : `Descargar ${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`}
              </Button>
            }
          >
            <FilterField label="Buscar" htmlFor="inventario-search">
              <IconInput
                id="inventario-search"
                icon={Search}
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </FilterField>
            <FilterField label="Desde" htmlFor="inventario-start">
>>>>>>> f94a8a056b7c87972de21b6fa024d9bb7624f8d5
              <Input
                id="inventario-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </FilterField>
            <FilterField label="Hasta" htmlFor="inventario-end">
              <Input
                id="inventario-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </FilterField>
            <FilterField label="Estado" htmlFor="inventario-estado">
              <select
                id="inventario-estado"
                value={activeFilter}
                onChange={(e) =>
                  setActiveFilter(e.target.value as "todos" | "activos" | "inactivos")
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <option value="todos">Todos</option>
                <option value="activos">Activos</option>
                <option value="inactivos">Inactivos</option>
              </select>
<<<<<<< HEAD
            </div>
          </div>
          )}
=======
            </FilterField>
          </FilterBar>
>>>>>>> f94a8a056b7c87972de21b6fa024d9bb7624f8d5

          <div className="surface-panel overflow-hidden">{renderRecordsTable()}</div>

<<<<<<< HEAD
          <div className="border rounded-lg overflow-hidden">
            {filterType === "bienes" ? renderBienesReporte() : renderRecordsTable()}
          </div>
          
          <div className="text-xs text-slate-500">
            {filterType === "bienes" && bienesReporteType !== "listado"
              ? `Reporte: ${reporteData?.descripcion || "Cargando..."}`
              : `Mostrando ${filteredRecords.length} de ${records.length} registros`}
          </div>
=======
          <p className="text-xs text-muted-foreground">
            Mostrando {filteredRecords.length} de {records.length} registros
          </p>
>>>>>>> f94a8a056b7c87972de21b6fa024d9bb7624f8d5
        </CardContent>
      </Card>

      {message ? (
        <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-muted-foreground" aria-hidden="true" />
            <span>{message}</span>
          </div>
        </div>
      ) : null}

      {modalOpen && filterType === "bienes" ? (
        <BienFormModal
          bien={modalRecord}
          open={modalOpen}
          onOpenChange={(open: boolean) => setModalOpen(open)}
          readOnly={modalMode === "view"}
        />
      ) : null}
      {modalOpen && filterType === "componentes" ? (
        <ComponenteFormModal
          componente={modalRecord}
          open={modalOpen}
          onOpenChange={(open: boolean) => setModalOpen(open)}
          readOnly={modalMode === "view"}
        />
      ) : null}
      {modalOpen && filterType === "software" ? (
        <SoftwareFormModal
          software={modalRecord}
          open={modalOpen}
          onOpenChange={(open: boolean) => setModalOpen(open)}
          readOnly={modalMode === "view"}
        />
      ) : null}
    </div>
  );
}
