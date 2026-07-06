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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect } from "react";
import { getMarcas, getAreas, getCondiciones, getEstados, getCategorias } from "@/app/actions/catalogs";
import { notify } from "@/lib/feedback/toast";

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

  const selectedMarca = watch("IdMarca");
  const selectedCategoria = watch("IdCategoria");

  // Consultas para llenar los combos (Server Actions + React Query)
  const { data: marcas } = useQuery({ queryKey: ["marcas"], queryFn: () => getMarcas() });
  const { data: areas } = useQuery({ queryKey: ["areas"], queryFn: () => getAreas() });
  const { data: condiciones } = useQuery({ queryKey: ["condiciones"], queryFn: () => getCondiciones() });
  const { data: estados } = useQuery({ queryKey: ["estados"], queryFn: () => getEstados() });
  const { data: categorias } = useQuery({ queryKey: ["categorias"], queryFn: () => getCategorias() });

  const selectedArea = watch("IdArea");
  const selectedCondicion = watch("IdCondicion");
  const selectedEstado = watch("IdEstadoBien");
  const selectedCatName = categorias?.find((c: any) => String(c.IdCategoria) === String(selectedCategoria))?.CategoriaBien;
  const selectedAreaName = areas?.find((a: any) => String(a.IdArea) === String(selectedArea))?.NombreArea;
  const selectedMarcaName = marcas?.find((m: any) => String(m.IdMarca) === String(selectedMarca))?.Marca;
  const selectedCondicionName = condiciones?.find((c: any) => String(c.IdCondicion) === String(selectedCondicion))?.Condicion;
  const selectedEstadoName = estados?.find((e: any) => String(e.IdEstadoBien) === String(selectedEstado))?.EstadoBien;

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
      <FormDialogContent size="lg" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {readOnly ? "Detalle del Bien" : bien ? "Editar Bien" : "Registrar Nuevo Bien"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Cód. Inventario</label>
              <Input {...register("CodigoInventario")} placeholder="Ej. INV-001" readOnly={readOnly} />
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
              <Select 
                value={watch("IdCategoria") ? String(watch("IdCategoria")) : ""} 
                onValueChange={(val) => setValue("IdCategoria", val as any)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar">{selectedCatName}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categorias?.map((c: any) => (
                    <SelectItem key={c.IdCategoria} value={c.IdCategoria.toString()}>{c.CategoriaBien}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-foreground">Área</label>
              </div>
              <Select 
                value={watch("IdArea") ? String(watch("IdArea")) : ""} 
                onValueChange={(val) => setValue("IdArea", val as any)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar">{selectedAreaName}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {areas?.map((a: any) => (
                    <SelectItem key={a.IdArea} value={a.IdArea.toString()}>{a.NombreArea}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-foreground">Marca</label>
              </div>
              <Select 
                value={watch("IdMarca") ? String(watch("IdMarca")) : ""} 
                onValueChange={(val) => setValue("IdMarca", val as any)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar">{selectedMarcaName}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {marcas?.map((m: any) => (
                    <SelectItem key={m.IdMarca} value={m.IdMarca.toString()}>{m.Marca}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Select 
                value={watch("IdCondicion") ? String(watch("IdCondicion")) : ""} 
                onValueChange={(val) => setValue("IdCondicion", val as any)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar">{selectedCondicionName}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {condiciones?.map((c: any) => (
                    <SelectItem key={c.IdCondicion} value={c.IdCondicion.toString()}>{c.Condicion}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Estado</label>
              <Select 
                value={watch("IdEstadoBien") ? String(watch("IdEstadoBien")) : ""} 
                onValueChange={(val) => setValue("IdEstadoBien", val as any)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar">{selectedEstadoName}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {estados?.map((e: any) => (
                    <SelectItem key={e.IdEstadoBien} value={e.IdEstadoBien.toString()}>{e.EstadoBien}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!readOnly ? (
            <FormDialogFooter
              onCancel={() => onOpenChange(false)}
              submitLabel={bien ? "Actualizar" : "Guardar"}
              loading={mutation.isPending}
            />
          ) : (
            <div className="flex justify-end border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
            </div>
          )}
        </form>
      </FormDialogContent>
    </Dialog>
  );
}
