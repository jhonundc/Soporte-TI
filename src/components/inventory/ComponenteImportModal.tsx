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
  CodigoPatrimonial: string | null;
  NombreComponente: string | null;
  Marca: string | null;
  IdMarca: number | null;
  IdComponente?: number | null;
  Modelo: string | null;
  NumeroSerie: string | null;
  Serie?: string | null;
  DescripcionModelo?: string | null;
  ProcesadorEspecificaciones?: string | null;
  RAM?: string | null;
  Almacenamiento?: string | null;
  SistemaOperativo?: string | null;
  UsuarioAsignado?: string | null;
  Capacidad: string | null;
  Observacion: string | null;
  Cantidad: number | null;
  UbicacionFisica: string | null;
  EstadoEquipo: string | null;
};

type ImportResult = {
  Fila: number;
  NombreComponente: string;
  Estado: "OK" | "ERROR";
  Mensaje: string;
};

type ResultErrorFlags = {
  codigoPatrimonial: boolean;
  nombreComponente: boolean;
  marca: boolean;
  numeroSerie: boolean;
  cantidad: boolean;
  ubicacionFisica: boolean;
  estadoEquipo: boolean;
};

type RowResultView = {
  Fila: number;
  CodigoPatrimonial: string;
  NombreComponente: string;
  Marca: string;
  NumeroSerie: string;
  Cantidad: number | null;
  UbicacionFisica: string;
  EstadoEquipo: string;
  Estado: "OK" | "ERROR";
  Mensaje: string;
  flags: ResultErrorFlags;
};

type CatalogOption = {
  id: number;
  nombre: string;
};

type ImportCatalogs = {
  marcas: CatalogOption[];
  componentes?: CatalogOption[];
  areas?: CatalogOption[];
  estados?: CatalogOption[];
};

