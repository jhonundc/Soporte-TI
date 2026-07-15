"use client";

import { useEffect, useMemo, useState } from "react";
import { AppWindow, Boxes, Cpu, Download, Edit, Eye, Search, Sparkles, Trash2 } from "lucide-react";
import { useSession } from "@/lib/hooks/useSession";
import { StatCard } from "@/components/data-display/StatCard";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { TableActionButton, TableRowActions } from "@/components/data-display/TableRowActions";
import { FilterBar, FilterField } from "@/components/forms/FilterBar";
import { IconInput } from "@/components/forms/IconInput";
import { SearchableSelect } from "@/components/forms/SearchableSelect";
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
import { exportStyledReportExcel } from "@/lib/export/styled-report-excel";

type InventarioStats = {
  totalBienes: number;
  totalBienesActivos: number;
  totalBienesInactivos: number;
  totalComponentes: number;
  totalSoftware: number;
};

type FilterType = "bienes" | "componentes" | "software";

const TABLE_HEAD_CLASS =
  "border-b border-border bg-muted/50 text-xs font-semibold tracking-wide text-foreground uppercase";
const TABLE_ROW_CLASS = "border-t border-border transition-colors duration-150 hover:bg-muted/40";
const TABLE_CELL_CLASS = "whitespace-nowrap px-4 py-3.5 text-foreground";
const TABLE_CELL_MUTED = "whitespace-nowrap px-4 py-3.5 text-muted-foreground";

function RecordRowActions({
  onView,
  onEdit,
  onDelete,
  showEdit = true,
  showDelete = true,
}: {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  showEdit?: boolean;
  showDelete?: boolean;
}) {
  return (
    <TableRowActions>
      <TableActionButton title="Ver" aria-label="Ver registro" onClick={onView}>
        <Eye className="size-4" />
      </TableActionButton>
      {showEdit ? (
        <TableActionButton
          actionVariant="primary"
          title="Editar"
          aria-label="Editar registro"
          onClick={onEdit}
        >
          <Edit className="size-4" />
        </TableActionButton>
      ) : null}
      {showDelete ? (
        <TableActionButton
          actionVariant="destructive"
          title="Eliminar"
          aria-label="Eliminar registro"
          onClick={onDelete}
        >
          <Trash2 className="size-4" />
        </TableActionButton>
      ) : null}
    </TableRowActions>
  );
}

