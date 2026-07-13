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
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Plus, UploadCloud } from "lucide-react";

type ImportRow = {
  Fila: number;
  CodigoInventario: string | null;
  CodigoPatrimonial: string | null;
  Categoria: string | null;
  Marca: string | null;
  Area: string | null;
  IdCategoria: number | null;
  IdMarca: number | null;
  IdArea: number | null;
  NumeroSerie: string | null;
  Descripcion: string | null;
  Condicion: string | null;
  EstadoBien: string | null;
  IdCondicion: number | null;
  IdEstadoBien: number | null;
  FechaCompra: string | null;
  Modelo: string | null;
};

type ImportResult = {
  Fila: number;
  CodigoInventario: string;
  Estado: "OK" | "ERROR";
  Mensaje: string;
};

type ResultErrorFlags = {
  codigoInventario: boolean;
  categoria: boolean;
  marca: boolean;
  area: boolean;
  condicion: boolean;
  estado: boolean;
};

type RowResultView = {
  Fila: number;
  CodigoInventario: string;
  Categoria: string;
  Marca: string;
  Area: string;
  Condicion: string;
  EstadoBien: string;
  Estado: "OK" | "ERROR";
  Mensaje: string;
  flags: ResultErrorFlags;
};

type CatalogOption = {
  id: number;
  nombre: string;
};

type ImportCatalogs = {
  categorias: CatalogOption[];
  marcas: CatalogOption[];
  areas: CatalogOption[];
  condiciones: CatalogOption[];
  estados: CatalogOption[];
};

