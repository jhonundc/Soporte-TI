import type { Font, Worksheet } from "exceljs";
import type { ActaDetalle, ActaEntrega } from "@/features/soporte/acta-entrega/types";
import {
  ACTA_ENTREGA_TEMPLATE_URL,
  downloadWorkbook,
  loadWorkbookTemplate,
} from "./excel-base";

const FONT_BOLD: Partial<Font> = { bold: true, size: 11, name: "Calibri" };
const FONT_NORMAL: Partial<Font> = { size: 11, name: "Calibri" };

const TABLE_BORDER = {
  top: { style: "thin" as const, color: { argb: "FF000000" } },
  left: { style: "thin" as const, color: { argb: "FF000000" } },
  bottom: { style: "thin" as const, color: { argb: "FF000000" } },
  right: { style: "thin" as const, color: { argb: "FF000000" } },
};

const DEFAULT_CARGO_ENTREGANTE = "Jefe de la Unidad de Estadística e Informática";
const DEFAULT_DEPENDENCIA = "Unidad de Estadística e Informática";
const DEFAULT_OBSERVACIONES =
  "No habiendo observaciones adicionales, ambas partes firman la presente acta en señal de conformidad.";

const ITEM_START = 19;
const ITEM_SLOTS = 4;

function cellText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "object" && value && "richText" in value) {
    const rich = (value as { richText: Array<{ text: string }> }).richText;
    return rich.map((part) => part.text).join("");
  }
  return String(value);
}

function labelValue(label: string, value: string) {
  return {
    richText: [
      { font: FONT_BOLD, text: `${label} ` },
      { font: FONT_NORMAL, text: value },
    ],
  };
}

