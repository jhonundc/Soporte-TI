import { apiFetch } from "./http";

export type CatalogRecord = Record<string, unknown>;

export const catalogService = {
  list: (apiPath: string) => apiFetch<CatalogRecord[]>(apiPath),

  create: (apiPath: string, body: Record<string, unknown>) =>
    apiFetch<CatalogRecord>(apiPath, { method: "POST", body: JSON.stringify(body) }),

  update: (apiPath: string, body: Record<string, unknown>) =>
    apiFetch<CatalogRecord>(apiPath, { method: "PATCH", body: JSON.stringify(body) }),

  remove: (apiPath: string, id: number, options?: { permanent?: boolean }) => {
    const params = new URLSearchParams();
    params.set("id", String(id));
    if (options?.permanent) params.set("permanent", "1");
    return apiFetch<CatalogRecord>(`${apiPath}?${params.toString()}`, { method: "DELETE" });
  },
};
