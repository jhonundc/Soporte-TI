/**
 * Análisis exhaustivo de plantilla oficial de soporte.
 * Uso: npx tsx scripts/analyze-ficha-soporte-oficial.ts [archivo]
 */
import ExcelJS from "exceljs";
import path from "node:path";

const file =
  process.argv[2] ||
  path.join(process.cwd(), "public/templates/ficha-soporte-oficial-ref.xlsx");

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(file);
const ws = wb.worksheets[0]!;

console.log("FILE:", file);
console.log("SHEET:", ws.name);
console.log("pageSetup:", JSON.stringify(ws.pageSetup, null, 2));
console.log("views:", JSON.stringify(ws.views));
console.log("images:", ws.getImages?.()?.length ?? 0);

const merges = ((ws.model as { merges?: string[] }).merges || []).sort();
console.log("\nMERGES (" + merges.length + "):");
merges.forEach((m) => console.log(" ", m));

console.log("\nCOLUMN WIDTHS (B-AE):");
const widths: string[] = [];
for (let c = 2; c <= 31; c++) {
  const letter = c <= 26 ? String.fromCharCode(64 + c) : "A" + String.fromCharCode(64 + c - 26);
  widths.push(`${letter}:${ws.getColumn(c).width?.toFixed(2) ?? "def"}`);
}
console.log(widths.join(" "));

console.log("\nROW HEIGHTS (1-85, non-default):");
for (let r = 1; r <= 85; r++) {
  const h = ws.getRow(r).height;
  if (h && h !== 15) console.log(` R${r}: ${h}`);
}

console.log("\nCELLS WITH CONTENT (rows 1-85):");
for (let r = 1; r <= 85; r++) {
  const parts: string[] = [];
  for (let c = 2; c <= 31; c++) {
    const cell = ws.getCell(r, c);
    const v = cell.value;
    if (v == null || v === "") continue;
    const letter = c <= 26 ? String.fromCharCode(64 + c) : "A" + String.fromCharCode(64 + c - 26);
    const addr = `${letter}${r}`;
    let text = "";
    if (typeof v === "string") text = v.replace(/\n/g, "|");
    else if (typeof v === "number") text = String(v);
    else if (typeof v === "object" && v && "richText" in v)
      text = (v as { richText: { text: string }[] }).richText.map((t) => t.text).join("");
    else text = String(v);
    const chk = text === "X" || text === "x" ? "[X]" : text.slice(0, 40);
    parts.push(`${addr}=${chk}`);
  }
  if (parts.length) console.log(`R${r}: ${parts.join(" | ")}`);
}

console.log("\nCHECKBOX-LIKE CELLS (X/x):");
for (let r = 1; r <= 85; r++) {
  for (let c = 2; c <= 31; c++) {
    const v = ws.getCell(r, c).value;
    if (v === "X" || v === "x") {
      const letter = c <= 26 ? String.fromCharCode(64 + c) : "A" + String.fromCharCode(64 + c - 26);
      console.log(` ${letter}${r}`);
    }
  }
}