interface BienImportModalProps {
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

// Convierte fechas de Excel (serial) o texto a yyyy-mm-dd para el API.
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

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getErrorFlags(message: string): ResultErrorFlags {
  const msg = normalizeText(message);
  return {
    codigoInventario: msg.includes("inventario"),
    categoria: msg.includes("categoria"),
    marca: msg.includes("marca"),
    area: msg.includes("area"),
    condicion: msg.includes("condicion"),
    estado: msg.includes("estado"),
  };
}

async function fetchImportCatalogs(): Promise<ImportCatalogs> {
  const res = await fetch("/api/bienes/importar/catalogos");
  if (!res.ok) {
    throw new Error("No se pudieron cargar los catálogos para corrección");
  }
  const data = await res.json();
  return {
    categorias: Array.isArray(data?.categorias) ? data.categorias : [],
    marcas: Array.isArray(data?.marcas) ? data.marcas : [],
    areas: Array.isArray(data?.areas) ? data.areas : [],
    condiciones: Array.isArray(data?.condiciones) ? data.condiciones : [],
    estados: Array.isArray(data?.estados) ? data.estados : [],
  };
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
        CodigoInventario: toNullableString(get("CodigoInventario", "Codigo Inventario", "CodInventario", "ID Inventario")),
        CodigoPatrimonial: toNullableString(get("CodigoPatrimonial", "Codigo Patrimonial", "CodPatrimonial", "ID Patrimonial")),
        Categoria: toNullableString(get("Categoria", "Categoría")),
        Marca: toNullableString(get("Marca")),
        Area: toNullableString(get("Area", "Área", "NombreArea", "Nombre Área")),
        IdCategoria: toNullableInt(get("IdCategoria", "Id Categoria", "CategoriaId")),
        IdMarca: toNullableInt(get("IdMarca", "Id Marca", "MarcaId")),
        IdArea: toNullableInt(get("IdArea", "Id Area", "AreaId")),
        NumeroSerie: toNullableString(get("NumeroSerie", "Numero Serie", "N Serie")),
        Descripcion: toNullableString(get("Descripcion", "Descripción", "Bien", "Detalle")),
        Condicion: toNullableString(get("Condicion", "Condición")),
        EstadoBien: toNullableString(get("EstadoBien", "Estado", "Estado del Bien")),
        IdCondicion: toNullableInt(get("IdCondicion", "Id Condicion", "CondicionId")),
        IdEstadoBien: toNullableInt(get("IdEstadoBien", "Id Estado Bien", "EstadoBienId")),
        FechaCompra: toApiDate(get("FechaCompra", "Fecha Compra")),
        Modelo: toNullableString(get("Modelo")),
      };
    })
    .filter((row) => {
      return (
        row.CodigoInventario ||
        row.CodigoPatrimonial ||
        row.Descripcion ||
        row.Categoria ||
        row.Marca ||
        row.Area ||
        row.IdCategoria ||
        row.IdMarca ||
        row.IdArea
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
    "codigoinventario",
    "codigopatrimonial",
    "categoria",
    "marca",
    "area",
    "descripcion",
  ];

  let headerIndex = -1;
  for (let i = 0; i < matrix.length; i += 1) {
    const row = matrix[i] || [];
    const normalizedRow = row.map((cell) => normalizeHeader(cell));
    const score = expected.filter((h) => normalizedRow.includes(h)).length;
    if (score >= 3) {
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

export default function BienImportModal({ open, onOpenChange, onImported }: BienImportModalProps) {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [summary, setSummary] = useState<{ Insertados: number; Errores: number } | null>(null);
  const [isBuildingTemplate, setIsBuildingTemplate] = useState(false);
  const [isFixMode, setIsFixMode] = useState(false);
  const [isCreatingCatalog, setIsCreatingCatalog] = useState(false);

  const { data: importCatalogs, refetch: refetchImportCatalogs } = useQuery({
    queryKey: ["import-catalogos-bienes"],
    queryFn: fetchImportCatalogs,
    enabled: open,
  });

  const createCatalogOption = async (
    type: "categoria" | "marca" | "area" | "condicion",
    fila: number,
    field: "Categoria" | "Marca" | "Area" | "Condicion"
  ) => {
    const labelByType = {
      categoria: "categoría",
      marca: "marca",
      area: "área",
      condicion: "condición",
    } as const;

    const value = window.prompt(`Escribe la nueva ${labelByType[type]}:`)?.trim();
    if (!value) return;

    try {
      setIsCreatingCatalog(true);
      const res = await fetch("/api/bienes/importar/catalogos/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: type,
          nombre: value,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `No se pudo crear la ${labelByType[type]}`);
      }

      await refetchImportCatalogs();
      updateRowField(fila, field, value);
    } catch (error: any) {
      alert(error?.message || `Error al crear la ${labelByType[type]}`);
    } finally {
      setIsCreatingCatalog(false);
    }
  };

  const importMutation = useMutation({
    mutationFn: async (payloadRows: ImportRow[]) => {
      const res = await fetch("/api/bienes/importar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bienes: payloadRows }),
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
    const sourceByFila = new Map(rows.map((row) => [row.Fila, row]));

    for (const item of results) {
      const source = sourceByFila.get(item.Fila);
      const row = grouped.get(item.Fila);
      const flags = getErrorFlags(item.Mensaje || "");

      if (!row) {
        grouped.set(item.Fila, {
          Fila: item.Fila,
          CodigoInventario: item.CodigoInventario || source?.CodigoInventario || "-",
          Categoria: source?.Categoria || (source?.IdCategoria ? String(source.IdCategoria) : "-"),
          Marca: source?.Marca || (source?.IdMarca ? String(source.IdMarca) : "-"),
          Area: source?.Area || (source?.IdArea ? String(source.IdArea) : "-"),
          Condicion: source?.Condicion || (source?.IdCondicion ? String(source.IdCondicion) : "-"),
          EstadoBien: source?.EstadoBien || (source?.IdEstadoBien ? String(source.IdEstadoBien) : "-"),
          Estado: item.Estado,
          Mensaje: item.Mensaje || "",
          flags,
        });
        continue;
      }

      if (item.Estado === "ERROR") {
        row.Estado = "ERROR";
      }

      if (item.Mensaje && !row.Mensaje.includes(item.Mensaje)) {
        row.Mensaje = row.Mensaje ? `${row.Mensaje} | ${item.Mensaje}` : item.Mensaje;
      }

      row.flags = {
        codigoInventario: row.flags.codigoInventario || flags.codigoInventario,
        categoria: row.flags.categoria || flags.categoria,
        marca: row.flags.marca || flags.marca,
        area: row.flags.area || flags.area,
        condicion: row.flags.condicion || flags.condicion,
        estado: row.flags.estado || flags.estado,
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
    field: "CodigoInventario" | "Categoria" | "Marca" | "Area" | "Condicion" | "EstadoBien",
    value: string
  ) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.Fila !== fila) return row;

        if (field === "Categoria") {
          return { ...row, Categoria: value || null, IdCategoria: null };
        }
        if (field === "Marca") {
          return { ...row, Marca: value || null, IdMarca: null };
        }
        if (field === "Area") {
          return { ...row, Area: value || null, IdArea: null };
        }
        if (field === "Condicion") {
          return { ...row, Condicion: value || null, IdCondicion: null };
        }
        if (field === "EstadoBien") {
          return { ...row, EstadoBien: value || null, IdEstadoBien: null };
        }
        return { ...row, CodigoInventario: value || null };
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

      const wsPlantilla = workbook.addWorksheet("Plantilla_Bienes", {
        views: [{ state: "frozen", ySplit: 3 }],
      });

      const headers = [
        "Fila",
        "CodigoInventario",
        "CodigoPatrimonial",
        "Categoria",
        "Marca",
        "Area",
        "NumeroSerie",
        "Descripcion",
        "Condicion",
        "EstadoBien",
        "FechaCompra",
        "Modelo",
      ];

      wsPlantilla.columns = [
        { key: "Fila", width: 10 },
        { key: "CodigoInventario", width: 20 },
        { key: "CodigoPatrimonial", width: 22 },
        { key: "Categoria", width: 20 },
        { key: "Marca", width: 16 },
        { key: "Area", width: 24 },
        { key: "NumeroSerie", width: 18 },
        { key: "Descripcion", width: 42 },
        { key: "Condicion", width: 16 },
        { key: "EstadoBien", width: 18 },
        { key: "FechaCompra", width: 15 },
        { key: "Modelo", width: 20 },
      ];

      wsPlantilla.mergeCells("A1:L1");
      wsPlantilla.getCell("A1").value = "PLANTILLA DE CARGA MASIVA DE BIENES";
      wsPlantilla.getCell("A1").font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
      wsPlantilla.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
      wsPlantilla.getCell("A1").fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1E3A8A" },
      };
      wsPlantilla.getRow(1).height = 28;

      wsPlantilla.mergeCells("A2:L2");
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
        "INV-0001",
        "PAT-0001",
        "Laptop",
        "Lenovo",
        "Sistemas",
        "SN-ABC-123",
        "Laptop para soporte tecnico",
        "Operativo",
        "En uso",
        "2026-07-06",
        "ThinkPad T14",
      ]);

      for (let r = 4; r <= 120; r += 1) {
        const row = wsPlantilla.getRow(r);
        for (let c = 1; c <= 12; c += 1) {
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
            horizontal: c === 8 ? "left" : "center",
          };
        }
      }

      wsPlantilla.autoFilter = {
        from: { row: 3, column: 1 },
        to: { row: 3, column: 12 },
      };

      wsPlantilla.getColumn(11).numFmt = "yyyy-mm-dd";

      type CatalogItem = { id: number | string; nombre: string };
      const toCatalog = (items: any[], idKey: string, textKey: string): CatalogItem[] => {
        return (items || [])
          .map((it) => ({ id: it?.[idKey], nombre: String(it?.[textKey] ?? "") }))
          .filter((it) => (it.id ?? null) !== null && it.nombre.trim().length > 0);
      };

      const catalogResponse = await fetch("/api/bienes/importar/catalogos");
      const catalogData = catalogResponse.ok ? await catalogResponse.json() : {};

      const categorias = toCatalog(catalogData?.categorias || [], "id", "nombre");
      const marcas = toCatalog(catalogData?.marcas || [], "id", "nombre");
      const areas = toCatalog(catalogData?.areas || [], "id", "nombre");
      const estados = toCatalog(catalogData?.estados || [], "id", "nombre");

      const catalogRows: (string | number)[][] = [
        ["CATALOGOS DE REFERENCIA (USAR NOMBRE EXACTO)"],
        ["Tipo", "ID", "Nombre"],
      ];

      const pushCatalog = (label: string, items: CatalogItem[]) => {
        if (!items.length) {
          catalogRows.push([label, "", "Sin datos o sin permisos"]);
          return;
        }
        items.forEach((item, idx) => {
          catalogRows.push([idx === 0 ? label : "", item.id, item.nombre]);
        });
      };

      pushCatalog("Categorias", categorias);
      pushCatalog("Marcas", marcas);
      pushCatalog("Areas", areas);
      pushCatalog("EstadosDelBien", estados);

      const wsCatalogos = workbook.addWorksheet("Catalogos_Referencia", {
        views: [{ state: "frozen", ySplit: 2 }],
      });

      wsCatalogos.columns = [
        { key: "Tipo", width: 24 },
        { key: "ID", width: 10 },
        { key: "Nombre", width: 45 },
      ];

      wsCatalogos.mergeCells("A1:C1");
      wsCatalogos.getCell("A1").value = "CATALOGOS DE REFERENCIA (NOMBRES PARA CARGA)";
      wsCatalogos.getCell("A1").font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
      wsCatalogos.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
      wsCatalogos.getCell("A1").fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0F172A" },
      };
      wsCatalogos.getRow(1).height = 24;

      wsCatalogos.addRow(["Tipo", "ID", "Nombre"]);
      wsCatalogos.getRow(2).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF334155" },
        };
      });

      catalogRows.slice(2).forEach((dataRow) => {
        wsCatalogos.addRow(dataRow);
      });

      for (let r = 2; r <= wsCatalogos.rowCount; r += 1) {
        const row = wsCatalogos.getRow(r);
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFD1D5DB" } },
            left: { style: "thin", color: { argb: "FFD1D5DB" } },
            bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
            right: { style: "thin", color: { argb: "FFD1D5DB" } },
          };
          if (r > 2 && r % 2 === 0) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF8FAFC" },
            };
          }
          cell.alignment = {
            vertical: "middle",
            horizontal: Number(cell.col) === 3 ? "left" : "center",
          };
        });
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([
        buffer as ArrayBuffer,
      ], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Plantilla_Importacion_Bienes_PRO_${new Date().toISOString().slice(0, 10)}.xlsx`;
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
      <DialogContent className="sm:max-w-6xl p-0 bg-white max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700">
          <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-cyan-300" />
            Importar Bienes por Excel
          </DialogTitle>
          <p className="text-slate-300 text-sm mt-1">
            Carga masiva de inventario con validación automática y resultado por fila.
          </p>
        </DialogHeader>

        <div className="p-6 space-y-5 overflow-y-auto flex-1 min-h-0">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-sm font-semibold text-slate-800 mb-2">Indicaciones</p>
            <div className="grid md:grid-cols-2 gap-2 text-sm text-slate-700">
              <p>1. Usa la plantilla PRO para mantener formato y diseño.</p>
              <p>2. Ingresa nombres exactos en Categoria, Marca, Area, Condicion y EstadoBien.</p>
              <p>3. CodigoInventario y Descripcion son datos clave para un alta correcta.</p>
              <p>4. FechaCompra debe ir en formato yyyy-mm-dd.</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4 bg-white shadow-sm">
            <div className="grid lg:grid-cols-[1fr_auto_auto] gap-3 items-center">
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleSelectFile}
                className="border-slate-300"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadTemplate}
                disabled={isBuildingTemplate}
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <Download className="h-4 w-4 mr-2" />
                {isBuildingTemplate ? "Generando plantilla..." : "Descargar plantilla PRO"}
              </Button>
              <Button
                onClick={handleImport}
                disabled={importMutation.isPending || !rows.length}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <UploadCloud className="h-4 w-4 mr-2" />
                {importMutation.isPending ? "Importando..." : "Importar archivo"}
              </Button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-slate-700 border border-slate-200">
                Archivo: {fileName || "sin seleccionar"}
              </span>
              <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-blue-700 border border-blue-200">
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
                Modo edición activo: corrige los campos en rojo y luego pulsa "Importar archivo" nuevamente.
              </p>
            )}
          </div>

          {!!previewRows.length && !results.length && (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                <p className="text-sm font-semibold text-slate-800">Vista previa del archivo</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm leading-tight">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="text-left px-2 py-1.5">Fila</th>
                      <th className="text-left px-2 py-1.5">Cód. Inventario</th>
                      <th className="text-left px-2 py-1.5">Descripción</th>
                      <th className="text-left px-2 py-1.5">Categoría</th>
                      <th className="text-left px-2 py-1.5">Marca</th>
                      <th className="text-left px-2 py-1.5">Área</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, idx) => (
                      <tr key={`${row.Fila}-${row.CodigoInventario || "sincodigo"}-${idx}`} className="border-t border-slate-100 odd:bg-white even:bg-slate-50/60">
                        <td className="px-2 py-1">{row.Fila}</td>
                        <td className="px-2 py-1">{row.CodigoInventario || "-"}</td>
                        <td className="px-2 py-1">{row.Descripcion || "-"}</td>
                        <td className="px-2 py-1">{row.Categoria || (row.IdCategoria ?? "-")}</td>
                        <td className="px-2 py-1">{row.Marca || (row.IdMarca ?? "-")}</td>
                        <td className="px-2 py-1">{row.Area || (row.IdArea ?? "-")}</td>
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
                  <p className="text-xl font-bold">{summary.Insertados ?? 0}</p>
                </div>
              </div>
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide">Errores</p>
                  <p className="text-xl font-bold">{summary.Errores ?? 0}</p>
                </div>
              </div>
            </div>
          )}

          {!!errorResultRows.length && (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                <p className="text-sm font-semibold text-slate-800">Errores a corregir</p>
              </div>
              <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
                <table className="w-full text-sm leading-tight">
                  <thead className="bg-slate-100 text-slate-700 sticky top-0">
                    <tr>
                      <th className="text-left px-2 py-1.5">Fila</th>
                      <th className="text-left px-2 py-1.5">Cód. Inventario</th>
                      <th className="text-left px-2 py-1.5">Categoría</th>
                      <th className="text-left px-2 py-1.5">Marca</th>
                      <th className="text-left px-2 py-1.5">Área</th>
                      <th className="text-left px-2 py-1.5">Condición</th>
                      <th className="text-left px-2 py-1.5">Estado Bien</th>
                      <th className="text-left px-2 py-1.5">Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {errorResultRows.map((r) => {
                      const source = sourceRowByFila.get(r.Fila);
                      const codigoInventarioValue = source?.CodigoInventario || r.CodigoInventario || "";
                      const categoriaValue = source?.Categoria || (source?.IdCategoria ? String(source.IdCategoria) : r.Categoria || "");
                      const marcaValue = source?.Marca || (source?.IdMarca ? String(source.IdMarca) : r.Marca || "");
                      const areaValue = source?.Area || (source?.IdArea ? String(source.IdArea) : r.Area || "");
                      const condicionValue = source?.Condicion || (source?.IdCondicion ? String(source.IdCondicion) : r.Condicion || "");
                      const estadoValue = source?.EstadoBien || (source?.IdEstadoBien ? String(source.IdEstadoBien) : r.EstadoBien || "");

                      return (
                      <tr key={`${r.Fila}-${r.CodigoInventario}`} className="border-t border-slate-100 odd:bg-white even:bg-slate-50/60">
                        <td className="px-2 py-1">{r.Fila}</td>
                        <td className={`px-2 py-1 ${r.flags.codigoInventario ? "text-red-600 font-semibold" : ""}`}>
                          {isFixMode && r.flags.codigoInventario ? (
                            <Input
                              value={codigoInventarioValue}
                              onChange={(e) => updateRowField(r.Fila, "CodigoInventario", e.target.value)}
                              className="h-7 border-red-300 text-red-700"
                            />
                          ) : (
                            codigoInventarioValue || "-"
                          )}
                        </td>
                        <td className={`px-2 py-1 ${r.flags.categoria ? "text-red-600 font-semibold" : ""}`}>
                          {isFixMode ? (
                            <div className="flex items-center gap-1">
                              <div className="min-w-[130px] flex-1">
                                <Select
                                  value={categoriaValue || "__empty__"}
                                  onValueChange={(val) => updateRowField(r.Fila, "Categoria", val === "__empty__" ? "" : (val ?? ""))}
                                >
                                  <SelectTrigger className="h-7 border-red-300 text-red-700">
                                    <SelectValue placeholder="Seleccionar" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__empty__">Seleccionar</SelectItem>
                                    {(importCatalogs?.categorias || []).map((opt) => (
                                      <SelectItem key={`cat-${opt.id}`} value={opt.nombre}>{opt.nombre}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                className="h-7 w-7 p-0 border-red-300 text-red-700 hover:bg-red-50"
                                disabled={isCreatingCatalog}
                                onClick={() => void createCatalogOption("categoria", r.Fila, "Categoria")}
                                title="Agregar categoría"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            categoriaValue || "-"
                          )}
                        </td>
                        <td className={`px-2 py-1 ${r.flags.marca ? "text-red-600 font-semibold" : ""}`}>
                          {isFixMode ? (
                            <div className="flex items-center gap-1">
                              <div className="min-w-[130px] flex-1">
                                <Select
                                  value={marcaValue || "__empty__"}
                                  onValueChange={(val) => updateRowField(r.Fila, "Marca", val === "__empty__" ? "" : (val ?? ""))}
                                >
                                  <SelectTrigger className="h-7 border-red-300 text-red-700">
                                    <SelectValue placeholder="Seleccionar" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__empty__">Seleccionar</SelectItem>
                                    {(importCatalogs?.marcas || []).map((opt) => (
                                      <SelectItem key={`mar-${opt.id}`} value={opt.nombre}>{opt.nombre}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                className="h-7 w-7 p-0 border-red-300 text-red-700 hover:bg-red-50"
                                disabled={isCreatingCatalog}
                                onClick={() => void createCatalogOption("marca", r.Fila, "Marca")}
                                title="Agregar marca"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            marcaValue || "-"
                          )}
                        </td>
                        <td className={`px-2 py-1 ${r.flags.area ? "text-red-600 font-semibold" : ""}`}>
                          {isFixMode ? (
                            <div className="flex items-center gap-1">
                              <div className="min-w-[130px] flex-1">
                                <Select
                                  value={areaValue || "__empty__"}
                                  onValueChange={(val) => updateRowField(r.Fila, "Area", val === "__empty__" ? "" : (val ?? ""))}
                                >
                                  <SelectTrigger className="h-7 border-red-300 text-red-700">
                                    <SelectValue placeholder="Seleccionar" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__empty__">Seleccionar</SelectItem>
                                    {(importCatalogs?.areas || []).map((opt) => (
                                      <SelectItem key={`are-${opt.id}`} value={opt.nombre}>{opt.nombre}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                className="h-7 w-7 p-0 border-red-300 text-red-700 hover:bg-red-50"
                                disabled={isCreatingCatalog}
                                onClick={() => void createCatalogOption("area", r.Fila, "Area")}
                                title="Agregar área"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            areaValue || "-"
                          )}
                        </td>
                        <td className={`px-2 py-1 ${r.flags.condicion ? "text-red-600 font-semibold" : ""}`}>
                          {isFixMode ? (
                            <div className="flex items-center gap-1">
                              <div className="min-w-[130px] flex-1">
                                <Select value={condicionValue || "__empty__"} onValueChange={(val) => updateRowField(r.Fila, "Condicion", val === "__empty__" ? "" : (val ?? ""))}>
                                  <SelectTrigger className="h-7 border-red-300 text-red-700">
                                    <SelectValue placeholder="Seleccionar" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__empty__">Seleccionar</SelectItem>
                                    {(importCatalogs?.condiciones || []).map((opt) => (
                                      <SelectItem key={`con-${opt.id}`} value={opt.nombre}>{opt.nombre}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                className="h-7 w-7 p-0 border-red-300 text-red-700 hover:bg-red-50"
                                disabled={isCreatingCatalog}
                                onClick={() => void createCatalogOption("condicion", r.Fila, "Condicion")}
                                title="Agregar condición"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            condicionValue || "-"
                          )}
                        </td>
                        <td className={`px-2 py-1 ${r.flags.estado ? "text-red-600 font-semibold" : ""}`}>
                          {isFixMode && r.flags.estado ? (
                            <Select value={estadoValue || "__empty__"} onValueChange={(val) => updateRowField(r.Fila, "EstadoBien", val === "__empty__" ? "" : (val ?? ""))}>
                              <SelectTrigger className="h-7 border-red-300 text-red-700">
                                <SelectValue placeholder="Seleccionar" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__empty__">Seleccionar</SelectItem>
                                {(importCatalogs?.estados || []).map((opt) => (
                                  <SelectItem key={`est-${opt.id}`} value={opt.nombre}>{opt.nombre}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            estadoValue || "-"
                          )}
                        </td>
                        <td className="px-2 py-1">
                          <span
                            className={
                              r.Estado === "OK"
                                ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700"
                                : "rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700"
                            }
                          >
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
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                <p className="text-sm font-semibold text-slate-800">Resultado de importación</p>
              </div>
              <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
                <table className="w-full text-sm leading-tight">
                  <thead className="bg-slate-100 text-slate-700 sticky top-0">
                    <tr>
                      <th className="text-left px-2 py-1.5">Fila</th>
                      <th className="text-left px-2 py-1.5">Cód. Inventario</th>
                      <th className="text-left px-2 py-1.5">Estado</th>
                      <th className="text-left px-2 py-1.5">Mensaje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, idx) => (
                      <tr
                        key={`${r.Fila}-${r.CodigoInventario || "-"}-${idx}`}
                        className="border-t border-slate-100 odd:bg-white even:bg-slate-50/60"
                      >
                        <td className="px-2 py-1">{r.Fila}</td>
                        <td className="px-2 py-1">{r.CodigoInventario || "-"}</td>
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
