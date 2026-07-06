import ExcelJS from "exceljs";

for (const file of ["public/templates/ficha-baja.xlsx", "public/templates/ficha-soporte.xlsx"]) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);
  const ws = wb.worksheets[0]!;
  console.log("\n===", file, "===");
  for (let r = 18; r <= 65; r++) {
    const parts: string[] = [];
    for (let c = 2; c <= 31; c++) {
      const v = ws.getCell(r, c).value;
      const b = ws.getCell(r, c).border;
      const hasBorder = b && (b.top || b.bottom || b.left || b.right);
      if (v || hasBorder) {
        const col = c <= 26 ? String.fromCharCode(64 + c) : "A" + String.fromCharCode(64 + c - 26);
        if (v) parts.push(`${col}${v ? ":" + String(v).replace(/\n/g, "|").slice(0, 20) : ""}`);
        else if (hasBorder) parts.push(`${col}:_`);
      }
    }
    if (parts.length) console.log(`R${r}`, parts.join(" "));
  }
}
