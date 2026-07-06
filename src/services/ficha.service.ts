import { apiFetch } from "./http";
import type { FichaSoporteRecord } from "@/features/soporte/ficha/types";

export const fichaService = {
  list: () => apiFetch<FichaSoporteRecord[]>("/api/soporte/ficha"),

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
