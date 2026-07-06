import { apiFetch } from "./http";

export type CatalogRecord = Record<string, unknown>;

export const catalogService = {
  list: (apiPath: string) => apiFetch<CatalogRecord[]>(apiPath),

  create: (apiPath: string, body: Record<string, unknown>) =>
    apiFetch<CatalogRecord>(apiPath, { method: "POST", body: JSON.stringify(body) }),

  update: (apiPath: string, body: Record<string, unknown>) =>
    apiFetch<CatalogRecord>(apiPath, { method: "PATCH", body: JSON.stringify(body) }),

  remove: (apiPath: string, id: number) =>
    apiFetch<CatalogRecord>(`${apiPath}?id=${id}`, { method: "DELETE" }),
};
