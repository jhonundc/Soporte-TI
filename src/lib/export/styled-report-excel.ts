import { downloadWorkbook } from "./excel-base";

type ReportColumn = { header: string; key: string; width?: number };

export async function exportStyledReportExcel(params: {
  title: string;
  subtitle?: string;
  sheetName: string;
  filename: string;
  columns: ReportColumn[];
  rows: Record<string, unknown>[];
  filters?: string[];
}) {
  const mod = await import("exceljs");
  const ExcelJS = mod.default ?? mod;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sistema de Soporte TI";
  workbook.created = new Date();
  const ws = workbook.addWorksheet(params.sheetName.slice(0, 31), {
    pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, horizontalCentered: true, margins: { left: .35, right: .35, top: .5, bottom: .5, header: .2, footer: .25 } },
  });
  const count = params.columns.length;
  ws.columns = params.columns.map((column) => ({ key: column.key, width: column.width || 18 }));
  ws.mergeCells(2, 1, 2, count);
  const title = ws.getCell(2, 1); title.value = params.title.toUpperCase(); title.font = { name: "Arial", size: 18, bold: true, color: { argb: "FF174EA6" } }; title.alignment = { horizontal: "center", vertical: "middle" }; ws.getRow(2).height = 30;
  ws.mergeCells(3, 1, 3, count); const subtitle = ws.getCell(3, 1); subtitle.value = params.subtitle || "Hospital Regional de Cañete - Rezola"; subtitle.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF475569" } }; subtitle.alignment = { horizontal: "center" };
  const generatedRow = 5; ws.mergeCells(generatedRow, 1, generatedRow, count); ws.getCell(generatedRow, 1).value = `Generado: ${new Date().toLocaleString("es-PE")}`; ws.getCell(generatedRow, 1).font = { name: "Arial", size: 9, italic: true, color: { argb: "FF64748B" } };
  let headerRow = 7;
  if (params.filters?.length) { ws.mergeCells(6, 1, 6, count); ws.getCell(6, 1).value = `Filtros: ${params.filters.join("  •  ")}`; ws.getCell(6, 1).font = { name: "Arial", size: 9, color: { argb: "FF475569" } }; ws.getCell(6, 1).alignment = { wrapText: true }; headerRow = 8; }
  params.columns.forEach((column, index) => { const cell = ws.getCell(headerRow, index + 1); cell.value = column.header; cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } }; cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF174EA6" } }; cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }; cell.border = { top: { style: "thin", color: { argb: "FF123B7A" } }, left: { style: "thin", color: { argb: "FF123B7A" } }, bottom: { style: "thin", color: { argb: "FF123B7A" } }, right: { style: "thin", color: { argb: "FF123B7A" } } }; }); ws.getRow(headerRow).height = 30;
  params.rows.forEach((data, rowIndex) => { const row = ws.getRow(headerRow + rowIndex + 1); params.columns.forEach((column, columnIndex) => { const cell = row.getCell(columnIndex + 1); const value = data[column.key]; cell.value = value instanceof Date ? value : String(value ?? ""); cell.font = { name: "Arial", size: 9 }; cell.alignment = { vertical: "middle", wrapText: true }; cell.border = { top: { style: "thin", color: { argb: "FFD8E0EA" } }, left: { style: "thin", color: { argb: "FFD8E0EA" } }, bottom: { style: "thin", color: { argb: "FFD8E0EA" } }, right: { style: "thin", color: { argb: "FFD8E0EA" } } }; if (rowIndex % 2 === 1) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F6FA" } }; }); row.height = 27; });
  const endRow = headerRow + Math.max(params.rows.length, 1); ws.autoFilter = { from: { row: headerRow, column: 1 }, to: { row: endRow, column: count } }; ws.views = [{ state: "frozen", ySplit: headerRow, activeCell: `A${headerRow + 1}` }]; ws.pageSetup.printTitlesRow = `${headerRow}:${headerRow}`; ws.pageSetup.printArea = `A1:${ws.getColumn(count).letter}${endRow}`; ws.headerFooter.oddFooter = "Página &P de &N";
  await downloadWorkbook(workbook, params.filename.endsWith(".xlsx") ? params.filename : `${params.filename}.xlsx`);
}
