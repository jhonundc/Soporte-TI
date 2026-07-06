import ExcelJS from "exceljs";

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile("public/templates/ficha-baja.xlsx");
const ws = wb.worksheets[0]!;
for (let r = 75; r <= 85; r++) {
  const parts: string[] = [];
  for (let c = 2; c <= 31; c++) {
    const v = ws.getCell(r, c).value;
    if (v) parts.push(`${c}:${String(v).slice(0, 25)}`);
  }
  if (parts.length) console.log("R" + r, parts.join("|"));
}
