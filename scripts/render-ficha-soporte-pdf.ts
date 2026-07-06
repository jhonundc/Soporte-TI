/**
 * Renderiza el PDF oficial a PNG (referencia visual).
 * Uso: npx tsx scripts/render-ficha-soporte-pdf.ts
 */
import fs from "node:fs";
import path from "node:path";
import { createCanvas } from "canvas";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const pdfPath = path.join(process.cwd(), "public/templates/ficha-soporte-oficial.pdf");
const outPath = path.join(process.cwd(), "public/templates/ficha-soporte-reference.png");

const data = new Uint8Array(fs.readFileSync(pdfPath));
const doc = await getDocument({ data, useSystemFonts: true }).promise;
const page = await doc.getPage(1);
const scale = 2;
const viewport = page.getViewport({ scale });
const canvas = createCanvas(viewport.width, viewport.height);
const ctx = canvas.getContext("2d");

await page.render({
  canvas: canvas as unknown as HTMLCanvasElement,
  canvasContext: ctx as unknown as CanvasRenderingContext2D,
  viewport,
}).promise;

fs.writeFileSync(outPath, canvas.toBuffer("image/png"));
console.log("PNG generado:", outPath, viewport.width, "x", viewport.height);
