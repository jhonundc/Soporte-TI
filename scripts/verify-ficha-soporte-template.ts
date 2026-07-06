/**
 * Verifica que el export conserve la estructura de la plantilla oficial.
 * Uso: npx tsx scripts/verify-ficha-soporte-template.ts
 */
import ExcelJS from "exceljs";
import { fillFichaSoporteData } from "../src/lib/export/ficha-soporte-excel";

const OFFICIAL = "public/templates/ficha-soporte-oficial-ref.xlsx";

async function fingerprint(file: string) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);
  const ws = wb.worksheets[0]!;
  const merges = ((ws.model as { merges?: string[] }).merges || []).sort();
  const colWidths = Array.from({ length: 30 }, (_, i) =>
    (ws.getColumn(i + 2).width ?? 0).toFixed(2)
  ).join(",");
  return {
    merges: merges.join("|"),
    mergeCount: merges.length,
    colWidths,
    pageSetup: JSON.stringify({
      scale: ws.pageSetup.scale,
      fitToWidth: ws.pageSetup.fitToWidth,
      fitToHeight: ws.pageSetup.fitToHeight,
      horizontalCentered: ws.pageSetup.horizontalCentered,
      verticalCentered: ws.pageSetup.verticalCentered,
      printArea: ws.pageSetup.printArea,
    }),
    views: JSON.stringify(ws.views),
    images: ws.getImages?.()?.length ?? 0,
  };
}

const sample = {
  NumeroFicha: "TEST-001",
  FechaRegistro: "2026-01-14",
  UnidadOrganica: "UNIDAD DE ESTADISTICA E INFORMATICA",
  Responsable: "M.C. ISABEL SOTELO VASQUEZ",
  Dependencia: "DTO. DE CONSULTA EXTERNA",
  Ambiente: "SECRETARIA DE CONSULTA EXTERNA",
  TipoBien: "Informatico",
  TrabajosRealizados: "REVISIÓN Y EVALUACIÓN DE EQUIPO.",
  Diagnostico: "No cuenta con memoria RAM.",
  Recomendacion: "Se recomienda baja de equipo.",
  Condicion: { Condicion: "Inoperativo" },
  Estado: { EstadoBien: "Malo para baja" },
  Bien: {
    CodigoInventario: "838",
    CodigoPatrimonial: "",
    Descripcion: "CPU",
    Marca: { Marca: "HP" },
    Modelo: { Modelo: "TPC-F046-SF" },
    NumeroSerie: "MXL4291TT9",
  },
} as Parameters<typeof fillFichaSoporteData>[1];

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile("public/templates/ficha-soporte.xlsx");
fillFichaSoporteData(wb.worksheets[0]!, sample);
await wb.xlsx.writeFile("tmp-ficha-soporte-generated.xlsx");

const official = await fingerprint(OFFICIAL);
const generated = await fingerprint("tmp-ficha-soporte-generated.xlsx");

let ok = true;
for (const key of ["mergeCount", "colWidths", "pageSetup", "views", "images"] as const) {
  const match = official[key] === generated[key];
  if (!match) ok = false;
  console.log(`${match ? "✓" : "✗"} ${key}`);
  if (!match) {
    console.log("  oficial:  ", official[key]);
    console.log("  generado: ", generated[key]);
  }
}

const ws = wb.worksheets[0]!;
const checks: [string, string][] = [
  ["AB9", "13/01/2026"],
  ["G14", "M.C. ISABEL SOTELO VASQUEZ"],
  ["B26", "838"],
  ["K26", "CPU"],
  ["R26", "HP"],
  ["X26", "TPC-F046-SF"],
  ["AB26", "MXL4291TT9"],
  ["G20", "X"],
  ["G33", "X"],
  ["W37", "X"],
  ["B42", "REVISIÓN Y EVALUACIÓN DE EQUIPO."],
  ["B50", "No cuenta con memoria RAM."],
  ["B58", "Se recomienda baja de equipo."],
];

console.log("\nCeldas dinámicas:");
for (const [addr, expected] of checks) {
  const val = String(ws.getCell(addr).value ?? "");
  const match = val.includes(expected.slice(0, 10));
  if (!match) ok = false;
  console.log(`${match ? "✓" : "✗"} ${addr} = ${JSON.stringify(val)}`);
}

if (!ok) process.exit(1);
console.log("\nVerificación OK");
