import type { FichaSoporteRecord } from "@/features/soporte/ficha/types";
import {
  checkboxMark,
  downloadWorkbook,
  FICHA_SOPORTE_TEMPLATE_URL,
  formatDate,
  loadWorkbookTemplate,
} from "./excel-base";
import type { Worksheet } from "exceljs";

/**
 * Mapa de celdas extraído del archivo oficial:
 * FICHA DE EVALUACION TECNICA (2).xlsx
 * (esquina superior izquierda de cada merge).
 */
const DATA_CELLS = {
  fecha: "AB9",
  unidadOrganica: "H9",
  responsable: "G14",
  dependencia: "G15",
  ambiente: "G16",
  codigoInventario: "B26",
  codigoPatrimonial: "G26",
  descripcion: "K26",
  marca: "R26",
  modelo: "X26",
  serie: "AB26",
  trabajos: "B42",
  diagnostico: "B50",
  recomendacion: "B58",
} as const;

const TIPO_CHK = {
  informatico: "G20",
  comunicacion: "M20",
  electrico: "S20",
} as const;

const CONDICION_CHK = {
  operativo: "G31",
  inoperativo: "G33",
} as const;

const ESTADO_CHK = {
  bueno: "E37",
  regular: "J37",
  maloReparar: "Q37",
  maloBaja: "W37",
} as const;

const ALL_CHECKBOXES = [
  ...Object.values(TIPO_CHK),
  ...Object.values(CONDICION_CHK),
  ...Object.values(ESTADO_CHK),
] as const;

function normalize(value?: string | null) {
  return (value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function matchesTipo(tipoBien: string, key: keyof typeof TIPO_CHK) {
  const t = normalize(tipoBien);
  switch (key) {
    case "informatico":
      return t.includes("informatic");
    case "comunicacion":
      return t.includes("comunicacion");
    case "electrico":
      return t.includes("electric");
    default:
      return false;
  }
}

function setCell(ws: Worksheet, address: string, value: string | undefined) {
  ws.getCell(address).value = value ?? "";
}

function setCheck(ws: Worksheet, address: string, checked: boolean) {
  ws.getCell(address).value = checkboxMark(checked);
}

function clearDynamicFields(ws: Worksheet) {
  Object.values(DATA_CELLS).forEach((addr) => setCell(ws, addr, ""));
  ALL_CHECKBOXES.forEach((addr) => setCheck(ws, addr, false));
}

/** Solo escribe valores dinámicos; no altera formato, merges ni estilos de la plantilla. */
export function fillFichaSoporteData(ws: Worksheet, ficha: FichaSoporteRecord) {
  const bien = ficha.Bien;
  const tipoBien = ficha.TipoBien || "";
  const condicion = normalize(ficha.Condicion?.Condicion);
  const estado = normalize(ficha.Estado?.EstadoBien);

  clearDynamicFields(ws);

  setCell(ws, DATA_CELLS.fecha, formatDate(ficha.FechaRegistro));
  setCell(
    ws,
    DATA_CELLS.unidadOrganica,
    ficha.UnidadOrganica || "UNIDAD DE ESTADISTICA E INFORMATICA"
  );
  setCell(ws, DATA_CELLS.responsable, ficha.Responsable || "");
  setCell(ws, DATA_CELLS.dependencia, ficha.Dependencia || "");
  setCell(ws, DATA_CELLS.ambiente, ficha.Ambiente || "");

  (Object.keys(TIPO_CHK) as Array<keyof typeof TIPO_CHK>).forEach((key) => {
    setCheck(ws, TIPO_CHK[key], matchesTipo(tipoBien, key));
  });

  setCell(ws, DATA_CELLS.codigoInventario, bien?.CodigoInventario || "");
  setCell(ws, DATA_CELLS.codigoPatrimonial, bien?.CodigoPatrimonial || "");
  setCell(ws, DATA_CELLS.descripcion, bien?.Descripcion || "");
  setCell(ws, DATA_CELLS.marca, bien?.Marca?.Marca || "");
  setCell(
    ws,
    DATA_CELLS.modelo,
    typeof bien?.Modelo === "object" ? bien?.Modelo?.Modelo || "" : String(bien?.Modelo || "")
  );
  setCell(ws, DATA_CELLS.serie, bien?.NumeroSerie || "");

  setCheck(
    ws,
    CONDICION_CHK.operativo,
    condicion.includes("operativo") && !condicion.includes("inoperativo")
  );
  setCheck(ws, CONDICION_CHK.inoperativo, condicion.includes("inoperativo"));

  setCheck(ws, ESTADO_CHK.bueno, estado.includes("bueno") && !estado.includes("malo"));
  setCheck(ws, ESTADO_CHK.regular, estado.includes("regular"));
  setCheck(
    ws,
    ESTADO_CHK.maloReparar,
    estado.includes("malo por reparar") || (estado.includes("reparar") && !estado.includes("baja"))
  );
  setCheck(ws, ESTADO_CHK.maloBaja, estado.includes("malo para baja") || estado === "baja");

  setCell(ws, DATA_CELLS.trabajos, ficha.TrabajosRealizados || "");
  setCell(ws, DATA_CELLS.diagnostico, ficha.Diagnostico || "");
  setCell(ws, DATA_CELLS.recomendacion, ficha.Recomendacion || "");
}

export async function exportFichaSoporteExcel(ficha: FichaSoporteRecord) {
  const workbook = await loadWorkbookTemplate(FICHA_SOPORTE_TEMPLATE_URL);
  const ws = workbook.worksheets[0];
  if (!ws) throw new Error("La plantilla Excel de soporte no contiene hojas.");

  fillFichaSoporteData(ws, ficha);

  await downloadWorkbook(workbook, `Ficha_Soporte_${ficha.NumeroFicha || "export"}.xlsx`);
}
