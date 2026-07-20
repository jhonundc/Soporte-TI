import { apiFetch } from "./http";
import type { FichaSoporteRecord } from "@/features/soporte/ficha/types";

type FichaListParams = {
  numeroFicha?: string;
};

export const fichaService = {
  list: (params?: FichaListParams) => {
    const search = new URLSearchParams();
    if (params?.numeroFicha) search.set("numeroFicha", params.numeroFicha);
    const query = search.toString();
    return apiFetch<FichaSoporteRecord[]>(`/api/soporte/ficha${query ? `?${query}` : ""}`);
  },

  getById: (id: number) => apiFetch<FichaSoporteRecord>(`/api/soporte/ficha?id=${id}`),

  save: (data: Record<string, unknown>, editingId?: number) =>
    apiFetch<FichaSoporteRecord>("/api/soporte/ficha", {
      method: editingId ? "PATCH" : "POST",
      body: JSON.stringify(
        editingId ? { ...data, IdSoporte: editingId } : data
      ),
    }),

  saveEvidence: (idSoporte: number, image: File) => {
    const formData = new FormData();
    formData.append("IdSoporte", String(idSoporte));
    formData.append("imagen", image);
    return apiFetch<{ success: boolean; EvidenciaFirma: string }>(
      "/api/soporte/ficha/evidencia",
      { method: "POST", body: formData }
    );
  },

  removeEvidence: (idSoporte: number) =>
    apiFetch<{ success: boolean }>(`/api/soporte/ficha/evidencia?id=${idSoporte}`, {
      method: "DELETE",
    }),

  remove: (id: number) =>
    apiFetch<{ success?: boolean }>(`/api/soporte/ficha?id=${id}`, {
      method: "DELETE",
    }),
};
