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

  remove: (id: number) =>
    apiFetch<{ success?: boolean }>(`/api/soporte/ficha?id=${id}`, {
      method: "DELETE",
    }),
};
