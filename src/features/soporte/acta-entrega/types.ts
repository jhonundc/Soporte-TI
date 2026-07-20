export type ActaDetalle = {
  IdActaEntregaDetalle?: number;
  IdBien: number;
  CodigoPatrimonial?: string;
  CodigoInventario?: string;
  Descripcion?: string;
  NumeroSerie?: string;
  Modelo?: string;
  Marca?: string;
  ObservacionDetalle?: string;
};

export type ActaEntrega = {
  IdActaEntrega: number;
  NumeroActa: string;
  FechaEntrega: string;
  IdUsuarioEntrega: number;
  NombreCreador?: string;
  CargoCreador?: string;
  NombreReceptor: string;
  CargoReceptor?: string;
  IdAreaReceptor?: number;
  AreaReceptor?: string;
  ServicioArea?: string;
  Observaciones?: string;
  EstadoActa: string;
  Activo: boolean;
  FechaRegistro?: string;
  EvidenciaFirma?: string;
  CantidadBienes?: number;
  Detalles?: ActaDetalle[];
};

export type ActaPayload = Omit<ActaEntrega, "IdActaEntrega" | "Activo" | "FechaRegistro" | "CantidadBienes" | "AreaReceptor"> & {
  IdActaEntrega?: number;
  Detalles: Array<{ IdBien: number; ObservacionDetalle?: string }>;
};
