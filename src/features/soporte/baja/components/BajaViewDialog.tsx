"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DialogPrintStyles } from "@/lib/print/dialog-print-styles";
import { TIPO_BIEN_OPTIONS, type BajaRecord, type BienRef } from "@/features/soporte/baja/types";

interface BajaViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  baja: BajaRecord | null;
  bienes?: BienRef[];
}

export function BajaViewDialog({ open, onOpenChange, baja, bienes }: BajaViewDialogProps) {
  const bienDetails = useMemo(() => {
    if (!baja) return null;
    const fromList = bienes?.find((b) => String(b.IdBien) === String(baja.IdBien));
    return { ...(fromList || {}), ...(baja.Bien || {}) } as BienRef;
  }, [baja, bienes]);

  const condicionLabel = baja?.Condicion?.Condicion || "";
  const estadoLabel = baja?.Estado?.EstadoBien || "";

  return (
    <>
      <DialogPrintStyles />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl print:max-h-none print:border-none print:p-0 print:shadow-none">
          <DialogHeader className="print:hidden">
            <DialogTitle>Detalle de ficha de baja</DialogTitle>
          </DialogHeader>

          {baja ? (
            <div
              id="printable-baja"
              className="space-y-6 rounded-xl border border-slate-200 bg-white p-4 text-slate-800 print:border-none print:p-0"
            >
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                <div className="text-left">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    UNIDAD DE ESTADISTICA E INFORMATICA
                  </p>
                  <h2 className="mt-1 text-base font-extrabold text-slate-800">
                    FICHA DE BAJA DE BIENES
                  </h2>
                </div>
                <div className="text-right">
                  <p className="inline-block rounded border bg-slate-100 px-3 py-1 text-xs font-bold text-slate-800">
                    Nº {baja.NumeroFichaBaja || "-"}
                  </p>
                  <p className="mt-1.5 text-[10px] text-slate-500">
                    Fecha:{" "}
                    {baja.FechaRegistro
                      ? new Date(baja.FechaRegistro).toLocaleString()
                      : "-"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 rounded border bg-slate-50 p-3 text-[11px] text-slate-700">
                <div>
                  <span className="block font-bold text-slate-500">RESPONSABLE DEL BIEN</span>
                  <span className="text-xs font-medium text-slate-800">
                    {baja.Responsable || "-"}
                  </span>
                </div>
                <div>
                  <span className="block font-bold text-slate-500">DEPENDENCIA (ÁREA)</span>
                  <span className="text-xs font-medium text-slate-800">
                    {baja.Dependencia || "-"}
                  </span>
                </div>
                <div>
                  <span className="block font-bold text-slate-500">AMBIENTE</span>
                  <span className="text-xs font-medium text-slate-800">{baja.Ambiente || "-"}</span>
                </div>
              </div>

              <div>
                <h3 className="rounded-t bg-slate-800 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                  I. Tipo del Bien
                </h3>
                <div className="flex flex-wrap gap-6 rounded-b border border-t-0 p-3 text-xs">
                  {TIPO_BIEN_OPTIONS.map((item) => (
                    <label key={item} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={(baja.TipoBien || "")
                          .toLowerCase()
                          .includes(item.toLowerCase().replace(/[^a-z]/g, ""))}
                        readOnly
                        className="pointer-events-none rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="rounded-t bg-slate-800 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                  II. Detalle Técnico del Bien
                </h3>
                <div className="overflow-hidden rounded-b border border-t-0">
                  <table className="w-full border-collapse text-left text-[11px]">
                    <thead>
                      <tr className="border-b bg-slate-100">
                        <th className="border-r p-2 font-bold">Bien / Descripción</th>
                        <th className="border-r p-2 font-bold">Código Inventario</th>
                        <th className="border-r p-2 font-bold">Código Patrimonial</th>
                        <th className="border-r p-2 font-bold">Marca</th>
                        <th className="border-r p-2 font-bold">Modelo</th>
                        <th className="p-2 font-bold">Nº Serie</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border-b border-r p-2">
                          {bienDetails?.Descripcion || baja.Bien?.Descripcion || "-"}
                        </td>
                        <td className="border-b border-r p-2">
                          {bienDetails?.CodigoInventario || "-"}
                        </td>
                        <td className="border-b border-r p-2">
                          {bienDetails?.CodigoPatrimonial || baja.Bien?.CodigoPatrimonial || "-"}
                        </td>
                        <td className="border-b border-r p-2">
                          {bienDetails?.Marca?.Marca || baja.Bien?.Marca?.Marca || "-"}
                        </td>
                        <td className="border-b border-r p-2">
                          {bienDetails?.Modelo?.Modelo || baja.Bien?.Modelo?.Modelo || "-"}
                        </td>
                        <td className="border-b p-2">
                          {bienDetails?.NumeroSerie || baja.Bien?.NumeroSerie || "-"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="rounded-t bg-slate-800 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                    III. Condición del Bien
                  </h3>
                  <div className="flex flex-wrap gap-6 rounded-b border border-t-0 p-3 text-xs">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={condicionLabel.toUpperCase().includes("OPERATIVO")}
                        readOnly
                        className="pointer-events-none rounded text-blue-600"
                      />
                      <span>Operativo</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={condicionLabel.toUpperCase().includes("INOPERATIVO")}
                        readOnly
                        className="pointer-events-none rounded text-blue-600"
                      />
                      <span>Inoperativo</span>
                    </label>
                  </div>
                </div>
                <div>
                  <h3 className="rounded-t bg-slate-800 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                    IV. Estado del Bien
                  </h3>
                  <div className="flex flex-wrap gap-4 rounded-b border border-t-0 p-3 text-[11px]">
                    {["BUENO", "REGULAR", "MALO POR REPARAR", "MALO PARA BAJA"].map((label) => (
                      <label key={label} className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={estadoLabel.toUpperCase().includes(label)}
                          readOnly
                          className="pointer-events-none rounded text-blue-600"
                        />
                        <span className="capitalize">{label.toLowerCase()}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { title: "V. Causal de Baja", value: baja.CausalBaja },
                  { title: "VI. Fundamentación", value: baja.Fundamentacion },
                  { title: "VII. Recomendación", value: baja.Recomendacion },
                ].map(({ title, value }) => (
                  <div key={title}>
                    <h3 className="rounded-t bg-slate-800 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                      {title}
                    </h3>
                    <div className="min-h-[50px] whitespace-pre-wrap rounded-b border border-t-0 p-3 text-xs">
                      {value || "Ninguna"}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-6 pt-16 text-center text-[10px] font-bold uppercase text-slate-700">
                {[
                  { label: "Especialista Validador", name: baja.Validador },
                  { label: "Jefe de Área Usuaria", name: baja.JefeArea },
                  { label: "Jefe de Control Patrimonial", name: baja.JefePatrimonial },
                ].map(({ label, name }) => (
                  <div key={label} className="flex h-24 flex-col items-center justify-end">
                    <div className="mb-2 w-4/5 border-t border-slate-900" />
                    <span>{label}</span>
                    <span className="mt-1 text-[9px] font-normal normal-case text-slate-500">
                      {name || "-"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between border-t pt-3 text-[10px] text-slate-400 print:mt-12 print:text-slate-500">
                <span>SISTEMA DE SOPORTE Y BAJA DE BIENES</span>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4 print:hidden">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
