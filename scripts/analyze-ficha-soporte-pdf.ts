import fs from "node:fs";
import path from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const pdfPath = path.join(
  process.cwd(),
  "public/templates/ficha-soporte-oficial.pdf"
);

const data = new Uint8Array(fs.readFileSync(pdfPath));
const doc = await getDocument({ data, useSystemFonts: true }).promise;
const page = await doc.getPage(1);
const viewport = page.getViewport({ scale: 1 });
const content = await page.getTextContent();

type Item = { str: string; x: number; y: number; w: number; h: number };

const items: Item[] = content.items
  .map((it) => {
    if (!("str" in it)) return null;
    return {
      str: it.str,
      x: Math.round(it.transform[4]),
      y: Math.round(viewport.height - it.transform[5]),
      w: Math.round(it.width),
      h: Math.round(it.height),
    };
  })
  .filter((it): it is Item => Boolean(it?.str.trim()));

items.sort((a, b) => a.y - b.y || a.x - b.x);

for (const item of items) {
  console.log(`${item.y}\t${item.x}\t${item.str}`);
}

console.log("\nviewport", viewport.width, "x", viewport.height);
