import { z } from "zod";
import { nullableInt, nullableString, requiredPositiveInt, requiredString } from "./common";

/** Schema compartido formulario cliente + API POST/PATCH bienes */
export const bienFormSchema = z
  .object({
    CodigoInventario: z.string().optional(),
    CodigoPatrimonial: z.string().optional(),
    Descripcion: z.string().min(3, "La descripción es requerida"),
    Modelo: z.string().optional(),
    IdCategoria: z.string().optional(),
    IdMarca: z.string().optional(),
    IdArea: z.string().optional(),
    NumeroSerie: z.string().optional(),
    IdCondicion: z.string().optional(),
    IdEstadoBien: z.string().optional(),
    FechaCompra: z.string().optional(),
  })
  .refine((data) => data.CodigoInventario || data.CodigoPatrimonial, {
    message: "Debe proporcionar al menos un código (Inventario o Patrimonial)",
    path: ["CodigoInventario"],
  });

export type BienFormInput = z.infer<typeof bienFormSchema>;

export const bienCreateApiSchema = z
  .object({
    CodigoInventario: nullableString,
    CodigoPatrimonial: nullableString,
    Descripcion: nullableString,
    Modelo: nullableString,
    IdCategoria: nullableInt,
    IdMarca: nullableInt,
    IdArea: nullableInt,
    NumeroSerie: nullableString,
    IdCondicion: nullableInt,
    IdEstadoBien: nullableInt,
    FechaCompra: z
      .union([z.string(), z.date(), z.null()])
      .optional()
      .refine(
        (val) => {
          if (val === null || val === undefined || val === "") return true;
          const date = val instanceof Date ? val : new Date(String(val));
          return !Number.isNaN(date.getTime());
        },
        { message: "Fecha de compra inválida" }
      )
      .transform((val) => {
        if (val === null || val === undefined || val === "") return null;
        return val instanceof Date ? val : new Date(String(val));
      }),
  })
  .refine((data) => data.CodigoInventario || data.CodigoPatrimonial, {
    message: "Debe proporcionar al menos un código (Inventario o Patrimonial)",
    path: ["CodigoInventario"],
  });

export const bienToggleApiSchema = z.object({
  IdBien: requiredPositiveInt,
  Activo: z.boolean(),
});

export const bienUpdateApiSchema = z
  .object({
    IdBien: requiredPositiveInt,
    CodigoInventario: nullableString.optional(),
    CodigoPatrimonial: nullableString.optional(),
    IdCategoria: nullableInt.optional(),
    IdMarca: nullableInt.optional(),
    IdArea: nullableInt.optional(),
    Modelo: nullableString.optional(),
    NumeroSerie: nullableString.optional(),
    Descripcion: nullableString.optional(),
    IdCondicion: nullableInt.optional(),
    IdEstadoBien: nullableInt.optional(),
    FechaCompra: z
      .union([z.string(), z.date(), z.null()])
      .optional()
      .refine(
        (val) => {
          if (val === undefined || val === null || val === "") return true;
          const date = val instanceof Date ? val : new Date(String(val));
          return !Number.isNaN(date.getTime());
        },
        { message: "Fecha de compra inválida" }
      )
      .transform((val) => {
        if (val === undefined) return undefined;
        if (val === null || val === "") return null;
        return val instanceof Date ? val : new Date(String(val));
      }),
    Activo: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    const { IdBien: _id, Activo, ...fields } = data;
    const keys = Object.keys(fields).filter(
      (k) => fields[k as keyof typeof fields] !== undefined
    );
    if (Activo !== undefined && keys.length === 0) return;
    if (keys.length === 0 && Activo === undefined) {
      ctx.addIssue({
        code: "custom",
        message: "No hay campos para actualizar",
      });
    }
  });

export const bienDeleteQuerySchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type BienCreateApiInput = z.infer<typeof bienCreateApiSchema>;
export type BienUpdateApiInput = z.infer<typeof bienUpdateApiSchema>;
export type BienToggleApiInput = z.infer<typeof bienToggleApiSchema>;
