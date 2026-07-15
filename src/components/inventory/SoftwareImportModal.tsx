"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Plus,
  UploadCloud,
} from "lucide-react";

type ImportRow = {
  Fila: number;
  IdSoftwareCatalogo: number | null;
  NombreSoftware: string | null;
  IdTipoSoftware: number | null;
  TipoSoftware: string | null;
  VersionSoftware: string | null;
  IdProveedor: number | null;
  ProveedorEntidad: string | null;
  IdTipoLicencia: number | null;
  TipoLicencia: string | null;
  CantidadLicencias: number | null;
  IdEstadoLicencia: number | null;
  EstadoLicencia: string | null;
  FechaCaducidad: string | null;
  IdTipoAsignacion: number | null;
  TipoAsignacion: string | null;
  UsoFinalidad: string | null;
};

type ImportResult = {
  Fila: number;
  NombreSoftware?: string;
  IdSoftwareCatalogo?: number;
  Estado: "OK" | "ERROR";
  Mensaje: string;
};

type ResultErrorFlags = {
  software: boolean;
  tipoSoftware: boolean;
  proveedor: boolean;
  tipoLicencia: boolean;
  estadoLicencia: boolean;
  tipoAsignacion: boolean;
  version: boolean;
  cantidad: boolean;
  usoFinalidad: boolean;
};

type RowResultView = {
  Fila: number;
  NombreSoftware: string;
  Estado: "OK" | "ERROR";
  Mensaje: string;
  flags: ResultErrorFlags;
};

type CatalogOption = {
  id: number;
  nombre: string;
};

type ImportCatalogs = {
  softwareCatalogo: CatalogOption[];
  tiposSoftware: CatalogOption[];
  proveedores: CatalogOption[];
  tiposLicencia: CatalogOption[];
  estadosLicencia: CatalogOption[];
  tiposAsignacion: CatalogOption[];
};

interface SoftwareImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported?: () => void;
}

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length ? text : null;
}

function toNullableInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : parseInt(String(value), 10);
  return Number.isInteger(parsed) ? parsed : null;
}

function toApiDate(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    const mm = String(parsed.m).padStart(2, "0");
    const dd = String(parsed.d).padStart(2, "0");
    return `${parsed.y}-${mm}-${dd}`;
  }

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function mapExcelRows(rows: Record<string, unknown>[]): ImportRow[] {
  return rows
    .map((rawRow, index) => {
      const entries = Object.entries(rawRow);
      const byKey = new Map(entries.map(([k, v]) => [normalizeHeader(k), v]));

      const get = (...aliases: string[]) => {
        for (const alias of aliases) {
          const value = byKey.get(normalizeHeader(alias));
          if (value !== undefined) return value;
        }
        return undefined;
      };

      return {
        Fila: toNullableInt(get("Fila")) ?? index + 2,
        IdSoftwareCatalogo: toNullableInt(get("IdSoftwareCatalogo", "ID Software Catalogo")),
        NombreSoftware: toNullableString(get("NombreSoftware", "Nombre Software", "Software")),
        IdTipoSoftware: toNullableInt(get("IdTipoSoftware", "ID Tipo Software")),
        TipoSoftware: toNullableString(get("TipoSoftware", "Tipo Software")),
        VersionSoftware: toNullableString(get("VersionSoftware", "Version Software", "Version", "Versión")),
        IdProveedor: toNullableInt(get("IdProveedor", "ID Proveedor")),
        ProveedorEntidad: toNullableString(get("ProveedorEntidad", "Proveedor Entidad", "Proveedor")),
        IdTipoLicencia: toNullableInt(get("IdTipoLicencia", "ID Tipo Licencia")),
        TipoLicencia: toNullableString(get("TipoLicencia", "Tipo Licencia")),
        CantidadLicencias: toNullableInt(get("CantidadLicencias", "Cantidad Licencias", "Cantidad")),
        IdEstadoLicencia: toNullableInt(get("IdEstadoLicencia", "ID Estado Licencia")),
        EstadoLicencia: toNullableString(get("EstadoLicencia", "Estado Licencia")),
        FechaCaducidad: toApiDate(get("FechaCaducidad", "Fecha Caducidad")),
        IdTipoAsignacion: toNullableInt(get("IdTipoAsignacion", "ID Tipo Asignacion")),
        TipoAsignacion: toNullableString(get("TipoAsignacion", "Tipo Asignacion", "Tipo de Asignacion")),
        UsoFinalidad: toNullableString(get("UsoFinalidad", "Uso Finalidad", "Uso/Finalidad")),
      };
    })
    .filter((row) => {
      return (
        row.IdSoftwareCatalogo ||
        row.NombreSoftware ||
        row.IdTipoSoftware ||
        row.TipoSoftware ||
        row.IdProveedor ||
        row.TipoLicencia ||
        row.IdTipoLicencia ||
        row.CantidadLicencias ||
        row.IdEstadoLicencia ||
        row.EstadoLicencia ||
        row.IdTipoAsignacion ||
        row.TipoAsignacion ||
        row.VersionSoftware ||
        row.ProveedorEntidad
      );
    });
}

