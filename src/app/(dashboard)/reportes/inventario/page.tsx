"use client";

import { useEffect, useState, useMemo } from "react";
import { Download, Sparkles, Eye, Edit, Trash2, Search, BarChart3, FileText, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BienFormModal from "@/components/inventory/BienFormModal";
import ComponenteFormModal from "@/components/inventory/ComponenteFormModal";
import SoftwareFormModal from "@/components/inventory/SoftwareFormModal";

type InventarioStats = {
  totalBienes: number;
  totalBienesActivos: number;
  totalBienesInactivos: number;
  totalComponentes: number;
  totalSoftware: number;
};

type FilterType = "bienes" | "componentes" | "software";
type BienesReporteType = "listado" | "general" | "areas" | "categorias" | "estados";

const StatusBadge = ({ active }: { active: boolean | number }) => {
  const isActive = active === 1 || active === true;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
      isActive ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
    }`}>
      {isActive ? "Activo" : "Inactivo"}
    </span>
  );
};

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
      // Determinar endpoint según el tipo de filtro actual
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
    } catch (error: any) {
      console.error(error);
      setMessage(error?.message || "No se pudo generar el reporte.");
    } finally {
      setExporting(false);
    }
  };

  const statsItems = [
    {
      label: "Bienes",
      value: stats?.totalBienes ?? 0,
      description: "Total",
      className: "border-none shadow-sm border-l-4 border-blue-600 bg-blue-50",
      labelClass: "text-slate-700",
      valueClass: "text-blue-800",
    },
    {
      label: "Componentes",
      value: stats?.totalComponentes ?? 0,
      description: "Total",
      className: "border-none shadow-sm border-l-4 border-emerald-600 bg-emerald-50",
      labelClass: "text-emerald-800",
      valueClass: "text-emerald-900",
    },
    {
      label: "Software",
      value: stats?.totalSoftware ?? 0,
      description: "Total",
      className: "border-none shadow-sm border-l-4 border-violet-600 bg-violet-50",
      labelClass: "text-violet-800",
      valueClass: "text-violet-900",
    },
  ];

  const filteredRecords = useMemo(() => {
    let result = records;

    // Filtro por búsqueda de texto
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
        } else if (filterType === "componentes") {
          return (
            (record.NombreComponente?.toLowerCase() || "").includes(term) ||
            (record.BienDescripcion?.toLowerCase() || "").includes(term) ||
            (record.Serie?.toLowerCase() || "").includes(term)
          );
        } else if (filterType === "software") {
          return (
            (record.NombreSoftware?.toLowerCase() || "").includes(term) ||
            (record.TipoSoftware?.toLowerCase() || "").includes(term) ||
            (record.VersionSoftware?.toLowerCase() || "").includes(term)
          );
        }
        return true;
      });
    }

    // Filtro por estado activo/inactivo
    if (activeFilter === "activos" || activeFilter === "inactivos") {
      result = result.filter((record) => {
        // Convert Activo value to boolean
        // Considers as active: 1, "1", true
        // Considers as inactive: 0, "0", false, null, undefined
        const activo = record?.Activo;
        const isActive = activo === 1 || activo === "1" || activo === true;
        
        return activeFilter === "activos" ? isActive : !isActive;
      });
    }

    // Filtro por fechas
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

  const renderRecordsTable = () => {
    if (loadingRecords) {
      return <div className="p-8 text-center text-slate-500">Cargando registros...</div>;
    }

    if (filteredRecords.length === 0) {
      return <div className="p-8 text-center text-slate-500">No hay registros para mostrar</div>;
    }

    if (filterType === "bienes") {
      return (
        <div className="overflow-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-slate-900 to-slate-700 text-white text-xs">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Código Inventario</th>
                <th className="px-4 py-3 text-left font-semibold">Descripción</th>
                <th className="px-4 py-3 text-left font-semibold">Marca</th>
                <th className="px-4 py-3 text-left font-semibold">Modelo</th>
                <th className="px-4 py-3 text-left font-semibold">Fecha Registro</th>
                <th className="px-4 py-3 text-left font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((bien, idx) => (
                <tr key={idx} className="border-t transition-colors text-xs hover:bg-slate-50 odd:bg-white even:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-700">{bien.CodigoInventario || "-"}</td>
                  <td className="px-4 py-3">{bien.Descripcion || "-"}</td>
                  <td className="px-4 py-3">{bien.Marca?.Marca || "-"}</td>
                  <td className="px-4 py-3">{bien.Modelo?.Modelo || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {bien.FechaRegistro ? new Date(bien.FechaRegistro).toLocaleDateString("es-ES") : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <StatusBadge active={bien.Activo} />
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-blue-600" onClick={() => { setModalRecord(bien); setModalMode("view"); setModalOpen(true); }}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-emerald-600" onClick={() => { setModalRecord(bien); setModalMode("edit"); setModalOpen(true); }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600" onClick={async () => {
                          const ok = confirm("¿Eliminar este bien? Esta acción lo desactivará.");
                          if (!ok) return;
                          try {
                            const res = await fetch(`/api/bienes?id=${encodeURIComponent(String(bien.IdBien))}`, { method: "DELETE" });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.error || "Error al eliminar");
                            setMessage("Bien eliminado/desactivado correctamente.");
                            await loadRecords();
                          } catch (e: any) {
                            alert(e.message || "Error al eliminar");
                          }
                        }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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
        <div className="overflow-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-slate-900 to-slate-700 text-white text-xs">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Bien</th>
                <th className="px-4 py-3 text-left font-semibold">Componente</th>
                <th className="px-4 py-3 text-left font-semibold">Marca</th>
                <th className="px-4 py-3 text-left font-semibold">Serie</th>
                <th className="px-4 py-3 text-left font-semibold">Fecha Registro</th>
                <th className="px-4 py-3 text-left font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((comp, idx) => (
                <tr key={idx} className="border-t transition-colors text-xs hover:bg-slate-50 odd:bg-white even:bg-slate-50">
                  <td className="px-4 py-3">{comp.BienDescripcion || "-"}</td>
                  <td className="px-4 py-3">{comp.NombreComponente || "-"}</td>
                  <td className="px-4 py-3">{comp.Marca || "-"}</td>
                  <td className="px-4 py-3">{comp.Serie || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {comp.FechaRegistro ? new Date(comp.FechaRegistro).toLocaleDateString("es-ES") : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <StatusBadge active={comp.Activo} />
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-blue-600" onClick={() => { setModalRecord(comp); setModalMode("view"); setModalOpen(true); }}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-emerald-600" onClick={() => { setModalRecord(comp); setModalMode("edit"); setModalOpen(true); }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600" onClick={async () => {
                          const ok = confirm("¿Eliminar este componente del bien?");
                          if (!ok) return;
                          try {
                            const res = await fetch(`/api/componentes?idBien=${encodeURIComponent(String(comp.IdBien))}&idComponente=${encodeURIComponent(String(comp.IdComponente))}`, { method: "DELETE" });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.error || "Error al eliminar");
                            setMessage("Componente eliminado correctamente.");
                            await loadRecords();
                          } catch (e: any) {
                            alert(e.message || "Error al eliminar");
                          }
                        }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (filterType === "software") {
      return (
        <div className="overflow-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-slate-900 to-slate-700 text-white text-xs">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Nombre</th>
                <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                <th className="px-4 py-3 text-left font-semibold">Versión</th>
                <th className="px-4 py-3 text-left font-semibold">Licencias</th>
                <th className="px-4 py-3 text-left font-semibold">Fecha Registro</th>
                <th className="px-4 py-3 text-left font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((soft, idx) => (
                <tr key={idx} className="border-t transition-colors text-xs hover:bg-slate-50 odd:bg-white even:bg-slate-50">
                  <td className="px-4 py-3">{soft.NombreSoftware || "-"}</td>
                  <td className="px-4 py-3">{soft.TipoSoftware || "-"}</td>
                  <td className="px-4 py-3">{soft.VersionSoftware || "-"}</td>
                  <td className="px-4 py-3">{soft.CantidadLicencias || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {soft.FechaRegistro ? new Date(soft.FechaRegistro).toLocaleDateString("es-ES") : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <StatusBadge active={soft.Activo} />
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-blue-600" onClick={() => { setModalRecord(soft); setModalMode("view"); setModalOpen(true); }}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-emerald-600" onClick={() => { setModalRecord(soft); setModalMode("edit"); setModalOpen(true); }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600" onClick={async () => {
                          const ok = confirm("¿Eliminar este software? Será desactivado.");
                          if (!ok) return;
                          try {
                            const res = await fetch(`/api/software?id=${encodeURIComponent(String(soft.IdSoftware))}`, { method: "DELETE" });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.error || "Error al eliminar");
                            setMessage("Software desactivado correctamente.");
                            await loadRecords();
                          } catch (e: any) {
                            alert(e.message || "Error al eliminar");
                          }
                        }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  };

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

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">Registro de inventario</h1>
            <p className="text-sm text-slate-500 mt-1">
              Descarga el reporte de inventario de bienes. Usa el menú de Reportes para cambiar entre registros de inventario y registros de fichas.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {statsItems.map((item) => (
          <div
            key={item.label}
            className={`rounded-2xl border px-4 py-3 text-sm ${item.className}`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className={`font-medium ${item.labelClass || 'text-slate-700'}`}>{item.label}</p>
              <p className={`text-lg font-semibold ${item.valueClass || ''}`}>{loadingStats ? "..." : item.value}</p>
            </div>
            <p className="mt-1 text-xs text-slate-500">{item.description}</p>
          </div>
        ))}
      </div>

      

      <Card className="border border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Registros</CardTitle>
          <CardDescription>Consulta y filtra los registros de inventario.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {(["bienes", "componentes", "software"] as FilterType[]).map((type) => (
              <Button
                key={type}
                variant={filterType === type ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setFilterType(type);
                  setSearchTerm("");
                  setStartDate("");
                  setEndDate("");
                  setBienesReporteType("listado");
                }}
                className={filterType === type ? "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-md" : "hover:border-blue-400 hover:text-blue-600"}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>

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
              <Input
                type="date"
                className="rounded-lg shadow-sm border"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">Hasta</label>
              <Input
                type="date"
                className="rounded-lg shadow-sm border"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">Estado</label>
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value as "todos" | "activos" | "inactivos")}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
              >
                <option value="todos">Todos</option>
                <option value="activos">Activos</option>
                <option value="inactivos">Inactivos</option>
              </select>
            </div>
          </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleExport}
              disabled={exporting}
              className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-lg"
            >
              <Download className="w-4 h-4" />
              {exporting ? "Generando..." : `Descargar ${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`}
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            {filterType === "bienes" ? renderBienesReporte() : renderRecordsTable()}
          </div>
          
          <div className="text-xs text-slate-500">
            {filterType === "bienes" && bienesReporteType !== "listado"
              ? `Reporte: ${reporteData?.descripcion || "Cargando..."}`
              : `Mostrando ${filteredRecords.length} de ${records.length} registros`}
          </div>
        </CardContent>
      </Card>

      {message && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-slate-500" />
            <span>{message}</span>
          </div>
        </div>
      )}

      {/* Modales para ver/editar */}
      {modalOpen && filterType === "bienes" && (
        <BienFormModal
          bien={modalRecord}
          open={modalOpen}
          onOpenChange={(open) => setModalOpen(open)}
          readOnly={modalMode === "view"}
        />
      )}
      {modalOpen && filterType === "componentes" && (
        <ComponenteFormModal
          componente={modalRecord}
          open={modalOpen}
          onOpenChange={(open) => setModalOpen(open)}
          readOnly={modalMode === "view"}
        />
      )}
      {modalOpen && filterType === "software" && (
        <SoftwareFormModal
          software={modalRecord}
          open={modalOpen}
          onOpenChange={(open) => setModalOpen(open)}
          readOnly={modalMode === "view"}
        />
      )}
    </div>
  );
}

