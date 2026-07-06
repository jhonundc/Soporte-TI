/**
 * Compara plantilla oficial vs generada (merges, columnas, pageSetup, imágenes).
 * Uso: npx tsx scripts/compare-ficha-soporte-templates.ts
 */
import ExcelJS from "exceljs";
import { fillFichaSoporteData } from "../src/lib/export/ficha-soporte-excel";

const OFFICIAL = "public/templates/ficha-soporte-oficial-ref.xlsx";
const CURRENT = "public/templates/ficha-soporte.xlsx";

async function fingerprint(file: string, fill = false) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);
  const ws = wb.worksheets[0]!;

  if (fill) {
    fillFichaSoporteData(ws, {
      NumeroFicha: "TEST",
      FechaRegistro: "2026-02-25",
      UnidadOrganica: "UNIDAD DE ESTADISTICA E INFORMATICA",
      Responsable: "Usuario Test",
      Dependencia: "TI",
      Ambiente: "Soporte",
      TipoBien: "Informatico",
      TrabajosRealizados: "Trabajo de prueba",
      Diagnostico: "Diagnostico prueba",
      Recomendacion: "Recomendacion prueba",
      Condicion: { Condicion: "Operativo" },
      Estado: { EstadoBien: "Bueno" },
      Bien: {
        CodigoInventario: "3060",
        CodigoPatrimonial: "7422223580036",
        Descripcion: "FOTOCOPIADORA",
        Marca: { Marca: "KYOCERA" },
        Modelo: { Modelo: "M4132idn" },
        NumeroSerie: "C-24029",
      },
    } as Parameters<typeof fillFichaSoporteData>[1]);
  }

  const merges = ((ws.model as { merges?: string[] }).merges || []).sort();
  const colWidths = Array.from({ length: 30 }, (_, i) => {
    const c = i + 2;
    return ws.getColumn(c).width?.toFixed(2) ?? "def";
  }).join(",");

  const rowHeights = Array.from({ length: 85 }, (_, i) => {
    const h = ws.getRow(i + 1).height;
    return h ? String(h) : "";
  }).join(",");

  return {
    merges: merges.join("|"),
    mergeCount: merges.length,
    colWidths,
    rowHeights,
    pageSetup: JSON.stringify({
      scale: ws.pageSetup.scale,
      fitToWidth: ws.pageSetup.fitToWidth,
      fitToHeight: ws.pageSetup.fitToHeight,
      horizontalCentered: ws.pageSetup.horizontalCentered,
      verticalCentered: ws.pageSetup.verticalCentered,
      paperSize: ws.pageSetup.paperSize,
      orientation: ws.pageSetup.orientation,
    }),
    views: JSON.stringify(ws.views),
    images: ws.getImages?.()?.length ?? 0,
    sheetName: ws.name,
  };
}

const official = await fingerprint(OFFICIAL);
const current = await fingerprint(CURRENT);

// Generar con plantilla actual + fill y comparar estructura post round-trip
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(CURRENT);
fillFichaSoporteData(wb.worksheets[0]!, {
  NumeroFicha: "TEST",
  FechaRegistro: "2026-02-25",
  UnidadOrganica: "UNIDAD DE ESTADISTICA E INFORMATICA",
  Responsable: "Usuario Test",
  Dependencia: "TI",
  Ambiente: "Soporte",
  TipoBien: "Informatico",
  TrabajosRealizados: "Trabajo de prueba",
  Diagnostico: "Diagnostico prueba",
  Recomendacion: "Recomendacion prueba",
  Condicion: { Condicion: "Operativo" },
  Estado: { EstadoBien: "Bueno" },
  Bien: {
    CodigoInventario: "3060",
    CodigoPatrimonial: "7422223580036",
    Descripcion: "FOTOCOPIADORA",
    Marca: { Marca: "KYOCERA" },
    Modelo: { Modelo: "M4132idn" },
    NumeroSerie: "C-24029",
  },
} as Parameters<typeof fillFichaSoporteData>[1]);
const buf = await wb.xlsx.writeBuffer();
await wb.xlsx.load(buf);
const generated = await fingerprint("public/templates/ficha-soporte.xlsx"); // structure only
generated.merges = ((wb.worksheets[0]!.model as { merges?: string[] }).merges || []).sort().join("|");
generated.mergeCount = generated.merges.split("|").filter(Boolean).length;
generated.images = wb.worksheets[0]!.getImages?.()?.length ?? 0;
generated.pageSetup = JSON.stringify({
  scale: wb.worksheets[0]!.pageSetup.scale,
  fitToWidth: wb.worksheets[0]!.pageSetup.fitToWidth,
  fitToHeight: wb.worksheets[0]!.pageSetup.fitToHeight,
  horizontalCentered: wb.worksheets[0]!.pageSetup.horizontalCentered,
  verticalCentered: wb.worksheets[0]!.pageSetup.verticalCentered,
});
await wb.xlsx.writeFile("tmp-ficha-soporte-generated.xlsx");

console.log("=== COMPARACIÓN OFICIAL vs PLANTILLA ACTUAL ===\n");
for (const key of ["mergeCount", "pageSetup", "views", "images", "colWidths"] as const) {
  const match = official[key] === current[key];
  console.log(`${match ? "✓" : "✗"} ${key}: oficial=${official[key]} | actual=${current[key]}`);
}

const officialMerges = new Set(official.merges.split("|"));
const currentMerges = new Set(current.merges.split("|"));
const onlyOfficial = [...officialMerges].filter((m) => m && !currentMerges.has(m));
const onlyCurrent = [...currentMerges].filter((m) => m && !officialMerges.has(m));
if (onlyOfficial.length) {
  console.log("\nMerges solo en OFICIAL:");
  onlyOfficial.forEach((m) => console.log(" +", m));
}
if (onlyCurrent.length) {
  console.log("\nMerges solo en ACTUAL:");
  onlyCurrent.forEach((m) => console.log(" -", m));
}

console.log("\n=== POST ROUND-TRIP (fill + save) ===");
console.log("merges:", generated.mergeCount, "images:", generated.images);
console.log("pageSetup match:", generated.pageSetup === official.pageSetup);