export default function ReportesInventarioPage() {
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState("");
  const [stats, setStats] = useState<InventarioStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const { data: sessionData } = useSession();
  const role = String(sessionData?.user?.role || "").toLowerCase();
  const isSupport = role.includes("soporte") || role.includes("support");

  const [filterType, setFilterType] = useState<FilterType>("bienes");
  const [records, setRecords] = useState<any[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [areaSearch, setAreaSearch] = useState("");
  const [selectedAreaId, setSelectedAreaId] = useState("");
  const [areas, setAreas] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<"todos" | "activos" | "inactivos">("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit">("view");
  const [modalRecord, setModalRecord] = useState<any | null>(null);

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

    loadStats();
  }, []);

  useEffect(() => {
    loadRecords();
  }, [filterType, startDate, endDate, selectedAreaId, activeFilter]);

  useEffect(() => {
    if (filterType !== "bienes" && filterType !== "componentes") return;

    const loadAreas = async () => {
      try {
        const res = await fetch("/api/areas");
        if (!res.ok) throw new Error("No se pudieron cargar las áreas");
        const data = await res.json();
        setAreas(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        setAreas([]);
      }
    };

    loadAreas();
  }, [filterType]);

  useEffect(() => {
    if (!areaSearch) {
      setSelectedAreaId("");
      return;
    }

    const exactMatch = areas.find(
      (area) =>
        area.NombreArea &&
        normalizeText(area.NombreArea) === normalizeText(areaSearch)
    );
    setSelectedAreaId(exactMatch ? String(exactMatch.IdArea) : "");
  }, [areaSearch, areas]);

  async function loadRecords() {
    setLoadingRecords(true);
    try {
      if (filterType === "bienes") {
        const areaQuery = selectedAreaId ? `&idArea=${encodeURIComponent(selectedAreaId)}` : "";

        if (startDate && endDate) {
          const params = new URLSearchParams({
            accion: "R",
            fechaInicio: startDate,
            fechaFin: endDate,
          });
          if (selectedAreaId) params.set("idArea", selectedAreaId);
          const res = await fetch(`/api/reportes/bienes?${params.toString()}`);
          if (!res.ok) {
            const error = await res.json().catch(() => null);
            throw new Error(error?.error || "Error al cargar bienes por rango");
          }
          const data = await res.json();
          setRecords(Array.isArray(data?.datos) ? data.datos : []);
          return;
        }

        const [activosRes, inactivosRes] = await Promise.all([
          fetch(`/api/reportes/bienes?accion=D${areaQuery}`),
          fetch(`/api/reportes/bienes?accion=B${areaQuery}`),
        ]);

        if (!activosRes.ok || !inactivosRes.ok) {
          const activosError = activosRes.ok ? null : await activosRes.json().catch(() => null);
          const inactivosError = inactivosRes.ok ? null : await inactivosRes.json().catch(() => null);
          throw new Error(
            activosError?.error ||
              inactivosError?.error ||
              "Error al cargar el reporte de bienes"
          );
        }

        const [activosData, inactivosData] = await Promise.all([
          activosRes.json(),
          inactivosRes.json(),
        ]);

        const merged = [
          ...(Array.isArray(activosData?.datos) ? activosData.datos : []),
          ...(Array.isArray(inactivosData?.datos) ? inactivosData.datos : []),
        ].sort((left, right) => {
          const leftTime = left?.FechaRegistro ? new Date(left.FechaRegistro).getTime() : 0;
          const rightTime = right?.FechaRegistro ? new Date(right.FechaRegistro).getTime() : 0;
          return rightTime - leftTime;
        });

        setRecords(merged);
        return;
      }

      if (filterType === "software") {
        const url =
          activeFilter === "activos"
            ? "/api/software"
            : activeFilter === "inactivos"
            ? "/api/software?inactivos=1"
            : "/api/software?all=1";
        const res = await fetch(url);
        if (!res.ok) throw new Error("Error al cargar software");
        const data = await res.json();
        setRecords(Array.isArray(data) ? data : []);
        return;
      }

      if (filterType === "componentes") {
        const url = selectedAreaId
          ? `/api/componentes?accion=A&idArea=${encodeURIComponent(selectedAreaId)}`
          : activeFilter === "activos"
          ? "/api/componentes?accion=L"
          : activeFilter === "inactivos"
          ? "/api/componentes?accion=D"
          : "/api/componentes?accion=T";

        const res = await fetch(url);
        if (!res.ok) throw new Error("Error al cargar componentes");
        const data = await res.json();
        let records = Array.isArray(data) ? data : [];

if (selectedAreaId) {
      records = records.filter((record) => {
        const areaId = String(
          record?.IdArea ?? record?.Area?.IdArea ?? record?.Bien?.IdArea ?? record?.Bien?.Area?.IdArea ?? ""
        );
        return areaId === selectedAreaId;
          });
        }

        if (activeFilter !== "todos") {
          const isActive = activeFilter === "activos";
          records = records.filter((record) => {
            const rawActivo = record.Activo;
            const isRecordActive =
              rawActivo === true ||
              rawActivo === 1 ||
              rawActivo === "1" ||
              String(rawActivo).toLowerCase() === "true";
            return isActive ? isRecordActive : !isRecordActive;
          });
        }

        setRecords(records);
        return;
      }

      const url = "/api/bienes";

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
      const filters = [searchTerm && `Búsqueda: ${searchTerm}`, areaSearch && `Área: ${areaSearch}`, startDate && `Desde: ${startDate}`, endDate && `Hasta: ${endDate}`, activeFilter !== "todos" && `Estado: ${activeFilter}`].filter(Boolean) as string[];
      const config = filterType === "bienes" ? {
        columns: [
          { header: "Código inventario", key: "inventario", width: 20 }, { header: "Código patrimonial", key: "patrimonial", width: 21 },
          { header: "Descripción", key: "descripcion", width: 35 }, { header: "Marca", key: "marca", width: 18 },
          { header: "Modelo", key: "modelo", width: 20 }, { header: "Número de serie", key: "serie", width: 21 },
          { header: "Área", key: "area", width: 28 }, { header: "Fecha de registro", key: "fecha", width: 20 }, { header: "Estado", key: "estado", width: 13 },
        ],
        rows: filteredRecords.map((r) => ({ inventario: r.CodigoInventario || "", patrimonial: r.CodigoPatrimonial || "", descripcion: r.Descripcion || "", marca: (typeof r.Marca === "object" ? r.Marca?.Marca : r.Marca) || "", modelo: r.Modelo || "", serie: r.NumeroSerie || "", area: r.Area?.NombreArea || r.NombreArea || "", fecha: r.FechaRegistro ? new Date(r.FechaRegistro).toLocaleDateString("es-PE") : "", estado: r.Activo ? "Activo" : "Inactivo" })),
      } : filterType === "componentes" ? {
        columns: [
          { header: "Bien", key: "bien", width: 32 }, { header: "Código patrimonial", key: "patrimonial", width: 21 },
          { header: "Área", key: "area", width: 28 }, { header: "Componente", key: "componente", width: 26 },
          { header: "Marca", key: "marca", width: 18 }, { header: "Serie", key: "serie", width: 22 },
          { header: "Fecha de registro", key: "fecha", width: 20 }, { header: "Estado", key: "estado", width: 13 },
        ],
        rows: filteredRecords.map((r) => ({ bien: r.BienDescripcion || r.Bien?.Descripcion || "", patrimonial: r.CodigoPatrimonial || r.Bien?.CodigoPatrimonial || "", area: r.UbicacionFisica || r.Area?.NombreArea || r.Bien?.Area?.NombreArea || r.NombreArea || "", componente: r.NombreComponente || "", marca: (typeof r.Marca === "object" ? r.Marca?.Marca : r.Marca) || "", serie: r.Serie || "", fecha: r.FechaRegistro ? new Date(r.FechaRegistro).toLocaleDateString("es-PE") : "", estado: r.Activo ? "Activo" : "Inactivo" })),
      } : {
        columns: [
          { header: "Software", key: "software", width: 32 }, { header: "Tipo", key: "tipo", width: 23 },
          { header: "Versión", key: "version", width: 18 }, { header: "Licencias", key: "licencias", width: 14 },
          { header: "Fecha de registro", key: "fecha", width: 20 }, { header: "Estado", key: "estado", width: 13 },
        ],
        rows: filteredRecords.map((r) => ({ software: r.NombreSoftware || "", tipo: r.TipoSoftware || "", version: r.VersionSoftware || "", licencias: r.CantidadLicencias || "", fecha: r.FechaRegistro ? new Date(r.FechaRegistro).toLocaleDateString("es-PE") : "", estado: r.Activo ? "Activo" : "Inactivo" })),
      };
      await exportStyledReportExcel({ title: `Registro de inventario - ${filterType}`, sheetName: filterType, filename: `inventario_${filterType}_${new Date().toISOString().slice(0, 10)}.xlsx`, filters, columns: config.columns, rows: config.rows });
      setMessage(`Reporte de ${filterType} generado correctamente.`);
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
    if (areaSearch.trim()) count += 1;
    if (activeFilter !== "todos") count += 1;
    return count;
  }, [searchTerm, startDate, endDate, areaSearch, activeFilter]);

  const clearFilters = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    setAreaSearch("");
    setSelectedAreaId("");
    setActiveFilter("todos");
  };

  const normalizeText = (value: string | null | undefined) =>
    String(value || "")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

  const filteredRecords = useMemo(() => {
    let result = records;

    if (searchTerm.trim()) {
      const term = normalizeText(searchTerm);
      result = result.filter((record) => {
        if (filterType === "bienes") {
          return (
            normalizeText(record.Descripcion).includes(term) ||
            normalizeText(record.CodigoInventario).includes(term) ||
            normalizeText(record.CodigoPatrimonial).includes(term) ||
            normalizeText(record.NumeroSerie).includes(term) ||
            normalizeText(record.Area?.NombreArea || record.NombreArea).includes(term)
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

    if (activeFilter !== "todos") {
      const isActive = activeFilter === "activos";
      result = result.filter((record) => {
        const rawActivo = record.Activo;
        const isRecordActive =
          rawActivo === true ||
          rawActivo === 1 ||
          rawActivo === "1" ||
          String(rawActivo).toLowerCase() === "true";
        return isActive ? isRecordActive : !isRecordActive;
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

  const openModal = (record: any, mode: "view" | "edit") => {
    setModalRecord(record);
    setModalMode(mode);
    setModalOpen(true);
  };

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
                <th className="px-4 py-3.5 text-left">Área</th>
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
                  <td className={TABLE_CELL_CLASS}>
                    {(typeof bien.Marca === "object" ? bien.Marca?.Marca : bien.Marca) || "-"}
                  </td>
                  <td className={TABLE_CELL_CLASS}>{bien.Modelo || "-"}</td>
                  <td className={TABLE_CELL_CLASS}>{bien.Area?.NombreArea || bien.NombreArea || "-"}</td>
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
                        showEdit={!isSupport}
                        showDelete={!isSupport}
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
                <th className="px-4 py-3.5 text-left">Área</th>
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
                  <td className={TABLE_CELL_CLASS}>
                    <div className="space-y-1">
                      <div>
                        {comp.BienDescripcion || comp.Bien?.Descripcion || comp.CodigoPatrimonial || comp.CodigoInventario || "-"}
                      </div>
                      {comp.CodigoPatrimonial && (comp.BienDescripcion || comp.Bien?.Descripcion) ? (
                        <div className="text-xs text-muted-foreground">{comp.CodigoPatrimonial}</div>
                      ) : null}
                    </div>
                  </td>
                  <td className={TABLE_CELL_CLASS}>
                    {comp.UbicacionFisica || comp.Area?.NombreArea || comp.Bien?.Area?.NombreArea || comp.NombreArea || "-"}
                  </td>
                  <td className={TABLE_CELL_CLASS}>{comp.NombreComponente || "-"}</td>
                  <td className={TABLE_CELL_CLASS}>
                    {typeof comp.Marca === "object"
                      ? comp.Marca?.Marca || "-"
                      : comp.Marca || "-"}
                  </td>
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
                        showEdit={!isSupport}
                        showDelete={!isSupport}
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
                      showEdit={!isSupport}
                      showDelete={!isSupport}
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

  const searchPlaceholder =
    filterType === "bienes"
      ? "Descripción, código..."
      : filterType === "componentes"
        ? "Componente, bien..."
        : "Nombre, tipo...";

  return (
    <div className="space-y-8">
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

      <Card className="gap-0 rounded-2xl border border-border py-0 shadow-[var(--shadow-soft)]">
        <CardHeader className="border-b border-primary/10 bg-gradient-to-r from-primary/10 via-primary/5 to-card px-6 py-5">
          <CardTitle className="text-xl font-semibold tracking-tight text-foreground">Registros</CardTitle>
          <CardDescription>Consulta y filtra los registros de inventario.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-wrap gap-2">
            {(["bienes", "componentes", "software"] as FilterType[]).map((type) => (
              <Button
                key={type}
                variant={filterType === type ? "default" : "outline"}
                size="sm"
                className="rounded-lg"
                onClick={() => {
                  setFilterType(type);
                  clearFilters();
                }}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>

          <FilterBar
            activeCount={activeFilterCount}
            onClear={clearFilters}
            actions={
              <Button onClick={handleExport} disabled={exporting} className="gap-2 rounded-xl">
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
            {(filterType === "bienes" || filterType === "componentes") && (
              <FilterField label="Área" htmlFor="inventario-area">
                <SearchableSelect
                  id="inventario-area"
                  value={areaSearch}
                  onValueChange={setAreaSearch}
                  options={areas.map((area) => ({ value: area.NombreArea, label: area.NombreArea }))}
                  placeholder="Seleccione o busque área"
                  emptyMessage="No hay áreas que coincidan"
                />
              </FilterField>
            )}
            <FilterField label="Desde" htmlFor="inventario-start">
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
              <SearchableSelect
                id="inventario-estado"
                value={activeFilter}
                onValueChange={(value) => setActiveFilter(value as "todos" | "activos" | "inactivos")}
                options={[
                  { value: "todos", label: "Todos" },
                  { value: "activos", label: "Activos" },
                  { value: "inactivos", label: "Inactivos" },
                ]}
                placeholder="Seleccione o busque estado"
              />
            </FilterField>
          </FilterBar>

          <div className="surface-panel overflow-hidden">{renderRecordsTable()}</div>

          <p className="text-xs text-muted-foreground">
            Mostrando {filteredRecords.length} de {records.length} registros
          </p>
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
