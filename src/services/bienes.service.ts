import { apiFetch } from "./http";

export type BienRecord = Record<string, unknown>;

export const bienesService = {
  list: () => apiFetch<BienRecord[]>("/api/bienes"),

  toggleActivo: (idBien: number, activo: boolean) =>
    apiFetch<{ success: boolean }>("/api/bienes", {
      method: "PATCH",
      body: JSON.stringify({ IdBien: idBien, Activo: activo }),
    }),

  remove: (id: number) =>
    apiFetch<{ success: boolean }>(`/api/bienes?id=${id}`, { method: "DELETE" }),
};
