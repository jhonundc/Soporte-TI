"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ActaEntrega } from "./types";

export function ActaEntregaDetailDialog({
  acta,
  onClose,
  statusClass,
}: {
  acta: ActaEntrega | null;
  onClose: () => void;
  statusClass: (status: string) => string;
}) {
  return (
    <Dialog open={!!acta} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-3xl">
        <DialogHeader className="border-b border-primary/10 bg-gradient-to-r from-primary/10 via-primary/5 to-card px-6 py-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-primary">Documento de entrega</p>
              <DialogTitle className="text-xl">Acta N.º {acta?.NumeroActa}</DialogTitle>
              <DialogDescription className="mt-1">Detalle completo del registro y sus bienes asociados.</DialogDescription>
            </div>
            {acta ? <Badge variant="outline" className={`rounded-full px-3 py-1.5 font-bold ${statusClass(acta.EstadoActa)}`}>{acta.EstadoActa}</Badge> : null}
          </div>
        </DialogHeader>

        {acta ? (
          <div className="max-h-[calc(90vh-11rem)] space-y-5 overflow-y-auto px-6 py-5 text-sm">
            <section>
              <h3 className="mb-3 inline-flex rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary">Información general</h3>
              <div className="grid gap-3 sm:grid-cols-2 [&>p]:rounded-xl [&>p]:bg-primary/[0.045] [&>p]:px-4 [&>p]:py-3.5 [&>p>b]:mb-1.5 [&>p>b]:block [&>p>b]:text-[11px] [&>p>b]:uppercase [&>p>b]:tracking-wide [&>p>b]:text-primary">
                <p><b>Fecha de entrega</b>{new Date(acta.FechaEntrega).toLocaleString("es-PE")}</p>
                <p><b>Creado por</b>{acta.NombreCreador || "-"}</p>
                <p><b>Receptor</b>{acta.NombreReceptor}</p>
                <p><b>Cargo</b>{acta.CargoReceptor || "-"}</p>
                <p><b>Área receptora</b>{acta.AreaReceptor || "-"}</p>
                <p><b>Servicio / ambiente</b>{acta.ServicioArea || "-"}</p>
              </div>
            </section>
            <section>
              <h3 className="mb-2 inline-flex rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary">Observaciones</h3>
              <p className="rounded-xl bg-primary/[0.045] p-4 leading-6">{acta.Observaciones || "Sin observaciones"}</p>
            </section>
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="inline-flex rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary">Bienes entregados</h3>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{acta.Detalles?.length || 0}</span>
              </div>
              {acta.Detalles?.map((detalle) => (
                <div key={detalle.IdActaEntregaDetalle || detalle.IdBien} className="mb-2 rounded-xl border border-primary/10 bg-primary/[0.025] p-4 shadow-sm">
                  <b className="text-primary">{detalle.CodigoPatrimonial || detalle.CodigoInventario || `Bien ${detalle.IdBien}`}</b>
                  <span className="text-muted-foreground"> — {detalle.Descripcion}</span>
                  <div className="mt-1 text-xs text-muted-foreground">Serie: {detalle.NumeroSerie || "-"} · {detalle.Marca || ""} {detalle.Modelo || ""}</div>
                </div>
              ))}
            </section>
            <section>
              <h3 className="mb-3 inline-flex rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary">Evidencia firmada</h3>
              {acta.EvidenciaFirma ? (
                <div className="space-y-3">
                  <a href={acta.EvidenciaFirma} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-border bg-white p-2 shadow-sm">
                    <Image src={acta.EvidenciaFirma} alt={`Evidencia firmada del acta ${acta.NumeroActa}`} width={1200} height={800} unoptimized className="mx-auto max-h-[420px] w-auto rounded-lg object-contain" />
                  </a>
                  <a href={acta.EvidenciaFirma} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-primary hover:underline">Abrir imagen en tamaño completo</a>
                </div>
              ) : <p className="rounded-xl bg-muted/30 p-4 text-muted-foreground">Esta acta no tiene una imagen firmada.</p>}
            </section>
          </div>
        ) : null}
        <DialogFooter className="border-t border-border bg-muted/20 px-6 py-4"><Button variant="outline" onClick={onClose}>Cerrar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
