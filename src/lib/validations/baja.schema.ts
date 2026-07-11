import { z } from "zod";
import {
  nullableInt,
  nullableString,
  requiredPositiveInt,
  requiredString,
} from "./common";

const bajaBaseFields = {
  UnidadOrganica: nullableString.optional(),
  Responsable: nullableString.optional(),
  Dependencia: nullableString.optional(),
  Ambiente: nullableString.optional(),
  TipoBien: nullableString.optional(),
  Prioridad: nullableString.optional(),
  IdCondicion: nullableInt.optional(),
  IdEstadoBien: nullableInt.optional(),
  Fundamentacion: nullableString.optional(),
  Recomendacion: nullableString.optional(),
  CausalBaja: nullableString.optional(),
  Observacion: nullableString.optional(),
  IdUsuarioRegistro: nullableInt.optional(),
};

export const bajaCreateApiSchema = z.object({
  NumeroFichaBaja: requiredString,
  IdBien: requiredPositiveInt,
  ...bajaBaseFields,
});

export const bajaUpdateApiSchema = z.object({
  IdBaja: requiredPositiveInt,
  NumeroFichaBaja: nullableString.optional(),
  IdBien: nullableInt.optional(),
  ...bajaBaseFields,
});

export const bajaDeleteQuerySchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const bajaListQuerySchema = z.object({
  numeroFicha: nullableString.optional(),
});

export type BajaCreateApiInput = z.infer<typeof bajaCreateApiSchema>;
export type BajaUpdateApiInput = z.infer<typeof bajaUpdateApiSchema>;
