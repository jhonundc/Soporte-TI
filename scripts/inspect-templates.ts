import ExcelJS from "exceljs";

async function inspect(file: string) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);
  const ws = wb.worksheets[0]!;
  console.log(`\n=== ${file} ===`);
  console.log("pageSetup scale:", ws.pageSetup.scale, "fit:", ws.pageSetup.fitToWidth, ws.pageSetup.fitToHeight);
  console.log("centered:", ws.pageSetup.horizontalCentered, ws.pageSetup.verticalCentered);
  console.log("view style:", (ws.views?.[0] as { style?: string })?.style);
  console.log("images:", ws.getImages?.()?.length ?? 0);
  const merges = ((ws.model as { merges?: string[] }).merges || []).sort();
  console.log("merges:", merges.length);
  console.log("has B4:AE4:", merges.includes("B4:AE4"));
  console.log("B4:", ws.getCell("B4").value);
  let totalW = 0;
  for (let c = 2; c <= 31; c++) totalW += ws.getColumn(c).width || 0;
  console.log("col width sum B-AE:", totalW.toFixed(1));
}

await inspect("public/templates/ficha-baja.xlsx");
await inspect("public/templates/ficha-soporte.xlsx");

// Round-trip test (simula export en navegador)
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile("public/templates/ficha-soporte.xlsx");
const buf = await wb.xlsx.writeBuffer();
await wb.xlsx.load(buf);
const ws = wb.worksheets[0]!;
console.log("\n=== after round-trip ===");
console.log("images:", ws.getImages?.()?.length ?? 0);
console.log("view style:", (ws.views?.[0] as { style?: string })?.style);
console.log("pageSetup scale:", ws.pageSetup.scale);
