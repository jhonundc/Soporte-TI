import { apiFetch } from "./http";
import type { BajaRecord } from "@/features/soporte/baja/types";

export const bajaService = {
  list: () => apiFetch<BajaRecord[]>("/api/soporte/baja"),

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
