"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
import { useEffect } from "react";
import { notify } from "@/lib/feedback/toast";

const softwareSchema = z.object({
  TipoSoftware: z.string().min(1, "El tipo de software es obligatorio."),
  VersionSoftware: z.string().min(1, "La versión es obligatoria."),
  ProveedorEntidad: z.string().min(2, "El proveedor o entidad es obligatorio."),
  TipoLicencia: z.string().min(1, "El tipo de licencia es obligatorio."),
  CantidadLicencias: z.string().regex(/^\d+$/, "La cantidad de licencias debe ser un número entero."),
  EstadoLicencia: z.string().min(1, "El estado de la licencia es obligatorio."),
  IdSoftwareCatalogo: z.string().min(1, "Selecciona un software del catálogo."),
  FechaCaducidad: z.string().optional(),
  EquiposUsuariosAsignados: z.string().optional(),
  UsoFinalidad: z.string().optional(),
});

export type SoftwareFormValues = z.infer<typeof softwareSchema>;

interface SoftwareFormModalProps {
  software?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  readOnly?: boolean;
}

const fetchTiposSoftware = async () => {
  const res = await fetch("/api/tipos-software");
  if (!res.ok) throw new Error("Error al cargar tipos de software");
  return res.json();
};

const fetchProveedores = async () => {
  const res = await fetch("/api/proveedores");
  if (!res.ok) throw new Error("Error al cargar proveedores");
  return res.json();
};

// (No se necesitan consultas a bienes/usuarios para este formulario)

const fetchTiposLicencia = async () => {
  const res = await fetch("/api/tipos-licencia");
  if (!res.ok) throw new Error("Error al cargar tipos de licencia");
  return res.json();
};

const fetchTiposAsignacion = async () => {
  const res = await fetch("/api/tipos-asignacion-software");
  if (!res.ok) throw new Error("Error al cargar tipos de asignación");
  return res.json();
};

const fetchSoftwareCatalogo = async () => {
  const res = await fetch("/api/software-catalogo");
  if (!res.ok) throw new Error("Error al cargar catálogo de software");
  return res.json();
};

