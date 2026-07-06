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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl print:max-h-none print:border-none print:p-0 print:shadow-none">
          <DialogHeader className="print:hidden">
            <DialogTitle>Detalle de Ficha de Soporte</DialogTitle>
            <DialogDescription>
              Vista de impresión y detalles técnicos de la ficha registrada.
            </DialogDescription>
          </DialogHeader>

          {ficha && (
            <div className="space-y-6 p-4 border rounded-lg bg-white print:border-none print:p-0 text-slate-800">
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
                <div className="grid grid-cols-3 gap-4 text-[11px] bg-slate-50 p-3 rounded border">
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
                <div className="grid grid-cols-2 gap-4">
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

                {/* FIRMAS SECTION */}
                <div className="pt-20 grid grid-cols-3 gap-6 text-center text-[10px] uppercase font-bold text-slate-700">
                  <div className="flex flex-col items-center justify-end h-24">
                    <div className="w-4/5 border-t border-slate-900 mb-2"></div>
                    <span>RESP. DE SOPORTE TÉCNICO</span>
                  </div>
                  <div className="flex flex-col items-center justify-end h-24">
                    <div className="w-4/5 border-t border-slate-900 mb-2"></div>
                    <span>JEFE DE LA UNIDAD DE ESTADISTICA E INFORMATICA</span>
                  </div>
                  <div className="flex flex-col items-center justify-end h-24">
                    <div className="w-4/5 border-t border-slate-900 mb-2"></div>
                    <span>ÁREA USUARIA</span>
                  </div>
                </div>

                {/* CREATOR USER DETAIL */}
                <div className="text-[10px] text-slate-400 flex justify-between border-t pt-3 mt-4 print:mt-12">
                  <span>SISTEMA DE SOPORTE TI</span>
                  <span>REGISTRADO POR: {ficha.Usuario_Nombres || ficha.UsuarioSoporte?.Nombres || ficha.UsuarioSoporte?.Usuario || "ADMIN"}</span>
                </div>
              </div>

              {/* ACTION FOOTER */}
              <div className="flex justify-end gap-3 pt-4 border-t print:hidden">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
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
