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
  NombreComponente: string | null;
  Marca: string | null;
  IdMarca: number | null;
  Modelo: string | null;
  NumeroSerie: string | null;
  Capacidad: string | null;
  Observacion: string | null;
  Cantidad: number | null;
};

type ImportResult = {
  Fila: number;
  NombreComponente: string;
  Estado: "OK" | "ERROR";
  Mensaje: string;
};

type ResultErrorFlags = {
  nombreComponente: boolean;
  marca: boolean;
  numeroSerie: boolean;
  cantidad: boolean;
};

type RowResultView = {
  Fila: number;
  NombreComponente: string;
  Marca: string;
  NumeroSerie: string;
  Cantidad: number | null;
  Estado: "OK" | "ERROR";
  flags: ResultErrorFlags;
};

type CatalogOption = {
  id: number;
  nombre: string;
};

type ImportCatalogs = {
  marcas: CatalogOption[];
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
    nombreComponente: msg.includes("nombre"),
    marca: msg.includes("marca"),
    numeroSerie: msg.includes("serie"),
    cantidad: msg.includes("cantidad"),
  };
}

async function fetchImportCatalogs(): Promise<ImportCatalogs> {
  const res = await fetch("/api/componentes/importar/catalogos");
  if (!res.ok) throw new Error("No se pudieron cargar catálogos para importación de componentes");
  const data = await res.json();
  return {
    marcas: Array.isArray(data?.marcas) ? data.marcas : [],
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
        NombreComponente: toNullableString(get("NombreComponente", "Nombre Componente")),
        Marca: toNullableString(get("Marca")),
        IdMarca: toNullableInt(get("IdMarca", "Id Marca", "MarcaId")),
        Modelo: toNullableString(get("Modelo")),
        NumeroSerie: toNullableString(get("NumeroSerie", "Numero Serie", "Serie")),
        Capacidad: toNullableString(get("Capacidad")),
        Observacion: toNullableString(get("Observacion", "Observación")),
        Cantidad: toNullableInt(get("Cantidad")),
      };
    })
    .filter((row) => {
      return (
        row.NombreComponente ||
        row.Marca ||
        row.IdMarca ||
        row.Modelo ||
        row.NumeroSerie ||
        row.Capacidad ||
        row.Observacion ||
        row.Cantidad
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

  const expected = ["nombrecomponente", "marca", "modelo", "numeroserie", "cantidad"];

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

  const importMutation = useMutation({
    mutationFn: async (payloadRows: ImportRow[]) => {
      const res = await fetch("/api/componentes/importar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ componentes: payloadRows }),
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
          NombreComponente: item.NombreComponente || source?.NombreComponente || "-",
          Marca: source?.Marca || (source?.IdMarca ? String(source.IdMarca) : "-"),
          NumeroSerie: source?.NumeroSerie || "-",
          Cantidad: source?.Cantidad ?? null,
          Estado: item.Estado,
          flags,
        });
        continue;
      }

      if (item.Estado === "ERROR") {
        row.Estado = "ERROR";
      }

      row.flags = {
        nombreComponente: row.flags.nombreComponente || flags.nombreComponente,
        marca: row.flags.marca || flags.marca,
        numeroSerie: row.flags.numeroSerie || flags.numeroSerie,
        cantidad: row.flags.cantidad || flags.cantidad,
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
    field: "NombreComponente" | "Marca" | "NumeroSerie" | "Cantidad",
    value: string
  ) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.Fila !== fila) return row;
        if (field === "Marca") return { ...row, Marca: value || null, IdMarca: null };
        if (field === "Cantidad") return { ...row, Cantidad: toNullableInt(value) };
        if (field === "NumeroSerie") return { ...row, NumeroSerie: value || null };
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
    importMutation.mutate(payloadRows);
  };

  const handleDownloadTemplate = () => {
    const template = [
      ["Fila", "NombreComponente", "Marca", "Modelo", "NumeroSerie", "Capacidad", "Observacion", "Cantidad"],
      [2, "Disco Duro", "Seagate", "BarraCuda", "SN-001", "1TB", "Demo", 1],
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla_Componentes");
    XLSX.writeFile(wb, `Plantilla_Importacion_Componentes_${new Date().toISOString().slice(0, 10)}.xlsx`);
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
            Importar Componentes por Excel
          </DialogTitle>
          <p className="text-slate-300 text-sm mt-1">Carga masiva de componentes con validación y resultado por fila.</p>
        </DialogHeader>

        <div className="p-6 space-y-5 overflow-y-auto flex-1 min-h-0">
          <div className="rounded-xl border border-slate-200 p-4 bg-white shadow-sm">
            <div className="grid lg:grid-cols-[1fr_auto_auto] gap-3 items-center">
              <Input type="file" accept=".xlsx,.xls,.csv" onChange={handleSelectFile} className="border-slate-300" />
              <Button type="button" variant="outline" onClick={handleDownloadTemplate} className="border-slate-300 text-slate-700 hover:bg-slate-50">
                <Download className="h-4 w-4 mr-2" />
                Descargar plantilla
              </Button>
              <Button onClick={handleImport} disabled={importMutation.isPending || !rows.length} className="bg-blue-600 hover:bg-blue-700 text-white">
                <UploadCloud className="h-4 w-4 mr-2" />
                {importMutation.isPending ? "Importando..." : "Importar archivo"}
              </Button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-slate-700 border border-slate-200">Archivo: {fileName || "sin seleccionar"}</span>
              <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-blue-700 border border-blue-200">Filas detectadas: {rows.length}</span>
              {hasErrorRows && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFixMode((v) => !v)}
                  className={isFixMode ? "h-7 border-amber-300 bg-amber-50 text-amber-700" : "h-7 border-red-300 bg-red-50 text-red-700"}
                >
                  {isFixMode ? "Finalizar edición" : "Arreglar errores"}
                </Button>
              )}
            </div>
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
                      <th className="text-left px-2 py-1.5">Nombre</th>
                      <th className="text-left px-2 py-1.5">Marca</th>
                      <th className="text-left px-2 py-1.5">Serie</th>
                      <th className="text-left px-2 py-1.5">Cantidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, idx) => (
                      <tr key={`${row.Fila}-${row.NombreComponente || "sin-nombre"}-${idx}`} className="border-t border-slate-100 odd:bg-white even:bg-slate-50/60">
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
              <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
                <table className="w-full text-sm leading-tight">
                  <thead className="bg-slate-100 text-slate-700 sticky top-0">
                    <tr>
                      <th className="text-left px-2 py-1.5">Fila</th>
                      <th className="text-left px-2 py-1.5">Nombre</th>
                      <th className="text-left px-2 py-1.5">Marca</th>
                      <th className="text-left px-2 py-1.5">Serie</th>
                      <th className="text-left px-2 py-1.5">Cantidad</th>
                      <th className="text-left px-2 py-1.5">Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {errorResultRows.map((r) => {
                      const source = sourceRowByFila.get(r.Fila);
                      const nombreValue = source?.NombreComponente || r.NombreComponente || "";
                      const marcaValue = source?.Marca || (source?.IdMarca ? String(source.IdMarca) : r.Marca || "");
                      const serieValue = source?.NumeroSerie || r.NumeroSerie || "";
                      const cantidadValue = source?.Cantidad ?? r.Cantidad ?? null;

                      return (
                        <tr key={`${r.Fila}-${r.NombreComponente}`} className="border-t border-slate-100 odd:bg-white even:bg-slate-50/60">
                          <td className="px-2 py-1">{r.Fila}</td>
                          <td className={`px-2 py-1 ${r.flags.nombreComponente ? "text-red-600 font-semibold" : ""}`}>
                            {isFixMode ? (
                              <Input value={nombreValue} onChange={(e) => updateRowField(r.Fila, "NombreComponente", e.target.value)} className="h-7 border-red-300 text-red-700" />
                            ) : (
                              nombreValue || "-"
                            )}
                          </td>
                          <td className={`px-2 py-1 ${r.flags.marca ? "text-red-600 font-semibold" : ""}`}>
                            {isFixMode ? (
                              <div className="flex items-center gap-1">
                                <div className="min-w-[130px] flex-1">
                                  <Select value={marcaValue || "__empty__"} onValueChange={(val) => updateRowField(r.Fila, "Marca", val === "__empty__" ? "" : val)}>
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
                          <td className={`px-2 py-1 ${r.flags.numeroSerie ? "text-red-600 font-semibold" : ""}`}>
                            {isFixMode ? (
                              <Input value={serieValue} onChange={(e) => updateRowField(r.Fila, "NumeroSerie", e.target.value)} className="h-7 border-red-300 text-red-700" />
                            ) : (
                              serieValue || "-"
                            )}
                          </td>
                          <td className={`px-2 py-1 ${r.flags.cantidad ? "text-red-600 font-semibold" : ""}`}>
                            {isFixMode ? (
                              <Input type="number" value={cantidadValue ?? ""} onChange={(e) => updateRowField(r.Fila, "Cantidad", e.target.value)} className="h-7 border-red-300 text-red-700" />
                            ) : (
                              cantidadValue ?? "-"
                            )}
                          </td>
                          <td className="px-2 py-1">
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">ERROR</span>
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
