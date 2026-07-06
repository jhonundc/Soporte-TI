import {
  type BajaPrintData,
  type BienEnriched,
  CAUSALES,
  TIPOS_BIEN,
  getModelo,
  matchesCausal,
  matchesTipo,
  normalize,
} from "@/lib/print/baja-print-template";
import {
  checkboxMark,
  downloadWorkbook,
  FICHA_BAJA_TEMPLATE_URL,
  formatDate,
  loadWorkbookTemplate,
} from "./excel-base";
import type { Worksheet } from "exceljs";

/**
 * Mapa de celdas extraído del archivo oficial:
 * FORMATO DE BAJA DE BIENES - HOSPITAL REZOLA 2025 OPERATIVO.xlsx
 * (esquina superior izquierda de cada merge).
 */
const DATA_CELLS = {
  fecha: "AB9",
  unidadOrganica: "H9",
  responsable: "G14",
  dependencia: "G15",
  ambiente: "G16",
  codigoPatrimonial: "B28",
  descripcion: "G28",
  marca: "M28",
  modelo: "P28",
  serie: "S28",
  dimension: "W28",
  color: "Z28",
  fechaAdquisicion: "AB28",
  fundamentacion: "B43",
} as const;

const TIPO_CHK = {
  informatico: "G20",
  comunicacion: "M20",
  biomedico: "S20",
  electrico: "AE20",
  mobiliario: "G22",
  mobiliario_clinico: "AE22",
} as const;

const CONDICION_CHK = {
  operativo: "G33",
  inoperativo: "G35",
} as const;

const ESTADO_CHK = {
  bueno: "E39",
  regular: "J39",
  maloReparar: "Q39",
  maloBaja: "W39",
} as const;

const REC_CHK = {
  darBaja: "G52",
  recuperar: "L52",
  reasignar: "S52",
} as const;

const CAUSAL_CHK = ["R56", "R58", "R60", "R62", "R64", "R66", "R68", "R70"] as const;

const ALL_CHECKBOXES = [
  ...Object.values(TIPO_CHK),
  ...Object.values(CONDICION_CHK),
  ...Object.values(ESTADO_CHK),
  ...Object.values(REC_CHK),
  ...CAUSAL_CHK,
] as const;

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

type Ctx = {
  baja: BajaPrintData;
  bien: BienEnriched & Record<string, unknown>;
  tipoBien: string;
  condicion: string;
  estado: string;
  recomendacion: string;
  causal: string;
  codigo: string;
};

function buildCtx(baja: BajaPrintData, extra?: BienEnriched | null): Ctx {
  const bien = { ...(baja.Bien || {}), ...(extra || {}) };
  return {
    baja,
    bien,
    tipoBien: baja.TipoBien || "",
    condicion: normalize(baja.Condicion?.Condicion),
    estado: normalize(baja.Estado?.EstadoBien),
    recomendacion: normalize(baja.Recomendacion),
    causal: baja.CausalBaja || "",
    codigo: bien.CodigoPatrimonial || bien.CodigoInventario || "",
  };
}

/** Solo escribe valores dinámicos; no altera formato, merges ni estilos de la plantilla. */
export function fillFichaBajaData(ws: Worksheet, baja: BajaPrintData, extra?: BienEnriched | null) {
  const d = buildCtx(baja, extra);

  clearDynamicFields(ws);

  setCell(ws, DATA_CELLS.fecha, formatDate(baja.FechaRegistro));
  setCell(
    ws,
    DATA_CELLS.unidadOrganica,
    baja.UnidadOrganica || "HOSPITAL REGIONAL DE CAÑETE - REZOLA"
  );
  setCell(ws, DATA_CELLS.responsable, baja.Responsable || "");
  setCell(ws, DATA_CELLS.dependencia, baja.Dependencia || "");
  setCell(ws, DATA_CELLS.ambiente, baja.Ambiente || "");

  TIPOS_BIEN.forEach(({ key }) => {
    const addr = TIPO_CHK[key as keyof typeof TIPO_CHK];
    if (addr) setCheck(ws, addr, matchesTipo(d.tipoBien, key));
  });

  setCell(ws, DATA_CELLS.codigoPatrimonial, d.codigo);
  setCell(ws, DATA_CELLS.descripcion, d.bien.Descripcion || "");
  setCell(ws, DATA_CELLS.marca, d.bien.Marca?.Marca || "");
  setCell(ws, DATA_CELLS.modelo, getModelo(d.bien));
  setCell(ws, DATA_CELLS.serie, d.bien.NumeroSerie || "");
  setCell(ws, DATA_CELLS.dimension, d.bien.Dimension || "");
  setCell(ws, DATA_CELLS.color, d.bien.Color || "");
  setCell(
    ws,
    DATA_CELLS.fechaAdquisicion,
    formatDate(d.bien.FechaAdquisicion || d.bien.FechaCompra)
  );

  setCheck(
    ws,
    CONDICION_CHK.operativo,
    d.condicion.includes("operativo") && !d.condicion.includes("inoperativo")
  );
  setCheck(ws, CONDICION_CHK.inoperativo, d.condicion.includes("inoperativo"));

  setCheck(ws, ESTADO_CHK.bueno, d.estado.includes("bueno") && !d.estado.includes("malo"));
  setCheck(ws, ESTADO_CHK.regular, d.estado.includes("regular"));
  setCheck(ws, ESTADO_CHK.maloReparar, d.estado.includes("malo por reparar"));
  setCheck(ws, ESTADO_CHK.maloBaja, d.estado.includes("malo para baja"));

  setCell(ws, DATA_CELLS.fundamentacion, baja.Fundamentacion || "");

  setCheck(ws, REC_CHK.darBaja, d.recomendacion.includes("dar de baja"));
  setCheck(ws, REC_CHK.recuperar, d.recomendacion.includes("recuperar"));
  setCheck(ws, REC_CHK.reasignar, d.recomendacion.includes("reasignar"));

  CAUSALES.forEach((item, index) => {
    setCheck(ws, CAUSAL_CHK[index], matchesCausal(d.causal, item));
  });
}

export async function exportFichaBajaExcel(baja: BajaPrintData, extra?: BienEnriched | null) {
  try {
    const workbook = await loadWorkbookTemplate(FICHA_BAJA_TEMPLATE_URL);
    const ws = workbook.worksheets[0];
    if (!ws) {
      throw new Error("La plantilla Excel no contiene hojas de cálculo.");
    }

    fillFichaBajaData(ws, baja, extra);

    await downloadWorkbook(workbook, `Ficha_Baja_${baja.NumeroFichaBaja || "export"}.xlsx`);
  } catch (error) {
    console.error("Error exportando ficha baja Excel:", error);
    throw error;
  }
}
