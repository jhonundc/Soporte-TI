import { apiFetch } from "./http";

export type NotificacionRecord = {
  IdNotificacion: number;
  TipoFicha: string;
  IdReferencia: number;
  IdUsuarioOrigen: number;
  IdUsuarioDestino: number;
  NombreUsuarioOrigen?: string | null;
  IdUsuarioRespondio?: number | null;
  NombreUsuarioRespondio?: string | null;
  Titulo: string;
  Mensaje: string;
  EstadoAprobacion: string;
  Leido: boolean;
  FechaCreacion: string;
  FechaLectura?: string | null;
  FechaRespuesta?: string | null;
  ObservacionAdministrador?: string | null;
  Activo: boolean;
};

export const notificacionService = {
  list: (params?: {
    tipoFicha?: string;
    pendiente?: boolean;
    leido?: boolean;
    noLeidas?: boolean;
  }) => {
    const search = new URLSearchParams();
    if (params?.tipoFicha) search.set("tipoFicha", params.tipoFicha);
    if (typeof params?.pendiente === "boolean" && params.pendiente) search.set("pendiente", "1");
    if (typeof params?.leido === "boolean") search.set("leido", params.leido ? "1" : "0");
    if (typeof params?.noLeidas === "boolean" && params.noLeidas) search.set("noLeidas", "1");
    const query = search.toString();
    return apiFetch<NotificacionRecord[]>(`/api/soporte/notificaciones${query ? `?${query}` : ""}`);
  },

  action: (payload: {
    IdNotificacion: number;
    Accion: "P" | "X";
    ObservacionAdministrador?: string | null;
  }) =>
    apiFetch<{ Mensaje?: string; error?: string }>("/api/soporte/notificaciones", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};
