/**
 * Prepara public/templates/ficha-soporte.xlsx desde el archivo oficial del hospital.
 * Uso: npx tsx scripts/prepare-ficha-soporte-template.ts
 */
import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import ExcelJS from "exceljs";
import { fillFichaSoporteData } from "../src/lib/export/ficha-soporte-excel";

const root = process.cwd();
const official =
  process.argv[2] ||
  path.join(root, "public/templates/ficha-soporte-oficial-ref.xlsx");
const out = path.join(root, "public/templates/ficha-soporte.xlsx");

await mkdir(path.dirname(out), { recursive: true });
await copyFile(official, out);

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(out);
const ws = wb.worksheets[0]!;

// Vacía solo campos dinámicos; conserva diseño, merges, logos y estilos.
fillFichaSoporteData(ws, {
  IdSoporte: 0,
  NumeroFicha: "",
  FechaRegistro: "",
  UnidadOrganica: "",
  Responsable: "",
  Dependencia: "",
  Ambiente: "",
  TipoBien: "",
  TrabajosRealizados: "",
  Diagnostico: "",
  Recomendacion: "",
  Condicion: { Condicion: "" },
  Estado: { EstadoBien: "" },
  Bien: undefined,
} as unknown as Parameters<typeof fillFichaSoporteData>[1]);

await wb.xlsx.writeFile(out);
console.log("Plantilla lista:", out);
