"use client";
import { FileSpreadsheet, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { exportActaEntregaExcel } from "@/lib/export/acta-entrega-excel";
import { openActaEntregaPrintWindow } from "@/lib/print/acta-entrega-print-template";
import type { ActaEntrega } from "./types";

export function ActaEntregaPrintSection({ open, onOpenChange, acta }: { open: boolean; onOpenChange: (open: boolean) => void; acta: ActaEntrega | null }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="rounded-2xl sm:max-w-md"><DialogHeader><DialogTitle className="text-xl font-semibold">Exportar / Imprimir Acta</DialogTitle><DialogDescription>¿Qué desea hacer con el acta <span className="font-semibold text-foreground">{acta?.NumeroActa}</span>?</DialogDescription></DialogHeader><div className="flex justify-center gap-4 py-6"><Button className="flex h-32 flex-1 flex-col gap-3 shadow-[var(--shadow-soft)] transition-transform hover:scale-[1.02]" onClick={() => { if (acta) { onOpenChange(false); openActaEntregaPrintWindow(acta); } }}><Printer className="size-10" /><span className="text-base font-semibold">Imprimir PDF</span></Button><Button variant="outline" className="flex h-32 flex-1 flex-col gap-3 border-success/30 bg-success/10 text-success shadow-[var(--shadow-soft)] transition-transform hover:scale-[1.02] hover:bg-success/15 hover:text-success" onClick={async () => { if (!acta) return; try { await exportActaEntregaExcel(acta); onOpenChange(false); } catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo generar el Excel"); } }}><FileSpreadsheet className="size-10" /><span className="text-base font-semibold">Descargar Excel</span></Button></div></DialogContent></Dialog>;
}
