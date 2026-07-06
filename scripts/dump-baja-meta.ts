import ExcelJS from "exceljs";

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile("public/templates/ficha-baja.xlsx");
const ws = wb.worksheets[0]!;
console.log("pageSetup", JSON.stringify(ws.pageSetup, null, 2));
console.log("views", JSON.stringify(ws.views));
console.log("images", ws.getImages?.()?.length ?? 0);
const widths: string[] = [];
for (let c = 2; c <= 31; c++) {
  widths.push(`${String.fromCharCode(64 + (c <= 26 ? c : 65 + (c - 27)))}:${ws.getColumn(c).width?.toFixed(2) ?? "def"}`);
}
console.log("widths", widths.join(" "));
