export type BienRef = {
  IdBien: number;
  Descripcion?: string;
  CodigoInventario?: string;
  CodigoPatrimonial?: string;
  NumeroSerie?: string;
  Dimension?: string;
  Color?: string;
  FechaAdquisicion?: string;
  Marca?: { Marca?: string };
  Modelo?: { Modelo?: string };
};

export type BajaRecord = {
  IdBaja: number;
  NumeroFichaBaja?: string;
  UnidadOrganica?: string;
  Dependencia?: string;
  Ambiente?: string;
  Responsable?: string;
  IdBien?: number;
  Prioridad?: string;
  TipoBien?: string;
  IdCondicion?: number;
  IdEstadoBien?: number;
  CausalBaja?: string;
  Recomendacion?: string;
  Observacion?: string;
  Fundamentacion?: string;
  IdUsuarioRegistro?: number;
  EstadoAprobacion?: string;
  FechaRegistro?: string;
  Validador?: string;
  JefeArea?: string;
  JefePatrimonial?: string;
  Bien?: BienRef;
  Condicion?: { Condicion?: string };
  Estado?: { EstadoBien?: string };
  UsuarioRegistro?: { Nombres?: string; Usuario?: string };
  [key: string]: unknown;
};

export type BajaFormValues = {
  NumeroFichaBaja: string;
  UnidadOrganica: string;
  Dependencia: string;
  IdBien: string;
  Prioridad: string;
  TipoBien: string;
  IdCondicion: string;
  IdEstadoBien: string;
  CausalBaja: string;
  Recomendacion: string;
  Observacion: string;
  Fundamentacion: string;
  IdUsuarioRegistro: string;
  Responsable: string;
  Ambiente: string;
};

export type BajaFormSelection = {
  IdCondicion: string;
  IdEstadoBien: string;
  Recomendacion: string;
  CausalBaja: string;
};

export const CONDICION_OPTIONS = ["Operativo", "Inoperativo"] as const;
export const ESTADO_OPTIONS = [
  "Bueno",
  "Regular",
  "Reparar",
  "Baja",
] as const;
export const TIPO_BIEN_OPTIONS = [
  "Informático",
  "Comunicación",
  "Biomédico",
  "Mobiliario",
  "Eléctricos/electrónicos/electromecánico",
  "Mobiliario Clínico",
] as const;
export const DEPENDENCIA_OPTIONS = [
  "Gerencia",
  "Administración",
  "Logística",
  "Laboratorio",
  "Mantenimiento",
  "Unidad de TI",
] as const;
export const RECOMENDACION_OPTIONS = ["Dar de baja", "Recuperar", "Reasignar"] as const;
export const CAUSAL_BAJA_OPTIONS = [
  "Obsolescencia técnica",
  "Estado de excedencia",
  "Mantenimiento o reparación onerosa",
  "Siniestro o destrucción",
  "Reposición",
  "Estado de chatarra",
  "RAEE",
  "Otros",
] as const;

export function getCondicionBadgeClass(value?: string) {
  const normalized = (value || "").toLowerCase();
  return normalized.includes("inoperativo")
    ? "bg-destructive/10 text-destructive ring-destructive/20"
    : "bg-success/10 text-success ring-success/20";
}

export function getEstadoBadgeClass(value?: string) {
  const normalized = (value || "").toLowerCase();
  if (
    normalized.includes("malo para baja") ||
    normalized.includes("malo por reparar") ||
    normalized.includes("reparar") ||
    normalized === "baja"
  ) {
    return "bg-warning/10 text-warning ring-warning/20";
  }
  if (normalized.includes("regular")) {
    return "bg-primary/10 text-primary ring-primary/20";
  }
  return "bg-success/10 text-success ring-success/20";
}
