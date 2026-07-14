"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, Check, CircleCheckBig, Clock3, Eye, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/layout/PageHeader";
import { SearchableSelect } from "@/components/forms/SearchableSelect";
import { fetchSessionClient } from "@/lib/auth/session-client";
import { notify } from "@/lib/feedback/toast";
import { queryKeys } from "@/lib/query-keys";
import { bajaService } from "@/services/baja.service";
import { notificacionService, type NotificacionRecord } from "@/services/notificacion.service";

function formatDate(value?: string | null) {
  return value
    ? new Date(value).toLocaleString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";
}

export default function CentroNotificacionesFichasBajaPage() {
  const queryClient = useQueryClient();
  const [selectedNotification, setSelectedNotification] = useState<NotificacionRecord | null>(null);
  const [rejectNotification, setRejectNotification] = useState<NotificacionRecord | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [codeFilter, setCodeFilter] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const sessionQuery = useQuery({ queryKey: queryKeys.session(), queryFn: fetchSessionClient });
  const isAdmin = String(sessionQuery.data?.user?.role || "").trim().toLowerCase() === "admin";
  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey: queryKeys.notificaciones("baja"),
    queryFn: () => notificacionService.list({ tipoFicha: "BAJA" }),
  });
  const bajaQuery = useQuery({
    queryKey: queryKeys.fichasBaja(),
    queryFn: () => bajaService.list(),
    enabled: selectedNotification !== null,
  });

  const selectedBaja = bajaQuery.data?.find(
    (baja) => baja.IdBaja === selectedNotification?.IdReferencia
  );

  const filteredNotifications = useMemo(() => {
    const code = codeFilter.trim().toLowerCase();
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;

    return notifications.filter((notification) => {
      const searchable = `${notification.Titulo || ""} ${notification.Mensaje || ""} ${notification.IdReferencia}`.toLowerCase();
      if (code && !searchable.includes(code)) return false;
      if (approvalFilter && notification.EstadoAprobacion.trim().toUpperCase() !== approvalFilter) return false;

      if (!from && !to) return true;
      const createdAt = notification.FechaCreacion ? new Date(String(notification.FechaCreacion)) : null;
      if (!createdAt || Number.isNaN(createdAt.getTime())) return false;
      return (!from || createdAt >= from) && (!to || createdAt <= to);
    });
  }, [approvalFilter, codeFilter, dateFrom, dateTo, notifications]);

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
    const notification = notifications.find((item) => item.IdNotificacion === notificationId);
    if (!notification) return;

    const timer = window.setTimeout(() => {
      setSelectedNotification(notification);
      const url = new URL(window.location.href);
      url.searchParams.delete("notificacion");
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [notifications]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["notificaciones"] });

  const approve = async (notification: NotificacionRecord) => {
    if (!window.confirm("¿Está seguro de aprobar esta ficha de baja?")) return;
    try {
      const result = await notificacionService.action({
        IdNotificacion: notification.IdNotificacion,
        Accion: "P",
      });
      notify.success(result.Mensaje || "Ficha de baja aprobada correctamente");
      refresh();
      queryClient.invalidateQueries({ queryKey: queryKeys.fichasBaja() });
    } catch (error) {
      notify.fromError(error, "No se pudo aprobar la ficha de baja");
    }
  };

  const reject = async () => {
    if (!rejectNotification || !rejectReason.trim()) {
      notify.warning("Debe ingresar el motivo del rechazo.");
      return;
    }
    try {
      const result = await notificacionService.action({
        IdNotificacion: rejectNotification.IdNotificacion,
        Accion: "X",
        ObservacionAdministrador: rejectReason.trim(),
      });
      notify.success(result.Mensaje || "Ficha de baja rechazada correctamente");
      setRejectNotification(null);
      setRejectReason("");
      refresh();
      queryClient.invalidateQueries({ queryKey: queryKeys.fichasBaja() });
    } catch (error) {
      notify.fromError(error, "No se pudo rechazar la ficha de baja");
    }
  };

  return (
    <main className="space-y-8 px-4 py-6 lg:px-8">
      <PageHeader
        title="Centro de Notificaciones"
        description="Administra las solicitudes de baja y deja constancia de cada decisión."
      />
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
        <div className="flex flex-col gap-5 border-b border-destructive/10 bg-gradient-to-br from-destructive/10 via-card to-card px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-destructive">
              <BellRing className="size-5" />
              <span className="text-xs font-bold uppercase tracking-[0.16em]">Bandeja de revisión</span>
            </div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Fichas de baja</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {isAdmin
              ? "Solicitudes de baja pendientes de aprobación."
              : "Consulta el estado de las fichas de baja que registraste."}
          </p>
          </div>
          <div className="rounded-xl border border-destructive/15 bg-card/80 px-4 py-3 text-sm shadow-sm backdrop-blur">
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
            Buscar ficha de baja
            <Input value={codeFilter} onChange={(event) => setCodeFilter(event.target.value)} placeholder="Ej. FB-2127" />
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
          <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full min-w-[980px] table-fixed border-collapse text-left text-[13px] text-muted-foreground">
            <thead className="bg-muted/70 text-xs font-semibold uppercase tracking-wide text-foreground">
              <tr>
                <th className="w-16 px-3 py-3">Ficha</th>
                <th className="w-[13%] px-3 py-3">Registrado por</th>
                <th className="w-[24%] px-3 py-3">Título</th>
                <th className="w-[11%] px-3 py-3">Estado</th>
                <th className="w-16 px-3 py-3">Leído</th>
                <th className="w-[14%] px-3 py-3">Respondido por</th>
                <th className="w-[15%] px-3 py-3">Fecha</th>
                <th className="w-24 px-2 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={8} className="p-8 text-center">Cargando notificaciones...</td></tr>
              ) : error ? (
                <tr><td colSpan={8} className="p-8 text-center text-destructive">{(error as Error).message}</td></tr>
              ) : filteredNotifications.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center">No hay notificaciones que coincidan con los filtros seleccionados.</td></tr>
              ) : filteredNotifications.map((notification) => {
                const isPending = notification.EstadoAprobacion.trim().toUpperCase() === "PENDIENTE";
                return (
                  <tr key={notification.IdNotificacion} className="transition-colors hover:bg-destructive/[0.035]">
                    <td className="whitespace-nowrap px-3 py-3 text-foreground">{notification.IdReferencia}</td>
                    <td className="break-words px-3 py-3 text-foreground">{notification.NombreUsuarioOrigen || "-"}</td>
                    <td className="break-words px-3 py-3 font-medium leading-5 text-foreground">{notification.Titulo}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getApprovalBadgeClass(notification.EstadoAprobacion)}`}>
                        {notification.EstadoAprobacion}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${notification.Leido ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                        {notification.Leido ? "Sí" : "No"}
                      </span>
                    </td>
                    <td className="break-words px-3 py-3 text-foreground">
                      {notification.NombreUsuarioRespondio || (isPending ? "Pendiente" : "-")}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-xs text-foreground">{formatDate(notification.FechaCreacion)}</td>
                    <td className="px-2 py-3 text-right">
                      <div className="ml-auto inline-flex flex-col items-end gap-1">
                        <Button variant="ghost" size="sm" className="gap-1.5 px-2" onClick={() => setSelectedNotification(notification)}>
                          <Eye className="size-4" /> <span className="ml-1">Ver</span>
                        </Button>
                        {isAdmin && isPending ? <>
                          <Button variant="ghost" size="sm" className="gap-1.5 px-2 text-success" onClick={() => approve(notification)}>
                            <Check className="size-4" /> <span className="ml-1">Aprobar</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="gap-1.5 px-2 text-destructive" onClick={() => {
                            setRejectNotification(notification);
                            setRejectReason("");
                          }}>
                            <XCircle className="size-4" /> <span className="ml-1">Rechazar</span>
                          </Button>
                        </> : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      </section>

      <Dialog open={selectedNotification !== null} onOpenChange={(open) => !open && setSelectedNotification(null)}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] sm:max-w-5xl gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-xl">
          <DialogHeader className="border-b border-destructive/10 bg-gradient-to-r from-destructive/10 via-destructive/5 to-card px-6 py-5">
            <DialogTitle>Detalle de notificación</DialogTitle>
            <DialogDescription>Información de la ficha de baja relacionada.</DialogDescription>
          </DialogHeader>
          {selectedNotification ? <div className="max-h-[calc(90vh-11rem)] space-y-5 overflow-y-auto px-6 py-5 text-sm">
            <div className="grid gap-3 sm:grid-cols-2 [&>p]:rounded-xl [&>p]:bg-destructive/[0.035] [&>p]:p-4 [&>p]:shadow-sm [&>p>span]:mb-2 [&>p>span]:inline-flex [&>p>span]:rounded-md [&>p>span]:bg-destructive/10 [&>p>span]:px-2 [&>p>span]:py-1 [&>p>span]:text-[11px] [&>p>span]:font-bold [&>p>span]:uppercase [&>p>span]:tracking-[0.12em] [&>p>span]:text-destructive">
              <p><span className="font-semibold">Título:</span> {selectedNotification.Titulo}</p>
              <p><span className="font-semibold">Registrado por:</span> {selectedNotification.NombreUsuarioOrigen || "-"}</p>
              <p><span className="font-semibold">Estado:</span> {selectedNotification.EstadoAprobacion}</p>
              <p><span className="font-semibold">Fecha:</span> {formatDate(selectedNotification.FechaCreacion)}</p>
              <p><span className="font-semibold">Respondido por:</span> {selectedNotification.NombreUsuarioRespondio || "Pendiente"}</p>
            </div>
            <p className="rounded-xl bg-muted/40 p-4 leading-6"><span className="mb-2 inline-flex rounded-md bg-destructive/10 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-destructive">Mensaje</span>{selectedNotification.Mensaje}</p>
            <p className="rounded-xl bg-muted/40 p-4 leading-6"><span className="mb-2 inline-flex rounded-md bg-destructive/10 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-destructive">Observación</span>{selectedNotification.ObservacionAdministrador || "Sin observación."}</p>
            <div className="space-y-4 [&_h3]:!bg-destructive/10 [&_h3]:!text-destructive">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-destructive">Ficha de baja relacionada</p>
              {bajaQuery.isLoading ? <p className="mt-2">Cargando ficha...</p> : selectedBaja ? <>
                <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                  <h3 className="bg-slate-800 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white">I. Tipo del bien</h3>
                  <div className="p-4"><span className="inline-flex rounded-md bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">{selectedBaja.TipoBien || "No especificado"}</span></div>
                </section>
                <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                  <h3 className="bg-slate-800 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white">II. Detalle técnico del bien</h3>
                  <div className="grid divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-3">
                    <p className="p-4"><span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Bien / descripción</span>{selectedBaja.Bien?.Descripcion || "-"}</p>
                    <p className="p-4"><span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Código inventario</span>{selectedBaja.Bien?.CodigoInventario || "-"}</p>
                    <p className="p-4"><span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Código patrimonial</span>{selectedBaja.Bien?.CodigoPatrimonial || "-"}</p>
                    <p className="p-4"><span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Marca</span>{selectedBaja.Bien?.Marca?.Marca || "-"}</p>
                    <p className="p-4"><span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Modelo</span>{selectedBaja.Bien?.Modelo?.Modelo || "-"}</p>
                    <p className="p-4"><span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted-foreground">N.° de serie</span>{selectedBaja.Bien?.NumeroSerie || "-"}</p>
                  </div>
                </section>
                <div className="grid gap-4 lg:grid-cols-2">
                  <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"><h3 className="bg-slate-800 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white">III. Condición del bien</h3><p className="p-4 font-medium">{selectedBaja.Condicion?.Condicion || "-"}</p></section>
                  <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"><h3 className="bg-slate-800 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white">IV. Estado del bien</h3><p className="p-4 font-medium">{selectedBaja.Estado?.EstadoBien || "-"}</p></section>
                </div>
                <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                  <h3 className="bg-slate-800 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white">V. Datos de la ficha</h3>
                  <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 [&>p>span]:mb-1 [&>p>span]:block [&>p>span]:text-[11px] [&>p>span]:font-bold [&>p>span]:uppercase [&>p>span]:tracking-wide [&>p>span]:text-muted-foreground">
                    <p><span>N.° de ficha</span>{selectedBaja.NumeroFichaBaja || "-"}</p><p><span>Fecha de registro</span>{selectedBaja.FechaRegistro ? new Date(selectedBaja.FechaRegistro).toLocaleString("es-PE") : "-"}</p><p><span>Responsable</span>{selectedBaja.Responsable || "-"}</p><p><span>Unidad orgánica</span>{selectedBaja.UnidadOrganica || "-"}</p><p><span>Dependencia</span>{selectedBaja.Dependencia || "-"}</p><p><span>Ambiente</span>{selectedBaja.Ambiente || "-"}</p>
                  </div>
                </section>
                <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"><h3 className="bg-slate-800 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white">VI. Causal de baja</h3><p className="whitespace-pre-wrap p-4 leading-6">{selectedBaja.CausalBaja || "-"}</p></section>
                <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"><h3 className="bg-slate-800 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white">VII. Fundamentación</h3><p className="whitespace-pre-wrap p-4 leading-6">{selectedBaja.Fundamentacion || "-"}</p></section>
                <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"><h3 className="bg-slate-800 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white">VIII. Recomendación</h3><p className="whitespace-pre-wrap p-4 leading-6">{selectedBaja.Recomendacion || "-"}</p></section>
                <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"><h3 className="bg-slate-800 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white">IX. Observación</h3><p className="whitespace-pre-wrap p-4 leading-6">{selectedBaja.Observacion || "-"}</p></section>
              </> : <p className="mt-2">No se encontró la ficha relacionada.</p>}
            </div>
          </div> : null}
          <DialogFooter className="border-t border-border bg-muted/20 px-6 py-4"><Button variant="secondary" onClick={() => setSelectedNotification(null)}>Cerrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectNotification !== null} onOpenChange={(open) => !open && setRejectNotification(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar ficha de baja</DialogTitle>
            <DialogDescription>Indique el motivo del rechazo.</DialogDescription>
          </DialogHeader>
          <Textarea value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} placeholder="Ingrese el motivo del rechazo" />
          <DialogFooter>
            <Button variant="secondary" onClick={() => setRejectNotification(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={reject}>Rechazar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
