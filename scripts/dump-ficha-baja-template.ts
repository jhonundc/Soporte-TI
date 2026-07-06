import ExcelJS from "exceljs";

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile("public/templates/ficha-baja.xlsx");
const ws = wb.worksheets[0]!;

for (let r = 1; r <= 85; r++) {
  const parts: string[] = [];
  for (let c = 2; c <= 31; c++) {
    const v = ws.getCell(r, c).value;
    if (v && typeof v === "string" && v.trim()) {
      const col = String.fromCharCode(64 + (c <= 26 ? c : 0));
      const addr = c <= 26 ? `${String.fromCharCode(64 + c)}${r}` : `?${r}`;
      parts.push(`${addr}:${v.replace(/\n/g, "|").slice(0, 35)}`);
    }
  }
  if (parts.length) console.log(`R${r}`, parts.join(" | "));
}

const merges = ((ws.model as { merges?: string[] }).merges || []).sort();
console.log("\nmerges count", merges.length);
for (const m of merges.filter((x) => {
  const row = parseInt(m.split(":")[0]?.replace(/\D/g, "") || "0", 10);
  return row >= 18 && row <= 65;
})) {
  console.log(m);
}