function extractSheetObjects(firstSheet: XLSX.WorkSheet): Record<string, unknown>[] {
  const matrix = XLSX.utils.sheet_to_json<(string | number | null)[]>(firstSheet, {
    header: 1,
    defval: "",
    blankrows: false,
  });

  if (!matrix.length) return [];

  const expected = [
    "nombresoftware",
    "tiposoftware",
    "proveedorentidad",
    "tipolicencia",
    "cantidadlicencias",
    "estadolicencia",
    "tipoasignacion",
  ];

  let headerIndex = -1;
  for (let i = 0; i < matrix.length; i += 1) {
    const row = matrix[i] || [];
    const normalizedRow = row.map((cell) => normalizeHeader(cell));
    const score = expected.filter((h) => normalizedRow.includes(h)).length;
    if (score >= 2) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex < 0) {
    return XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" });
  }

  const headers = (matrix[headerIndex] || []).map((cell) => String(cell ?? "").trim());
  const rows: Record<string, unknown>[] = [];

  for (let i = headerIndex + 1; i < matrix.length; i += 1) {
    const row = matrix[i] || [];
    const isEmpty = row.every((cell) => String(cell ?? "").trim() === "");
    if (isEmpty) continue;

    const obj: Record<string, unknown> = {};
    headers.forEach((header, idx) => {
      if (!header) return;
      obj[header] = row[idx] ?? "";
    });
    rows.push(obj);
  }

  return rows;
}

