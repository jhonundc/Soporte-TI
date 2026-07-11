import { apiFetch } from "./http";
import type { BajaRecord } from "@/features/soporte/baja/types";

type BajaListParams = {
  numeroFicha?: string;
};

export const bajaService = {
  list: (params?: BajaListParams) => {
    const search = new URLSearchParams();
    if (params?.numeroFicha) search.set("numeroFicha", params.numeroFicha);
    const query = search.toString();
    return apiFetch<BajaRecord[]>(`/api/soporte/baja${query ? `?${query}` : ""}`);
  },

  save: (data: Record<string, unknown>, editingId?: number) =>
    apiFetch<BajaRecord>("/api/soporte/baja", {
      method: editingId ? "PATCH" : "POST",
      body: JSON.stringify(editingId ? { ...data, IdBaja: editingId } : data),
    }),

  remove: (id: number) =>
    apiFetch<{ success?: boolean }>(`/api/soporte/baja?id=${id}`, {
      method: "DELETE",
    }),
};
