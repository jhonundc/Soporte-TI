"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileSpreadsheet, Printer } from "lucide-react";
import { exportFichaSoporteExcel } from "@/lib/export/ficha-soporte-excel";
import { printFichaSoporte } from "@/lib/print/ficha-print-template";
import type { FichaSoporteRecord } from "@/features/soporte/ficha/types";

interface FichaPrintSectionProps {
  printActionOpen: boolean;
  onPrintActionOpenChange: (open: boolean) => void;
  selectedFicha: FichaSoporteRecord | null;
}

export function FichaPrintSection({
  printActionOpen,
  onPrintActionOpenChange,
  selectedFicha,
}: FichaPrintSectionProps) {
  const handlePrint = (ficha: FichaSoporteRecord) => {
    onPrintActionOpenChange(false);
    printFichaSoporte(ficha);
  };

  const handleExportExcel = async (ficha: FichaSoporteRecord) => {
    await exportFichaSoporteExcel(ficha as Parameters<typeof exportFichaSoporteExcel>[0]);
    onPrintActionOpenChange(false);
  };

  return (
    <Dialog open={printActionOpen} onOpenChange={onPrintActionOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Exportar / Imprimir Ficha</DialogTitle>
          <DialogDescription>
            ¿Qué desea hacer con la ficha{" "}
            <span className="font-semibold text-foreground">{selectedFicha?.NumeroFicha}</span>?
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center gap-4 py-6">
          <Button
            className="flex h-32 flex-1 flex-col gap-3 shadow-[var(--shadow-soft)] transition-transform hover:scale-[1.02]"
            onClick={() => selectedFicha && handlePrint(selectedFicha)}
          >
            <Printer className="size-10" aria-hidden="true" />
            <span className="text-base font-semibold">Imprimir PDF</span>
          </Button>
          <Button
            variant="outline"
            className="flex h-32 flex-1 flex-col gap-3 border-success/30 bg-success/10 text-success shadow-[var(--shadow-soft)] transition-transform hover:scale-[1.02] hover:bg-success/15 hover:text-success"
            onClick={() => selectedFicha && handleExportExcel(selectedFicha)}
          >
            <FileSpreadsheet className="size-10" aria-hidden="true" />
            <span className="text-base font-semibold">Descargar Excel</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
