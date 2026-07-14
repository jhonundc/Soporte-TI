"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/forms/SearchableSelect";
import { useEffect, useMemo, useState } from "react";
import QuickCreateMarcaModal from "./QuickCreateMarcaModal";
import { notify } from "@/lib/feedback/toast";
import React from "react";

const componenteSchema = z.object({
  IdBienComponente: z.string().optional(),
  IdBien: z.string().optional(),
  IdComponente: z.string().min(1, "Selecciona un componente.").optional(),
  DescripcionModelo: z.string().max(200).optional(),
  Marca: z.string().max(100).optional(),
  Serie: z.string().max(100).optional(),
  CodigoPatrimonial: z.string().max(100).nullable().optional(),
  ProcesadorEspecificaciones: z.string().max(300).optional(),
  RAM: z.string().max(100).optional(),
  Almacenamiento: z.string().max(100).optional(),
  SistemaOperativo: z.string().max(100).optional(),
  UbicacionFisica: z.string().max(200).optional(),
  UsuarioAsignado: z.string().max(200).optional(),
  EstadoEquipo: z.string().max(100).optional(),
  Cantidad: z.string()
    .min(1, "La cantidad es obligatoria.")
    .regex(/^[0-9]+$/, "La cantidad debe ser un número entero mayor que cero."),
  Observacion: z.string().optional(),
});

type ComponenteFormValues = z.infer<typeof componenteSchema>;

interface ComponenteFormModalProps {
  componente?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  readOnly?: boolean;
}

