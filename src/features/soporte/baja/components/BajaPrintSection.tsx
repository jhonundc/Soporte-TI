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
import { exportFichaBajaExcel } from "@/lib/export/ficha-baja-excel";
import { openBajaPrintWindow } from "@/lib/print/baja-print-template";
import { notify } from "@/lib/feedback/toast";
import type { BajaRecord, BienRef } from "@/features/soporte/baja/types";

interface BajaPrintSectionProps {
  printActionOpen: boolean;
  onPrintActionOpenChange: (open: boolean) => void;
  selectedBaja: BajaRecord | null;
  bienes?: BienRef[];
}

export function BajaPrintSection({
  printActionOpen,
  onPrintActionOpenChange,
  selectedBaja,
  bienes,
}: BajaPrintSectionProps) {
  const getBienExtra = (baja: BajaRecord) =>
    bienes?.find((b) => String(b.IdBien) === String(baja.IdBien)) || null;

  const handlePrint = (baja: BajaRecord) => {
    onPrintActionOpenChange(false);
    openBajaPrintWindow(baja, getBienExtra(baja));
  };

  const handleExportExcel = async (baja: BajaRecord) => {
    try {
      await exportFichaBajaExcel(baja, getBienExtra(baja));
      onPrintActionOpenChange(false);
    } catch (error) {
      notify.fromError(error, "No se pudo generar el Excel. Intente de nuevo.");
    }
  };

  return (
    <Dialog open={printActionOpen} onOpenChange={onPrintActionOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Exportar / Imprimir Ficha</DialogTitle>
          <DialogDescription>
            ¿Qué desea hacer con la ficha{" "}
            <span className="font-semibold text-foreground">{selectedBaja?.NumeroFichaBaja}</span>?
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center gap-4 py-6">
          <Button
            className="flex h-32 flex-1 flex-col gap-3 shadow-[var(--shadow-soft)] transition-transform hover:scale-[1.02]"
            onClick={() => selectedBaja && handlePrint(selectedBaja)}
          >
            <Printer className="size-10" aria-hidden="true" />
            <span className="text-base font-semibold">Imprimir PDF</span>
          </Button>
          <Button
            variant="outline"
            className="flex h-32 flex-1 flex-col gap-3 border-success/30 bg-success/10 text-success shadow-[var(--shadow-soft)] transition-transform hover:scale-[1.02] hover:bg-success/15 hover:text-success"
            onClick={() => selectedBaja && handleExportExcel(selectedBaja)}
          >
            <FileSpreadsheet className="size-10" aria-hidden="true" />
            <span className="text-base font-semibold">Descargar Excel</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