export default function SoftwareImportModal({
  open,
  onOpenChange,
  onImported,
}: SoftwareImportModalProps) {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [summary, setSummary] = useState<{ Insertados: number; Errores: number } | null>(null);
  const [isBuildingTemplate, setIsBuildingTemplate] = useState(false);
  const [isFixMode, setIsFixMode] = useState(false);
  const [isCreatingCatalog, setIsCreatingCatalog] = useState(false);

  const { data: importCatalogs, refetch: refetchImportCatalogs } = useQuery({
    queryKey: ["import-catalogos-software"],
    queryFn: fetchImportCatalogs,
    enabled: open,
  });

  const createCatalogOption = async (
    type:
      | "softwareCatalogo"
      | "tipoSoftware"
      | "proveedor"
      | "tipoLicencia"
      | "estadoLicencia"
      | "tipoAsignacion",
    fila: number,
    field:
      | "NombreSoftware"
      | "TipoSoftware"
      | "ProveedorEntidad"
      | "TipoLicencia"
      | "EstadoLicencia"
      | "TipoAsignacion"
  ) => {
    const labelByType = {
      softwareCatalogo: "software del catálogo",
      tipoSoftware: "tipo de software",
      proveedor: "proveedor",
      tipoLicencia: "tipo de licencia",
      estadoLicencia: "estado de licencia",
      tipoAsignacion: "tipo de asignación",
    } as const;

    const value = window.prompt(`Escribe el nuevo ${labelByType[type]}:`)?.trim();
    if (!value) return;

    try {
      setIsCreatingCatalog(true);
      const res = await fetch("/api/software/importar/catalogos/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: type, nombre: value }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `No se pudo crear el ${labelByType[type]}`);
      }

      await refetchImportCatalogs();
      updateRowField(fila, field, value);
    } catch (error: any) {
      alert(error?.message || `Error al crear el ${labelByType[type]}`);
    } finally {
      setIsCreatingCatalog(false);
    }
  };

  const importMutation = useMutation({
    mutationFn: async (payloadRows: ImportRow[]) => {
      const res = await fetch("/api/software/importar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ software: payloadRows }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al importar el Excel");
      }

      return res.json();
    },
    onSuccess: (data) => {
      setResults(Array.isArray(data?.resultados) ? data.resultados : []);
      setSummary(data?.resumen ?? { Insertados: 0, Errores: 0 });
      if (typeof onImported === "function") onImported();
    },
    onError: (error: any) => {
      alert(error?.message || "Error al importar");
    },
  });

  const previewRows = useMemo(() => rows.slice(0, 8), [rows]);

  const resultRows = useMemo<RowResultView[]>(() => {
    if (!results.length) return [];

    const grouped = new Map<number, RowResultView>();
    for (const item of results) {
      const flags = getErrorFlags(item.Mensaje || "");
      const current = grouped.get(item.Fila);

      if (!current) {
        grouped.set(item.Fila, {
          Fila: item.Fila,
          NombreSoftware:
            item.NombreSoftware ||
            rows.find((row) => row.Fila === item.Fila)?.NombreSoftware ||
            "",
          Estado: item.Estado,
          Mensaje: item.Mensaje || "",
          flags,
        });
        continue;
      }

      if (item.Estado === "ERROR") {
        current.Estado = "ERROR";
      }

      if (item.Mensaje && !current.Mensaje.includes(item.Mensaje)) {
        current.Mensaje = current.Mensaje ? `${current.Mensaje} | ${item.Mensaje}` : item.Mensaje;
      }

      current.flags = {
        software: current.flags.software || flags.software,
        tipoSoftware: current.flags.tipoSoftware || flags.tipoSoftware,
        proveedor: current.flags.proveedor || flags.proveedor,
        tipoLicencia: current.flags.tipoLicencia || flags.tipoLicencia,
        estadoLicencia: current.flags.estadoLicencia || flags.estadoLicencia,
        tipoAsignacion: current.flags.tipoAsignacion || flags.tipoAsignacion,
        version: current.flags.version || flags.version,
        cantidad: current.flags.cantidad || flags.cantidad,
        usoFinalidad: current.flags.usoFinalidad || flags.usoFinalidad,
      };
    }

    return Array.from(grouped.values()).sort((a, b) => a.Fila - b.Fila);
  }, [results, rows]);

  const errorResultRows = useMemo<RowResultView[]>(
    () => resultRows.filter((r) => r.Estado === "ERROR"),
    [resultRows]
  );

  const hasErrorRows = useMemo(
    () => resultRows.some((r) => r.Estado === "ERROR"),
    [resultRows]
  );

  const uniqueInsertedCount = resultRows.filter((row) => row.Estado === "OK").length;
  const uniqueErrorCount = resultRows.filter((row) => row.Estado === "ERROR").length;

  const errorFilaSet = useMemo(() => {
    const set = new Set<number>();
    resultRows.forEach((r) => {
      if (r.Estado === "ERROR") set.add(r.Fila);
    });
    return set;
  }, [resultRows]);

  const sourceRowByFila = useMemo(() => {
    return new Map(rows.map((row) => [row.Fila, row]));
  }, [rows]);

  const updateRowField = (
    fila: number,
    field:
      | "NombreSoftware"
      | "TipoSoftware"
      | "ProveedorEntidad"
      | "TipoLicencia"
      | "EstadoLicencia"
      | "TipoAsignacion"
      | "VersionSoftware"
      | "CantidadLicencias"
      | "UsoFinalidad",
    value: string
  ) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.Fila !== fila) return row;

        if (field === "NombreSoftware") {
          return { ...row, NombreSoftware: value || null, IdSoftwareCatalogo: null };
        }
        if (field === "TipoSoftware") {
          return { ...row, TipoSoftware: value || null, IdTipoSoftware: null };
        }
        if (field === "ProveedorEntidad") {
          return { ...row, ProveedorEntidad: value || null, IdProveedor: null };
        }
        if (field === "TipoLicencia") {
          return { ...row, TipoLicencia: value || null, IdTipoLicencia: null };
        }
        if (field === "EstadoLicencia") {
          return { ...row, EstadoLicencia: value || null, IdEstadoLicencia: null };
        }
        if (field === "TipoAsignacion") {
          return { ...row, TipoAsignacion: value || null, IdTipoAsignacion: null };
        }
        if (field === "CantidadLicencias") {
          return { ...row, CantidadLicencias: toNullableInt(value) };
        }

        if (field === "UsoFinalidad") {
          return { ...row, UsoFinalidad: value || null };
        }

        return { ...row, VersionSoftware: value || null };
      })
    );
  };

  const handleSelectFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setResults([]);
    setSummary(null);
    setIsFixMode(false);
    setFileName(selectedFile.name);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = extractSheetObjects(firstSheet);
      const mappedRows = mapExcelRows(rawRows);
      setRows(mappedRows);

      if (!mappedRows.length) {
        alert("No se detectaron filas válidas. Verifica que el archivo tenga datos debajo del encabezado.");
      }
    } catch (error) {
      console.error("Error leyendo Excel:", error);
      alert("No se pudo leer el archivo Excel. Verifica el formato.");
      setRows([]);
    }
  };

  const handleImport = () => {
    if (!rows.length) {
      alert("Primero selecciona un archivo con filas válidas.");
      return;
    }

    const payloadRows = isFixMode
      ? rows.filter((row) => errorFilaSet.has(row.Fila))
      : rows;

    if (!payloadRows.length) {
      alert("No hay filas con error para reintentar.");
      return;
    }

    setIsFixMode(false);
    importMutation.mutate(payloadRows);
  };

  const handleDownloadTemplate = async () => {
    setIsBuildingTemplate(true);
    try {
      const ExcelJS = await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Inventario TI";
      workbook.created = new Date();

      const wsPlantilla = workbook.addWorksheet("Plantilla_Software", {
        views: [{ state: "frozen", ySplit: 3 }],
      });

      const headers = [
        "Fila",
        "NombreSoftware",
        "TipoSoftware",
        "VersionSoftware",
        "ProveedorEntidad",
        "TipoLicencia",
        "CantidadLicencias",
        "EstadoLicencia",
        "FechaCaducidad",
        "TipoAsignacion",
        "UsoFinalidad",
      ];

      wsPlantilla.columns = [
        { key: "Fila", width: 10 },
        { key: "NombreSoftware", width: 26 },
        { key: "TipoSoftware", width: 20 },
        { key: "VersionSoftware", width: 16 },
        { key: "ProveedorEntidad", width: 24 },
        { key: "TipoLicencia", width: 20 },
        { key: "CantidadLicencias", width: 18 },
        { key: "EstadoLicencia", width: 18 },
        { key: "FechaCaducidad", width: 16 },
        { key: "TipoAsignacion", width: 20 },
        { key: "UsoFinalidad", width: 30 },
      ];

      wsPlantilla.mergeCells("A1:K1");
      wsPlantilla.getCell("A1").value = "PLANTILLA DE CARGA MASIVA DE SOFTWARE";
      wsPlantilla.getCell("A1").font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
      wsPlantilla.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
      wsPlantilla.getCell("A1").fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1E3A8A" },
      };
      wsPlantilla.getRow(1).height = 28;

      wsPlantilla.mergeCells("A2:K2");
      wsPlantilla.getCell("A2").value = `Sistema Inventario TI | ${new Date().toLocaleDateString("es-PE")}`;
      wsPlantilla.getCell("A2").font = { bold: true, size: 10, color: { argb: "FF0F172A" } };
      wsPlantilla.getCell("A2").alignment = { horizontal: "center", vertical: "middle" };
      wsPlantilla.getCell("A2").fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE2E8F0" },
      };
      wsPlantilla.getRow(2).height = 20;

      wsPlantilla.addRow(headers);
      const headerRow = wsPlantilla.getRow(3);
      headerRow.height = 22;
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF0F766E" },
        };
        cell.border = {
          top: { style: "thin", color: { argb: "FFFFFFFF" } },
          left: { style: "thin", color: { argb: "FFFFFFFF" } },
          bottom: { style: "thin", color: { argb: "FFFFFFFF" } },
          right: { style: "thin", color: { argb: "FFFFFFFF" } },
        };
      });

      wsPlantilla.addRow([
        2,
        "Microsoft Office",
        "Ofimática",
        "Microsoft 365",
        "Microsoft",
        "Suscripción",
        50,
        "Vigente",
        "2027-12-31",
        "Por usuario",
        "Productividad institucional",
      ]);

      for (let r = 4; r <= 120; r += 1) {
        const row = wsPlantilla.getRow(r);
        for (let c = 1; c <= 11; c += 1) {
          const cell = row.getCell(c);
          cell.border = {
            top: { style: "thin", color: { argb: "FFD1D5DB" } },
            left: { style: "thin", color: { argb: "FFD1D5DB" } },
            bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
            right: { style: "thin", color: { argb: "FFD1D5DB" } },
          };
          if (r % 2 === 0) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF8FAFC" },
            };
          }
          cell.alignment = {
            vertical: "middle",
            horizontal: c >= 10 ? "left" : "center",
          };
        }
      }

      wsPlantilla.autoFilter = {
        from: { row: 3, column: 1 },
        to: { row: 3, column: 11 },
      };
      wsPlantilla.getColumn(9).numFmt = "yyyy-mm-dd";

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer as ArrayBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Plantilla_Importacion_Software_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } finally {
      setIsBuildingTemplate(false);
    }
  };

  const handleClose = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setFileName("");
      setRows([]);
      setResults([]);
      setSummary(null);
      setIsFixMode(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[92vh] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-xl sm:max-w-6xl">
        <DialogHeader className="border-b border-primary/10 bg-gradient-to-r from-primary/10 via-primary/5 to-card px-6 py-5">
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-foreground">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Importar Software por Excel
          </DialogTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Carga masiva de licencias con validación por fila y resumen de resultados.
          </p>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-surface p-6">
          <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-4">
            <p className="mb-2 inline-flex rounded-md bg-primary/10 px-2.5 py-1 text-sm font-semibold text-primary">Indicaciones</p>
            <div className="grid gap-2 text-sm text-foreground md:grid-cols-2">
              <p>1. Usa la plantilla para mantener formato y nombres de columnas.</p>
              <p>2. Completa Software, Tipo, Proveedor, Licencia, Estado y TipoAsignacion (o sus IDs).</p>
              <p>3. CantidadLicencias debe ser mayor a cero.</p>
              <p>4. FechaCaducidad debe ir en formato yyyy-mm-dd.</p>
            </div>
          </div>

          <div className="rounded-xl border border-primary/15 bg-card p-4 shadow-sm">
            <div className="grid items-center gap-3 lg:grid-cols-[1fr_auto_auto]">
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleSelectFile}
                className="border-primary/20 bg-card"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadTemplate}
                disabled={isBuildingTemplate}
                className="rounded-xl border-primary/20 text-primary hover:bg-primary/5"
              >
                <Download className="h-4 w-4 mr-2" />
                {isBuildingTemplate ? "Generando plantilla..." : "Descargar plantilla"}
              </Button>
              <Button
                onClick={handleImport}
                disabled={importMutation.isPending || !rows.length}
                className="rounded-xl"
              >
                <UploadCloud className="h-4 w-4 mr-2" />
                {importMutation.isPending ? "Importando..." : "Importar archivo"}
              </Button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-muted-foreground">
                Archivo: {fileName || "sin seleccionar"}
              </span>
              <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary">
                Filas detectadas: {rows.length}
              </span>
              {hasErrorRows && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFixMode((v) => !v)}
                  className={
                    isFixMode
                      ? "h-7 border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                      : "h-7 border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                  }
                >
                  {isFixMode ? "Finalizar edición" : "Arreglar errores"}
                </Button>
              )}
            </div>
            {isFixMode && hasErrorRows && (
              <p className="mt-2 text-xs text-amber-700">
                Modo edición activo: corrige los campos en rojo y luego pulsa &quot;Importar archivo&quot; nuevamente.
              </p>
            )}
          </div>

          {!!previewRows.length && !results.length && (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="border-b border-primary/10 bg-primary/[0.04] px-4 py-3">
                <p className="text-sm font-semibold text-primary">Vista previa del archivo</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm leading-tight">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="text-left px-2 py-1.5">Fila</th>
                      <th className="text-left px-2 py-1.5">Nombre</th>
                      <th className="text-left px-2 py-1.5">Tipo</th>
                      <th className="text-left px-2 py-1.5">Versión</th>
                      <th className="text-left px-2 py-1.5">Proveedor</th>
                      <th className="text-left px-2 py-1.5">Licencia</th>
                      <th className="text-left px-2 py-1.5">Asignación</th>
                      <th className="text-left px-2 py-1.5">Cantidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, idx) => (
                      <tr
                        key={`${row.Fila}-${row.NombreSoftware || row.IdSoftwareCatalogo || "sin-nombre"}-${idx}`}
                        className="border-t border-slate-100 odd:bg-white even:bg-slate-50/60"
                      >
                        <td className="px-2 py-1">{row.Fila}</td>
                        <td className="px-2 py-1">{row.NombreSoftware || row.IdSoftwareCatalogo || "-"}</td>
                        <td className="px-2 py-1">{row.TipoSoftware || row.IdTipoSoftware || "-"}</td>
                        <td className="px-2 py-1">{row.VersionSoftware || "-"}</td>
                        <td className="px-2 py-1">{row.ProveedorEntidad || row.IdProveedor || "-"}</td>
                        <td className="px-2 py-1">{row.TipoLicencia || row.IdTipoLicencia || "-"}</td>
                        <td className="px-2 py-1">{row.TipoAsignacion || row.IdTipoAsignacion || "-"}</td>
                        <td className="px-2 py-1">{row.CantidadLicencias ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {summary && (
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide">Insertados</p>
                  <p className="text-xl font-bold">{uniqueInsertedCount}</p>
                </div>
              </div>
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide">Errores</p>
                  <p className="text-xl font-bold">{uniqueErrorCount}</p>
                </div>
              </div>
            </div>
          )}

          {!!errorResultRows.length && (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="border-b border-destructive/10 bg-destructive/[0.04] px-4 py-3">
                <p className="text-sm font-semibold text-destructive">Errores a corregir</p>
              </div>
              <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
                <table className="w-full text-sm leading-tight">
                  <thead className="bg-slate-100 text-slate-700 sticky top-0">
                    <tr>
                      <th className="text-left px-2 py-1.5">Fila</th>
                      <th className="text-left px-2 py-1.5">Software</th>
                      <th className="text-left px-2 py-1.5">Tipo</th>
                      <th className="text-left px-2 py-1.5">Proveedor</th>
                      <th className="text-left px-2 py-1.5">Licencia</th>
                      <th className="text-left px-2 py-1.5">Estado</th>
                      <th className="text-left px-2 py-1.5">Asignación</th>
                      <th className="text-left px-2 py-1.5">Versión</th>
                      <th className="text-left px-2 py-1.5">Cantidad</th>
                      <th className="text-left px-2 py-1.5">Uso / finalidad</th>
                      <th className="text-left px-2 py-1.5">Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {errorResultRows.map((r) => {
                      const source = sourceRowByFila.get(r.Fila);
                      const softwareValue = source?.NombreSoftware || (source?.IdSoftwareCatalogo ? String(source.IdSoftwareCatalogo) : "");
                      const tipoSoftwareValue = source?.TipoSoftware || (source?.IdTipoSoftware ? String(source.IdTipoSoftware) : "");
                      const proveedorValue = source?.ProveedorEntidad || (source?.IdProveedor ? String(source.IdProveedor) : "");
                      const tipoLicenciaValue = source?.TipoLicencia || (source?.IdTipoLicencia ? String(source.IdTipoLicencia) : "");
                      const estadoLicenciaValue = source?.EstadoLicencia || (source?.IdEstadoLicencia ? String(source.IdEstadoLicencia) : "");
                      const tipoAsignacionValue = source?.TipoAsignacion || (source?.IdTipoAsignacion ? String(source.IdTipoAsignacion) : "");
                      const versionValue = source?.VersionSoftware || "";
                      const cantidadValue = source?.CantidadLicencias ?? null;
                      const usoFinalidadValue = source?.UsoFinalidad || "";

                      return (
                        <tr key={`error-${r.Fila}`} className="border-t border-slate-100 odd:bg-white even:bg-slate-50/60">
                          <td className="px-2 py-1">{r.Fila}</td>
                          <td className={`px-2 py-1 ${r.flags.software ? "text-red-600 font-semibold" : ""}`}>
                            {isFixMode ? (
                              <div className="flex items-center gap-1">
                                <div className="min-w-[150px] flex-1">
                                  <Select value={softwareValue || "__empty__"} onValueChange={(val) => updateRowField(r.Fila, "NombreSoftware", val === "__empty__" ? "" : (val ?? ""))}>
                                    <SelectTrigger className={r.flags.software ? "h-7 border-red-300 text-red-700" : "h-7 border-slate-300 text-slate-700"}>
                                      <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="__empty__">Seleccionar</SelectItem>
                                      {(importCatalogs?.softwareCatalogo || []).map((opt) => (
                                        <SelectItem key={`sw-${opt.id}`} value={opt.nombre}>{opt.nombre}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className={r.flags.software ? "h-7 w-7 p-0 border-red-300 text-red-700 hover:bg-red-50" : "h-7 w-7 p-0 border-slate-300 text-slate-700"}
                                  disabled={isCreatingCatalog}
                                  onClick={() => void createCatalogOption("softwareCatalogo", r.Fila, "NombreSoftware")}
                                  title="Agregar software al catálogo"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              softwareValue || "-"
                            )}
                          </td>
                          <td className={`px-2 py-1 ${r.flags.tipoSoftware ? "text-red-600 font-semibold" : ""}`}>
                            {isFixMode ? (
                              <div className="flex items-center gap-1">
                                <div className="min-w-[130px] flex-1">
                                  <Select value={tipoSoftwareValue || "__empty__"} onValueChange={(val) => updateRowField(r.Fila, "TipoSoftware", val === "__empty__" ? "" : (val ?? ""))}>
                                    <SelectTrigger className={r.flags.tipoSoftware ? "h-7 border-red-300 text-red-700" : "h-7 border-slate-300 text-slate-700"}>
                                      <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="__empty__">Seleccionar</SelectItem>
                                      {(importCatalogs?.tiposSoftware || []).map((opt) => (
                                        <SelectItem key={`ts-${opt.id}`} value={opt.nombre}>{opt.nombre}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className={r.flags.tipoSoftware ? "h-7 w-7 p-0 border-red-300 text-red-700 hover:bg-red-50" : "h-7 w-7 p-0 border-slate-300 text-slate-700"}
                                  disabled={isCreatingCatalog}
                                  onClick={() => void createCatalogOption("tipoSoftware", r.Fila, "TipoSoftware")}
                                  title="Agregar tipo de software"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              tipoSoftwareValue || "-"
                            )}
                          </td>
                          <td className={`px-2 py-1 ${r.flags.proveedor ? "text-red-600 font-semibold" : ""}`}>
                            {isFixMode ? (
                              <div className="flex items-center gap-1">
                                <div className="min-w-[130px] flex-1">
                                  <Select value={proveedorValue || "__empty__"} onValueChange={(val) => updateRowField(r.Fila, "ProveedorEntidad", val === "__empty__" ? "" : (val ?? ""))}>
                                    <SelectTrigger className={r.flags.proveedor ? "h-7 border-red-300 text-red-700" : "h-7 border-slate-300 text-slate-700"}>
                                      <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="__empty__">Seleccionar</SelectItem>
                                      {(importCatalogs?.proveedores || []).map((opt) => (
                                        <SelectItem key={`pr-${opt.id}`} value={opt.nombre}>{opt.nombre}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className={r.flags.proveedor ? "h-7 w-7 p-0 border-red-300 text-red-700 hover:bg-red-50" : "h-7 w-7 p-0 border-slate-300 text-slate-700"}
                                  disabled={isCreatingCatalog}
                                  onClick={() => void createCatalogOption("proveedor", r.Fila, "ProveedorEntidad")}
                                  title="Agregar proveedor"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              proveedorValue || "-"
                            )}
                          </td>
                          <td className={`px-2 py-1 ${r.flags.tipoLicencia ? "text-red-600 font-semibold" : ""}`}>
                            {isFixMode ? (
                              <div className="flex items-center gap-1">
                                <div className="min-w-[130px] flex-1">
                                  <Select value={tipoLicenciaValue || "__empty__"} onValueChange={(val) => updateRowField(r.Fila, "TipoLicencia", val === "__empty__" ? "" : (val ?? ""))}>
                                    <SelectTrigger className={r.flags.tipoLicencia ? "h-7 border-red-300 text-red-700" : "h-7 border-slate-300 text-slate-700"}>
                                      <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="__empty__">Seleccionar</SelectItem>
                                      {(importCatalogs?.tiposLicencia || []).map((opt) => (
                                        <SelectItem key={`tl-${opt.id}`} value={opt.nombre}>{opt.nombre}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className={r.flags.tipoLicencia ? "h-7 w-7 p-0 border-red-300 text-red-700 hover:bg-red-50" : "h-7 w-7 p-0 border-slate-300 text-slate-700"}
                                  disabled={isCreatingCatalog}
                                  onClick={() => void createCatalogOption("tipoLicencia", r.Fila, "TipoLicencia")}
                                  title="Agregar tipo de licencia"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              tipoLicenciaValue || "-"
                            )}
                          </td>
                          <td className={`px-2 py-1 ${r.flags.estadoLicencia ? "text-red-600 font-semibold" : ""}`}>
                            {isFixMode ? (
                              <div className="flex items-center gap-1">
                                <div className="min-w-[130px] flex-1">
                                  <Select value={estadoLicenciaValue || "__empty__"} onValueChange={(val) => updateRowField(r.Fila, "EstadoLicencia", val === "__empty__" ? "" : (val ?? ""))}>
                                    <SelectTrigger className={r.flags.estadoLicencia ? "h-7 border-red-300 text-red-700" : "h-7 border-slate-300 text-slate-700"}>
                                      <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="__empty__">Seleccionar</SelectItem>
                                      {(importCatalogs?.estadosLicencia || []).map((opt) => (
                                        <SelectItem key={`el-${opt.id}`} value={opt.nombre}>{opt.nombre}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className={r.flags.estadoLicencia ? "h-7 w-7 p-0 border-red-300 text-red-700 hover:bg-red-50" : "h-7 w-7 p-0 border-slate-300 text-slate-700"}
                                  disabled={isCreatingCatalog}
                                  onClick={() => void createCatalogOption("estadoLicencia", r.Fila, "EstadoLicencia")}
                                  title="Agregar estado de licencia"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              estadoLicenciaValue || "-"
                            )}
                          </td>
                          <td className={`px-2 py-1 ${r.flags.tipoAsignacion ? "text-red-600 font-semibold" : ""}`}>
                            {isFixMode ? (
                              <div className="flex items-center gap-1">
                                <div className="min-w-[130px] flex-1">
                                  <Select value={tipoAsignacionValue || "__empty__"} onValueChange={(val) => updateRowField(r.Fila, "TipoAsignacion", val === "__empty__" ? "" : (val ?? ""))}>
                                    <SelectTrigger className={r.flags.tipoAsignacion ? "h-7 border-red-300 text-red-700" : "h-7 border-slate-300 text-slate-700"}>
                                      <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="__empty__">Seleccionar</SelectItem>
                                      {(importCatalogs?.tiposAsignacion || []).map((opt) => (
                                        <SelectItem key={`ta-${opt.id}`} value={opt.nombre}>{opt.nombre}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className={r.flags.tipoAsignacion ? "h-7 w-7 p-0 border-red-300 text-red-700 hover:bg-red-50" : "h-7 w-7 p-0 border-slate-300 text-slate-700"}
                                  disabled={isCreatingCatalog}
                                  onClick={() => void createCatalogOption("tipoAsignacion", r.Fila, "TipoAsignacion")}
                                  title="Agregar tipo de asignación"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              tipoAsignacionValue || "-"
                            )}
                          </td>
                          <td className={`px-2 py-1 ${r.flags.version ? "text-red-600 font-semibold" : ""}`}>
                            {isFixMode ? (
                              <Input
                                value={versionValue}
                                onChange={(e) => updateRowField(r.Fila, "VersionSoftware", e.target.value)}
                                className={r.flags.version ? "h-7 border-red-300 text-red-700" : "h-7 border-slate-300 text-slate-700"}
                              />
                            ) : (
                              versionValue || "-"
                            )}
                          </td>
                          <td className={`px-2 py-1 ${r.flags.cantidad ? "text-red-600 font-semibold" : ""}`}>
                            {isFixMode ? (
                              <Input
                                type="number"
                                value={cantidadValue ?? ""}
                                onChange={(e) => updateRowField(r.Fila, "CantidadLicencias", e.target.value)}
                                className={r.flags.cantidad ? "h-7 border-red-300 text-red-700" : "h-7 border-slate-300 text-slate-700"}
                              />
                            ) : (
                              cantidadValue ?? "-"
                            )}
                          </td>
                          <td className={`px-2 py-1 ${r.flags.usoFinalidad ? "text-red-600 font-semibold" : ""}`}>
                            {isFixMode ? (
                              <Input
                                value={usoFinalidadValue}
                                maxLength={255}
                                onChange={(e) => updateRowField(r.Fila, "UsoFinalidad", e.target.value)}
                                className={r.flags.usoFinalidad ? "h-7 min-w-[190px] border-red-300 text-red-700" : "h-7 min-w-[190px] border-slate-300 text-slate-700"}
                              />
                            ) : (
                              usoFinalidadValue || "-"
                            )}
                          </td>
                          <td className="px-2 py-1">
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                              {r.Estado}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!!results.length && (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="border-b border-success/15 bg-success/5 px-4 py-3">
                <p className="text-sm font-semibold text-success">Resultado de importación</p>
              </div>
              <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
                <table className="w-full text-sm leading-tight">
                  <thead className="bg-slate-100 text-slate-700 sticky top-0">
                    <tr>
                      <th className="text-left px-2 py-1.5">Fila</th>
                      <th className="text-left px-2 py-1.5">Nombre software</th>
                      <th className="text-left px-2 py-1.5">Estado</th>
                      <th className="text-left px-2 py-1.5">Mensaje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultRows.map((r) => (
                      <tr
                        key={`resultado-${r.Fila}`}
                        className="border-t border-slate-100 odd:bg-white even:bg-slate-50/60"
                      >
                        <td className="px-2 py-1">{r.Fila}</td>
                        <td className={`px-2 py-1 ${r.flags.software ? "font-semibold text-red-600" : ""}`}>
                          {r.NombreSoftware || "-"}
                        </td>
                        <td className="px-2 py-1">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                              r.Estado === "OK"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {r.Estado}
                          </span>
                        </td>
                        <td className="px-2 py-1">{r.Mensaje || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getErrorFlags(message: string): ResultErrorFlags {
  const msg = normalizeText(message);
  return {
    software:
      msg.includes("software inexistente o inactivo") ||
      msg.includes("software no existe"),
    tipoSoftware: msg.includes("tipo de software inexistente o inactivo"),
    proveedor: msg.includes("proveedor inexistente o inactivo"),
    tipoLicencia: msg.includes("tipo de licencia inexistente o inactivo"),
    estadoLicencia: msg.includes("estado de licencia inexistente o inactivo"),
    tipoAsignacion: msg.includes("tipo de asignacion inexistente o inactivo"),
    version:
      msg.includes("version de software obligatoria") ||
      msg.includes("versionsoftware excede 100 caracteres"),
    cantidad: msg.includes("cantidad de licencias debe ser mayor a cero"),
    usoFinalidad: msg.includes("usofinalidad excede 255 caracteres"),
  };
}

async function fetchImportCatalogs(): Promise<ImportCatalogs> {
  const res = await fetch("/api/software/importar/catalogos");
  if (!res.ok) {
    throw new Error("No se pudieron cargar los catálogos para corrección");
  }
  const data = await res.json();
  return {
    softwareCatalogo: Array.isArray(data?.softwareCatalogo) ? data.softwareCatalogo : [],
    tiposSoftware: Array.isArray(data?.tiposSoftware) ? data.tiposSoftware : [],
    proveedores: Array.isArray(data?.proveedores) ? data.proveedores : [],
    tiposLicencia: Array.isArray(data?.tiposLicencia) ? data.tiposLicencia : [],
    estadosLicencia: Array.isArray(data?.estadosLicencia) ? data.estadosLicencia : [],
    tiposAsignacion: Array.isArray(data?.tiposAsignacion) ? data.tiposAsignacion : [],
  };
}
