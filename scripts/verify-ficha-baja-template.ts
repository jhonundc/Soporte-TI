import ExcelJS from "exceljs";
import { fillFichaBajaData } from "../src/lib/export/ficha-baja-excel";

async function analyze(file: string) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);
  const ws = wb.worksheets[0]!;
  return {
    merges: ((ws.model as { merges?: string[] }).merges || []).sort().join("|"),
    colWidths: ws.columns?.slice(0, 35).map((c) => c?.width?.toFixed(2)).join(","),
    views: JSON.stringify(ws.views),
    pageSetup: JSON.stringify({ ...ws.pageSetup, margins: ws.pageSetup?.margins }),
    images: ws.getImages?.()?.length ?? 0,
  };
}

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile("public/templates/ficha-baja.xlsx");
const ws = wb.worksheets[0]!;

fillFichaBajaData(ws, {
  NumeroFichaBaja: "TEST-001",
  FechaRegistro: "2025-06-15",
  UnidadOrganica: "UNIDAD DE ESTADISTICA E INFORMATICA",
  Responsable: "Usuario Demo",
  Dependencia: "Administracion",
  Ambiente: "Soporte TI",
  TipoBien: "Informatico",
  Fundamentacion: "Prueba de exportacion",
  Recomendacion: "Dar de baja",
  CausalBaja: "Obsolescencia tecnica",
  Condicion: { Condicion: "Operativo" },
  Estado: { EstadoBien: "Regular" },
  Bien: {
    CodigoPatrimonial: "PAT-001",
    Descripcion: "Laptop Dell",
    Marca: { Marca: "DELL" },
    Modelo: { Modelo: "Latitude" },
    NumeroSerie: "SN123",
  },
});

await wb.xlsx.writeFile("tmp-ficha-baja-generated.xlsx");

const orig = await analyze("FORMATO DE BAJA DE BIENES - HOSPITAL REZOLA 2025 OPERATIVO (2).xlsx");
const gen = await analyze("tmp-ficha-baja-generated.xlsx");

console.log("merges match:", orig.merges === gen.merges);
console.log("colWidths match:", orig.colWidths === gen.colWidths);
console.log("views match:", orig.views === gen.views);
console.log("pageSetup match:", orig.pageSetup === gen.pageSetup);
console.log("images:", orig.images, gen.images);
console.log("G20", ws.getCell("G20").value);
console.log("AB9", ws.getCell("AB9").value);