interface ComponenteImportModalProps {
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

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getErrorFlags(message: string): ResultErrorFlags {
  const msg = normalizeText(message);
  return {
    codigoPatrimonial: msg.includes("patrimonial") || msg.includes("codigo"),
    nombreComponente: msg.includes("nombre"),
    marca: msg.includes("marca"),
    numeroSerie: msg.includes("serie"),
    cantidad: msg.includes("cantidad"),
    ubicacionFisica: msg.includes("ubicacion"),
    estadoEquipo: msg.includes("estado"),
  };
}

function getFieldErrorMessage(message: string, field: keyof ResultErrorFlags): string | undefined {
  if (!message) return undefined;
  const matchingMessages = message
    .split(" | ")
    .map((item) => item.trim())
    .filter((item) => item && getErrorFlags(item)[field]);
  return matchingMessages.length ? matchingMessages.join(" · ") : message;
}

function resolveComponenteIdByNombre(nombre: string | null, componentes: CatalogOption[] = []): number | null {
  if (!nombre) return null;
  const normalizedValue = normalizeText(nombre);
  const item = componentes.find((comp) => normalizeText(comp.nombre) === normalizedValue);
  return item?.id ?? null;
}

async function fetchImportCatalogs(): Promise<ImportCatalogs> {
  const [catalogRes, componentesRes] = await Promise.allSettled([
    fetch("/api/componentes/importar/catalogos"),
    fetch("/api/componentes-catalogo"),
  ]);

  const marcas: CatalogOption[] = [];
  const componentes: CatalogOption[] = [];
  const areas: CatalogOption[] = [];
  const estados: CatalogOption[] = [];

  if (catalogRes.status === "fulfilled") {
    try {
      const data = await catalogRes.value.json();
      if (Array.isArray(data?.marcas)) data.marcas.forEach((m: any) => marcas.push({ id: m.id, nombre: String(m.nombre ?? "") }));
      if (Array.isArray(data?.areas)) data.areas.forEach((a: any) => areas.push({ id: a.id, nombre: String(a.nombre ?? "") }));
      if (Array.isArray(data?.estados)) data.estados.forEach((s: any) => estados.push({ id: s.id, nombre: String(s.nombre ?? "") }));
    } catch (e) {
      // ignore
    }
  }

  if (componentesRes.status === "fulfilled") {
    try {
      const data = await componentesRes.value.json();
      if (Array.isArray(data)) {
        data.forEach((c: any) => {
          const nombre = String(c?.NombreComponente ?? c?.nombre ?? "").trim();
          const id = Number(c?.IdComponente ?? c?.id ?? 0) || 0;
          if (nombre) componentes.push({ id, nombre });
        });
      }
    } catch (e) {
      // ignore
    }
  }

  return { marcas, componentes, areas, estados };
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
        CodigoPatrimonial: toNullableString(get("CodigoPatrimonial", "Codigo Patrimonial", "Cod Patrimonial")),
        NombreComponente: toNullableString(get("NombreComponente", "Nombre Componente", "Componente")),
        Marca: toNullableString(get("Marca")),
        IdMarca: toNullableInt(get("IdMarca", "Id Marca", "MarcaId")),
        Modelo: toNullableString(get("Modelo")),
        DescripcionModelo: toNullableString(get("DescripcionModelo", "Descripcion Modelo", "Descripcion", "Modelo")),
        NumeroSerie: toNullableString(get("NumeroSerie", "Numero Serie", "Serie")),
        Serie: toNullableString(get("Serie", "NumeroSerie", "Numero Serie", "Serie")) || toNullableString(get("NumeroSerie", "Numero Serie", "Serie")),
        ProcesadorEspecificaciones: toNullableString(get("ProcesadorEspecificaciones", "Procesador Especificaciones", "Procesador")),
        RAM: toNullableString(get("RAM", "Memoria", "Memoria RAM")),
        Almacenamiento: toNullableString(get("Almacenamiento", "Disco", "Storage", "Almacenamiento")),
        SistemaOperativo: toNullableString(get("SistemaOperativo", "Sistema Operativo", "SO")),
        UsuarioAsignado: toNullableString(get("UsuarioAsignado", "Usuario Asignado", "Asignado a", "Usuario")),
        Capacidad: toNullableString(get("Capacidad")),
        Observacion: toNullableString(get("Observacion", "Observación")),
        Cantidad: toNullableInt(get("Cantidad")),
        UbicacionFisica: toNullableString(get("UbicacionFisica", "Ubicacion Fisica", "Ubicación Física")),
        EstadoEquipo: toNullableString(get("EstadoEquipo", "Estado Equipo", "Estado")),
      };
    })
    .filter((row) => {
      return (
        row.CodigoPatrimonial ||
        row.NombreComponente ||
        row.Marca ||
        row.IdMarca ||
        row.Modelo ||
        row.DescripcionModelo ||
        row.NumeroSerie ||
        row.Serie ||
        row.ProcesadorEspecificaciones ||
        row.RAM ||
        row.Almacenamiento ||
        row.SistemaOperativo ||
        row.UsuarioAsignado ||
        row.Capacidad ||
        row.Observacion ||
        row.Cantidad ||
        row.UbicacionFisica ||
        row.EstadoEquipo
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

  const expected = ["componente", "nombrecomponente", "marca", "modelo", "numeroserie", "cantidad"];

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

export default function ComponenteImportModal({ open, onOpenChange, onImported }: ComponenteImportModalProps) {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [summary, setSummary] = useState<{ Insertados: number; Errores: number } | null>(null);
  const [isFixMode, setIsFixMode] = useState(false);
  const [isCreatingCatalog, setIsCreatingCatalog] = useState(false);

  const { data: importCatalogs, refetch: refetchCatalogs } = useQuery({
    queryKey: ["import-catalogos-componentes"],
    queryFn: fetchImportCatalogs,
    enabled: open,
  });

  const createMarcaOption = async (fila: number) => {
    const value = window.prompt("Escribe la nueva marca:")?.trim();
    if (!value) return;

    try {
      setIsCreatingCatalog(true);
      const res = await fetch("/api/bienes/importar/catalogos/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "marca", nombre: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo crear la marca");
      await refetchCatalogs();
      updateRowField(fila, "Marca", value);
    } catch (error: any) {
      alert(error?.message || "Error al crear la marca");
    } finally {
      setIsCreatingCatalog(false);
    }
  };

  const createComponenteOption = async (fila: number) => {
    const value = window.prompt("Escribe el nombre del nuevo componente:")?.trim();
    if (!value) return;

    try {
      setIsCreatingCatalog(true);
      const res = await fetch("/api/componentes-catalogo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ NombreComponente: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo crear el componente");
      await refetchCatalogs();
      updateRowField(fila, "NombreComponente", value);
    } catch (error: any) {
      alert(error?.message || "Error al crear el componente");
    } finally {
      setIsCreatingCatalog(false);
    }
  };

  const createAreaOption = async (fila: number) => {
    const value = window.prompt("Escribe el nombre de la nueva área:")?.trim();
    if (!value) return;

    try {
      setIsCreatingCatalog(true);
      const res = await fetch("/api/areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ NombreArea: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo crear el área");
      await refetchCatalogs();
      updateRowField(fila, "UbicacionFisica", value);
    } catch (error: any) {
      alert(error?.message || "Error al crear el área");
    } finally {
      setIsCreatingCatalog(false);
    }
  };

  const createEstadoOption = async (fila: number) => {
    const value = window.prompt("Escribe el nombre del nuevo estado:")?.trim();
    if (!value) return;

    try {
      setIsCreatingCatalog(true);
      const res = await fetch("/api/estados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ EstadoBien: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo crear el estado");
      await refetchCatalogs();
      updateRowField(fila, "EstadoEquipo", value);
    } catch (error: any) {
      alert(error?.message || "Error al crear el estado");
    } finally {
      setIsCreatingCatalog(false);
    }
  };

  const importMutation = useMutation({
    mutationFn: async (payload: { rows: ImportRow[]; validateOnly?: boolean }) => {
      const payloadRows = payload.rows || [];
      const validateOnly = Boolean(payload.validateOnly);
      const rowsToSend = payloadRows.map((row) => ({
        ...row,
        IdComponente: row.IdComponente ?? resolveComponenteIdByNombre(row.NombreComponente, importCatalogs?.componentes),
      }));

      const res = await fetch("/api/componentes/importar/bienes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bienesComponentes: rowsToSend, validateOnly }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al importar el Excel");
      }

      return res.json();
    },
    onSuccess: (data) => {
      const resultados: ImportResult[] = Array.isArray(data?.resultados) ? data.resultados : [];
      const filasConError = new Set(resultados.filter((r) => r.Estado === "ERROR").map((r) => r.Fila));
      const filasInsertadas = new Set(resultados.filter((r) => r.Estado === "OK").map((r) => r.Fila));
      setSummary({ Insertados: filasInsertadas.size || Number(data?.resumen?.Insertados || 0), Errores: filasConError.size });

      // Si estamos en modo 'arreglar errores', quitar automáticamente las filas que se importaron correctamente
      setResults(resultados);

      if (typeof onImported === "function") onImported();
    },
    onError: (error: any) => {
      alert(error?.message || "Error al importar");
    },
  });

  const handleToggleFixMode = () => {
    if (!isFixMode) {
      setIsFixMode(true);
      return;
    }

    const payloadRows = rows.filter((row) => errorFilaSet.has(row.Fila));
    if (!payloadRows.length) {
      setIsFixMode(false);
      return;
    }

    setIsFixMode(false);
    importMutation.mutate({ rows: payloadRows });
  };

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
          CodigoPatrimonial: source?.CodigoPatrimonial || "-",
          NombreComponente: item.NombreComponente || source?.NombreComponente || "-",
          Marca: source?.Marca || (source?.IdMarca ? String(source.IdMarca) : "-"),
          NumeroSerie: source?.NumeroSerie || "-",
          Cantidad: source?.Cantidad ?? null,
          UbicacionFisica: source?.UbicacionFisica || "-",
          EstadoEquipo: source?.EstadoEquipo || "-",
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
        codigoPatrimonial: row.flags.codigoPatrimonial || flags.codigoPatrimonial,
        nombreComponente: row.flags.nombreComponente || flags.nombreComponente,
        marca: row.flags.marca || flags.marca,
        numeroSerie: row.flags.numeroSerie || flags.numeroSerie,
        cantidad: row.flags.cantidad || flags.cantidad,
        ubicacionFisica: row.flags.ubicacionFisica || flags.ubicacionFisica,
        estadoEquipo: row.flags.estadoEquipo || flags.estadoEquipo,
      };
    }

    return Array.from(grouped.values()).sort((a, b) => a.Fila - b.Fila);
  }, [results, rows]);

  const errorResultRows = useMemo(() => resultRows.filter((r) => r.Estado === "ERROR"), [resultRows]);
  const hasErrorRows = useMemo(() => resultRows.some((r) => r.Estado === "ERROR"), [resultRows]);

  const errorFilaSet = useMemo(() => {
    const set = new Set<number>();
    resultRows.forEach((r) => {
      if (r.Estado === "ERROR") set.add(r.Fila);
    });
    return set;
  }, [resultRows]);

  const sourceRowByFila = useMemo(() => new Map(rows.map((row) => [row.Fila, row])), [rows]);

  const updateRowField = (
    fila: number,
    field: "CodigoPatrimonial" | "NombreComponente" | "Marca" | "NumeroSerie" | "Cantidad" | "UbicacionFisica" | "EstadoEquipo",
    value: string
  ) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.Fila !== fila) return row;
        if (field === "Marca") return { ...row, Marca: value || null, IdMarca: null };
        if (field === "Cantidad") return { ...row, Cantidad: toNullableInt(value) };
        if (field === "NumeroSerie") return { ...row, NumeroSerie: value || null };
        if (field === "CodigoPatrimonial") return { ...row, CodigoPatrimonial: value || null };
        if (field === "UbicacionFisica") return { ...row, UbicacionFisica: value || null };
        if (field === "EstadoEquipo") return { ...row, EstadoEquipo: value || null };
        return { ...row, NombreComponente: value || null };
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

    const payloadRows = isFixMode ? rows.filter((row) => errorFilaSet.has(row.Fila)) : rows;
    if (!payloadRows.length) {
      alert("No hay filas con error para reintentar.");
      return;
    }

    setIsFixMode(false);
    importMutation.mutate({ rows: payloadRows });
  };

  const handleDownloadTemplate = async () => {
    setIsCreatingCatalog(true);
    try {
      const ExcelJS = await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Inventario TI";
      workbook.created = new Date();
      const ws = workbook.addWorksheet("Plantilla_Componentes", {
        views: [{ state: "frozen", ySplit: 3 }],
      });

      const headers = [
        "Fila",
        "CodigoPatrimonial",
        "Componente",
        "Observacion",
        "Cantidad",
        "DescripcionModelo",
        "Marca",
        "NumeroSerie",
        "ProcesadorEspecificaciones",
        "RAM",
        "Almacenamiento",
        "SistemaOperativo",
        "UbicacionFisica",
        "UsuarioAsignado",
        "EstadoEquipo",
      ];

      ws.columns = [
        { key: "Fila", width: 8 },
        { key: "CodigoPatrimonial", width: 20 },
        { key: "Componente", width: 28 },
        { key: "Observacion", width: 36 },
        { key: "Cantidad", width: 10 },
        { key: "DescripcionModelo", width: 28 },
        { key: "Marca", width: 18 },
        { key: "NumeroSerie", width: 18 },
        { key: "ProcesadorEspecificaciones", width: 32 },
        { key: "RAM", width: 14 },
        { key: "Almacenamiento", width: 16 },
        { key: "SistemaOperativo", width: 18 },
        { key: "UbicacionFisica", width: 28 },
        { key: "UsuarioAsignado", width: 22 },
        { key: "EstadoEquipo", width: 16 },
      ];

      ws.mergeCells("A1:O1");
      ws.getCell("A1").value = "PLANTILLA DE CARGA MASIVA DE BIENES - COMPONENTES";
      ws.getCell("A1").font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
      ws.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
      ws.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
      ws.getRow(1).height = 28;

      ws.mergeCells("A2:O2");
      ws.getCell("A2").value = `Sistema Inventario TI | ${new Date().toLocaleDateString("es-PE")}`;
      ws.getCell("A2").font = { bold: true, size: 10, color: { argb: "FF0F172A" } };
      ws.getCell("A2").alignment = { horizontal: "center", vertical: "middle" };
      ws.getCell("A2").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
      ws.getRow(2).height = 20;

      ws.addRow(headers);
      const headerRow = ws.getRow(3);
      headerRow.height = 22;
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } };
        cell.border = {
          top: { style: "thin", color: { argb: "FFFFFFFF" } },
          left: { style: "thin", color: { argb: "FFFFFFFF" } },
          bottom: { style: "thin", color: { argb: "FFFFFFFF" } },
          right: { style: "thin", color: { argb: "FFFFFFFF" } },
        };
      });

      ws.addRow([
        2,
        "",
        "Disco Duro 1TB",
        "Ejemplo de observación",
        1,
        "BarraCuda",
        "Seagate",
        "SN-001",
        "Intel i5",
        "8GB",
        "1TB",
        "Windows 10",
        "Almacén A",
        "usuario@dominio.local",
        "Operativo",
      ]);

      for (let r = 4; r <= 120; r += 1) {
        const row = ws.getRow(r);
        for (let c = 1; c <= headers.length; c += 1) {
          const cell = row.getCell(c);
          cell.border = {
            top: { style: "thin", color: { argb: "FFD1D5DB" } },
            left: { style: "thin", color: { argb: "FFD1D5DB" } },
            bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
            right: { style: "thin", color: { argb: "FFD1D5DB" } },
          };
          if (r % 2 === 0) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
          }
          cell.alignment = { vertical: "middle", horizontal: c === 6 || c === 3 ? "left" : "center" };
        }
      }

      ws.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: headers.length } };

      // Catalogos de referencia (marcas y, si hay, componentes)
      const catalogResponse = await fetch("/api/componentes/importar/catalogos");
      const catalogData = catalogResponse.ok ? await catalogResponse.json() : {};

      const marcas = Array.isArray(catalogData?.marcas) ? catalogData.marcas : [];
      const componentes: { id: number | string; nombre: string }[] = [];
      try {
        const compRes = await fetch("/api/componentes-catalogo");
        const compData = compRes.ok ? await compRes.json() : {};
        if (Array.isArray(compData)) {
          compData.forEach((c: any) => {
            if (c?.IdComponente && c?.NombreComponente) componentes.push({ id: c.IdComponente, nombre: String(c.NombreComponente) });
          });
        }
      } catch (e) {
        // ignore
      }

      const catalogRows: (string | number)[][] = [["CATALOGOS DE REFERENCIA (USAR NOMBRE O ID)"]];
      catalogRows.push(["Tipo", "ID", "Nombre"]);

      const pushCatalog = (label: string, items: { id: number | string; nombre: string }[]) => {
        if (!items.length) {
          catalogRows.push([label, "", "Sin datos o sin permisos"]);
          return;
        }
        items.forEach((it, idx) => catalogRows.push([idx === 0 ? label : "", it.id, it.nombre]));
      };

      pushCatalog("Marcas", marcas.map((m: any) => ({ id: m.id, nombre: String(m.nombre ?? "") })).filter((x: { id: number | string; nombre: string }) => x.nombre));
      pushCatalog("Componentes", componentes);

      const wsCatalogs = workbook.addWorksheet("Catalogos_Referencia", { views: [{ state: "frozen", ySplit: 2 }] });
      wsCatalogs.columns = [{ key: "tipo", width: 24 }, { key: "id", width: 12 }, { key: "nombre", width: 48 }];

      wsCatalogs.mergeCells("A1:C1");
      wsCatalogs.getCell("A1").value = "CATALOGOS DE REFERENCIA (NOMBRES PARA CARGA)";
      wsCatalogs.getCell("A1").font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
      wsCatalogs.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
      wsCatalogs.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
      wsCatalogs.getRow(1).height = 24;

      wsCatalogs.addRow(["Tipo", "ID", "Nombre"]);
      wsCatalogs.getRow(2).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF334155" } };
      });

      catalogRows.slice(2).forEach((r) => wsCatalogs.addRow(r));

      for (let r = 2; r <= wsCatalogs.rowCount; r += 1) {
        const row = wsCatalogs.getRow(r);
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFD1D5DB" } },
            left: { style: "thin", color: { argb: "FFD1D5DB" } },
            bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
            right: { style: "thin", color: { argb: "FFD1D5DB" } },
          };
          if (r > 2 && r % 2 === 0) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
          }
          cell.alignment = { vertical: "middle", horizontal: Number(cell.col) === 3 ? "left" : "center" };
        });
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer as ArrayBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Plantilla_Importacion_Componentes_PRO_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } finally {
      setIsCreatingCatalog(false);
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
      <DialogContent className="flex max-h-[92vh] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-xl sm:max-w-[96vw] xl:max-w-[1500px]">
        <DialogHeader className="border-b border-primary/10 bg-gradient-to-r from-primary/10 via-primary/5 to-card px-6 py-5">
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-foreground">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Importar Componentes por Excel
          </DialogTitle>
          <p className="mt-1 text-sm text-muted-foreground">Carga masiva de componentes con validación y resultado por fila.</p>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-surface p-6">
          <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-4">
            <p className="mb-2 inline-flex rounded-md bg-primary/10 px-2.5 py-1 text-sm font-semibold text-primary">Indicaciones</p>
            <div className="grid gap-2 text-sm text-foreground md:grid-cols-2">
              <p>1. Usa la plantilla PRO para mantener formato y diseño.</p>
              <p>2. En la columna <strong>Componente</strong> coloca el nombre exacto del componente (no el ID).</p>
              <p>3. Marca, Modelo y Número de Serie ayudan a identificar y evitar duplicados.</p>
              <p>4. Cantidad debe ser un número entero mayor que cero.</p>
            </div>
          </div>

          <div className="rounded-xl border border-primary/15 bg-card p-4 shadow-sm">
            <div className="grid items-center gap-3 lg:grid-cols-[1fr_auto_auto]">
              <Input type="file" accept=".xlsx,.xls,.csv" onChange={handleSelectFile} className="border-primary/20 bg-card" />
              <Button type="button" variant="outline" onClick={handleDownloadTemplate} className="rounded-xl border-primary/20 text-primary hover:bg-primary/5">
                <Download className="h-4 w-4 mr-2" />
                Descargar plantilla
              </Button>
              <Button onClick={handleImport} disabled={importMutation.isPending || !rows.length} className="rounded-xl">
                <UploadCloud className="h-4 w-4 mr-2" />
                {importMutation.isPending ? "Importando..." : "Importar archivo"}
              </Button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-muted-foreground">Archivo: {fileName || "sin seleccionar"}</span>
              <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary">Filas detectadas: {rows.length}</span>
              {hasErrorRows && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleToggleFixMode}
                  disabled={importMutation.isPending}
                  className={isFixMode ? "h-7 border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400" : "h-7 border-destructive/50 bg-destructive/10 text-destructive"}
                >
                  {importMutation.isPending ? "Validando..." : isFixMode ? "Finalizar edición" : "Arreglar errores"}
                </Button>
              )}
            </div>
            {isFixMode && hasErrorRows && (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                Modo edición activo: corrige los campos en rojo y pulsa &quot;Finalizar edición&quot; para validarlos nuevamente.
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
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="text-left px-2 py-1.5">Fila</th>
                      <th className="text-left px-2 py-1.5">Nombre</th>
                      <th className="text-left px-2 py-1.5">Marca</th>
                      <th className="text-left px-2 py-1.5">Serie</th>
                      <th className="text-left px-2 py-1.5">Cantidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, idx) => (
                      <tr key={`${row.Fila}-${row.NombreComponente || "sin-nombre"}-${idx}`} className="border-t border-border odd:bg-card even:bg-muted/35">
                        <td className="px-2 py-1">{row.Fila}</td>
                        <td className="px-2 py-1">{row.NombreComponente || "-"}</td>
                        <td className="px-2 py-1">{row.Marca || (row.IdMarca ?? "-")}</td>
                        <td className="px-2 py-1">{row.NumeroSerie || "-"}</td>
                        <td className="px-2 py-1">{row.Cantidad ?? "-"}</td>
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
              <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide">Errores</p>
                  <p className="text-xl font-bold">{summary.Errores ?? 0}</p>
                </div>
              </div>
            </div>
          )}

          {!!results.length && !hasErrorRows && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">Los datos están correctos</p>
                <p className="text-xs">Las filas fueron validadas e importadas sin errores.</p>
              </div>
            </div>
          )}

          {!!errorResultRows.length && (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="border-b border-destructive/10 bg-destructive/[0.04] px-4 py-3">
                <p className="text-sm font-semibold text-destructive">Errores a corregir</p>
              </div>
              <div className="max-h-[420px] overflow-auto">
                <table className="w-full min-w-[1450px] text-sm leading-tight">
                  <thead className="sticky top-0 bg-muted text-muted-foreground">
                    <tr>
                      <th className="w-16 whitespace-nowrap px-2 py-2 text-left">Fila</th>
                      <th className="min-w-44 whitespace-nowrap px-2 py-2 text-left">Cód. Patrimonial</th>
                      <th className="min-w-56 whitespace-nowrap px-2 py-2 text-left">Componente</th>
                      <th className="min-w-48 whitespace-nowrap px-2 py-2 text-left">Marca</th>
                      <th className="min-w-44 whitespace-nowrap px-2 py-2 text-left">Serie</th>
                      <th className="min-w-28 whitespace-nowrap px-2 py-2 text-left">Cantidad</th>
                      <th className="min-w-56 whitespace-nowrap px-2 py-2 text-left">Ubicación</th>
                      <th className="min-w-52 whitespace-nowrap px-2 py-2 text-left">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {errorResultRows.map((r) => {
                      const source = sourceRowByFila.get(r.Fila);
                      const codigoValue = source?.CodigoPatrimonial || r.CodigoPatrimonial || "";
                      const nombreValue = source?.NombreComponente || r.NombreComponente || "";
                      const marcaValue = source?.Marca || (source?.IdMarca ? String(source.IdMarca) : r.Marca || "");
                      const serieValue = source?.NumeroSerie || r.NumeroSerie || "";
                      const cantidadValue = source?.Cantidad ?? r.Cantidad ?? null;
                      const ubicacionValue = source?.UbicacionFisica || r.UbicacionFisica || "";
                      const estadoValue = source?.EstadoEquipo || r.EstadoEquipo || "";
                      const hasCurrentNombreOption = Boolean(importCatalogs?.componentes?.some((opt) => opt.nombre === nombreValue));

                      return (
                        <tr key={r.Fila} className="border-t border-border odd:bg-card even:bg-muted/35 text-foreground">
                          <td className="px-2 py-1">{r.Fila}</td>
                          <td title={r.flags.codigoPatrimonial ? getFieldErrorMessage(r.Mensaje, "codigoPatrimonial") : undefined} className={`px-2 py-1 ${r.flags.codigoPatrimonial ? "cursor-help font-semibold text-destructive" : ""}`}>
                            {isFixMode ? (
                              <Input
                                value={codigoValue}
                                onChange={(e) => updateRowField(r.Fila, "CodigoPatrimonial", e.target.value)}
                                className={r.flags.codigoPatrimonial ? "h-7 border-red-300 text-red-700" : "h-7 border-slate-300 text-slate-700"}
                              />
                            ) : (
                              codigoValue || "-"
                            )}
                          </td>
                          <td title={r.flags.nombreComponente ? getFieldErrorMessage(r.Mensaje, "nombreComponente") : undefined} className={`px-2 py-1 ${r.flags.nombreComponente ? "cursor-help font-semibold text-destructive" : ""}`}>
                            {isFixMode ? (
                                <div className="flex items-center gap-1">
                                  <div className="min-w-[160px] flex-1">
                                    <Select value={nombreValue || "__empty__"} onValueChange={(val) => updateRowField(r.Fila, "NombreComponente", val === "__empty__" ? "" : (val ?? ""))}>
                                      <SelectTrigger className={r.flags.nombreComponente ? "h-7 border-red-300 text-red-700" : "h-7 border-slate-300 text-slate-700"}>
                                        <SelectValue placeholder="Seleccionar" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="__empty__">Seleccionar</SelectItem>
                                        {(importCatalogs?.componentes || []).map((opt) => (
                                          <SelectItem key={`comp-${opt.id}`} value={opt.nombre}>{opt.nombre}</SelectItem>
                                        ))}
                                        {!hasCurrentNombreOption && nombreValue ? (
                                          <SelectItem key="current-nombre" value={nombreValue}>{nombreValue}</SelectItem>
                                        ) : null}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className={r.flags.nombreComponente ? "h-7 w-7 p-0 border-red-300 text-red-700 hover:bg-red-50" : "h-7 w-7 p-0 border-slate-300 text-slate-700 hover:bg-slate-50"}
                                    disabled={isCreatingCatalog}
                                    onClick={() => void createComponenteOption(r.Fila)}
                                    title="Agregar componente"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                nombreValue || "-"
                              )}
                          </td>
                          <td title={r.flags.marca ? getFieldErrorMessage(r.Mensaje, "marca") : undefined} className={`px-2 py-1 ${r.flags.marca ? "cursor-help font-semibold text-destructive" : ""}`}>
                            {isFixMode ? (
                              <div className="flex items-center gap-1">
                                <div className="min-w-[130px] flex-1">
                                  <Select value={marcaValue || "__empty__"} onValueChange={(val) => updateRowField(r.Fila, "Marca", val === "__empty__" ? "" : (val ?? ""))}>
                                    <SelectTrigger className={r.flags.marca ? "h-7 border-red-300 text-red-700" : "h-7 border-slate-300 text-slate-700"}>
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
                                  className={r.flags.marca ? "h-7 w-7 p-0 border-red-300 text-red-700 hover:bg-red-50" : "h-7 w-7 p-0 border-slate-300 text-slate-700 hover:bg-slate-50"}
                                  disabled={isCreatingCatalog}
                                  onClick={() => void createMarcaOption(r.Fila)}
                                  title="Agregar marca"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              marcaValue || "-"
                            )}
                          </td>
                          <td title={r.flags.numeroSerie ? getFieldErrorMessage(r.Mensaje, "numeroSerie") : undefined} className={`px-2 py-1 ${r.flags.numeroSerie ? "cursor-help font-semibold text-destructive" : ""}`}>
                            {isFixMode ? (
                              <Input value={serieValue} onChange={(e) => updateRowField(r.Fila, "NumeroSerie", e.target.value)} className={r.flags.numeroSerie ? "h-7 border-red-300 text-red-700" : "h-7 border-slate-300 text-slate-700"} />
                            ) : (
                              serieValue || "-"
                            )}
                          </td>
                          <td title={r.flags.cantidad ? getFieldErrorMessage(r.Mensaje, "cantidad") : undefined} className={`px-2 py-1 ${r.flags.cantidad ? "cursor-help font-semibold text-destructive" : ""}`}>
                            {isFixMode ? (
                              <Input type="number" value={cantidadValue ?? ""} onChange={(e) => updateRowField(r.Fila, "Cantidad", e.target.value)} className={r.flags.cantidad ? "h-7 border-red-300 text-red-700" : "h-7 border-slate-300 text-slate-700"} />
                            ) : (
                              cantidadValue ?? "-"
                            )}
                          </td>
                          <td title={r.flags.ubicacionFisica ? getFieldErrorMessage(r.Mensaje, "ubicacionFisica") : undefined} className={`px-2 py-1 ${r.flags.ubicacionFisica ? "cursor-help font-semibold text-destructive" : ""}`}>
                            {isFixMode ? (
                              <div className="flex items-center gap-1">
                                <div className="min-w-[160px] flex-1">
                                  <Select value={ubicacionValue || "__empty__"} onValueChange={(val) => updateRowField(r.Fila, "UbicacionFisica", val === "__empty__" ? "" : (val ?? ""))}>
                                    <SelectTrigger className={r.flags.ubicacionFisica ? "h-7 border-red-300 text-red-700" : "h-7 border-slate-300 text-slate-700"}>
                                      <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="__empty__">Seleccionar</SelectItem>
                                      {(importCatalogs?.areas || []).map((opt) => (
                                        <SelectItem key={`area-${opt.id}`} value={opt.nombre}>{opt.nombre}</SelectItem>
                                      ))}
                                      {ubicacionValue && !importCatalogs?.areas?.some((a) => a.nombre === ubicacionValue) ? (
                                        <SelectItem key="current-area" value={ubicacionValue}>{ubicacionValue}</SelectItem>
                                      ) : null}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className={r.flags.ubicacionFisica ? "h-7 w-7 p-0 border-red-300 text-red-700 hover:bg-red-50" : "h-7 w-7 p-0 border-slate-300 text-slate-700 hover:bg-slate-50"}
                                  disabled={isCreatingCatalog}
                                  onClick={() => void createAreaOption(r.Fila)}
                                  title="Agregar área / ubicación"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              ubicacionValue || "-"
                            )}
                          </td>
                          <td title={r.flags.estadoEquipo ? getFieldErrorMessage(r.Mensaje, "estadoEquipo") : undefined} className={`px-2 py-1 ${r.flags.estadoEquipo ? "cursor-help font-semibold text-destructive" : ""}`}>
                            {isFixMode ? (
                              <div className="flex items-center gap-1">
                                <div className="min-w-[140px] flex-1">
                                  <Select value={estadoValue || "__empty__"} onValueChange={(val) => updateRowField(r.Fila, "EstadoEquipo", val === "__empty__" ? "" : (val ?? ""))}>
                                    <SelectTrigger className={r.flags.estadoEquipo ? "h-7 border-red-300 text-red-700" : "h-7 border-slate-300 text-slate-700"}>
                                      <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="__empty__">Seleccionar</SelectItem>
                                      {(importCatalogs?.estados || []).map((opt) => (
                                        <SelectItem key={`est-${opt.id}`} value={opt.nombre}>{opt.nombre}</SelectItem>
                                      ))}
                                      {estadoValue && !importCatalogs?.estados?.some((s) => s.nombre === estadoValue) ? (
                                        <SelectItem key="current-estado" value={estadoValue}>{estadoValue}</SelectItem>
                                      ) : null}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className={r.flags.estadoEquipo ? "h-7 w-7 p-0 border-red-300 text-red-700 hover:bg-red-50" : "h-7 w-7 p-0 border-slate-300 text-slate-700 hover:bg-slate-50"}
                                  disabled={isCreatingCatalog}
                                  onClick={() => void createEstadoOption(r.Fila)}
                                  title="Agregar estado"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              estadoValue || "-"
                            )}
                          </td>
                        </tr>
                      );
                    })}
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
