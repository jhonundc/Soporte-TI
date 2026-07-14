"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconInput } from "@/components/forms/IconInput";
import { FilterBar, FilterField } from "@/components/forms/FilterBar";
import { SearchableSelect } from "@/components/forms/SearchableSelect";
import { PageHeader } from "@/components/layout/PageHeader";
import { Download, Search } from "lucide-react";
import { notify } from "@/lib/feedback/toast";

const ACTION_OPTIONS = [
  { value: "L", label: "Software activos" },
  { value: "A", label: "Todos los software" },
  { value: "D", label: "Software inactivos" },
  { value: "F", label: "Licencias próximas a vencer" },
  { value: "N", label: "Buscar por nombre" },
  { value: "T", label: "Buscar por tipo" },
  { value: "V", label: "Buscar por versión" },
  { value: "P", label: "Buscar por proveedor" },
  { value: "C", label: "Buscar por tipo de licencia" },
  { value: "E", label: "Buscar por estado de licencia" },
  { value: "I", label: "Buscar por ID" },
];

const REPORT_TITLES: Record<string, string> = {
  L: "Software activos",
  A: "Todos los software",
  D: "Software inactivos",
  F: "Licencias próximas a vencer",
  N: "Buscar software por nombre",
  T: "Buscar software por tipo",
  V: "Buscar software por versión",
  P: "Buscar software por proveedor",
  C: "Buscar software por tipo de licencia",
  E: "Buscar software por estado de licencia",
  I: "Buscar software por ID",
};

export default function ReportesSoftwarePage() {
  const [accion, setAccion] = useState("G");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadReport();
  }, [accion]);

  const loadReport = async () => {
    setLoading(true);
    setMessage("");

    try {
      const params = new URLSearchParams({ accion });
      if (["I", "N", "T", "V", "P", "C", "E"].includes(accion) && searchTerm.trim()) {
        params.set("term", searchTerm.trim());
      }

      const res = await fetch(`/api/reportes/software?${params.toString()}`);
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.error || "Error al cargar el reporte de software");
      }

      const body = await res.json();
      setData(Array.isArray(body.datos) ? body.datos : []);
    } catch (error: unknown) {
      console.error(error);
      setData([]);
      setMessage(error instanceof Error ? error.message : "No se pudo cargar el reporte de software");
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.trim().toLowerCase();

    return data.filter((row) =>
      Object.values(row).some((value) =>
        String(value ?? "").toLowerCase().includes(term)
      )
    );
  }, [data, searchTerm]);

  const columns = useMemo(() => {
    if (!data.length) return [];
    return Object.keys(data[0]);
  }, [data]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm.trim()) count += 1;
    return count;
  }, [searchTerm]);

  const clearFilters = () => {
    setSearchTerm("");
  };

  const handleExport = () => {
    if (!data.length) {
      setMessage("No hay datos para exportar.");
      return;
    }

    setExporting(true);
    try {
      const headers = columns;
      const rows = filteredData.map((row) =>
        headers.map((key) => {
          const value = row[key];
          return typeof value === "object" && value !== null
            ? JSON.stringify(value)
            : String(value ?? "");
        })
      );
      const csvContent = [headers.join("\t"), ...rows.map((row) => row.join("\t"))].join("\n");
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `reporte_software_${accion}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage("Exportación generada correctamente.");
    } catch (error: unknown) {
      console.error(error);
      setMessage(error instanceof Error ? error.message : "Error al exportar el reporte.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reportes de software"
        description="Consulta reportes de estado, licencias y vencimientos de software."
      />

      <Card className="gap-0 rounded-2xl border border-border py-0 shadow-[var(--shadow-soft)]">
        <CardHeader className="border-b border-primary/10 bg-gradient-to-r from-primary/10 via-primary/5 to-card px-6 py-5">
          <CardTitle className="text-xl font-semibold tracking-tight text-foreground">{REPORT_TITLES[accion] || "Reporte de software"}</CardTitle>
          <CardDescription>
            Selecciona un tipo de reporte para ver los resultados generados por el procedimiento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <FilterBar
            activeCount={activeFilterCount}
            onClear={clearFilters}
            actions={
              <Button onClick={handleExport} disabled={exporting || !data.length} className="gap-2 rounded-xl">
                <Download className="size-4" aria-hidden="true" />
                {exporting ? "Generando..." : "Exportar"}
              </Button>
            }
          >
            <FilterField label="Reporte" htmlFor="reportes-software-accion">
              <SearchableSelect
                id="reportes-software-accion"
                value={accion}
                onValueChange={setAccion}
                options={ACTION_OPTIONS}
                placeholder="Seleccione o busque reporte"
                emptyMessage="No hay reportes que coincidan"
              />
            </FilterField>
            <FilterField label="Buscar" htmlFor="reportes-software-search">
              <IconInput
                id="reportes-software-search"
                icon={Search}
                placeholder={
                  ["N", "T", "V", "P", "C", "E", "I"].includes(accion)
                    ? "Ingresa término de búsqueda"
                    : "Buscar en resultados"
                }
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    loadReport();
                  }
                }}
              />
            </FilterField>
          </FilterBar>

          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Cargando reporte...</div>
          ) : !data.length ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No hay datos disponibles para este reporte.
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full border-collapse text-left text-sm text-muted-foreground">
                <thead className="border-b border-border bg-muted/50 text-xs font-semibold tracking-wide text-foreground uppercase">
                  <tr>
                    {columns.map((column) => (
                      <th key={column} className="px-4 py-3.5 text-left">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {filteredData.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-t border-border transition-colors duration-150 hover:bg-muted/40">
                      {columns.map((column) => {
                        const value = row[column];
                        const formatted =
                          value === null || value === undefined
                            ? "-"
                            : typeof value === "object"
                            ? JSON.stringify(value)
                            : String(value);
                        return (
                          <td key={`${rowIndex}-${column}`} className="whitespace-nowrap px-4 py-3.5 text-foreground">
                            {formatted}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {message ? (
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-foreground">
              {message}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
