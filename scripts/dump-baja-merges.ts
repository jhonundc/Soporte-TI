import ExcelJS from "exceljs";

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile("public/templates/ficha-baja.xlsx");
const ws = wb.worksheets[0]!;
const merges = ((ws.model as { merges?: string[] }).merges || []).sort();
for (const m of merges) console.log(m);
