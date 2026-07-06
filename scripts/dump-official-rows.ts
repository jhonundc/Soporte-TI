import ExcelJS from "exceljs";

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile("public/templates/ficha-soporte-oficial-ref.xlsx");
const ws = wb.worksheets[0]!;

for (let r = 29; r <= 76; r++) {
  const parts: string[] = [];
  for (let c = 2; c <= 31; c++) {
    const v = ws.getCell(r, c).value;
    if (v == null || v === "") continue;
    const L = c <= 26 ? String.fromCharCode(64 + c) : "A" + String.fromCharCode(64 + c - 26);
    let t = typeof v === "string" ? v : v instanceof Date ? v.toLocaleDateString("es-PE") : String(v);
    if (t.length > 45) t = t.slice(0, 45) + "...";
    parts.push(`${L}${r}=${t}`);
  }
  if (parts.length) console.log(`R${r}`, parts.join(" | "));
}
