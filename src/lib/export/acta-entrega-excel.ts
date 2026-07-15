import type { Alignment, Borders, Fill, Font, Worksheet } from "exceljs";
import type { ActaEntrega } from "@/features/soporte/acta-entrega/types";
import { downloadWorkbook } from "./excel-base";

const border: Partial<Borders> = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
const bold: Partial<Font> = { name: "Arial", size: 10, bold: true };
const normal: Partial<Font> = { name: "Arial", size: 10 };
const wrap: Partial<Alignment> = { vertical: "middle", wrapText: true };
const headerFill: Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F2F2" } };
const conditions = [
  "El equipo de cómputo se entrega en buen estado de funcionamiento.",
  "El usuario receptor se compromete a utilizar el equipo exclusivamente para labores institucionales.",
  "El usuario es responsable de la custodia, conservación y uso adecuado del equipo asignado.",
  "Cualquier falla, incidente o traslado del equipo deberá ser comunicado oportunamente a la Unidad de Estadística e Informática.",
  "En caso de cese de funciones, rotación o cambio de dependencia, el equipo deberá ser devuelto mediante la correspondiente acta de entrega.",
];

function text(ws: Worksheet, row: number, value: string, isBold = false) {
  ws.mergeCells(row, 1, row, 6); const cell = ws.getCell(row, 1); cell.value = value; cell.font = isBold ? bold : normal; cell.alignment = { ...wrap, horizontal: "left" };
}

export async function exportActaEntregaExcel(acta: ActaEntrega) {
  const mod = await import("exceljs"); const ExcelJS = mod.default ?? mod; const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet("Acta de Entrega", { pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 2, horizontalCentered: true, margins: { left: .55, right: .55, top: .55, bottom: .55, header: .2, footer: .2 } } });
  ws.columns = [{ width: 8 }, { width: 24 }, { width: 15 }, { width: 18 }, { width: 20 }, { width: 20 }];
  ws.properties.defaultRowHeight = 20;
  text(ws, 2, "ACTA DE ENTREGA Y RECEPCIÓN DE EQUIPO DE CÓMPUTO", true); ws.getCell("A2").font = { ...bold, size: 14 }; ws.getCell("A2").alignment = { horizontal: "center" }; ws.getRow(2).height = 25;
  text(ws, 4, `ACTA N.°     ${acta.NumeroActa}`, true);
  const fecha = new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "long", year: "numeric" }).format(new Date(acta.FechaEntrega));
  const hora = new Intl.DateTimeFormat("es-PE", { hour: "2-digit", minute: "2-digit", hour12: true }).format(new Date(acta.FechaRegistro || acta.FechaEntrega));
  text(ws, 5, `En el distrito de San Luis, Provincia de Cañete, siendo las ${hora} horas del día ${fecha}, en las instalaciones del Hospital Regional de Cañete “Rezola”, se procede a realizar la entrega y recepción del equipo de cómputo que se detalla a continuación:`); ws.getRow(5).height = 62;
  text(ws, 7, "I. DATOS DEL ENTREGANTE", true); text(ws, 8, `Nombre: ${acta.NombreCreador || ""}`); text(ws, 9, `Cargo: ${acta.CargoCreador || "Jefe de la Unidad de Estadística e Informática"}`); text(ws, 10, "Dependencia: Unidad de Estadística e Informática");
  text(ws, 13, "II. DATOS DEL RECEPTOR", true); text(ws, 14, `Nombre: ${acta.NombreReceptor}`); text(ws, 15, `Cargo: ${acta.CargoReceptor || ""}`); text(ws, 16, `Servicio/Área: ${acta.AreaReceptor || acta.ServicioArea || ""}`);
  text(ws, 19, "III. DESCRIPCIÓN DEL EQUIPO ENTREGADO", true);
  const headers = ["Ítem", "Descripción", "Marca", "Modelo", "N.° Serie", "Código Patrimonial"];
  headers.forEach((value, index) => { const cell = ws.getCell(20, index + 1); cell.value = value; cell.font = bold; cell.fill = headerFill; cell.border = border; cell.alignment = { ...wrap, horizontal: "center" }; }); ws.getRow(20).height = 35;
  (acta.Detalles || []).forEach((bien, index) => { const row = ws.getRow(21 + index); row.values = [String(index + 1).padStart(2, "0"), bien.Descripcion || "-", bien.Marca || "-", bien.Modelo || "-", bien.NumeroSerie || "-", bien.CodigoPatrimonial || "-"]; row.eachCell((cell) => { cell.font = normal; cell.border = border; cell.alignment = wrap; }); row.height = 34; });
  const conditionTitle = 23 + Math.max(acta.Detalles?.length || 0, 1); text(ws, conditionTitle, "IV. CONDICIONES DE ENTREGA", true);
  conditions.forEach((value, index) => { text(ws, conditionTitle + 2 + index * 2, `${index + 1}.     ${value}`); ws.getRow(conditionTitle + 2 + index * 2).height = 43; });

  const secondPage = Math.max(48, conditionTitle + 14); ws.getRow(secondPage - 1).addPageBreak();
  text(ws, secondPage + 2, "V. OBSERVACIONES", true); text(ws, secondPage + 4, acta.Observaciones || "No habiendo observaciones adicionales, ambas partes firman la presente acta en señal de conformidad."); ws.getRow(secondPage + 4).height = 60;
  const signRow = secondPage + 8;
  ws.mergeCells(signRow, 1, signRow, 3); ws.mergeCells(signRow, 4, signRow, 6); ws.getCell(signRow, 1).value = "ENTREGUÉ CONFORME"; ws.getCell(signRow, 4).value = "RECIBÍ CONFORME";
  for (let r = signRow; r <= signRow + 7; r++) { for (let c = 1; c <= 6; c++) { ws.getCell(r, c).border = border; ws.getCell(r, c).font = normal; ws.getCell(r, c).alignment = wrap; } }
  [signRow + 1, signRow + 2, signRow + 3].forEach((r) => { ws.mergeCells(r, 1, r, 3); ws.mergeCells(r, 4, r, 6); }); ws.getRow(signRow + 1).height = 105;
  ws.getCell(signRow + 2, 1).value = `Nombre: ${acta.NombreCreador || ""}`; ws.getCell(signRow + 2, 4).value = `Nombre: ${acta.NombreReceptor}`;
  ws.getCell(signRow + 3, 1).value = acta.CargoCreador || "Jefe de la Unidad de Estadística e Informática"; ws.getCell(signRow + 3, 4).value = `Cargo: ${acta.CargoReceptor || ""}`; ws.getRow(signRow + 3).height = 55;
  ws.mergeCells(signRow + 4, 1, signRow + 4, 3); ws.mergeCells(signRow + 4, 4, signRow + 4, 6); ws.getCell(signRow + 4, 1).value = "DNI:"; ws.getCell(signRow + 4, 4).value = "DNI:";
  ws.pageSetup.printArea = `A1:F${signRow + 5}`; ws.headerFooter.oddFooter = "Página &P de &N";
  await downloadWorkbook(workbook, `Acta_Entrega_${acta.NumeroActa}.xlsx`);
}
