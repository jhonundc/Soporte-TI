"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, Check, CircleCheckBig, Clock3, Eye, XCircle } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { notificacionService, type NotificacionRecord } from "@/services/notificacion.service";
import { fichaService } from "@/services/ficha.service";
import { notify } from "@/lib/feedback/toast";
import { fetchSessionClient } from "@/lib/auth/session-client";
import { queryKeys } from "@/lib/query-keys";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/forms/SearchableSelect";

export default function CentroNotificacionesFichasSoportePage() {
  const [selectedNotificacion, setSelectedNotificacion] = useState<NotificacionRecord | null>(null);
  const [selectedFichaId, setSelectedFichaId] = useState<number | null>(null);
  const [notificationToReject, setNotificationToReject] = useState<NotificacionRecord | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [codeFilter, setCodeFilter] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const queryClient = useQueryClient();
  const sessionQuery = useQuery({
    queryKey: queryKeys.session(),
    queryFn: fetchSessionClient,
  });

  const userRole = String(sessionQuery.data?.user?.role || "");
  const isAdmin = userRole.trim().toLowerCase() === "admin";
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

  const filteredNotifications = useMemo(() => {
    const code = codeFilter.trim().toLowerCase();
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;

    return notificaciones.filter((notification) => {
      const searchable = `${notification.Titulo || ""} ${notification.Mensaje || ""} ${notification.IdReferencia}`.toLowerCase();
      if (code && !searchable.includes(code)) return false;
      if (approvalFilter && notification.EstadoAprobacion.trim().toUpperCase() !== approvalFilter) return false;

      if (!from && !to) return true;
      const createdAt = notification.FechaCreacion ? new Date(String(notification.FechaCreacion)) : null;
      if (!createdAt || Number.isNaN(createdAt.getTime())) return false;
      return (!from || createdAt >= from) && (!to || createdAt <= to);
    });
  }, [approvalFilter, codeFilter, dateFrom, dateTo, notificaciones]);

  const pendingCount = filteredNotifications.filter(
    (notification) => notification.EstadoAprobacion.trim().toUpperCase() === "PENDIENTE"
  ).length;
  const approvedCount = filteredNotifications.filter(
    (notification) => notification.EstadoAprobacion.trim().toUpperCase() === "APROBADA"
  ).length;
  const rejectedCount = filteredNotifications.filter(
    (notification) => notification.EstadoAprobacion.trim().toUpperCase() === "RECHAZADA"
  ).length;

  const getApprovalBadgeClass = (status: string) => {
    const normalized = status.trim().toUpperCase();
    if (normalized === "APROBADA") return "bg-success/10 text-success ring-success/20";
    if (normalized === "RECHAZADA") return "bg-destructive/10 text-destructive ring-destructive/20";
    return "bg-warning/10 text-warning ring-warning/20";
  };

  useEffect(() => {
    const notificationId = Number(new URLSearchParams(window.location.search).get("notificacion"));
    if (!Number.isSafeInteger(notificationId) || notificationId <= 0) return;

    const notification = notificaciones.find(
      (item) => item.IdNotificacion === notificationId
    );
    if (!notification) return;

    const timer = window.setTimeout(() => {
      setSelectedNotificacion(notification);
      setSelectedFichaId(notification.IdReferencia);

      const url = new URL(window.location.href);
      url.searchParams.delete("notificacion");
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [notificaciones]);

  const cargarNotificaciones = () => {
    queryClient.invalidateQueries({ queryKey: ["notificaciones"] });
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
      notify.error(result.error || result.Mensaje || result.message || "No se pudo aprobar la ficha");
      return;
    }

    notify.success(result.Mensaje || "Ficha aprobada correctamente");
    cargarNotificaciones();
  };

  const abrirModalRechazo = (notification: NotificacionRecord) => {
    setNotificationToReject(notification);
    setRejectReason("");
    setRejectError("");
    setRejectDialogOpen(true);
  };

  const rechazarNotificacion = async () => {
    if (!rejectReason.trim()) {
      setRejectError("Debe ingresar el motivo del rechazo");
      return;
    }

    if (!notificationToReject) {
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
        IdNotificacion: notificationToReject.IdNotificacion,
        ObservacionAdministrador: rejectReason.trim(),
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      notify.error(result.error || result.Mensaje || result.message || "No se pudo rechazar la ficha");
      return;
    }

    notify.success(result.Mensaje || "Ficha rechazada correctamente");
    setRejectDialogOpen(false);
    setNotificationToReject(null);
    setRejectReason("");
    setRejectError("");
    cargarNotificaciones();
  };

  return (
    <main className="space-y-8 px-4 py-6 lg:px-8">
      <PageHeader
        title="Centro de Notificaciones"
        description="Revisa y gestiona las solicitudes enviadas por el equipo de soporte."
      />
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
        <div className="flex flex-col gap-5 border-b border-primary/10 bg-gradient-to-br from-primary/10 via-card to-card px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-primary">
              <BellRing className="size-5" />
              <span className="text-xs font-bold uppercase tracking-[0.16em]">Bandeja de revisión</span>
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Fichas de soporte</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {isAdmin
                ? "Solicitudes de soporte pendientes de aprobación."
                : "Consulta el estado de las fichas de soporte que registraste."}
            </p>
          </div>
          <div className="rounded-xl border border-primary/15 bg-card/80 px-4 py-3 text-sm shadow-sm backdrop-blur">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Solicitudes</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{filteredNotifications.length}</p>
          </div>
        </div>

        <div className="grid gap-3 border-b border-border bg-muted/20 px-6 py-4 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl border border-warning/15 bg-warning/5 px-4 py-3">
            <Clock3 className="size-5 text-warning" />
            <div><p className="text-xs text-muted-foreground">Pendientes</p><p className="font-semibold text-foreground">{pendingCount}</p></div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-success/15 bg-success/5 px-4 py-3">
            <CircleCheckBig className="size-5 text-success" />
            <div><p className="text-xs text-muted-foreground">Aprobadas</p><p className="font-semibold text-foreground">{approvedCount}</p></div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-destructive/15 bg-destructive/5 px-4 py-3">
            <XCircle className="size-5 text-destructive" />
            <div><p className="text-xs text-muted-foreground">Rechazadas</p><p className="font-semibold text-foreground">{rejectedCount}</p></div>
          </div>
        </div>

        <div className="grid gap-3 border-b border-border bg-card px-6 py-4 lg:grid-cols-[minmax(0,1fr)_180px_180px_190px_auto] lg:items-end">
          <label className="grid gap-1.5 text-xs font-semibold text-foreground">
            Buscar por código de ficha
            <Input value={codeFilter} onChange={(event) => setCodeFilter(event.target.value)} placeholder="Ej. ST-20260714-5581" />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-foreground">
            Desde
            <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-foreground">
            Hasta
            <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-foreground">
            Estado de aprobación
            <SearchableSelect
              value={approvalFilter}
              onValueChange={setApprovalFilter}
              options={[
                { value: "PENDIENTE", label: "Pendiente" },
                { value: "APROBADA", label: "Aprobada" },
                { value: "RECHAZADA", label: "Rechazada" },
              ]}
              placeholder="Seleccione o busque estado"
            />
          </label>
          <Button variant="outline" className="lg:mb-0" disabled={!codeFilter && !approvalFilter && !dateFrom && !dateTo} onClick={() => { setCodeFilter(""); setApprovalFilter(""); setDateFrom(""); setDateTo(""); }}>
            Limpiar filtros
          </Button>
        </div>

        <div className="overflow-x-auto p-4 sm:p-6">
          <div className="rounded-xl border border-border bg-card">
          <table className="min-w-[1220px] border-collapse text-left text-[13px] text-muted-foreground">
            <thead className="bg-muted/70 text-xs font-semibold uppercase tracking-wide text-foreground">
              <tr>
                <th className="whitespace-nowrap px-4 py-3.5">Registrado por</th>
                <th className="whitespace-nowrap px-4 py-3.5">Título</th>
                <th className="whitespace-nowrap px-4 py-3.5">Mensaje</th>
                <th className="whitespace-nowrap px-4 py-3.5">EstadoAprobación</th>
                <th className="whitespace-nowrap px-4 py-3.5">Respondido por</th>
                <th className="whitespace-nowrap px-4 py-3.5">Leído</th>
                <th className="whitespace-nowrap px-4 py-3.5">FechaCreación</th>
                <th className="w-28 whitespace-nowrap px-4 py-4 text-right">
                  Acciones
                </th>
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
              ) : filteredNotifications.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-sm text-muted-foreground">
                    No hay notificaciones que coincidan con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredNotifications.map((notification) => {
                  const isPending = String(notification.EstadoAprobacion || "").trim().toUpperCase() === "PENDIENTE";
                  return (
                    <tr key={notification.IdNotificacion} className="transition-colors duration-150 hover:bg-primary/[0.035]">
                      <td className="whitespace-nowrap px-5 py-4 text-foreground">
                        {notification.NombreUsuarioOrigen || "-"}
                      </td>
                      <td className="min-w-64 max-w-80 px-5 py-4 font-medium leading-5 text-foreground">{notification.Titulo}</td>
                      <td className="min-w-80 max-w-md px-5 py-4 leading-5 text-foreground">{notification.Mensaje || "-"}</td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getApprovalBadgeClass(notification.EstadoAprobacion)}`}>
                          {notification.EstadoAprobacion}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-foreground">
                        {notification.NombreUsuarioRespondio || (isPending ? "Pendiente" : "-")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${notification.Leido ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                          {notification.Leido ? "Sí" : "No"}
                        </span>
                      </td>
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
                      <td className="px-4 py-4 text-right text-foreground">
                        <div className="ml-auto inline-flex flex-col items-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 px-2"
                            title="Visualizar"
                            aria-label="Visualizar notificación"
                            onClick={() => {
                              setSelectedNotificacion(notification);
                              setSelectedFichaId(notification.IdReferencia);
                            }}
                          >
                            <Eye className="size-4" />
                            <span>Ver</span>
                          </Button>
                          {isAdmin && isPending ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1.5 px-2 text-warning"
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
                                className="gap-1.5 px-2 text-destructive"
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
        <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] sm:max-w-5xl gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-xl">
          <DialogHeader className="border-b border-primary/10 bg-gradient-to-r from-primary/10 via-primary/5 to-card px-6 py-5">
            <DialogTitle>Detalle de notificación</DialogTitle>
            <DialogDescription>
              Información completa de la notificación y la ficha de soporte relacionada.
            </DialogDescription>
          </DialogHeader>

          {selectedNotificacion ? (
            <div className="max-h-[calc(90vh-11rem)] space-y-5 overflow-y-auto px-6 py-5">
              <div className="grid gap-3 sm:grid-cols-2 [&>div]:rounded-xl [&>div]:bg-primary/[0.035] [&>div]:p-4 [&>div]:shadow-sm [&>div>p:first-child]:mb-2 [&>div>p:first-child]:inline-flex [&>div>p:first-child]:rounded-md [&>div>p:first-child]:bg-primary/10 [&>div>p:first-child]:px-2 [&>div>p:first-child]:py-1 [&>div>p:first-child]:text-[11px] [&>div>p:first-child]:font-bold [&>div>p:first-child]:uppercase [&>div>p:first-child]:tracking-[0.12em] [&>div>p:first-child]:text-primary [&>div>p:last-child]:font-medium [&>div>p:last-child]:leading-6 [&>div>p:last-child]:text-foreground">
                <div>
                  <p className="text-sm font-semibold">IdNotificacion</p>
                  <p>{selectedNotificacion.IdNotificacion}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">IdReferencia</p>
                  <p>{selectedNotificacion.IdReferencia}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Registrado por</p>
                  <p>{selectedNotificacion.NombreUsuarioOrigen || "-"}</p>
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
                <div>
                  <p className="text-sm font-semibold">FechaRespuesta</p>
                  <p>
                    {selectedNotificacion.FechaRespuesta
                      ? new Date(String(selectedNotificacion.FechaRespuesta)).toLocaleString("es-PE", {
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
                  <p className="text-sm font-semibold">Respondido por</p>
                  <p>{selectedNotificacion.NombreUsuarioRespondio || "Pendiente"}</p>
                </div>
              </div>

              <div>
                <p className="mb-2 inline-flex rounded-md bg-primary/10 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] text-primary">Observación del administrador</p>
                <p className="mt-2 whitespace-pre-wrap rounded-xl bg-muted/40 p-4 text-sm leading-6">
                  {selectedNotificacion.ObservacionAdministrador || "Sin observación."}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-primary">Ficha de soporte relacionada</p>
                <div className="rounded-xl bg-primary/[0.06] p-5">
                  {fichaQuery.isLoading ? (
                    <p>Cargando ficha relacionada...</p>
                  ) : fichaQuery.isError ? (
                    <p className="text-destructive">No se pudo cargar la ficha relacionada.</p>
                  ) : fichaQuery.data ? (
                    <div className="space-y-4 text-sm [&_h3]:!bg-primary/10 [&_h3]:!text-primary">
                      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                        <h3 className="bg-slate-800 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white">I. Tipo del bien</h3>
                        <div className="p-4"><span className="inline-flex rounded-md bg-primary/10 px-3 py-2 font-medium text-primary">{fichaQuery.data.TipoBien || "No especificado"}</span></div>
                      </section>
                      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                        <h3 className="bg-slate-800 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white">II. Detalle técnico del bien</h3>
                        <div className="grid divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-3">
                          <p className="p-4"><span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Bien / descripción</span>{fichaQuery.data.Bien?.Descripcion || "-"}</p>
                          <p className="p-4"><span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Código inventario</span>{fichaQuery.data.Bien?.CodigoInventario || "-"}</p>
                          <p className="p-4"><span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Código patrimonial</span>{fichaQuery.data.Bien?.CodigoPatrimonial || "-"}</p>
                          <p className="p-4"><span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Marca</span>{fichaQuery.data.Bien?.Marca?.Marca || "-"}</p>
                          <p className="p-4"><span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Modelo</span>{fichaQuery.data.Bien?.Modelo?.Modelo || "-"}</p>
                          <p className="p-4"><span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted-foreground">N.° de serie</span>{fichaQuery.data.Bien?.NumeroSerie || "-"}</p>
                        </div>
                      </section>
                      <div className="grid gap-4 lg:grid-cols-2">
                        <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"><h3 className="bg-slate-800 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white">III. Condición del bien</h3><p className="p-4 font-medium">{fichaQuery.data.Condicion?.Condicion || "-"}</p></section>
                        <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"><h3 className="bg-slate-800 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white">IV. Estado del bien</h3><p className="p-4 font-medium">{fichaQuery.data.Estado?.EstadoBien || "-"}</p></section>
                      </div>
                      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                        <h3 className="bg-slate-800 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white">V. Datos de la ficha</h3>
                        <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 [&>p>span]:mb-1 [&>p>span]:block [&>p>span]:text-[11px] [&>p>span]:font-bold [&>p>span]:uppercase [&>p>span]:tracking-wide [&>p>span]:text-muted-foreground">
                          <p><span>N.° de ficha</span>{fichaQuery.data.NumeroFicha || "-"}</p><p><span>Fecha de registro</span>{fichaQuery.data.FechaRegistro ? new Date(String(fichaQuery.data.FechaRegistro)).toLocaleString("es-PE") : "-"}</p><p><span>Responsable</span>{fichaQuery.data.Responsable || "-"}</p><p><span>Unidad orgánica</span>{fichaQuery.data.UnidadOrganica || "-"}</p><p><span>Dependencia</span>{fichaQuery.data.Dependencia || "-"}</p><p><span>Ambiente</span>{fichaQuery.data.Ambiente || "-"}</p><p><span>Prioridad</span>{fichaQuery.data.Prioridad?.NombrePrioridad || "-"}</p><p><span>Estado del ticket</span>{fichaQuery.data.EstadoTicket || "-"}</p><p><span>Técnico</span>{fichaQuery.data.UsuarioSoporte?.Nombres || fichaQuery.data.UsuarioSoporte?.Usuario || "-"}</p>
                        </div>
                      </section>
                      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"><h3 className="bg-slate-800 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white">VI. Atención técnica</h3><div className="space-y-4 p-4"><p><span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Descripción del problema</span><span className="whitespace-pre-wrap leading-6">{fichaQuery.data.DescripcionProblema || "-"}</span></p><p><span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Diagnóstico</span><span className="whitespace-pre-wrap leading-6">{fichaQuery.data.Diagnostico || "-"}</span></p><p><span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Trabajos realizados</span><span className="whitespace-pre-wrap leading-6">{fichaQuery.data.TrabajosRealizados || "-"}</span></p><p><span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Recomendación</span><span className="whitespace-pre-wrap leading-6">{fichaQuery.data.Recomendacion || "-"}</span></p></div></section>
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

          <DialogFooter className="border-t border-border bg-muted/20 px-6 py-4">
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedNotificacion(null);
                setSelectedFichaId(null);
              }}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={rejectDialogOpen}
        onOpenChange={(open) => {
          setRejectDialogOpen(open);
          if (!open) {
            setNotificationToReject(null);
            setRejectError("");
          }
        }}
      >
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
            {notificationToReject ? (
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-sm font-semibold">Notificación</p>
                <p className="text-sm">{notificationToReject.Titulo}</p>
                <p className="text-sm text-muted-foreground">IdReferencia: {notificationToReject.IdReferencia}</p>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setRejectDialogOpen(false);
                setNotificationToReject(null);
                setRejectError("");
              }}
            >
              Cerrar
            </Button>
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
