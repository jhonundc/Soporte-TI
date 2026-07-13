"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Check, XCircle } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { notificacionService, type NotificacionRecord } from "@/services/notificacion.service";
import { fichaService, type FichaSoporteRecord } from "@/services/ficha.service";
import { notify } from "@/lib/feedback/toast";
import { fetchSessionClient } from "@/lib/auth/session-client";
import { queryKeys } from "@/lib/query-keys";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function CentroNotificacionesFichasSoportePage() {
  const [selectedNotificacion, setSelectedNotificacion] = useState<NotificacionRecord | null>(null);
  const [selectedFichaId, setSelectedFichaId] = useState<number | null>(null);
  const [selectedNotificacionId, setSelectedNotificacionId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  const queryClient = useQueryClient();
  const sessionQuery = useQuery({
    queryKey: queryKeys.session(),
    queryFn: fetchSessionClient,
  });

  const userRole = String(sessionQuery.data?.user?.role || "");
  const isAdmin = /administrador/i.test(userRole);
  const queryKey = ["notificaciones", "soporte"] as const;

  const { data: notificaciones = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: () =>
      notificacionService.list({
        tipoFicha: "SOPORTE",
      }),
  });

  const fichaQuery = useQuery({
    queryKey: ["ficha", selectedFichaId],
    queryFn: () => (selectedFichaId ? fichaService.getById(selectedFichaId) : Promise.resolve(null)),
    enabled: selectedFichaId !== null,
  });

  const cargarNotificaciones = () => {
    queryClient.invalidateQueries({ queryKey });
  };

  const aprobarNotificacion = async (IdNotificacion: number) => {
    const confirmar = window.confirm("¿Está seguro de aprobar esta ficha de soporte?");
    if (!confirmar) return;

    const response = await fetch("/api/soporte/notificaciones", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Accion: "P",
        IdNotificacion,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      notify.error(result.Mensaje || result.message || "No se pudo aprobar la ficha");
      return;
    }

    notify.success(result.Mensaje || "Ficha aprobada correctamente");
    cargarNotificaciones();
  };

  const abrirModalRechazo = (notification: NotificacionRecord) => {
    setSelectedNotificacion(notification);
    setSelectedNotificacionId(notification.IdNotificacion);
    setRejectReason("");
    setRejectError("");
    setRejectDialogOpen(true);
  };

  const rechazarNotificacion = async () => {
    if (!rejectReason.trim()) {
      setRejectError("Debe ingresar el motivo del rechazo");
      return;
    }

    if (!selectedNotificacionId) {
      notify.error("No se ha seleccionado una notificación para rechazar.");
      return;
    }

    const response = await fetch("/api/soporte/notificaciones", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Accion: "X",
        IdNotificacion: selectedNotificacionId,
        ObservacionAdministrador: rejectReason.trim(),
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      notify.error(result.Mensaje || result.message || "No se pudo rechazar la ficha");
      return;
    }

    notify.success(result.Mensaje || "Ficha rechazada correctamente");
    setRejectDialogOpen(false);
    setRejectReason("");
    setRejectError("");
    cargarNotificaciones();
  };

  return (
    <main className="space-y-6 px-4 py-6 lg:px-8">
      <PageHeader title="Centro de Notificaciones" />
      <section className="rounded-lg border border-border bg-card p-6 space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Fichas Soporte</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Lista de notificaciones de soporte de tipo SOPORTE.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="min-w-full border-collapse text-left text-sm text-muted-foreground">
            <thead className="border-b border-border bg-muted/50 text-xs font-semibold uppercase tracking-wide text-foreground">
              <tr>
                <th className="whitespace-nowrap px-4 py-3.5">IdNotificacion</th>
                <th className="whitespace-nowrap px-4 py-3.5">IdReferencia</th>
                <th className="whitespace-nowrap px-4 py-3.5">Título</th>
                <th className="whitespace-nowrap px-4 py-3.5">Mensaje</th>
                <th className="whitespace-nowrap px-4 py-3.5">EstadoAprobación</th>
                <th className="whitespace-nowrap px-4 py-3.5">Leído</th>
                <th className="whitespace-nowrap px-4 py-3.5">FechaCreación</th>
                <th className="whitespace-nowrap px-4 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`skeleton-${index}`}>
                    {Array.from({ length: 8 }).map((_, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-3">
                        <div className="h-4 w-full rounded bg-slate-200/70" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-sm text-destructive">
                    {(error as Error).message || "Error al cargar los datos."}
                  </td>
                </tr>
              ) : notificaciones.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-sm text-muted-foreground">
                    No hay notificaciones de soporte disponibles.
                  </td>
                </tr>
              ) : (
                notificaciones.map((notification) => {
                  const isPending = String(notification.EstadoAprobacion || "").trim().toUpperCase() === "PENDIENTE";
                  return (
                    <tr key={notification.IdNotificacion} className="transition-colors duration-150 hover:bg-muted/40">
                      <td className="whitespace-nowrap px-4 py-3.5 text-foreground">{notification.IdNotificacion}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-foreground">{notification.IdReferencia}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-foreground">{notification.Titulo}</td>
                      <td className="px-4 py-3.5 text-foreground">{notification.Mensaje || "-"}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-foreground">{notification.EstadoAprobacion}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-foreground">{notification.Leido ? "Sí" : "No"}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-foreground">
                        {notification.FechaCreacion
                          ? new Date(String(notification.FechaCreacion)).toLocaleString("es-PE", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right text-foreground">
                        <div className="inline-flex flex-wrap items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 px-3"
                            title="Visualizar"
                            aria-label="Visualizar notificación"
                            onClick={() => {
                              setSelectedNotificacion(notification);
                              setSelectedFichaId(notification.IdReferencia);
                            }}
                          >
                            <Eye className="size-4" />
                            <span>Visualizar</span>
                          </Button>
                          {isAdmin && isPending ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-2 px-3 text-warning"
                                title="Aprobar"
                                aria-label="Aprobar notificación"
                                onClick={() => aprobarNotificacion(notification.IdNotificacion)}
                              >
                                <Check className="size-4" />
                                <span>Aprobar</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-2 px-3 text-destructive"
                                title="Rechazar"
                                aria-label="Rechazar notificación"
                                onClick={() => abrirModalRechazo(notification)}
                              >
                                <XCircle className="size-4" />
                                <span>Rechazar</span>
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog
        open={Boolean(selectedNotificacion)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedNotificacion(null);
            setSelectedFichaId(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalle de notificación</DialogTitle>
            <DialogDescription>
              Información completa de la notificación y la ficha de soporte relacionada.
            </DialogDescription>
          </DialogHeader>

          {selectedNotificacion ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold">IdNotificacion</p>
                  <p>{selectedNotificacion.IdNotificacion}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">IdReferencia</p>
                  <p>{selectedNotificacion.IdReferencia}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Título</p>
                  <p>{selectedNotificacion.Titulo}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Mensaje</p>
                  <p>{selectedNotificacion.Mensaje}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">EstadoAprobación</p>
                  <p>{selectedNotificacion.EstadoAprobacion}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Leído</p>
                  <p>{selectedNotificacion.Leido ? "Sí" : "No"}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">FechaCreación</p>
                  <p>
                    {selectedNotificacion.FechaCreacion
                      ? new Date(String(selectedNotificacion.FechaCreacion)).toLocaleString("es-PE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold">FechaLectura</p>
                  <p>
                    {selectedNotificacion.FechaLectura
                      ? new Date(String(selectedNotificacion.FechaLectura)).toLocaleString("es-PE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold">Ficha de soporte relacionada</p>
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  {fichaQuery.isLoading ? (
                    <p>Cargando ficha relacionada...</p>
                  ) : fichaQuery.isError ? (
                    <p className="text-destructive">No se pudo cargar la ficha relacionada.</p>
                  ) : fichaQuery.data ? (
                    <div className="space-y-3">
                      <p>
                        <span className="font-semibold">NumeroFicha:</span> {fichaQuery.data.NumeroFicha || "-"}
                      </p>
                      <p>
                        <span className="font-semibold">Responsable:</span> {fichaQuery.data.Responsable || "-"}
                      </p>
                      <p>
                        <span className="font-semibold">Dependencia:</span> {fichaQuery.data.Dependencia || "-"}
                      </p>
                      <p>
                        <span className="font-semibold">Ambiente:</span> {fichaQuery.data.Ambiente || "-"}
                      </p>
                      <p>
                        <span className="font-semibold">Diagnóstico:</span> {fichaQuery.data.Diagnostico || "-"}
                      </p>
                      <p>
                        <span className="font-semibold">Recomendación:</span> {fichaQuery.data.Recomendacion || "-"}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay ficha relacionada disponible.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p>No se ha seleccionado ninguna notificación.</p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cerrar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Rechazar ficha de soporte</DialogTitle>
            <DialogDescription>Ingresa el motivo del rechazo para esta notificación.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold">Motivo del rechazo</p>
              <Textarea
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="Ingrese el motivo del rechazo"
              />
              {rejectError ? <p className="text-sm text-destructive">{rejectError}</p> : null}
            </div>
            {selectedNotificacion ? (
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-sm font-semibold">Notificación</p>
                <p className="text-sm">{selectedNotificacion.Titulo}</p>
                <p className="text-sm text-muted-foreground">IdReferencia: {selectedNotificacion.IdReferencia}</p>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary" onClick={() => setRejectError("")}>Cerrar</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={rechazarNotificacion}
            >
              Rechazar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
