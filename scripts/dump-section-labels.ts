import ExcelJS from "exceljs";

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile("public/templates/ficha-soporte-oficial-ref.xlsx");
const ws = wb.worksheets[0]!;

for (let r = 39; r <= 58; r++) {
  const v = ws.getCell(`B${r}`).value;
  if (v) console.log(`B${r}:`, String(v).slice(0, 60));
}

// Patrimonial data cell
console.log("G26:", ws.getCell("G26").value);
console.log("G24:", ws.getCell("G24").value);
