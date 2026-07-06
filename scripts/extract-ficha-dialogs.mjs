import fs from "fs";

const page = fs.readFileSync("src/app/(dashboard)/soporte/ficha/page.tsx", "utf8");
const lines = page.split("\n");
const extract = (start, end) => lines.slice(start - 1, end).join("\n");

const viewJsx = extract(1591, 1839);
const printDialogJsx = extract(1841, 1867);
const printStylesJsx = extract(1964, 2055);
const hiddenPrintJsx = extract(2057, 2185);

const viewComponent =
  `"use client";\n\n` +
  `import { Button } from "@/components/ui/button";\n` +
  `import {\n  Dialog,\n  DialogContent,\n  DialogDescription,\n  DialogHeader,\n  DialogTitle,\n} from "@/components/ui/dialog";\n` +
  `import type { FichaSoporteRecord } from "@/features/soporte/ficha/types";\n\n` +
  `interface FichaViewDialogProps {\n` +
  `  open: boolean;\n` +
  `  onOpenChange: (open: boolean) => void;\n` +
  `  ficha: FichaSoporteRecord | null;\n` +
  `}\n\n` +
  `export function FichaViewDialog({ open, onOpenChange, ficha }: FichaViewDialogProps) {\n` +
  `  return (\n` +
  viewJsx
    .replace(/verOpen/g, "open")
    .replace(/setVerOpen/g, "onOpenChange")
    .replace(/viewingFicha/g, "ficha")
    .replace(/\{viewingFicha && \(/, "{ficha ? (")
    .replace(/\{viewingFicha &&/, "{ficha ?")
  +
  `\n  );\n}\n`;

const printComponent =
  `"use client";\n\n` +
  `import { Button } from "@/components/ui/button";\n` +
  `import {\n  Dialog,\n  DialogContent,\n  DialogDescription,\n  DialogHeader,\n  DialogTitle,\n} from "@/components/ui/dialog";\n` +
  `import { FileSpreadsheet, Printer } from "lucide-react";\n` +
  `import { exportFichaSoporteExcel } from "@/lib/export/ficha-soporte-excel";\n` +
  `import { printFichaSoporte } from "@/lib/print/ficha-print-template";\n` +
  `import type { FichaSoporteRecord } from "@/features/soporte/ficha/types";\n\n` +
  `interface FichaPrintSectionProps {\n` +
  `  printActionOpen: boolean;\n` +
  `  onPrintActionOpenChange: (open: boolean) => void;\n` +
  `  selectedFicha: FichaSoporteRecord | null;\n` +
  `}\n\n` +
  `export function FichaPrintSection({\n` +
  `  printActionOpen,\n` +
  `  onPrintActionOpenChange,\n` +
  `  selectedFicha,\n` +
  `}: FichaPrintSectionProps) {\n` +
  `  const handlePrint = (ficha: FichaSoporteRecord) => {\n` +
  `    onPrintActionOpenChange(false);\n` +
  `    printFichaSoporte(ficha);\n` +
  `  };\n\n` +
  `  const handleExportExcel = async (ficha: FichaSoporteRecord) => {\n` +
  `    await exportFichaSoporteExcel(ficha);\n` +
  `    onPrintActionOpenChange(false);\n` +
  `  };\n\n` +
  `  return (\n` +
  `    <>\n` +
  printDialogJsx
    .replace(/setPrintActionOpen/g, "onPrintActionOpenChange")
    .replace(/selectedFichaForPrint/g, "selectedFicha")
    .replace(/handlePrintTicket\(selectedFicha\)/g, "handlePrint(selectedFicha!)")
    .replace(/handleExportSingleExcel\(selectedFicha\)/g, "handleExportExcel(selectedFicha!)")
  +
  `\n` +
  printStylesJsx.replace(/selectedFichaForPrint/g, "selectedFicha") +
  `\n` +
  hiddenPrintJsx.replace(/selectedFichaForPrint/g, "selectedFicha") +
  `\n    </>\n  );\n}\n`;

fs.mkdirSync("src/features/soporte/ficha/components", { recursive: true });
fs.writeFileSync("src/features/soporte/ficha/components/FichaViewDialog.tsx", viewComponent);
fs.writeFileSync("src/features/soporte/ficha/components/FichaPrintSection.tsx", printComponent);
console.log("view", viewComponent.length, "print", printComponent.length);
