"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bienFormSchema, type BienFormInput } from "@/lib/validations";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormDialogContent } from "@/components/forms/FormDialogContent";
import { FormDialogFooter } from "@/components/forms/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect } from "react";
import { SearchableSelect } from "@/components/forms/SearchableSelect";
import { getMarcas, getAreas, getCondiciones, getEstados, getCategorias } from "@/app/actions/catalogs";
import { notify } from "@/lib/feedback/toast";
import { queryKeys } from "@/lib/query-keys";

type BienFormValues = BienFormInput;

interface BienFormModalProps {
  bien?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  readOnly?: boolean;
}

export default function BienFormModal({ bien, open, onOpenChange, readOnly = false }: BienFormModalProps) {
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<BienFormValues>({
    resolver: zodResolver(bienFormSchema),
  });

  // Consultas para llenar los combos (Server Actions + React Query)
  const { data: marcas } = useQuery({ queryKey: queryKeys.catalogs.marcas, queryFn: () => getMarcas() });
  const { data: areas } = useQuery({ queryKey: queryKeys.catalogs.areas, queryFn: () => getAreas() });
  const { data: condiciones } = useQuery({ queryKey: queryKeys.catalogs.condiciones, queryFn: () => getCondiciones() });
  const { data: estados } = useQuery({ queryKey: queryKeys.catalogs.estados, queryFn: () => getEstados() });
  const { data: categorias } = useQuery({ queryKey: queryKeys.catalogs.categorias, queryFn: () => getCategorias() });

  // Llenar formulario al editar
  useEffect(() => {
    if (open) {
      if (bien) {
        reset({
          CodigoInventario: bien.CodigoInventario || "",
          CodigoPatrimonial: bien.CodigoPatrimonial || "",
          Descripcion: bien.Descripcion || "",
          Modelo: bien.Modelo || "",
          IdCategoria: bien.IdCategoria ? String(bien.IdCategoria) : "",
          IdMarca: bien.IdMarca ? String(bien.IdMarca) : "",
          IdArea: bien.IdArea ? String(bien.IdArea) : "",
          NumeroSerie: bien.NumeroSerie || "",
          IdCondicion: bien.IdCondicion ? String(bien.IdCondicion) : "",
          IdEstadoBien: bien.IdEstadoBien ? String(bien.IdEstadoBien) : "",
          FechaCompra: bien.FechaCompra ? new Date(bien.FechaCompra).toISOString().slice(0, 10) : "",
        });
      } else {
        reset({
          CodigoInventario: "",
          CodigoPatrimonial: "",
          Descripcion: "",
          Modelo: "",
          IdCategoria: "",
          IdMarca: "",
          IdArea: "",
          NumeroSerie: "",
          IdCondicion: "",
          IdEstadoBien: "",
          FechaCompra: "",
        });
      }
    }
  }, [open, bien, reset]);

  // Mutación para guardar (POST o PATCH)
  const mutation = useMutation({
    mutationFn: async (data: BienFormValues) => {
      const url = "/api/bienes";
      const method = bien ? "PATCH" : "POST";
      const body = bien ? { IdBien: bien.IdBien, ...data } : data;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `Error al ${bien ? "actualizar" : "crear"} el bien`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bienes"] });
      onOpenChange(false);
      reset();
    },
    onError: (error) => notify.fromError(error),
  });

  const onSubmit = (data: BienFormValues) => {
    if (readOnly) return;
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <FormDialogContent size="lg" className="max-h-[92vh] overflow-y-auto p-0 sm:max-w-3xl">
        <DialogHeader className="border-b border-primary/10 bg-gradient-to-r from-primary/10 via-primary/5 to-card px-6 py-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Inventario institucional</p>
          <DialogTitle>
            {readOnly ? "Detalle del Bien" : bien ? "Editar Bien" : "Registrar Nuevo Bien"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-primary/[0.025] px-6 py-6 [&_input]:rounded-xl [&_label]:font-semibold [&_label]:text-primary [&_[data-slot=select-trigger]]:rounded-xl">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Cód. Inventario</label>
              <Input
                {...register("CodigoInventario")}
                placeholder="Ej. 5245 o INV-001"
                maxLength={50}
                readOnly={readOnly}
              />
              {!readOnly && (
                <p className="text-xs text-muted-foreground">
                  Acepta números o texto libre; no requiere el prefijo INV-.
                </p>
              )}
              {errors.CodigoInventario && <p className="text-xs text-destructive">{errors.CodigoInventario.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Cód. Patrimonial</label>
              <Input {...register("CodigoPatrimonial")} placeholder="Ej. PAT-001" readOnly={readOnly} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Descripción *</label>
            <Input {...register("Descripcion")} placeholder="Ej. Laptop HP Core i7" readOnly={readOnly} />
            {errors.Descripcion && <p className="text-xs text-destructive">{errors.Descripcion.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-foreground">Categoría</label>
              </div>
              <SearchableSelect
                value={watch("IdCategoria") ? String(watch("IdCategoria")) : ""} 
                onValueChange={(val) => setValue("IdCategoria", val as any)}
                disabled={readOnly}
                options={(categorias ?? []).map((c: any) => ({ value: String(c.IdCategoria), label: String(c.CategoriaBien) }))}
                placeholder="Seleccione o busque categoría"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-foreground">Área</label>
              </div>
              <SearchableSelect
                value={watch("IdArea") ? String(watch("IdArea")) : ""} 
                onValueChange={(val) => setValue("IdArea", val as any)}
                disabled={readOnly}
                options={(areas ?? []).map((a: any) => ({ value: String(a.IdArea), label: String(a.NombreArea) }))}
                placeholder="Seleccione o busque área"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-foreground">Marca</label>
              </div>
              <SearchableSelect
                value={watch("IdMarca") ? String(watch("IdMarca")) : ""} 
                onValueChange={(val) => setValue("IdMarca", val as any)}
                disabled={readOnly}
                options={(marcas ?? []).map((m: any) => ({ value: String(m.IdMarca), label: String(m.Marca) }))}
                placeholder="Seleccione o busque marca"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Modelo</label>
              <Input {...register("Modelo")} placeholder="Ej. ThinkPad T14" readOnly={readOnly} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Nº Serie</label>
              <Input {...register("NumeroSerie")} placeholder="Ej. ABC123XYZ" readOnly={readOnly} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Fecha Compra</label>
              <Input {...register("FechaCompra")} type="date" readOnly={readOnly} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-foreground">Condición</label>
              </div>
              <SearchableSelect
                value={watch("IdCondicion") ? String(watch("IdCondicion")) : ""} 
                onValueChange={(val) => setValue("IdCondicion", val as any)}
                disabled={readOnly}
                options={(condiciones ?? []).map((c: any) => ({ value: String(c.IdCondicion), label: String(c.Condicion) }))}
                placeholder="Seleccione o busque condición"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Estado</label>
              <SearchableSelect
                value={watch("IdEstadoBien") ? String(watch("IdEstadoBien")) : ""} 
                onValueChange={(val) => setValue("IdEstadoBien", val as any)}
                disabled={readOnly}
                options={(estados ?? []).map((e: any) => ({ value: String(e.IdEstadoBien), label: String(e.EstadoBien) }))}
                placeholder="Seleccione o busque estado"
              />
            </div>
          </div>

          {!readOnly ? (
            <FormDialogFooter
              onCancel={() => onOpenChange(false)}
              submitLabel={bien ? "Actualizar" : "Guardar"}
              loading={mutation.isPending}
            />
          ) : (
            <div className="flex justify-end border-t border-primary/10 pt-4">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
            </div>
          )}
        </form>
      </FormDialogContent>
    </Dialog>
  );
}
