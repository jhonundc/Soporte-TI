import fs from "fs";

const page = fs.readFileSync("src/app/(dashboard)/soporte/ficha/page.tsx", "utf8");
const lines = page.split("\n");
const extract = (start, end) => lines.slice(start - 1, end).join("\n");

const printFn = extract(484, 1034);
const printTemplate =
  `import { openPrintWindow } from "@/lib/print/open-print-window";\n` +
  `import type { FichaSoporteRecord } from "@/features/soporte/ficha/types";\n\n` +
  printFn
    .replace("const handlePrintTicket = (ficha: any) => {", "export function printFichaSoporte(ficha: FichaSoporteRecord) {")
    .replace("setPrintActionOpen(false);\n\n    ", "");

fs.mkdirSync("src/lib/print", { recursive: true });
fs.writeFileSync("src/lib/print/ficha-print-template.ts", printTemplate);
console.log("written", printTemplate.length);
