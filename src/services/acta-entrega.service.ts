import { apiFetch } from "./http";
import type { ActaEntrega, ActaPayload } from "@/features/soporte/acta-entrega/types";

export const actaEntregaService = {
  list: (all = false) => apiFetch<ActaEntrega[]>(`/api/soporte/actas-entrega${all ? "?todas=1" : ""}`),
  nextNumber: () => apiFetch<{ NumeroActa: string }>("/api/soporte/actas-entrega?siguienteNumero=1"),
  get: (id: number) => apiFetch<ActaEntrega>(`/api/soporte/actas-entrega?id=${id}`),
  create: (payload: ActaPayload) => apiFetch<{ IdActaEntrega: number; Mensaje: string }>("/api/soporte/actas-entrega", { method: "POST", body: JSON.stringify(payload) }),
  update: (payload: ActaPayload) => apiFetch<{ Mensaje: string }>("/api/soporte/actas-entrega", { method: "PUT", body: JSON.stringify(payload) }),
  saveEvidence: (idActaEntrega: number, image: File) => {
    const formData = new FormData();
    formData.append("IdActaEntrega", String(idActaEntrega));
    formData.append("imagen", image);
    return apiFetch<{ success: boolean; EvidenciaFirma: string }>("/api/soporte/actas-entrega/evidencia", { method: "POST", body: formData });
  },
  removeEvidence: (idActaEntrega: number) => apiFetch<{ success: boolean }>(`/api/soporte/actas-entrega/evidencia?id=${idActaEntrega}`, { method: "DELETE" }),
  action: (id: number, accion: "E" | "V" | "N" | "T" | "D") => apiFetch<{ Mensaje: string }>("/api/soporte/actas-entrega", { method: "PATCH", body: JSON.stringify({ IdActaEntrega: id, Accion: accion }) }),
};
