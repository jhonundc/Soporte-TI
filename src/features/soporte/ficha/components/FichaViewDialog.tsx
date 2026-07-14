"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { FichaSoporteRecord } from "@/features/soporte/ficha/types";
import { DialogPrintStyles } from "@/lib/print/dialog-print-styles";

interface FichaViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ficha: FichaSoporteRecord | null;
}

export function FichaViewDialog({ open, onOpenChange, ficha }: FichaViewDialogProps) {
  return (
    <>
      <DialogPrintStyles />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92vh] w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-border bg-card p-0 shadow-xl sm:max-w-5xl print:max-h-none print:border-none print:p-0 print:shadow-none">
          <DialogHeader className="border-b border-primary/10 bg-gradient-to-r from-primary/10 via-primary/5 to-card px-6 py-5 print:hidden">
            <DialogTitle>Detalle de Ficha de Soporte</DialogTitle>
            <DialogDescription>
              Vista de impresión y detalles técnicos de la ficha registrada.
            </DialogDescription>
          </DialogHeader>

          {ficha && (
            <div className="space-y-6 border-primary/15 bg-primary/[0.035] p-6 text-slate-800 [&_h3]:!rounded-md [&_h3]:!bg-primary/10 [&_h3]:!text-primary print:border-none print:bg-white print:p-0 print:[&_h3]:!rounded-t print:[&_h3]:!bg-slate-800 print:[&_h3]:!text-white">
              {/* PRINTABLE CONTAINER */}
              <div id="printable-ficha" className="space-y-6">
                {/* HEADER */}
                <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4">
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">UNIDAD DE ESTADISTICA E INFORMATICA</p>
                    <h2 className="text-base font-extrabold text-slate-800 mt-1">FICHA DE SOPORTE TÉCNICO</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold bg-slate-100 px-3 py-1 rounded border text-slate-800 inline-block">
                      Nº {ficha.NumeroFicha || "-"}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1.5">
                      Fecha: {ficha.FechaRegistro ? new Date(ficha.FechaRegistro).toLocaleString() : "-"}
                    </p>
                  </div>
                </div>

                {/* RESPONSABLE INFO */}
                <div className="grid grid-cols-1 gap-4 rounded-xl border border-primary/15 bg-card p-4 text-[11px] shadow-sm sm:grid-cols-3">
                  <div>
                    <span className="font-bold block text-slate-500">RESPONSABLE DEL BIEN</span>
                    <span className="font-medium text-xs text-slate-800">{ficha.Responsable || "-"}</span>
                  </div>
                  <div>
                    <span className="font-bold block text-slate-500">DEPENDENCIA (ÁREA)</span>
                    <span className="font-medium text-xs text-slate-800">{ficha.Dependencia || "-"}</span>
                  </div>
                  <div>
                    <span className="font-bold block text-slate-500">AMBIENTE</span>
                    <span className="font-medium text-xs text-slate-800">{ficha.Ambiente || "-"}</span>
                  </div>
                </div>

                {/* SECTION I: TIPO DEL BIEN */}
                <div>
                  <h3 className="text-[11px] font-bold bg-slate-800 text-white px-2.5 py-1 uppercase tracking-wider rounded-t">
                    I. Tipo del Bien
                  </h3>
                  <div className="border border-t-0 p-3 rounded-b flex gap-6 text-xs">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={ficha.TipoBien?.toLowerCase() === "informático" || ficha.TipoBien?.toLowerCase() === "informatico"}
                        readOnly
                        className="rounded text-blue-600 focus:ring-blue-500 pointer-events-none"
                      />
                      <span>Informático</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={ficha.TipoBien?.toLowerCase() === "comunicación" || ficha.TipoBien?.toLowerCase() === "comunicacion"}
                        readOnly
                        className="rounded text-blue-600 focus:ring-blue-500 pointer-events-none"
                      />
                      <span>Comunicación</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={ficha.TipoBien?.toLowerCase() === "eléctrico" || ficha.TipoBien?.toLowerCase() === "electrico"}
                        readOnly
                        className="rounded text-blue-600 focus:ring-blue-500 pointer-events-none"
                      />
                      <span>Eléctrico</span>
                    </label>
                  </div>
                </div>

                {/* SECTION II: DETALLE TÉCNICO */}
                <div>
                  <h3 className="text-[11px] font-bold bg-slate-800 text-white px-2.5 py-1 uppercase tracking-wider rounded-t">
                    II. Detalle Técnico del Bien
                  </h3>
                  <div className="border border-t-0 rounded-b overflow-hidden">
                    <table className="w-full text-[11px] text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b">
                          <th className="p-2 border-r font-bold">Código Inventario</th>
                          <th className="p-2 border-r font-bold">Código Patrimonial</th>
                          <th className="p-2 border-r font-bold">Bien / Descripción</th>
                          <th className="p-2 border-r font-bold">Marca</th>
                          <th className="p-2 border-r font-bold">Modelo</th>
                          <th className="p-2 font-bold">Nº Serie</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="p-2 border-r border-b">{ficha.Bien?.CodigoInventario || "-"}</td>
                          <td className="p-2 border-r border-b">{ficha.Bien?.CodigoPatrimonial || "-"}</td>
                          <td className="p-2 border-r border-b">{ficha.Bien?.Descripcion || "-"}</td>
                          <td className="p-2 border-r border-b">{ficha.Bien?.Marca?.Marca || "-"}</td>
                          <td className="p-2 border-r border-b">{ficha.Bien?.Modelo?.Modelo || "-"}</td>
                          <td className="p-2 border-b">{ficha.Bien?.NumeroSerie || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* SECTION III & IV: CONDICIÓN Y ESTADO */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="text-[11px] font-bold bg-slate-800 text-white px-2.5 py-1 uppercase tracking-wider rounded-t">
                      III. Condición del Bien
                    </h3>
                    <div className="border border-t-0 p-3 rounded-b flex gap-6 text-xs">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={String(ficha.IdCondicion) === "1" || ficha.Condicion?.Condicion?.toUpperCase() === "OPERATIVO"}
                          readOnly
                          className="rounded text-blue-600 pointer-events-none"
                        />
                        <span>Operativo</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={String(ficha.IdCondicion) === "2" || ficha.Condicion?.Condicion?.toUpperCase() === "INOPERATIVO"}
                          readOnly
                          className="rounded text-blue-600 pointer-events-none"
                        />
                        <span>Inoperativo</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[11px] font-bold bg-slate-800 text-white px-2.5 py-1 uppercase tracking-wider rounded-t">
                      IV. Estado del Bien
                    </h3>
                    <div className="border border-t-0 p-3 rounded-b flex gap-4 text-[11px] flex-wrap">
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={ficha.Estado?.EstadoBien?.toUpperCase() === "BUENO" || String(ficha.IdEstadoBien) === "1"}
                          readOnly
                          className="rounded text-blue-600 pointer-events-none"
                        />
                        <span>Bueno</span>
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={ficha.Estado?.EstadoBien?.toUpperCase() === "REGULAR" || String(ficha.IdEstadoBien) === "2"}
                          readOnly
                          className="rounded text-blue-600 pointer-events-none"
                        />
                        <span>Regular</span>
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={ficha.Estado?.EstadoBien?.toUpperCase() === "REPARAR" || String(ficha.IdEstadoBien) === "3"}
                          readOnly
                          className="rounded text-blue-600 pointer-events-none"
                        />
                        <span>Reparar</span>
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={ficha.Estado?.EstadoBien?.toUpperCase() === "BAJA" || String(ficha.IdEstadoBien) === "4"}
                          readOnly
                          className="rounded text-blue-600 pointer-events-none"
                        />
                        <span>Baja</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* TEXT SECTIONS V, VI, VII */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-[11px] font-bold bg-slate-800 text-white px-2.5 py-1 uppercase tracking-wider rounded-t">
                      V. Trabajos Realizados
                    </h3>
                    <div className="border border-t-0 p-3 rounded-b min-h-[50px] text-xs whitespace-pre-wrap">
                      {ficha.TrabajosRealizados || "Ninguno"}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[11px] font-bold bg-slate-800 text-white px-2.5 py-1 uppercase tracking-wider rounded-t">
                      VI. Diagnóstico
                    </h3>
                    <div className="border border-t-0 p-3 rounded-b min-h-[50px] text-xs whitespace-pre-wrap">
                      {ficha.Diagnostico || "Ninguno"}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[11px] font-bold bg-slate-800 text-white px-2.5 py-1 uppercase tracking-wider rounded-t">
                      VII. Recomendaciones
                    </h3>
                    <div className="border border-t-0 p-3 rounded-b min-h-[50px] text-xs whitespace-pre-wrap">
                      {ficha.Recomendacion || "Ninguna"}
                    </div>
                  </div>
                </div>

                {/* CREATOR USER DETAIL */}
                <div className="text-[10px] text-slate-400 flex justify-between border-t pt-3 mt-4 print:mt-12">
                  <span>SISTEMA DE SOPORTE TI</span>
                  <span>REGISTRADO POR: {ficha.Usuario_Nombres || ficha.UsuarioSoporte?.Nombres || ficha.UsuarioSoporte?.Usuario || "ADMIN"}</span>
                </div>
              </div>

              {/* ACTION FOOTER */}
              <div className="flex justify-end gap-3 border-t border-primary/10 pt-4 print:hidden">
                <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
