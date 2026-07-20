"use client";

import { useMemo } from "react";
import Image from "next/image";
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
        <DialogContent className="max-h-[92vh] w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-border bg-card p-0 shadow-xl sm:max-w-5xl print:max-h-none print:border-none print:p-0 print:shadow-none">
          <DialogHeader className="border-b border-primary/10 bg-gradient-to-r from-primary/10 via-primary/5 to-card px-6 py-5 print:hidden">
            <DialogTitle>Detalle de ficha de baja</DialogTitle>
          </DialogHeader>

          {baja ? (
            <div
              id="printable-baja"
              className="space-y-6 bg-primary/[0.018] p-6 text-slate-800 [&_h3]:!rounded-md [&_h3]:!bg-primary/10 [&_h3]:!text-primary print:bg-white print:p-0 print:[&_h3]:!rounded-t print:[&_h3]:!bg-slate-800 print:[&_h3]:!text-white"
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

              <div className="grid grid-cols-1 gap-4 rounded-xl border border-primary/10 bg-card p-4 text-[11px] text-slate-700 shadow-sm sm:grid-cols-3">
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

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                    {[
                      { label: "Bueno", values: ["BUENO"] },
                      { label: "Regular", values: ["REGULAR"] },
                      { label: "Reparar", values: ["REPARAR", "MALO POR REPARAR"] },
                      { label: "Baja", values: ["BAJA", "MALO PARA BAJA"] },
                    ].map(({ label, values }) => (
                      <label key={label} className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={values.some((value) => estadoLabel.toUpperCase().includes(value))}
                          readOnly
                          className="pointer-events-none rounded text-blue-600"
                        />
                        <span>{label}</span>
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

              <div>
                <h3 className="rounded-t bg-slate-800 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                  VIII. Evidencia de firma
                </h3>
                <div className="rounded-b border border-t-0 p-4">
                  {baja.EvidenciaFirma ? (
                    <div className="space-y-3">
                      <a
                        href={baja.EvidenciaFirma}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block overflow-hidden rounded-xl border border-border bg-white p-2 shadow-sm transition hover:border-primary/40"
                        title="Abrir imagen en tamaño completo"
                      >
                        <Image
                          src={baja.EvidenciaFirma}
                          alt={`Evidencia de firma de la ficha ${baja.NumeroFichaBaja || "de baja"}`}
                          width={1200}
                          height={800}
                          unoptimized
                          className="mx-auto max-h-[420px] w-auto rounded-lg object-contain"
                        />
                      </a>
                      <a
                        href={baja.EvidenciaFirma}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex text-xs font-semibold text-primary underline-offset-4 hover:underline print:hidden"
                      >
                        Abrir imagen en tamaño completo
                      </a>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Esta ficha no tiene una imagen de evidencia guardada.</p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t pt-3 text-[10px] text-slate-400 print:mt-12 print:text-slate-500">
                <span>SISTEMA DE SOPORTE Y BAJA DE BIENES</span>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3 border-t border-primary/10 bg-muted/20 px-6 py-4 print:hidden">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