function formatHora(value: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

function formatFechaPartes(value: string): { dia: string; mes: string; anio: string } {
  const date = new Date(value);
  return {
    dia: String(date.getDate()),
    mes: new Intl.DateTimeFormat("es-PE", { month: "long" }).format(date),
    anio: String(date.getFullYear()),
  };
}

function formatNumeroActa(numeroActa: string, fechaEntrega: string): string {
  const raw = String(numeroActa || "").trim();
  if (!raw) return "";
  if (/hrcr|uei/i.test(raw)) return raw;
  const year = new Date(fechaEntrega).getFullYear() || new Date().getFullYear();
  return `${raw}-${year}-HRCR-UEI`;
}

function clearItemRow(ws: Worksheet, row: number) {
  for (let col = 1; col <= 6; col++) {
    const cell = ws.getCell(row, col);
    cell.value = "";
    cell.border = TABLE_BORDER;
    cell.font = FONT_NORMAL;
    cell.alignment = {
      horizontal: col === 1 ? "center" : "left",
      vertical: "middle",
      wrapText: true,
    };
  }
  ws.getRow(row).height = 22;
}

function writeItemRow(ws: Worksheet, row: number, index: number, bien: ActaDetalle) {
  const values = [
    String(index + 1).padStart(2, "0"),
    bien.Descripcion || "",
    bien.Marca || "",
    bien.Modelo || "",
    bien.NumeroSerie || "",
    bien.CodigoPatrimonial || "",
  ];

  values.forEach((value, col) => {
    const cell = ws.getCell(row, col + 1);
    cell.value = value;
    cell.border = TABLE_BORDER;
    cell.font = FONT_NORMAL;
    cell.alignment = {
      horizontal: col === 0 ? "center" : "left",
      vertical: "middle",
      wrapText: true,
    };
  });
  ws.getRow(row).height = 22;
}

function fillEquipment(ws: Worksheet, detalles: ActaDetalle[]) {
  const items = detalles.length > 0 ? detalles : [];

  if (items.length > ITEM_SLOTS) {
    const extra = items.length - ITEM_SLOTS;
    ws.spliceRows(ITEM_START + ITEM_SLOTS, 0, ...Array.from({ length: extra }, () => []));
  }

  const slots = Math.max(ITEM_SLOTS, items.length);
  for (let i = 0; i < slots; i++) clearItemRow(ws, ITEM_START + i);
  items.forEach((bien, index) => writeItemRow(ws, ITEM_START + index, index, bien));
}

function findRow(ws: Worksheet, includes: string, from = 1, to = 80): number {
  const needle = includes.toLowerCase();
  for (let row = from; row <= to; row++) {
    if (cellText(ws.getCell(row, 1).value).toLowerCase().includes(needle)) {
      return row;
    }
  }
  return -1;
}

export async function exportActaEntregaExcel(acta: ActaEntrega) {
  const workbook = await loadWorkbookTemplate(ACTA_ENTREGA_TEMPLATE_URL);
  const ws = workbook.worksheets[0];
  if (!ws) {
    throw new Error("No se encontró la plantilla de acta de entrega.");
  }

  const numero = formatNumeroActa(acta.NumeroActa, acta.FechaEntrega);
  const hora = formatHora(acta.FechaRegistro || acta.FechaEntrega);
  const { dia, mes, anio } = formatFechaPartes(acta.FechaEntrega);

  ws.getCell("A3").value = `ACTA N.° ${numero}`;
  ws.getCell("A5").value =
    `En el distrito de San Luis, Provincia de Cañete, siendo las ${hora} horas del día ${dia} de ${mes} del ${anio}, en las instalaciones del Hospital Regional de Cañete “Rezola”, se procede a realizar la entrega y recepción del equipo de cómputo que se detalla a continuación:`;

  ws.getCell("A8").value = labelValue("Nombre:", acta.NombreCreador || "");
  ws.getCell("A9").value = labelValue(
    "Cargo:",
    acta.CargoCreador || DEFAULT_CARGO_ENTREGANTE
  );
  ws.getCell("A10").value = labelValue("Dependencia:", DEFAULT_DEPENDENCIA);

  ws.getCell("A13").value = labelValue("Nombre:", acta.NombreReceptor || "");
  ws.getCell("A14").value = labelValue("Cargo:", acta.CargoReceptor || "");
  ws.getCell("A15").value = labelValue(
    "Servicio/Área:",
    acta.AreaReceptor || acta.ServicioArea || ""
  );

  fillEquipment(ws, acta.Detalles || []);

  const obsTitleRow = findRow(ws, "V. OBSERVACIONES");
  const obsTextRow = obsTitleRow > 0 ? obsTitleRow + 1 : 37;
  const signHeaderRow = findRow(ws, "ENTREGUÉ CONFORME", obsTextRow);
  const nameRow = signHeaderRow > 0 ? signHeaderRow + 2 : 40;
  const cargoRow = nameRow + 1;
  const dniRow = cargoRow + 1;

  ws.getCell(obsTextRow, 1).value =
    (acta.Observaciones || "").trim() || DEFAULT_OBSERVACIONES;

  ws.getCell(nameRow, 1).value = `Nombre: ${acta.NombreCreador || ""}`;
  ws.getCell(nameRow, 4).value = `Nombre: ${acta.NombreReceptor || ""}`;
  ws.getCell(cargoRow, 1).value = acta.CargoCreador || DEFAULT_CARGO_ENTREGANTE;
  ws.getCell(cargoRow, 4).value = `Cargo: ${acta.CargoReceptor || ""}`;
  ws.getCell(dniRow, 1).value = "DNI:";
  ws.getCell(dniRow, 4).value = "DNI:";

  // Una sola hoja / una sola página al imprimir
  while (workbook.worksheets.length > 1) {
    workbook.removeWorksheet(workbook.worksheets[1].id);
  }
  ws.name = "Acta de Entrega";
  ws.pageSetup = {
    ...(ws.pageSetup || {}),
    paperSize: 9,
    orientation: "portrait",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,
    horizontalCentered: true,
    printArea: `A1:F${dniRow}`,
    margins: {
      left: 0.5,
      right: 0.5,
      top: 0.4,
      bottom: 0.4,
      header: 0.15,
      footer: 0.15,
    },
  };
  ws.headerFooter = {
    ...(ws.headerFooter || {}),
    oddFooter: "",
    evenFooter: "",
  };

  await downloadWorkbook(workbook, `Acta_Entrega_${acta.NumeroActa || "export"}.xlsx`);
}