export default function ComponenteFormModal({ componente, open, onOpenChange, readOnly = false }: ComponenteFormModalProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<ComponenteFormValues>({
    resolver: zodResolver(componenteSchema),
  });

  const codigoPatrimonialValue = watch("CodigoPatrimonial");
  const idBienValue = watch("IdBien");

  const { data: bienes } = useQuery({
    queryKey: ["bienesSelect"],
    queryFn: async () => {
      const res = await fetch("/api/bienes?includeInactive=true");
      if (!res.ok) throw new Error("Error al cargar los bienes");
      return res.json();
    },
  });

  const { data: componentesCatalog } = useQuery({
    queryKey: ["componentesCatalog"],
    queryFn: async () => {
      const res = await fetch("/api/componentes-catalogo");
      if (!res.ok) throw new Error("Error al cargar los componentes");
      return res.json();
    },
  });

  const { data: marcas } = useQuery({
    queryKey: ["marcas"],
    queryFn: async () => {
      const res = await fetch("/api/marcas");
      if (!res.ok) throw new Error("Error al cargar las marcas");
      return res.json();
    },
  });

  const { data: areas } = useQuery({
    queryKey: ["areasSelect"],
    queryFn: async () => {
      const res = await fetch("/api/areas");
      if (!res.ok) throw new Error("Error al cargar las áreas");
      return res.json();
    },
  });

  const { data: estados } = useQuery({
    queryKey: ["estadosSelect"],
    queryFn: async () => {
      const res = await fetch("/api/estados");
      if (!res.ok) throw new Error("Error al cargar los estados");
      return res.json();
    },
  });

  const selectedBien = bienes?.find((b: any) => String(b.IdBien) === watch("IdBien"));
  const codigoPatrimonialOptions = useMemo(
    () =>
      (bienes ?? [])
        .map((b: any) => String(b.CodigoPatrimonial || "").trim())
        .filter((value: string) => Boolean(value))
        .filter((value: string, index: number, list: string[]) => list.indexOf(value) === index)
        .map((value: string) => ({ value, label: value })),
    [bienes]
  );

// --- SuggestionsList component (local) ---
function SuggestionsList({
  query,
  options,
  onSelect,
}: {
  query?: string;
  options: { value: string; label: string }[];
  onSelect: (v: string) => void;
}) {
  const q = String(query ?? "").trim().toLowerCase();
  if (!q) return null;
  const filtered = options.filter((o) => o.value.toLowerCase().includes(q)).slice(0, 8);
  if (!filtered.length) return null;

  return (
    <ul className="absolute z-50 mt-1 max-h-44 w-full overflow-y-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-[var(--shadow-elevated)]">
      {filtered.map((opt) => (
        <li key={opt.value}>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onSelect(opt.value)}
            className="w-full text-left px-2.5 py-2 text-sm hover:bg-muted"
          >
            {opt.label}
          </button>
        </li>
      ))}
    </ul>
  );
}


  // usamos el propio react-hook-form para el campo CodigoPatrimonial (permite escritura libre)

  const normalizarCodigo = (value: unknown) =>
    String(value ?? "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9]/g, "");

  const normalizeCodigoPatrimonialInput = (value: unknown) => {
    const raw = String(value ?? "").trim();
    if (!raw) return "SIN ASIGNACIÓN";
    const normalized = raw.toLowerCase().replace(/\s+/g, "");
    if (["sin asignación", "sin-asignacion", "sin-asignación", "sinasignación"].includes(normalized)) {
      return "SIN ASIGNACIÓN";
    }
    return raw;
  };

  const buscarBienPorCodigoPatrimonial = (codigo: string) => {
    const normalizedCode = normalizarCodigo(codigo);
    if (!normalizedCode || !Array.isArray(bienes)) {
      if (watch("IdBien")) setValue("IdBien", "");
      return;
    }

    const bienEncontrado = bienes.find((b: any) => {
      const codigoPatrimonial = normalizarCodigo(b?.CodigoPatrimonial ?? "");
      const codigoInventario = normalizarCodigo(b?.CodigoInventario ?? "");
      return codigoPatrimonial === normalizedCode || codigoInventario === normalizedCode;
    });

    if (bienEncontrado) {
      setValue("IdBien", String(bienEncontrado.IdBien));
      setValue("CodigoPatrimonial", String(bienEncontrado.CodigoPatrimonial ?? ""));
      return;
    }

    // If not found, clear IdBien but keep CodigoPatrimonial value for user to edit
    setValue("IdBien", "");
    console.debug("buscarBienPorCodigoPatrimonial: no match for", codigo, "normalized->", normalizedCode);
  };

  const [suggestionsOpen, setSuggestionsOpen] = useState(false);



  useEffect(() => {
    if (open && selectedBien?.CodigoPatrimonial) {
      setValue("CodigoPatrimonial", selectedBien.CodigoPatrimonial);
      return;
    }

    if (open) {
      if (componente) {
        // Si tenemos IdBienComponente, obtener la versión más reciente del servidor
        (async () => {
          try {
            if (componente.IdBienComponente) {
              const res = await fetch(`/api/componentes?idBienComponente=${encodeURIComponent(String(componente.IdBienComponente))}`);
              if (res.ok) {
                const fresh = await res.json();
                const source = Array.isArray(fresh) ? fresh[0] : fresh;
                if (source) {
                  reset({
                    IdBienComponente: source.IdBienComponente ? String(source.IdBienComponente) : "",
                    IdBien: source.IdBien ? String(source.IdBien) : "",
                    IdComponente: source.IdComponente ? String(source.IdComponente) : "",
                    DescripcionModelo: source.DescripcionModelo || "",
                    Marca: typeof source.Marca === "object" ? source.Marca?.Marca || "" : source.Marca || "",
                    Serie: source.Serie || "",
                    CodigoPatrimonial: source.CodigoPatrimonial || "",
                    ProcesadorEspecificaciones: source.ProcesadorEspecificaciones || "",
                    RAM: source.RAM || "",
                    Almacenamiento: source.Almacenamiento || "",
                    SistemaOperativo: source.SistemaOperativo || "",
                    UbicacionFisica: source.UbicacionFisica || "",
                    UsuarioAsignado: source.UsuarioAsignado || "",
                    EstadoEquipo: source.EstadoEquipo || "",
                    Cantidad: String(source.Cantidad ?? 0),
                    Observacion: source.Observacion || "",
                  });
                  return;
                }
              }
            }
          } catch (e) {
            console.warn("No se pudo obtener detalle fresco:", e);
          }

          // Fallback a los datos que vinieron en `componente`
          reset({
            IdBienComponente: componente.IdBienComponente ? String(componente.IdBienComponente) : "",
            IdBien: componente.IdBien ? String(componente.IdBien) : "",
            IdComponente: componente.IdComponente ? String(componente.IdComponente) : "",
            DescripcionModelo: componente.DescripcionModelo || "",
            Marca: typeof componente.Marca === "object" ? componente.Marca?.Marca || "" : componente.Marca || "",
            Serie: componente.Serie || "",
            CodigoPatrimonial: componente.CodigoPatrimonial || "",
            ProcesadorEspecificaciones: componente.ProcesadorEspecificaciones || "",
            RAM: componente.RAM || "",
            Almacenamiento: componente.Almacenamiento || "",
            SistemaOperativo: componente.SistemaOperativo || "",
            UbicacionFisica: componente.UbicacionFisica || "",
            UsuarioAsignado: componente.UsuarioAsignado || "",
            EstadoEquipo: componente.EstadoEquipo || "",
            Cantidad: String(componente.Cantidad ?? 0),
            Observacion: componente.Observacion || "",
          });
        })();
      } else {
        reset({
          IdBienComponente: "",
          IdBien: "",
          IdComponente: "",
          DescripcionModelo: "",
          Marca: "",
          Serie: "",
          CodigoPatrimonial: "",
          ProcesadorEspecificaciones: "",
          RAM: "",
          Almacenamiento: "",
          SistemaOperativo: "",
          UbicacionFisica: "",
          UsuarioAsignado: "",
          EstadoEquipo: "",
          Cantidad: "0",
          Observacion: "",
        });
      }
    }
  }, [open, componente, reset, selectedBien, setValue]);

  const mutation = useMutation({
    mutationFn: async (data: ComponenteFormValues) => {
      const url = "/api/componentes";
      const method = componente ? "PATCH" : "POST";
      const payload = {
        ...data,
        Cantidad: data.Cantidad ? parseInt(data.Cantidad, 10) : null,
        IdBienComponente: data.IdBienComponente || componente?.IdBienComponente || "",
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let responseData: any = {};
      try {
        responseData = await res.json();
      } catch {
        responseData = {};
      }

      if (!res.ok) {
        throw new Error(responseData.error || `Error al ${componente ? "actualizar" : "registrar"} el registro`);
      }
      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["componentes"] });
      onOpenChange(false);
      reset();
    },
    onError: (error) => notify.fromError(error),
  });

  const onInvalid = (errors: Record<string, { message?: string }>) => {
    const firstError = Object.values(errors)[0]?.message;
    notify.fromError(new Error(firstError || "Completa los campos obligatorios antes de guardar"));
  };

  const onSubmit = (data: ComponenteFormValues) => {
    if (readOnly) return;

    const codigoPatrimonial = normalizeCodigoPatrimonialInput(data.CodigoPatrimonial);
    setValue("CodigoPatrimonial", codigoPatrimonial ?? "SIN ASIGNACIÓN");
    const payload = {
      ...data,
      CodigoPatrimonial: codigoPatrimonial,
    };

    mutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-border bg-card p-0 shadow-xl sm:max-w-3xl">
        <DialogHeader className="border-b border-primary/10 bg-gradient-to-r from-primary/10 via-primary/5 to-card px-6 py-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Inventario institucional</p>
          <DialogTitle className="text-xl font-semibold">
            {readOnly ? "Detalle del componente del bien" : componente ? "Editar componente del bien" : "Registrar componente del bien"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4 bg-primary/[0.025] px-6 py-6 [&_input]:rounded-xl [&_label]:font-semibold [&_label]:text-primary [&_textarea]:rounded-xl [&_[data-slot=select-trigger]]:rounded-xl">
          <input type="hidden" {...register("IdBienComponente")} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Componente *</label>
              <SearchableSelect
                value={watch("IdComponente") || ""}
                onValueChange={(val) => setValue("IdComponente", val as any)}
                disabled={readOnly}
                options={(componentesCatalog ?? []).map((c: any) => ({ value: String(c.IdComponente), label: String(c.NombreComponente) }))}
                placeholder="Seleccione o busque componente"
              />
              {errors.IdComponente && <p className="text-xs text-destructive">{errors.IdComponente.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Código patrimonial</label>
              <div className="relative">
                <Input {...register("CodigoPatrimonial")} placeholder="Ej. BP-001 o Sin asignación" readOnly={readOnly} />
                {!readOnly && (
                  <SuggestionsList
                    query={String(watch("CodigoPatrimonial") || "")}
                    options={codigoPatrimonialOptions}
                    onSelect={(val) => {
                      setValue("CodigoPatrimonial", val);
                      buscarBienPorCodigoPatrimonial(val);
                      setTimeout(() => {
                        const el = document.getElementsByName("CodigoPatrimonial")[0] as HTMLInputElement | undefined;
                        el?.focus();
                      }, 0);
                    }}
                  />
                )}
              </div>
              {errors.CodigoPatrimonial && <p className="text-xs text-destructive">{errors.CodigoPatrimonial.message}</p>}
              {!readOnly && (
                <p className="text-xs text-muted-foreground">Escribe un código patrimonial y selecciona uno existente o déjalo libre para guardar.</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Marca</label>
            <div className="flex items-center gap-2">
              <SearchableSelect
                value={watch("Marca") || ""}
                onValueChange={(val) => setValue("Marca", val as any)}
                disabled={readOnly}
                options={(marcas ?? []).map((m: any) => ({ value: String(m.Marca), label: String(m.Marca) }))}
                placeholder="Seleccione o busque marca"
              />
              {!readOnly && <QuickCreateMarcaModal />}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Descripción / Modelo</label>
              <Input
                {...register("DescripcionModelo")}
                placeholder="Ej. Inspiron 15, FX-8300"
                readOnly={readOnly}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Número de Serie</label>
              <Input
                {...register("Serie")}
                placeholder="Ej. SN123456"
                readOnly={readOnly}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Cantidad *</label>
              <Input
                type="number"
                {...register("Cantidad")}
                readOnly={readOnly}
              />
              {errors.Cantidad && <p className="text-xs text-destructive">{errors.Cantidad.message}</p>}
            </div>
            <div />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Procesador / Especificaciones</label>
              <Input
                {...register("ProcesadorEspecificaciones")}
                placeholder="Ej. Intel i5, AMD Ryzen"
                readOnly={readOnly}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">RAM</label>
              <Input
                {...register("RAM")}
                placeholder="Ej. 8GB, 16GB"
                readOnly={readOnly}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Almacenamiento</label>
              <Input
                {...register("Almacenamiento")}
                placeholder="Ej. 256GB SSD"
                readOnly={readOnly}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Sistema Operativo</label>
              <Input
                {...register("SistemaOperativo")}
                placeholder="Ej. Windows 10"
                readOnly={readOnly}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Ubicación Física</label>
              <SearchableSelect
                value={watch("UbicacionFisica") || ""}
                onValueChange={(val) => setValue("UbicacionFisica", val as any)}
                disabled={readOnly}
                options={(areas ?? []).map((a: any) => ({ value: String(a.NombreArea), label: String(a.NombreArea) }))}
                placeholder="Seleccione o busque área"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Usuario Asignado</label>
              <Input
                {...register("UsuarioAsignado")}
                placeholder="Ej. Juan Pérez"
                readOnly={readOnly}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Estado del Equipo</label>
              <SearchableSelect
                value={watch("EstadoEquipo") || ""}
                onValueChange={(val) => setValue("EstadoEquipo", val as any)}
                disabled={readOnly}
                options={(estados ?? []).map((e: any) => ({ value: String(e.EstadoBien), label: String(e.EstadoBien) }))}
                placeholder="Seleccione o busque estado"
              />
            </div>
            <div />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Observación</label>
            <Textarea
              {...register("Observacion")}
              placeholder="Notas adicionales"
              className="min-h-[60px]"
              readOnly={readOnly}
            />
          </div>

          <div className="mt-6 flex justify-end space-x-2 border-t border-primary/10 pt-4">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              {readOnly ? "Cerrar" : "Cancelar"}
            </Button>
            {!readOnly && (
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Guardando..." : componente ? "Actualizar" : "Guardar"}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