export default function SoftwareFormModal({
  software,
  open,
  onOpenChange,
  readOnly = false,
}: SoftwareFormModalProps) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SoftwareFormValues>({
    resolver: zodResolver(softwareSchema),
  });

  const findLabel = (list: any[], id: string | number | undefined, idKey: string, labelKey: string) => {
    if (!id) return "";
    const found = list.find((x: any) => String(x[idKey]) === String(id) || String(x[labelKey]) === String(id));
    return found ? String(found[labelKey]) : String(id || "");
  };

  const { data: tiposSoftware = [] } = useQuery({
    queryKey: ["tipos-software"],
    queryFn: fetchTiposSoftware,
    enabled: open,
  });

  const { data: proveedores = [] } = useQuery({
    queryKey: ["proveedores"],
    queryFn: fetchProveedores,
    enabled: open,
  });

  const { data: tiposLicencia = [] } = useQuery({
    queryKey: ["tipos-licencia"],
    queryFn: fetchTiposLicencia,
    enabled: open,
  });

  const { data: tiposAsignacion = [] } = useQuery({
    queryKey: ["tipos-asignacion-software"],
    queryFn: fetchTiposAsignacion,
    enabled: open,
  });

  const { data: softwareCatalogo = [] } = useQuery({
    queryKey: ["software-catalogo"],
    queryFn: fetchSoftwareCatalogo,
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    if (software) {
      reset({
        // the DB stores names (not ids) for these fields
        TipoSoftware: software.TipoSoftware || "",
        VersionSoftware: software.VersionSoftware || "",
        ProveedorEntidad: software.ProveedorEntidad || "",
        TipoLicencia: software.TipoLicencia || "",
        CantidadLicencias: String(software.CantidadLicencias ?? "0"),
        EstadoLicencia: software.EstadoLicencia || "",
        IdSoftwareCatalogo: software.IdSoftwareCatalogo ? String(software.IdSoftwareCatalogo) : (software.NombreSoftware ? String(software.NombreSoftware) : ""),
        FechaCaducidad: software.FechaCaducidad ? new Date(software.FechaCaducidad).toISOString().slice(0,10) : "",
        EquiposUsuariosAsignados: software.EquiposUsuariosAsignados || "",
        UsoFinalidad: software.UsoFinalidad || "",
      });
    } else {
      reset({
        TipoSoftware: "",
        VersionSoftware: "",
        ProveedorEntidad: "",
        TipoLicencia: "",
        CantidadLicencias: "0",
        EstadoLicencia: "",
        IdSoftwareCatalogo: "",
        FechaCaducidad: "",
        EquiposUsuariosAsignados: "",
        UsoFinalidad: "",
      });
    }
  }, [open, software, reset]);

  const mutation = useMutation({
    mutationFn: async (values: SoftwareFormValues) => {
      const method = software ? "PATCH" : "POST";
      // map catalog selection into NombreSoftware for existing stored procedures
      const payload = {
        ...values,
        NombreSoftware: values.IdSoftwareCatalogo,
      } as any;
      const body = software ? { IdSoftware: software.IdSoftware, ...payload } : payload;
      const res = await fetch("/api/software", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al guardar el software");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["software"] });
      onOpenChange(false);
    },
    onError: (error) => notify.fromError(error),
  });

  const onSubmit = (values: SoftwareFormValues) => {
    if (readOnly) return;
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-border bg-card p-0 shadow-xl sm:max-w-3xl">
        <DialogHeader className="border-b border-primary/10 bg-gradient-to-r from-primary/10 via-primary/5 to-card px-6 py-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Inventario institucional</p>
          <DialogTitle className="text-xl font-semibold">
            {readOnly
              ? "Detalle del Software"
              : software
              ? "Editar Software"
              : "Registrar Software"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-primary/[0.025] px-6 py-6 [&_input]:rounded-xl [&_label]:font-semibold [&_label]:text-primary [&_textarea]:rounded-xl [&_[data-slot=select-trigger]]:rounded-xl">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Catálogo de software *</label>
              <SearchableSelect
                value={watch("IdSoftwareCatalogo")} 
                onValueChange={(value) => setValue("IdSoftwareCatalogo", value)}
                disabled={readOnly}
                options={softwareCatalogo.map((sw: any) => ({ value: String(sw.NombreSoftware), label: String(sw.NombreSoftware) }))}
                placeholder="Seleccione o busque software"
              />
              {errors.IdSoftwareCatalogo && (
                <p className="text-xs text-destructive">{errors.IdSoftwareCatalogo.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Tipo de software *</label>
              <SearchableSelect
                value={watch("TipoSoftware")} 
                onValueChange={(value) => setValue("TipoSoftware", value)}
                disabled={readOnly}
                options={tiposSoftware.map((tipo: any) => ({ value: String(tipo.TipoSoftware), label: String(tipo.TipoSoftware) }))}
                placeholder="Seleccione o busque tipo"
              />
              {errors.TipoSoftware && (
                <p className="text-xs text-destructive">{errors.TipoSoftware.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Versión *</label>
              <Input
                {...register("VersionSoftware")}
                placeholder="Ej. 2024"
                readOnly={readOnly}
              />
              {errors.VersionSoftware && (
                <p className="text-xs text-destructive">{errors.VersionSoftware.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Proveedor / Entidad *</label>
              <SearchableSelect
                value={watch("ProveedorEntidad")}
                onValueChange={(value) => setValue("ProveedorEntidad", value)}
                disabled={readOnly}
                options={proveedores.map((p: any) => ({ value: String(p.Proveedor), label: String(p.Proveedor) }))}
                placeholder="Seleccione o busque proveedor"
              />
              {errors.ProveedorEntidad && (
                <p className="text-xs text-destructive">{errors.ProveedorEntidad.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Tipo de licencia *</label>
              <SearchableSelect
                value={watch("TipoLicencia")} 
                onValueChange={(value) => setValue("TipoLicencia", value)}
                disabled={readOnly}
                options={tiposLicencia.map((tipo: any) => ({ value: String(tipo.TipoLicencia), label: String(tipo.TipoLicencia) }))}
                placeholder="Seleccione o busque licencia"
              />
              {errors.TipoLicencia && (
                <p className="text-xs text-destructive">{errors.TipoLicencia.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Cantidad de licencias *</label>
              <Input
                type="number"
                {...register("CantidadLicencias")}
                placeholder="Ej. 10"
                readOnly={readOnly}
                min={0}
              />
              {errors.CantidadLicencias && (
                <p className="text-xs text-destructive">{errors.CantidadLicencias.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Estado de licencia *</label>
              <SearchableSelect
                value={watch("EstadoLicencia")} 
                onValueChange={(value) => setValue("EstadoLicencia", value)}
                disabled={readOnly}
                options={[
                  { value: "Vigente", label: "Vigente" },
                  { value: "Vencida", label: "Vencida" },
                  { value: "Suspendida", label: "Suspendida" },
                ]}
                placeholder="Seleccione o busque estado"
              />
              {errors.EstadoLicencia && (
                <p className="text-xs text-destructive">{errors.EstadoLicencia.message}</p>
              )}
            </div>
            
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Fecha de caducidad</label>
            <Input
              type="date"
              {...register("FechaCaducidad")}
              readOnly={readOnly}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Equipos / asignación</label>
            <SearchableSelect
              value={watch("EquiposUsuariosAsignados") || ""}
              onValueChange={(value) => setValue("EquiposUsuariosAsignados", value)}
              disabled={readOnly}
              options={tiposAsignacion.map((t: any) => ({ value: String(t.TipoAsignacion), label: String(t.TipoAsignacion) }))}
              placeholder="Seleccione o busque tipo de asignación"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Uso / finalidad</label>
            <Textarea
              {...register("UsoFinalidad")}
              placeholder="Ej. Gestión administrativa"
              rows={3}
              readOnly={readOnly}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-primary/10 pt-4">
            <Button variant="secondary" type="button" className="rounded-xl" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
            {!readOnly && (
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Guardando..." : software ? "Actualizar" : "Crear"}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
