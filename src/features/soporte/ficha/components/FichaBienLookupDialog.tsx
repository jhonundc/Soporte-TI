"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IconInput } from "@/components/forms/IconInput";
import { Search } from "lucide-react";
import type { BienRef } from "@/features/soporte/ficha/types";

interface FichaBienLookupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAreaName?: string;
  lookupSearch: string;
  onLookupSearchChange: (value: string) => void;
  bienes: BienRef[];
  onSelect: (bien: BienRef) => void;
  onCancel: () => void;
}

export function FichaBienLookupDialog({
  open,
  onOpenChange,
  selectedAreaName,
  lookupSearch,
  onLookupSearchChange,
  bienes,
  onSelect,
  onCancel,
}: FichaBienLookupDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Buscar Activo / Bien</DialogTitle>
          <DialogDescription>
            {selectedAreaName
              ? `Mostrando equipos asignados a la dependencia: ${selectedAreaName}`
              : "Mostrando todos los equipos disponibles (seleccione un área en el formulario para filtrar)"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 flex-col space-y-4 overflow-hidden py-2">
          <IconInput
            icon={Search}
            placeholder="Buscar por Descripción, N° Serie, Cód. Patrimonial o Cód. Inventario..."
            value={lookupSearch}
            onChange={(e) => onLookupSearchChange(e.target.value)}
          />

          <div className="surface-panel max-h-[450px] flex-1 overflow-y-auto">
            <table className="w-full border-collapse text-left text-xs text-muted-foreground">
              <thead className="sticky top-0 z-10 border-b border-border bg-muted/50 text-[10px] font-semibold tracking-wide text-foreground uppercase">
                <tr>
                  <th className="px-4 py-3">Cód. Inventario</th>
                  <th className="px-4 py-3">Cód. Patrimonial</th>
                  <th className="px-4 py-3">Descripción</th>
                  <th className="px-4 py-3">Marca / Modelo</th>
                  <th className="px-4 py-3">N° Serie</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {bienes.length > 0 ? (
                  bienes.map((bien) => (
                    <tr key={bien.IdBien} className="transition-colors duration-150 hover:bg-muted/40">
                      <td className="px-4 py-3 font-medium text-foreground">
                        {bien.CodigoInventario || "-"}
                      </td>
                      <td className="px-4 py-3">{bien.CodigoPatrimonial || "-"}</td>
                      <td className="px-4 py-3 font-semibold text-foreground">{bien.Descripcion}</td>
                      <td className="px-4 py-3">
                        {bien.Marca?.Marca || "-"} / {bien.Modelo?.Modelo || "-"}
                      </td>
                      <td className="px-4 py-3 font-medium">{bien.NumeroSerie || "-"}</td>
                      <td className="px-4 py-3 text-right">
                        <Button type="button" size="sm" onClick={() => onSelect(bien)}>
                          Seleccionar
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                      No se encontraron equipos que coincidan con la búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <DialogFooter className="mt-2 border-t border-border pt-3">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
