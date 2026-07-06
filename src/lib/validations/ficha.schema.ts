import { z } from "zod";
import {
  nullableInt,
  nullableString,
  optionalBooleanLike,
  requiredPositiveInt,
  requiredString,
} from "./common";

export const fichaCreateApiSchema = z.object({
  NumeroFicha: requiredString,
  UnidadOrganica: nullableString.optional(),
  IdBien: nullableInt.optional(),
  Responsable: nullableString.optional(),
  Dependencia: nullableString.optional(),
  Ambiente: nullableString.optional(),
  TipoBien: nullableString.optional(),
  IdCondicion: nullableInt.optional(),
  IdEstadoBien: nullableInt.optional(),
  TrabajosRealizados: nullableString.optional(),
  Diagnostico: nullableString.optional(),
  Recomendacion: nullableString.optional(),
  DescripcionProblema: nullableString.optional(),
  IdPrioridad: nullableInt.optional(),
  EstadoTicket: nullableString.optional(),
  Siglas: nullableString.optional(),
  FirmaSoporte: nullableString.optional(),
  FirmaJefeUnidad: nullableString.optional(),
  FirmaAreaUsuario: nullableString.optional(),
  IdUsuarioSoporte: nullableInt.optional(),
});

export const fichaUpdateApiSchema = z
  .object({
    IdSoporte: requiredPositiveInt,
    Accion: z.enum(["A", "C", "P", "E"]).optional(),
    Cerrar: z.boolean().optional(),
    NumeroFicha: nullableString.optional(),
    UnidadOrganica: nullableString.optional(),
    IdBien: nullableInt.optional(),
    Responsable: nullableString.optional(),
    Dependencia: nullableString.optional(),
    Ambiente: nullableString.optional(),
    TipoBien: nullableString.optional(),
    IdCondicion: nullableInt.optional(),
    IdEstadoBien: nullableInt.optional(),
    TrabajosRealizados: nullableString.optional(),
    Diagnostico: nullableString.optional(),
    Recomendacion: nullableString.optional(),
    DescripcionProblema: nullableString.optional(),
    IdPrioridad: nullableInt.optional(),
    EstadoTicket: nullableString.optional(),
    Siglas: nullableString.optional(),
    FirmaSoporte: nullableString.optional(),
    FirmaJefeUnidad: nullableString.optional(),
    FirmaAreaUsuario: nullableString.optional(),
    IdUsuarioSoporte: nullableInt.optional(),
  })
  .passthrough();

export const fichaDeleteQuerySchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const fichaListQuerySchema = z.object({
  id: nullableInt.optional(),
  numeroFicha: nullableString.optional(),
  idBien: nullableInt.optional(),
  responsable: nullableString.optional(),
  dependencia: nullableString.optional(),
  ambiente: nullableString.optional(),
  idPrioridad: nullableInt.optional(),
  estadoTicket: nullableString.optional(),
  idUsuarioSoporte: nullableInt.optional(),
  abiertos: optionalBooleanLike.optional(),
  cerrados: optionalBooleanLike.optional(),
});

export const fichaBuscarQuerySchema = z.object({
  q: z.string().trim().min(1, "El término de búsqueda es requerido"),
});

export type FichaCreateApiInput = z.infer<typeof fichaCreateApiSchema>;
export type FichaUpdateApiInput = z.infer<typeof fichaUpdateApiSchema>;
