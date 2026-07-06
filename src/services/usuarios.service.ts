import { apiFetch } from "./http";

export type UsuarioRecord = {
  IdUsuario: number;
  Usuario: string;
  Nombres: string;
  Cargo?: string;
  IdRol: number;
  Activo: boolean;
  FechaCreacion?: string;
  NombreRol: string;
};

export type RolRecord = {
  IdRol: number;
  NombreRol: string;
  Activo: boolean;
};

export const usuariosService = {
  list: () => apiFetch<UsuarioRecord[]>("/api/usuarios"),

  create: (body: Record<string, unknown>) =>
    apiFetch<{ success: boolean }>("/api/usuarios", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  update: (body: Record<string, unknown>) =>
    apiFetch<{ success: boolean }>("/api/usuarios", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  remove: (id: number) =>
    apiFetch<{ success: boolean }>(`/api/usuarios?id=${id}`, { method: "DELETE" }),

  roles: () => apiFetch<RolRecord[]>("/api/roles"),
};
