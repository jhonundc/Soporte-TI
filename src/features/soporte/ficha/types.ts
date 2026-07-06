export type BienRef = {
  IdBien: number;
  CodigoInventario: string;
  CodigoPatrimonial: string;
  Descripcion: string;
  NumeroSerie: string;
  IdArea: number | null;
  IdMarca: number | null;
  IdModelo: number | null;
  IdCondicion: number | null;
  IdEstadoBien: number | null;
  Area?: { NombreArea: string };
  Marca?: { Marca: string };
  Modelo?: { Modelo: string };
  Condicion?: { Condicion: string };
  Estado?: { EstadoBien: string };
};

export type CondicionRef = {
  IdCondicion: number;
  Condicion: string | null;
};

export type EstadoRef = {
  IdEstadoBien: number;
  EstadoBien: string | null;
};

export type PrioridadRef = {
  IdPrioridad: number;
  NombrePrioridad: string | null;
};

export type AreaRef = {
  IdArea: number;
  NombreArea: string;
};

export type TipoBienRef = {
  IdTipoBien: number;
  TipoBien: string;
};

export type FichaSoporteRecord = {
  IdSoporte: number;
  NumeroFicha?: string;
  UnidadOrganica?: string;
  FechaRegistro?: string;
  Responsable?: string;
  Dependencia?: string;
  Ambiente?: string;
  TipoBien?: string;
  IdBien?: number;
  IdPrioridad?: number;
  IdCondicion?: number;
  IdEstadoBien?: number;
  DescripcionProblema?: string;
  TrabajosRealizados?: string;
  Diagnostico?: string;
  Recomendacion?: string;
  FirmaSoporte?: string;
  FirmaJefeUnidad?: string;
  FirmaAreaUsuario?: string;
  EstadoTicket?: string;
  Usuario_Nombres?: string;
  Bien?: BienRef;
  Condicion?: CondicionRef;
  Estado?: EstadoRef;
  Prioridad?: PrioridadRef;
  UsuarioSoporte?: { Nombres?: string; Usuario?: string };
  [key: string]: unknown;
};

export type FichaFormValues = Record<string, string>;
