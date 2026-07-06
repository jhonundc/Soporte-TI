import fs from "node:fs";
import path from "node:path";
import { getDocument, OPS } from "pdfjs-dist/legacy/build/pdf.mjs";

const pdfPath = path.join(process.cwd(), "public/templates/ficha-soporte-oficial.pdf");
const data = new Uint8Array(fs.readFileSync(pdfPath));
const doc = await getDocument({ data }).promise;
const page = await doc.getPage(1);
const viewport = page.getViewport({ scale: 1 });
const opList = await page.getOperatorList();

let rects = 0;
let lines = 0;
for (let i = 0; i < opList.fnArray.length; i++) {
  const fn = opList.fnArray[i];
  if (fn === OPS.rectangle) rects++;
  if (fn === OPS.moveTo || fn === OPS.lineTo) lines++;
}

console.log("rectangles", rects, "line ops", lines, "total ops", opList.fnArray.length);

// Sample text again with row estimate (A4 ~792pt, ~90 rows)
const content = await page.getTextContent();
for (const it of content.items) {
  if (!("str" in it) || !it.str.trim()) continue;
  const y = viewport.height - it.transform[5];
  const x = it.transform[4];
  const row = Math.max(1, Math.round((y / 792) * 90));
  const col = Math.max(1, Math.round((x / 612) * 31));
  console.log(`R${row} C${col} (${Math.round(x)},${Math.round(y)}): ${it.str.slice(0, 40)}`);
}
